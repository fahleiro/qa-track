/**
* ====================================
* ROTAS PARA GERENCIAMENTO DE EXECUÇÕES (RUNS)
* ====================================
*/

module.exports = (app, client) => {

    // GET: Listar todas as execuções
    app.get('/api/run', async (req, res) => {
        try {
            const result = await client.query(`
                SELECT * FROM t_run ORDER BY id DESC
            `);
            res.json(result.rows);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // GET: Buscar uma execução específica
    app.get('/api/run/:id', async (req, res) => {
        try {
            const { expand } = req.query;
            
            // Buscar dados da execução
            const runResult = await client.query(`
                SELECT * FROM t_run WHERE id = $1
            `, [req.params.id]);
            
            if (runResult.rows.length === 0) {
                return res.status(404).json({ error: 'Execução não encontrada' });
            }

            const response = runResult.rows[0];

            // Se expand=details, buscar detalhes dos cenários vinculados
            if (expand === 'details') {
                const detailsResult = await client.query(`
                    SELECT * FROM t_run_detail WHERE run_id = $1
                `, [req.params.id]);
                
                response.details = detailsResult.rows;
            }

            res.json(response);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // POST: Criar nova execução
    app.post('/api/run', async (req, res) => {
        const { title, description, status } = req.body;
        
        if (!title) {
            return res.status(400).json({ error: 'Título da execução não pode ser vazio' });
        }
        if (!description) {
            return res.status(400).json({ error: 'Descrição da execução não pode ser vazia' });
        }

        try {
            // Se não informar status, busca o padrão
            let statusId = status;
            if (!statusId) {
                const defaultStatus = await client.query(
                    'SELECT id FROM t_run_status WHERE is_default = true LIMIT 1'
                );
                statusId = defaultStatus.rows[0]?.id || null;
            }

            const result = await client.query(
                'INSERT INTO t_run (title, description, status) VALUES ($1, $2, $3) RETURNING *',
                [title, description, statusId]
            );
            res.status(201).json(result.rows[0]);
        } catch (err) {
            if (err.code === '23505') {
                return res.status(409).json({ error: 'Execução com esse título já existe' });
            }
            res.status(500).json({ error: err.message });
        }
    });

    // PATCH: Atualizar parcialmente uma execução
    app.patch('/api/run/:id', async (req, res) => {
        const { title, description, status } = req.body;
        const { id } = req.params;

        try {
            const result = await client.query(
                `UPDATE t_run 
                SET title = COALESCE($1, title),
                    description = COALESCE($2, description),
                    status = COALESCE($3, status)
                WHERE id = $4 RETURNING *`,
                [title, description, status, id]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Execução não encontrada' });
            }
            res.json(result.rows[0]);
        } catch (err) {
            if (err.code === '23505') {
                return res.status(409).json({ error: 'Execução com esse título já existe' });
            }
            res.status(500).json({ error: err.message });
        }
    });

    // DELETE: Remover execução
    app.delete('/api/run/:id', async (req, res) => {
        try {
            const result = await client.query('DELETE FROM t_run WHERE id = $1 RETURNING id', [req.params.id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Execução não encontrada' });
            }
            res.status(204).send();
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // ========== GERENCIAMENTO DE CENÁRIOS NA EXECUÇÃO ==========

    // POST: Adicionar cenários à execução (t_run_detail)
    app.post('/api/run/:id/scenario', async (req, res) => {
        const { scenario_id } = req.body;
        const { id } = req.params;

        if (!scenario_id) {
            return res.status(400).json({ error: 'scenario_id não pode ser vazio' });
        }

        try {
            // Insere os cenários na execução
            const query = `
                INSERT INTO t_run_detail (run_id, scenario_id)
                VALUES ($1, $2)
                ON CONFLICT (run_id, scenario_id) DO NOTHING
                RETURNING *
            `;

            const result = await client.query(query, [id, scenario_id]);
            res.status(201).json(result.rows);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // DELETE: Remover cenário de uma execução
    app.delete('/api/run/:runId/scenario/:scenarioId', async (req, res) => {
        try {
            const result = await client.query(
                'DELETE FROM t_run_detail WHERE run_id = $1 AND scenario_id = $2 RETURNING *',
                [req.params.runId, req.params.scenarioId]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Cenário não encontrado nesta execução' });
            }
            res.status(204).send();
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
};
