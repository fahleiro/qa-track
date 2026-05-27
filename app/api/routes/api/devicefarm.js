/**
 * ============================================================
 *  ARQUIVO: app/api/routes/api/devicefarm.js
 * ============================================================
 *  Endpoints voltados ao USUÁRIO do device farm (a UI consome).
 *  Duas responsabilidades principais:
 *
 *    1. AGREGAR  — junta devices de TODOS os agents online via
 *                  fan-out HTTP paralelo, cruzando com locks ativos.
 *    2. LOCK     — transações para reservar/liberar devices, com TTL.
 *
 *  Endpoints:
 *    GET    /api/devicefarm/devices
 *    GET    /api/devicefarm/devices/:udid
 *    POST   /api/devicefarm/devices/:udid/lock
 *    POST   /api/devicefarm/devices/:udid/lock/renew
 *    DELETE /api/devicefarm/devices/:udid/lock          (?force=true para admin)
 *    GET    /api/devicefarm/devices/:udid/screenshot    (proxy ao node)
 *    GET    /api/devicefarm/sessions                    (audit)
 *
 *  Notas:
 *   - Lock usa `FOR UPDATE` dentro de transação para evitar race.
 *   - Screenshot é PROXY: o browser nunca fala direto com o node-agent.
 *     Toda autorização é checada aqui.
 *   - Cache de 3s na listagem evita martelar agents com requests
 *     concorrentes de vários usuários.
 * ============================================================
 */

const axios = require('axios');
const crypto = require('crypto');
const config = require('../../config');

let listCache = { ts: 0, data: null };
const CACHE_TTL_MS = 3000;

function invalidateCache() { listCache.ts = 0; listCache.data = null; }

function annotateSelfLocks(devices, currentUserId) {
    return devices.map(d => ({
        ...d,
        lock: d.lock ? { ...d.lock, is_self: d.lock.user_id === currentUserId } : null
    }));
}

