/**
* ====================================
* ROTAS PARA GERENCIAMENTO DE STATUS DE CENÁRIOS
* v0.1.0
* ====================================
*/

module.exports = (app, client) => {

    // GET: Listar todos os status de cenários
    app.get('/api/config/status/scenario', async (req, res) => {
        try {
            const result = await client.query('SELECT * FROM t_scenario_status ORDER BY id ASC');
            res.json(result.rows);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // GET: Listar um status específico
    app.get('/api/config/status/scenario/:id', async (req, res) => {
        try {
            const result = await client.query('SELECT * FROM t_scenario_status WHERE id = $1', [req.params.id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Status não encontrado' });
            }
            res.json(result.rows[0]);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // POST: Criar novo status de cenário
    app.post('/api/config/status/scenario', async (req, res) => {
        const { title } = req.body;
        if (!title) {
            return res.status(400).json({ error: 'Título do status não pode ser vazio' });
        }

        try {
            const result = await client.query(
                'INSERT INTO t_scenario_status (title) VALUES ($1) RETURNING *',
                [title]
            );
            res.status(201).json(result.rows[0]);
        } catch (err) {
            if (err.code === '23505') {
                return res.status(409).json({ error: 'Status com esse título já existe' });
            }
            res.status(500).json({ error: err.message });
        }
    });

    // PATCH: Atualizar status de cenário
    app.patch('/api/config/status/scenario/:id', async (req, res) => {
        const { title } = req.body;
        const { id } = req.params;

        if (!title) {
            return res.status(400).json({ error: 'Título do status não pode ser vazio' });
        }

        try {
            const result = await client.query(
                'UPDATE t_scenario_status SET title = $1 WHERE id = $2 RETURNING *',
                [title, id]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Status não encontrado' });
            }
            res.json(result.rows[0]);
        } catch (err) {
            if (err.code === '23505') {
                return res.status(409).json({ error: 'Status com esse título já existe' });
            }
            res.status(500).json({ error: err.message });
        }
    });

    // DELETE: Remover status de cenário
    app.delete('/api/config/status/scenario/:id', async (req, res) => {
        try {
            const result = await client.query('DELETE FROM t_scenario_status WHERE id = $1 RETURNING id', [req.params.id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Status não encontrado' });
            }
            res.status(204).send();
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
};
