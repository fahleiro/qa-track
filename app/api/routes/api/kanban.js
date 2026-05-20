/**
* ====================================
* ROTAS PARA KANBAN
* ====================================
*/

module.exports = (app, client) => {

    // Helper: Enriquecer card com dados relacionados
    const enrichCard = async (card) => {
        const [system, feature, cardStatus] = await Promise.all([
            client.query('SELECT id, title FROM t_system WHERE id = $1', [card.system_id]),
            client.query('SELECT id, title FROM t_feature WHERE id = $1', [card.feature_id]),
            client.query('SELECT id, title, "order" FROM t_card_status WHERE id = $1', [card.card_status_id])
        ]);

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
            system: system.rows[0] || null,
            feature: feature.rows[0] || null,
            card_status: cardStatus.rows[0] || null,
            run
        };
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
        const { title, description, system_id, feature_id } = req.body;

        if (!title || !title.trim()) return res.status(400).json({ error: 'Título é obrigatório' });
        if (!system_id)              return res.status(400).json({ error: 'Sistema é obrigatório' });
        if (!feature_id)             return res.status(400).json({ error: 'Feature é obrigatória' });

        try {
            // Etapa inicial: Backlog (menor order)
            const backlog = await client.query('SELECT id FROM t_card_status ORDER BY "order" ASC LIMIT 1');
            const card_status_id = backlog.rows[0].id;

            // Criar card
            const cardResult = await client.query(
                'INSERT INTO t_card (title, description, system_id, feature_id, card_status_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
                [title.trim(), description?.trim() || null, system_id, feature_id, card_status_id]
            );
            const card = cardResult.rows[0];

            // Buscar cenários ativos para sistema + feature
            const scenarios = await client.query(`
                SELECT DISTINCT s.id, s.title
                FROM t_scenario s
                JOIN t_scenario_system ss ON ss.scenario_id = s.id
                JOIN t_scenario_status sst ON sst.id = s.status_id
                WHERE ss.system_id = $1
                  AND s.feature_id = $2
                  AND LOWER(sst.title) = 'ativo'
            `, [system_id, feature_id]);

            let runInfo = null;

            if (scenarios.rows.length > 0) {
                const [plannedRun, plannedResult] = await Promise.all([
                    client.query("SELECT id FROM t_run_status WHERE LOWER(title) = 'planned' LIMIT 1"),
                    client.query("SELECT id FROM t_result_status WHERE LOWER(title) = 'planned' LIMIT 1")
                ]);

                // Criar run
                const runResult = await client.query(
                    'INSERT INTO t_run_master (title, status_id, card_id) VALUES ($1, $2, $3) RETURNING *',
                    [title.trim(), plannedRun.rows[0].id, card.id]
                );
                const run = runResult.rows[0];

                // Inserir cenários na run
                for (const scenario of scenarios.rows) {
                    await client.query(
                        'INSERT INTO t_run_detail (run_id, scenario_id, result_status_id) VALUES ($1, $2, $3)',
                        [run.id, scenario.id, plannedResult.rows[0].id]
                    );
                }

                // Vincular run ao card
                await client.query('UPDATE t_card SET run_id = $1 WHERE id = $2', [run.id, card.id]);
                card.run_id = run.id;
                runInfo = { id: run.id, scenarioCount: scenarios.rows.length };
            }

            const enriched = await enrichCard(card);
            res.status(201).json({ ...enriched, runCreated: runInfo !== null, runInfo });
        } catch (err) {
            if (err.code === '23503') return res.status(400).json({ error: 'Sistema ou Feature inválidos' });
            res.status(500).json({ error: err.message });
        }
    });

    // PATCH: Editar card / mover de etapa
    app.patch('/api/kanban/card/:id', async (req, res) => {
        const { id } = req.params;
        const { title, description, card_status_id, system_id, feature_id } = req.body;

        try {
            const cardResult = await client.query('SELECT * FROM t_card WHERE id = $1', [id]);
            if (!cardResult.rows.length) return res.status(404).json({ error: 'Card não encontrado' });
            const card = cardResult.rows[0];

            // Validar movimentação para nova etapa
            if (card_status_id && card_status_id !== card.card_status_id) {
                const targetResult = await client.query('SELECT * FROM t_card_status WHERE id = $1', [card_status_id]);
                if (!targetResult.rows.length) return res.status(400).json({ error: 'Etapa inválida' });
                const target = targetResult.rows[0];

                if (target.triggers_run_status_id && card.run_id) {
                    const triggerStatus = await client.query(
                        'SELECT title FROM t_run_status WHERE id = $1', [target.triggers_run_status_id]
                    );

                    // Bloqueio: mover para Finalizado exige todos os cenários Passed
                    if (triggerStatus.rows[0]?.title?.toLowerCase() === 'closed') {
                        const passedStatus = await client.query(
                            "SELECT id FROM t_result_status WHERE LOWER(title) = 'passed' LIMIT 1"
                        );
                        const notPassed = await client.query(
                            'SELECT COUNT(*)::int AS count FROM t_run_detail WHERE run_id = $1 AND result_status_id != $2',
                            [card.run_id, passedStatus.rows[0].id]
                        );
                        if (notPassed.rows[0].count > 0) {
                            return res.status(400).json({
                                error: `Não é possível finalizar: ${notPassed.rows[0].count} cenário(s) ainda não estão com resultado Passed.`
                            });
                        }
                    }

                    // Transicionar status da run
                    await client.query(
                        'UPDATE t_run_master SET status_id = $1 WHERE id = $2',
                        [target.triggers_run_status_id, card.run_id]
                    );
                }
            }

            const updated = await client.query(`
                UPDATE t_card SET
                    title          = COALESCE($1, title),
                    description    = COALESCE($2, description),
                    card_status_id = COALESCE($3, card_status_id),
                    system_id      = COALESCE($4, system_id),
                    feature_id     = COALESCE($5, feature_id)
                WHERE id = $6 RETURNING *
            `, [title?.trim() || null, description?.trim() || null, card_status_id || null, system_id || null, feature_id || null, id]);

            res.json(await enrichCard(updated.rows[0]));
        } catch (err) {
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
                // Quebrar FK circular: null-ificar card_id na run antes de deletar o card
                await client.query('UPDATE t_run_master SET card_id = NULL WHERE id = $1', [runId]);
                // Remover detalhes da run
                await client.query('DELETE FROM t_run_detail WHERE run_id = $1', [runId]);
            }

            // Deletar o card (isso null-ifica run_id via FK, mas já limpamos antes)
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