module.exports = (app, pool) => {

    // GET /api/devicefarm/devices  — listagem agregada (fan-out)
    app.get('/api/devicefarm/devices', async (req, res, next) => {
        try {
            const now = Date.now();
            if (listCache.data && (now - listCache.ts) < CACHE_TTL_MS) {
                return res.json(annotateSelfLocks(listCache.data, req.user.id));
            }

            const nodes = await pool.query(`
                SELECT id, name, public_url
                FROM device_farm.t_node
                WHERE last_heartbeat IS NOT NULL
                  AND last_heartbeat > NOW() - (INTERVAL '1 second' * $1)
            `, [config.nodeOnlineWindowSeconds]);

            const fans = await Promise.allSettled(
                nodes.rows.map(n =>
                    axios.get(`${n.public_url}/agent/devices`, { timeout: config.nodeFetchTimeoutMs })
                        .then(r => ({ node: n, devices: r.data?.devices || [] }))
                )
            );

            const live = [];
            for (const f of fans) {
                if (f.status !== 'fulfilled') continue;
                const { node, devices } = f.value;
                for (const d of devices) {
                    live.push({ ...d, node: { id: node.id, name: node.name } });
                }
            }

            const locks = await pool.query(`
                SELECT l.udid, l.user_id, l.session_id, l.locked_at, l.expires_at,
                       u.username AS locked_by
                FROM device_farm.t_device_lock l
                JOIN auth.t_user u ON u.id = l.user_id
                WHERE l.expires_at > NOW()
            `);
            const lockByUdid = new Map(locks.rows.map(r => [r.udid, r]));

            const enriched = live.map(d => {
                const lk = lockByUdid.get(d.udid);
                return {
                    ...d,
                    lock: lk ? {
                        user_id:    lk.user_id,
                        locked_by:  lk.locked_by,
                        session_id: lk.session_id,
                        locked_at:  lk.locked_at,
                        expires_at: lk.expires_at
                    } : null
                };
            });

            listCache = { ts: now, data: enriched };
            res.json(annotateSelfLocks(enriched, req.user.id));
        } catch (err) { next(err); }
    });

    app.get('/api/devicefarm/devices/:udid', async (req, res, next) => {
        try {
            const r = await pool.query(`
                SELECT d.*, n.name AS node_name, n.public_url AS node_url,
                       (n.last_heartbeat > NOW() - (INTERVAL '1 second' * $2)) AS node_online,
                       l.user_id, u.username AS locked_by, l.session_id, l.locked_at, l.expires_at
                FROM device_farm.t_device d
                LEFT JOIN device_farm.t_node n ON n.id = d.node_id
                LEFT JOIN device_farm.t_device_lock l ON l.udid = d.udid AND l.expires_at > NOW()
                LEFT JOIN auth.t_user u ON u.id = l.user_id
                WHERE d.udid = $1
            `, [req.params.udid, config.nodeOnlineWindowSeconds]);
            if (!r.rows.length) return res.status(404).json({ error: 'Device não encontrado' });

            const row = r.rows[0];
            res.json({
                udid: row.udid,
                platform: row.platform,
                model: row.model,
                manufacturer: row.manufacturer,
                os_version: row.os_version,
                last_status: row.last_status,
                last_seen: row.last_seen,
                node: { id: row.node_id, name: row.node_name, public_url: row.node_url, online: !!row.node_online },
                lock: row.user_id ? {
                    user_id: row.user_id, locked_by: row.locked_by, session_id: row.session_id,
                    locked_at: row.locked_at, expires_at: row.expires_at,
                    is_self: row.user_id === req.user.id
                } : null
            });
        } catch (err) { next(err); }
    });

    app.post('/api/devicefarm/devices/:udid/lock', async (req, res, next) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const dev = await client.query('SELECT udid, node_id FROM device_farm.t_device WHERE udid = $1', [req.params.udid]);
            if (!dev.rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Device não encontrado' }); }

            const existing = await client.query(
                'SELECT user_id, expires_at FROM device_farm.t_device_lock WHERE udid = $1 FOR UPDATE',
                [req.params.udid]
            );
            if (existing.rows.length && existing.rows[0].expires_at > new Date()) {
                await client.query('ROLLBACK');
                return res.status(409).json({ error: 'Device já está em uso' });
            }

            const sessionId = crypto.randomBytes(8).toString('hex');
            const ttlSec = config.deviceLockTtlSeconds;
            const ins = await client.query(`
                INSERT INTO device_farm.t_device_lock (udid, user_id, session_id, expires_at)
                VALUES ($1, $2, $3, NOW() + (INTERVAL '1 second' * $4))
                ON CONFLICT (udid) DO UPDATE SET
                    user_id    = EXCLUDED.user_id,
                    session_id = EXCLUDED.session_id,
                    locked_at  = NOW(),
                    expires_at = EXCLUDED.expires_at
                RETURNING session_id, locked_at, expires_at
            `, [req.params.udid, req.user.id, sessionId, ttlSec]);

            const node = await client.query(`
                SELECT n.public_url FROM device_farm.t_device d
                JOIN device_farm.t_node n ON n.id = d.node_id WHERE d.udid = $1
            `, [req.params.udid]);
            const user = await client.query('SELECT df_token FROM auth.t_user WHERE id = $1', [req.user.id]);

            await client.query('COMMIT');
            invalidateCache();
            res.json({
                session_id: ins.rows[0].session_id,
                locked_at:  ins.rows[0].locked_at,
                expires_at: ins.rows[0].expires_at,
                node:       { public_url: node.rows[0]?.public_url || null },
                device_token: user.rows[0]?.df_token || null
            });
        } catch (err) {
            try { await client.query('ROLLBACK'); } catch {}
            next(err);
        } finally {
            client.release();
        }
    });

    app.post('/api/devicefarm/devices/:udid/lock/renew', async (req, res, next) => {
        try {
            const r = await pool.query(`
                UPDATE device_farm.t_device_lock
                SET expires_at = NOW() + (INTERVAL '1 second' * $1)
                WHERE udid = $2 AND user_id = $3 AND expires_at > NOW()
                RETURNING session_id, locked_at, expires_at
            `, [config.deviceLockTtlSeconds, req.params.udid, req.user.id]);
            if (!r.rows.length) return res.status(404).json({ error: 'Lock não encontrado ou expirado' });
            res.json(r.rows[0]);
        } catch (err) { next(err); }
    });

    app.delete('/api/devicefarm/devices/:udid/lock', async (req, res, next) => {
        const force = req.query.force === 'true';
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const cur = await client.query(
                'SELECT user_id, locked_at FROM device_farm.t_device_lock WHERE udid = $1 FOR UPDATE',
                [req.params.udid]
            );
            if (!cur.rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Lock não encontrado' }); }

            const owner = cur.rows[0].user_id;
            if (owner !== req.user.id && !(force && req.user.role === 'admin')) {
                await client.query('ROLLBACK');
                return res.status(403).json({ error: 'Lock pertence a outro usuário (use ?force=true como admin para forçar)' });
            }

            await client.query(`
                INSERT INTO device_farm.t_farm_session (udid, user_id, started_at, ended_at, reason_end)
                VALUES ($1, $2, $3, NOW(), $4)
            `, [req.params.udid, owner, cur.rows[0].locked_at, force && owner !== req.user.id ? 'admin_force' : 'manual_release']);

            await client.query('DELETE FROM device_farm.t_device_lock WHERE udid = $1', [req.params.udid]);
            await client.query('COMMIT');
            invalidateCache();
            res.status(204).send();
        } catch (err) {
            try { await client.query('ROLLBACK'); } catch {}
            next(err);
        } finally {
            client.release();
        }
    });

    app.get('/api/devicefarm/devices/:udid/screenshot', async (req, res) => {
        try {
            const r = await pool.query(`
                SELECT n.public_url FROM device_farm.t_device d
                JOIN device_farm.t_node n ON n.id = d.node_id
                WHERE d.udid = $1
            `, [req.params.udid]);
            if (!r.rows.length) return res.status(404).json({ error: 'Device não encontrado' });

            const url = `${r.rows[0].public_url}/agent/devices/${req.params.udid}/screenshot`;
            const upstream = await axios.get(url, {
                responseType: 'arraybuffer',
                timeout: config.nodeFetchTimeoutMs * 2
            });
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Cache-Control', 'no-store');
            res.send(Buffer.from(upstream.data));
        } catch (err) {
            const status = err.response?.status || 502;
            res.status(status).json({ error: 'Falha ao obter screenshot do node', detail: err.message });
        }
    });

    app.get('/api/devicefarm/sessions', async (_req, res, next) => {
        try {
            const r = await pool.query(`
                SELECT s.id, s.udid, s.user_id, u.username, s.started_at, s.ended_at, s.reason_end,
                       EXTRACT(EPOCH FROM (s.ended_at - s.started_at))::int AS duration_seconds
                FROM device_farm.t_farm_session s
                LEFT JOIN auth.t_user u ON u.id = s.user_id
                ORDER BY s.ended_at DESC
                LIMIT 100
            `);
            res.json(r.rows);
        } catch (err) { next(err); }
    });
};
