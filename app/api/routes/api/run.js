/**
* ====================================
* ROTAS PARA VISUALIZAÇÃO DE RUNS
* ====================================
*/

module.exports = (app, client) => {

    // GET: Listar runs
    app.get('/api/run', async (req, res) => {
        try {
            const result = await client.query(`
                SELECT rm.id, rm.title, rm.start_date, rm.end_date, rm.created_at,
                       rs.id AS status_id, rs.title AS status_title,
                       c.id AS card_id, c.title AS card_title,
                       sys.id AS system_id, sys.title AS system_title,
                       feat.id AS feature_id, feat.title AS feature_title,
                       COUNT(rd.id)::int AS scenario_count,
                       COUNT(CASE WHEN rres.title = 'Passed' THEN 1 END)::int AS passed_count
                FROM t_run_master rm
                JOIN t_run_status rs ON rs.id = rm.status_id
                LEFT JOIN t_card c ON c.id = rm.card_id
                LEFT JOIN t_system sys ON sys.id = c.system_id
                LEFT JOIN t_feature feat ON feat.id = c.feature_id
                LEFT JOIN t_run_detail rd ON rd.run_id = rm.id
                LEFT JOIN t_result_status rres ON rres.id = rd.result_status_id
                GROUP BY rm.id, rs.id, rs.title, c.id, c.title, sys.id, sys.title, feat.id, feat.title
                ORDER BY rm.created_at DESC
            `);
            res.json(result.rows);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // GET: Detalhe de run com cenários
    app.get('/api/run/:id', async (req, res) => {
        try {
            const runResult = await client.query(`
                SELECT rm.*, rs.title AS status_title, c.title AS card_title
                FROM t_run_master rm
                JOIN t_run_status rs ON rs.id = rm.status_id
                LEFT JOIN t_card c ON c.id = rm.card_id
                WHERE rm.id = $1
            `, [req.params.id]);
            if (!runResult.rows.length) return res.status(404).json({ error: 'Run não encontrada' });

            const detailResult = await client.query(`
                SELECT rd.id, rd.scenario_id, s.title AS scenario_title,
                       rd.result_status_id, rrs.title AS result_status_title
                FROM t_run_detail rd
                JOIN t_scenario s ON s.id = rd.scenario_id
                LEFT JOIN t_result_status rrs ON rrs.id = rd.result_status_id
                WHERE rd.run_id = $1
                ORDER BY rd.id ASC
            `, [req.params.id]);

            res.json({ ...runResult.rows[0], scenarios: detailResult.rows });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // PATCH: Atualizar result_status de um cenário na run
    app.patch('/api/run/detail/:detailId/status', async (req, res) => {
        const { result_status_id } = req.body;
        if (!result_status_id) return res.status(400).json({ error: 'result_status_id é obrigatório' });

        try {
            const result = await client.query(
                'UPDATE t_run_detail SET result_status_id = $1 WHERE id = $2 RETURNING *',
                [result_status_id, req.params.detailId]
            );
            if (!result.rows.length) return res.status(404).json({ error: 'Detalhe não encontrado' });
            res.json(result.rows[0]);
        } catch (err) {
            if (err.code === '23503') return res.status(400).json({ error: 'Status inválido' });
            res.status(500).json({ error: err.message });
        }
    });
};
