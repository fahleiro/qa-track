/**
* ====================================
* ROTAS PARA GERENCIAMENTO DE RESULTADOS
* ====================================
*/

module.exports = (app, client) => {

    // GET: Listar todos os resultados
    app.get('/api/result', async (req, res) => {
        try {
            const result = await client.query('SELECT * FROM t_result ORDER BY id DESC');
            res.json(result.rows);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // GET: Buscar um resultado específico
    app.get('/api/result/:id', async (req, res) => {
        try {
            const result = await client.query('SELECT * FROM t_result WHERE id = $1', [req.params.id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Resultado não encontrado' });
            }
            res.json(result.rows[0]);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // POST: Criar novo resultado
    app.post('/api/result', async (req, res) => {
        const { scenario_id, run_id, status } = req.body;
        
        if (!scenario_id) {
            return res.status(400).json({ error: 'scenario_id é obrigatório' });
        }
        if (!run_id) {
            return res.status(400).json({ error: 'run_id é obrigatório' });
        }
        if (!status) {
            return res.status(400).json({ error: 'status é obrigatório' });
        }

        try {
            const result = await client.query(
                'INSERT INTO t_result (scenario_id, run_id, status) VALUES ($1, $2, $3) RETURNING *',
                [scenario_id, run_id, status]
            );
            res.status(201).json(result.rows[0]);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // PATCH: Atualizar parcialmente um resultado
    app.patch('/api/result/:id', async (req, res) => {
        const { status } = req.body;
        const { id } = req.params;

        try {
            const result = await client.query(
                'UPDATE t_result SET status = COALESCE($1, status) WHERE id = $2 RETURNING *',
                [status, id]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Resultado não encontrado' });
            }
            res.json(result.rows[0]);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // DELETE: Remover resultado
    app.delete('/api/result/:id', async (req, res) => {
        try {
            const result = await client.query('DELETE FROM t_result WHERE id = $1 RETURNING id', [req.params.id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Resultado não encontrado' });
            }
            res.status(204).send();
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
};

