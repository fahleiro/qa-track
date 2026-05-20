/**
* ====================================
* ROTAS PARA KANBAN
* ====================================
*
* Um card pode impactar MÚLTIPLOS (sistema, feature) — modelo via t_card_impact.
* t_card.system_id/feature_id permanecem como "primary" (primeiro par criado),
* mantidos para compatibilidade com queries que ainda esperam o singular.
* A run associada ao card recebe todos os cenários ativos que casam com
* QUALQUER par (DISTINCT). Alterações nos pares propagam para t_run_detail.
*/

module.exports = (app, client) => {

    // Cenários ativos que casam com QUALQUER par de impacto do card (distinct)
    const scenariosForCard = async (cardId) => {
        const r = await client.query(`
            SELECT DISTINCT s.id
            FROM t_card_impact ci
            JOIN t_scenario_system ss ON ss.system_id = ci.system_id
            JOIN t_scenario s        ON s.id = ss.scenario_id AND s.feature_id = ci.feature_id
            JOIN t_scenario_status sst ON sst.id = s.status_id
            WHERE ci.card_id = $1
              AND LOWER(sst.title) = 'ativo'
        `, [cardId]);
        return r.rows.map(row => row.id);
    };

    // Normaliza e deduplica pares vindos do payload; tolera legado system_id+feature_id
    const normalizePairs = (body) => {
        const out = [];
        const seen = new Set();
        const pushPair = (sid, fid) => {
            const s = parseInt(sid), f = parseInt(fid);
            if (!s || !f) return;
            const k = `${s}:${f}`;
            if (seen.has(k)) return;
            seen.add(k);
            out.push({ system_id: s, feature_id: f });
        };

        if (Array.isArray(body.pairs)) {
            for (const p of body.pairs) pushPair(p.system_id, p.feature_id);
        } else if (Array.isArray(body.impacts)) {
            // Forma alternativa: [{ system_id, feature_ids: [..] }]
            for (const g of body.impacts) {
                const sid = g.system_id;
                const fids = Array.isArray(g.feature_ids) ? g.feature_ids : [];
                for (const fid of fids) pushPair(sid, fid);
            }
        } else if (body.system_id && body.feature_id) {
            pushPair(body.system_id, body.feature_id);
        }
        return out;
    };

    // Helper: enriquecer card com pares, system/feature primários, status e run
    const enrichCard = async (card) => {
        const [cardStatusRes, impactRes] = await Promise.all([
            client.query('SELECT id, title, "order" FROM t_card_status WHERE id = $1', [card.card_status_id]),
            client.query(`
                SELECT ci.system_id, ci.feature_id,
                       s.title AS system_title,
                       f.title AS feature_title
                FROM t_card_impact ci
                LEFT JOIN t_system  s ON s.id = ci.system_id
                LEFT JOIN t_feature f ON f.id = ci.feature_id
                WHERE ci.card_id = $1
                ORDER BY ci.system_id, ci.feature_id
            `, [card.id])
        ]);

        const pairs = impactRes.rows.map(r => ({
            system:  { id: r.system_id,  title: r.system_title },
            feature: { id: r.feature_id, title: r.feature_title }
        }));

        // Agrupar por sistema para conveniência do front
        const grouped = new Map();
        for (const p of pairs) {
            if (!grouped.has(p.system.id)) {
                grouped.set(p.system.id, { system: p.system, features: [] });
            }
            grouped.get(p.system.id).features.push(p.feature);
        }
        const impacts = Array.from(grouped.values());

        // Primário (compat com clientes que ainda leem singular)
        const primary = pairs[0] || null;

        let run = null;
        if (card.run_id) {
            const runResult = await client.query(`
                SELECT rm.id, rm.status_id, rs.title AS status_title,
                       COUNT(rd.id)::int AS scenario_count
                FROM t_run_master rm
                JOIN t_run_status rs ON rs.id = rm.status_id
                LEFT JOIN t_run_detail rd ON rd.run_id = rm.id
                WHERE rm.id = $1
                GROUP BY rm.id, rm.status_id, rs.title
            `, [card.run_id]);
            run = runResult.rows[0] || null;
        }

        return {
            ...card,
            system:  primary?.system  || null,
            feature: primary?.feature || null,
            pairs,
            impacts,
            card_status: cardStatusRes.rows[0] || null,
            run
        };
    };

    // Cria a run vinculada ao card a partir dos cenários atuais (ou retorna null se 0)
    const createRunForCard = async (cardId, cardTitle) => {
        const scenarios = await scenariosForCard(cardId);
        if (scenarios.length === 0) return null;

        const [plannedRun, plannedResult] = await Promise.all([
            client.query("SELECT id FROM t_run_status WHERE LOWER(title) = 'planned' LIMIT 1"),
            client.query("SELECT id FROM t_result_status WHERE LOWER(title) = 'planned' LIMIT 1")
        ]);

        const runResult = await client.query(
            'INSERT INTO t_run_master (title, status_id, card_id) VALUES ($1, $2, $3) RETURNING *',
            [cardTitle, plannedRun.rows[0].id, cardId]
        );
        const run = runResult.rows[0];

        for (const sid of scenarios) {
            await client.query(
                'INSERT INTO t_run_detail (run_id, scenario_id, result_status_id) VALUES ($1, $2, $3)',
                [run.id, sid, plannedResult.rows[0].id]
            );
        }
        await client.query('UPDATE t_card SET run_id = $1 WHERE id = $2', [run.id, cardId]);
        return { run, scenarioCount: scenarios.length };
    };

    // GET: Listar etapas do Kanban
    app.get('/api/kanban/status', async (req, res) => {
        try {
            const result = await client.query('SELECT * FROM t_card_status ORDER BY "order" ASC');
            res.json(result.rows);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // GET: Listar cards
    app.get('/api/kanban/card', async (req, res) => {
        try {
            const result = await client.query('SELECT * FROM t_card ORDER BY created_at ASC');
            const cards = await Promise.all(result.rows.map(enrichCard));
            res.json(cards);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // GET: Detalhe do card
    app.get('/api/kanban/card/:id', async (req, res) => {
        try {
            const result = await client.query('SELECT * FROM t_card WHERE id = $1', [req.params.id]);
            if (!result.rows.length) return res.status(404).json({ error: 'Card não encontrado' });
            res.json(await enrichCard(result.rows[0]));
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // POST: Criar card + disparar Run automática
    app.post('/api/kanban/card', async (req, res) => {
        const { title, description } = req.body;
        if (!title || !title.trim()) return res.status(400).json({ error: 'Título é obrigatório' });

        const pairs = normalizePairs(req.body);
        if (pairs.length === 0) {
            return res.status(400).json({ error: 'É necessário ao menos 1 par (sistema, feature)' });
        }

        try {
            await client.query('BEGIN');

            const backlog = await client.query('SELECT id FROM t_card_status ORDER BY "order" ASC LIMIT 1');
            const card_status_id = backlog.rows[0].id;

            const primary = pairs[0];
            const cardResult = await client.query(
                'INSERT INTO t_card (title, description, system_id, feature_id, card_status_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [title.trim(), description?.trim() || null, primary.system_id, primary.feature_id, card_status_id]
            );
            const card = cardResult.rows[0];

            for (const p of pairs) {
                await client.query(
                    'INSERT INTO t_card_impact (card_id, system_id, feature_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
                    [card.id, p.system_id, p.feature_id]
                );
            }

            const runResult = await createRunForCard(card.id, card.title);
            if (runResult) card.run_id = runResult.run.id;

            await client.query('COMMIT');

            const enriched = await enrichCard(card);
            res.status(201).json({
                ...enriched,
                runCreated: !!runResult,
                runInfo: runResult ? { id: runResult.run.id, scenarioCount: runResult.scenarioCount } : null
            });
        } catch (err) {
            await client.query('ROLLBACK');
            if (err.code === '23503') return res.status(400).json({ error: 'Sistema ou Feature inválidos' });
            res.status(500).json({ error: err.message });
        }
    });

    // PATCH: Editar card / mover de etapa / atualizar pares com propagação na run
    app.patch('/api/kanban/card/:id', async (req, res) => {
        const { id } = req.params;
        const { title, description, card_status_id } = req.body;
        const pairsProvided =
            Array.isArray(req.body.pairs) || Array.isArray(req.body.impacts) ||
            (req.body.system_id && req.body.feature_id);
        const newPairs = pairsProvided ? normalizePairs(req.body) : null;
        if (pairsProvided && newPairs.length === 0) {
            return res.status(400).json({ error: 'Pelo menos 1 par (sistema, feature) é obrigatório' });
        }

        try {
            await client.query('BEGIN');

            const cardResult = await client.query('SELECT * FROM t_card WHERE id = $1', [id]);
            if (!cardResult.rows.length) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Card não encontrado' });
            }
            const card = cardResult.rows[0];

            // 1) Transição de etapa: dispara mudança de status na run (Running/Closed)
            if (card_status_id && card_status_id !== card.card_status_id) {
                const targetResult = await client.query('SELECT * FROM t_card_status WHERE id = $1', [card_status_id]);
                if (!targetResult.rows.length) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({ error: 'Etapa inválida' });
                }
                const target = targetResult.rows[0];

                if (target.triggers_run_status_id && card.run_id) {
                    const triggerStatus = await client.query(
                        'SELECT title FROM t_run_status WHERE id = $1', [target.triggers_run_status_id]
                    );
                    if (triggerStatus.rows[0]?.title?.toLowerCase() === 'closed') {
                        const passedStatus = await client.query(
                            "SELECT id FROM t_result_status WHERE LOWER(title) = 'passed' LIMIT 1"
                        );
                        const notPassed = await client.query(
                            'SELECT COUNT(*)::int AS count FROM t_run_detail WHERE run_id = $1 AND result_status_id != $2',
                            [card.run_id, passedStatus.rows[0].id]
                        );
                        if (notPassed.rows[0].count > 0) {
                            await client.query('ROLLBACK');
                            return res.status(400).json({
                                error: `Não é possível finalizar: ${notPassed.rows[0].count} cenário(s) ainda não estão com resultado Passed.`
                            });
                        }
                    }
                    await client.query(
                        'UPDATE t_run_master SET status_id = $1 WHERE id = $2',
                        [target.triggers_run_status_id, card.run_id]
                    );
                }
            }

            // 2) Update scalar fields + primary system/feature se houver newPairs
            const primary = newPairs ? newPairs[0] : null;
            await client.query(`
                UPDATE t_card SET
                    title          = COALESCE($1, title),
                    description    = COALESCE($2, description),
                    card_status_id = COALESCE($3, card_status_id),
                    system_id      = COALESCE($4, system_id),
                    feature_id     = COALESCE($5, feature_id)
                WHERE id = $6
            `, [
                title?.trim() || null,
                description?.trim() || null,
                card_status_id || null,
                primary?.system_id || null,
                primary?.feature_id || null,
                id
            ]);

            // 3) Se pares foram enviados: replace t_card_impact e propagar na run
            let runUpdate = null;
            if (newPairs) {
                await client.query('DELETE FROM t_card_impact WHERE card_id = $1', [id]);
                for (const p of newPairs) {
                    await client.query(
                        'INSERT INTO t_card_impact (card_id, system_id, feature_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
                        [id, p.system_id, p.feature_id]
                    );
                }

                // Diff de cenários
                if (card.run_id) {
                    const currentRes = await client.query(
                        'SELECT scenario_id FROM t_run_detail WHERE run_id = $1', [card.run_id]
                    );
                    const currentSet = new Set(currentRes.rows.map(r => r.scenario_id));

                    const newScenarios = await scenariosForCard(id);
                    const newSet = new Set(newScenarios);

                    const added   = newScenarios.filter(s => !currentSet.has(s));
                    const removed = [...currentSet].filter(s => !newSet.has(s));

                    if (added.length > 0) {
                        const plannedResult = await client.query(
                            "SELECT id FROM t_result_status WHERE LOWER(title) = 'planned' LIMIT 1"
                        );
                        for (const sid of added) {
                            await client.query(
                                'INSERT INTO t_run_detail (run_id, scenario_id, result_status_id) VALUES ($1, $2, $3)',
                                [card.run_id, sid, plannedResult.rows[0].id]
                            );
                        }
                    }
                    if (removed.length > 0) {
                        await client.query(
                            'DELETE FROM t_run_detail WHERE run_id = $1 AND scenario_id = ANY($2::int[])',
                            [card.run_id, removed]
                        );
                    }

                    if (added.length > 0 || removed.length > 0) {
                        const parts = [];
                        if (added.length)   parts.push(`+${added.length} cenário(s)`);
                        if (removed.length) parts.push(`-${removed.length} cenário(s)`);
                        runUpdate = {
                            runId: card.run_id,
                            added: added.length,
                            removed: removed.length,
                            created: false,
                            message: `Run #${card.run_id} atualizada: ${parts.join(', ')}`
                        };
                    }
                } else {
                    // Card ainda não tinha run; pode ser que com os novos pares passe a ter cenários
                    const created = await createRunForCard(id, card.title);
                    if (created) {
                        runUpdate = {
                            runId: created.run.id,
                            added: created.scenarioCount,
                            removed: 0,
                            created: true,
                            message: `Run #${created.run.id} criada com ${created.scenarioCount} cenário(s)`
                        };
                    }
                }
            }

            await client.query('COMMIT');

            const fresh = await client.query('SELECT * FROM t_card WHERE id = $1', [id]);
            const enriched = await enrichCard(fresh.rows[0]);
            res.json({ ...enriched, runUpdate });
        } catch (err) {
            await client.query('ROLLBACK');
            if (err.code === '23503') return res.status(400).json({ error: 'Sistema ou Feature inválidos' });
            res.status(500).json({ error: err.message });
        }
    });

    // DELETE: Remover card (e run vinculada, se existir)
    app.delete('/api/kanban/card/:id', async (req, res) => {
        try {
            await client.query('BEGIN');

            const cardRes = await client.query('SELECT run_id FROM t_card WHERE id = $1', [req.params.id]);
            if (!cardRes.rows.length) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Card não encontrado' });
            }
            const runId = cardRes.rows[0].run_id;

            if (runId) {
                await client.query('UPDATE t_run_master SET card_id = NULL WHERE id = $1', [runId]);
                await client.query('DELETE FROM t_run_detail WHERE run_id = $1', [runId]);
            }

            // t_card_impact cai via ON DELETE CASCADE
            await client.query('DELETE FROM t_card WHERE id = $1', [req.params.id]);

            if (runId) {
                await client.query('DELETE FROM t_run_master WHERE id = $1', [runId]);
            }

            await client.query('COMMIT');
            res.status(204).send();
        } catch (err) {
            await client.query('ROLLBACK');
            res.status(500).json({ error: err.message });
        }
    });
};
