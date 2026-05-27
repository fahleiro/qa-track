/**
 * ============================================================
 *  ARQUIVO: app/api/routes/api/nodes.js
 * ============================================================
 *  Registry de node-agents:
 *    POST   /api/nodes/register    (público) — agent se anuncia
 *    POST   /api/nodes/heartbeat   (público) — agent pulsa
 *    GET    /api/nodes             (JWT)     — UI lista agents
 *    DELETE /api/nodes/:id         (admin)   — desregistra agent
 *
 *  Notas:
 *   - register/heartbeat são PÚBLICOS no MVP (whitelist em authJwt).
 *     Em produção: usar pre-shared AGENT_REGISTER_TOKEN.
 *   - Upsert de devices é "merge não destrutivo": devices ausentes
 *     do snapshot continuam no banco como last_seen antigo. O status
 *     efetivo é computado em /api/devicefarm/devices.
 * ============================================================
 */

const requireRole = require('../../middleware/requireRole');

module.exports = (app, pool) => {

    app.post('/api/nodes/register', async (req, res, next) => {
        const { name, public_url, version, devices } = req.body || {};
        if (!name || !public_url) return res.status(400).json({ error: 'name e public_url são obrigatórios' });

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const nodeIns = await client.query(`
                INSERT INTO device_farm.t_node (name, public_url, version, last_heartbeat)
                VALUES ($1, $2, $3, NOW())
                ON CONFLICT (name) DO UPDATE SET
                    public_url = EXCLUDED.public_url,
                    version = EXCLUDED.version,
                    last_heartbeat = NOW()
                RETURNING id
            `, [name, public_url, version || null]);
            const nodeId = nodeIns.rows[0].id;

            if (Array.isArray(devices) && devices.length > 0) {
                for (const d of devices) {
                    if (!d.udid) continue;
                    await client.query(`
                        INSERT INTO device_farm.t_device (udid, node_id, platform, model, manufacturer, os_version, last_status, last_seen)
                        VALUES ($1, $2, COALESCE($3,'android'), $4, $5, $6, $7, NOW())
                        ON CONFLICT (udid) DO UPDATE SET
                            node_id      = EXCLUDED.node_id,
                            platform     = COALESCE(EXCLUDED.platform, device_farm.t_device.platform),
                            model        = COALESCE(EXCLUDED.model, device_farm.t_device.model),
                            manufacturer = COALESCE(EXCLUDED.manufacturer, device_farm.t_device.manufacturer),
                            os_version   = COALESCE(EXCLUDED.os_version, device_farm.t_device.os_version),
                            last_status  = EXCLUDED.last_status,
                            last_seen    = NOW()
                    `, [d.udid, nodeId, d.platform || 'android', d.model, d.manufacturer, d.os_version, d.status]);
                }
            }

            await client.query('COMMIT');
            res.json({ ok: true, node_id: nodeId, devices_registered: (devices || []).length });
        } catch (err) {
            try { await client.query('ROLLBACK'); } catch {}
            next(err);
        } finally {
            client.release();
        }
    });

    app.post('/api/nodes/heartbeat', async (req, res, next) => {
        const { name, devices } = req.body || {};
        if (!name) return res.status(400).json({ error: 'name é obrigatório' });

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const nodeRes = await client.query('SELECT id FROM device_farm.t_node WHERE name = $1', [name]);
            if (!nodeRes.rows.length) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Node não registrado. Faça /api/nodes/register primeiro.' });
            }
            const nodeId = nodeRes.rows[0].id;

            await client.query('UPDATE device_farm.t_node SET last_heartbeat = NOW() WHERE id = $1', [nodeId]);

            if (Array.isArray(devices)) {
                for (const d of devices) {
                    if (!d.udid) continue;
                    await client.query(`
                        INSERT INTO device_farm.t_device (udid, node_id, platform, model, manufacturer, os_version, last_status, last_seen)
                        VALUES ($1, $2, COALESCE($3,'android'), $4, $5, $6, $7, NOW())
                        ON CONFLICT (udid) DO UPDATE SET
                            node_id      = EXCLUDED.node_id,
                            model        = COALESCE(EXCLUDED.model, device_farm.t_device.model),
                            manufacturer = COALESCE(EXCLUDED.manufacturer, device_farm.t_device.manufacturer),
                            os_version   = COALESCE(EXCLUDED.os_version, device_farm.t_device.os_version),
                            last_status  = EXCLUDED.last_status,
                            last_seen    = NOW()
                    `, [d.udid, nodeId, d.platform || 'android', d.model, d.manufacturer, d.os_version, d.status]);
                }
            }
            await client.query('COMMIT');
            res.json({ ok: true });
        } catch (err) {
            try { await client.query('ROLLBACK'); } catch {}
            next(err);
        } finally {
            client.release();
        }
    });

    app.get('/api/nodes', async (_req, res, next) => {
        try {
            const r = await pool.query(`
                SELECT
                    n.id, n.name, n.public_url, n.version, n.registered_at, n.last_heartbeat,
                    (n.last_heartbeat IS NOT NULL AND n.last_heartbeat > NOW() - INTERVAL '60 seconds') AS online,
                    COUNT(d.udid)::int AS devices_count
                FROM device_farm.t_node n
                LEFT JOIN device_farm.t_device d ON d.node_id = n.id
                GROUP BY n.id
                ORDER BY n.name ASC
            `);
            res.json(r.rows);
        } catch (err) { next(err); }
    });

    app.delete('/api/nodes/:id', requireRole('admin'), async (req, res, next) => {
        try {
            const r = await pool.query('DELETE FROM device_farm.t_node WHERE id = $1 RETURNING id', [req.params.id]);
            if (!r.rows.length) return res.status(404).json({ error: 'Node não encontrado' });
            res.status(204).send();
        } catch (err) { next(err); }
    });
};
