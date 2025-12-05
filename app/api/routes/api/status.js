/**
* ====================================
* ROTAS PARA GERENCIAMENTO DE STATUS (CENÁRIOS E EXECUÇÕES)
* ====================================
*/

module.exports = (app, client) => {

    // ========== STATUS DE CENÁRIOS ==========

    // GET: Listar todos os status de cenários
    app.get('/api/config/status/scenario', async (req, res) => {
        try {
            const result = await client.query('SELECT * FROM t_scenario_status ORDER BY id ASC');
            res.json(result.rows);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // POST: Criar novo status de cenário
    app.post('/api/config/status/scenario', async (req, res) => {
        const { title, description, is_default } = req.body;
        if (!title) {
            return res.status(400).json({ error: 'Título do status não pode ser vazio' });
        }

        try {
            const result = await client.query(
                'INSERT INTO t_scenario_status (title, description, is_default) VALUES ($1, $2, $3) RETURNING *',
                [title, description || null, is_default || false]
            );
            res.status(201).json(result.rows[0]);
        } catch (err) {
            if (err.code === '23505') {
                return res.status(409).json({ error: 'Status com esse título já existe' });
            }
            res.status(500).json({ error: err.message });
        }
    });

    // PATCH: Atualizar parcialmente status de cenário
    app.patch('/api/config/status/scenario/:id', async (req, res) => {
        const { title, description, is_default } = req.body;
        const { id } = req.params;

        try {
            const result = await client.query(
                `UPDATE t_scenario_status 
                SET title = COALESCE($1, title),
                    description = COALESCE($2, description),
                    is_default = COALESCE($3, is_default)
                WHERE id = $4 RETURNING *`,
                [title, description, is_default, id]
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

    // ========== STATUS DE EXECUÇÕES ==========
    
    // GET: Listar todos os status de execuções
    app.get('/api/config/status/run', async (req, res) => {
        try {
            const result = await client.query('SELECT * FROM t_run_status ORDER BY id ASC');
            res.json(result.rows);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // POST: Criar novo status de execução
    app.post('/api/config/status/run', async (req, res) => {
        const { title, description, is_default } = req.body;
        if (!title) {
            return res.status(400).json({ error: 'Título do status não pode ser vazio' });
        }

        try {
            const result = await client.query(
                'INSERT INTO t_run_status (title, description, is_default) VALUES ($1, $2, $3) RETURNING *',
                [title, description || null, is_default || false]
            );
            res.status(201).json(result.rows[0]);
        } catch (err) {
            if (err.code === '23505') {
                return res.status(409).json({ error: 'Status com esse título já existe' });
            }
            res.status(500).json({ error: err.message });
        }
    });

    // PATCH: Atualizar parcialmente status de execução
    app.patch('/api/config/status/run/:id', async (req, res) => {
        const { title, description, is_default } = req.body;
        const { id } = req.params;

        try {
            const result = await client.query(
                `UPDATE t_run_status 
                SET title = COALESCE($1, title),
                    description = COALESCE($2, description),
                    is_default = COALESCE($3, is_default)
                WHERE id = $4 RETURNING *`,
                [title, description, is_default, id]
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

    // DELETE: Remover status de execução
    app.delete('/api/config/status/run/:id', async (req, res) => {
        try {
            const result = await client.query('DELETE FROM t_run_status WHERE id = $1 RETURNING id', [req.params.id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Status não encontrado' });
            }
            res.status(204).send();
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // ========== STATUS DE RESULTADOS ==========
    
    // GET: Listar todos os status de resultados
    app.get('/api/config/status/result', async (req, res) => {
        try {
            const result = await client.query('SELECT * FROM t_result_status ORDER BY id ASC');
            res.json(result.rows);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // POST: Criar novo status de resultado
    app.post('/api/config/status/result', async (req, res) => {
        const { title, description, is_default } = req.body;
        if (!title) {
            return res.status(400).json({ error: 'Título do status não pode ser vazio' });
        }

        try {
            const result = await client.query(
                'INSERT INTO t_result_status (title, description, is_default) VALUES ($1, $2, $3) RETURNING *',
                [title, description || null, is_default || false]
            );
            res.status(201).json(result.rows[0]);
        } catch (err) {
            if (err.code === '23505') {
                return res.status(409).json({ error: 'Status com esse título já existe' });
            }
            res.status(500).json({ error: err.message });
        }
    });

    // PATCH: Atualizar parcialmente status de resultado
    app.patch('/api/config/status/result/:id', async (req, res) => {
        const { title, description, is_default } = req.body;
        const { id } = req.params;

        try {
            const result = await client.query(
                `UPDATE t_result_status 
                SET title = COALESCE($1, title),
                    description = COALESCE($2, description),
                    is_default = COALESCE($3, is_default)
                WHERE id = $4 RETURNING *`,
                [title, description, is_default, id]
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

    // DELETE: Remover status de resultado
    app.delete('/api/config/status/result/:id', async (req, res) => {
        try {
            const result = await client.query('DELETE FROM t_result_status WHERE id = $1 RETURNING id', [req.params.id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Status não encontrado' });
            }
            res.status(204).send();
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
};

