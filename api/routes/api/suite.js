/**
* ====================================
* ROTAS PARA GERENCIAMENTO DE SUITES
* ====================================
*/

module.exports = (app, client) => {
    // GET: Listar todas as suites
    app.get('/api/suite', async (req, res) => {
        try {
            const result = await client.query('SELECT * FROM t_suite ORDER BY id DESC');
            res.json(result.rows);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // GET: Buscar uma suite específica
    app.get('/api/suite/:id', async (req, res) => {
        try {
            const result = await client.query('SELECT * FROM t_suite WHERE id = $1', [req.params.id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Suite não encontrada' });
            }
            res.json(result.rows[0]);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // POST: Criar nova suite
    app.post('/api/suite', async (req, res) => {
        const { title, description } = req.body;
        if (!title) {
            return res.status(400).json({ error: 'Título da suite não pode ser vazio' });
        }

        try {
            const result = await client.query(
                'INSERT INTO t_suite (title, description) VALUES ($1, $2) RETURNING *',
                [title, description]
            );
            res.status(201).json(result.rows[0]);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // PATCH: Atualizar parcialmente uma suite
    app.patch('/api/suite/:id', async (req, res) => {
        const { title, description } = req.body;
        const { id } = req.params;

        try {
            const result = await client.query(
                `UPDATE t_suite 
                SET title = COALESCE($1, title),
                    description = COALESCE($2, description)
                WHERE id = $3 RETURNING *`,
                [title, description, id]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Suite não encontrada' });
            }
            res.json(result.rows[0]);
        } catch (err) {
            if (err.code === '23505') {
                return res.status(409).json({ error: 'Suite com esse título já existe' });
            }
            res.status(500).json({ error: err.message });
        }
    });

    // DELETE: Remover suite
    app.delete('/api/suite/:id', async (req, res) => {
        try {
            const result = await client.query('DELETE FROM t_suite WHERE id = $1 RETURNING id', [req.params.id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Suite não encontrada' });
            }
            res.status(204).send();
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
};
