/**
* ====================================
* ROTAS PARA GERENCIAMENTO DE FUNCIONALIDADES
* ====================================
*/

module.exports = (app, client) => {
    // GET: Listar todas as funcionalidades
    app.get('/api/feature', async (req, res) => {
        try {
            const result = await client.query(`
                SELECT f.*, s.title as system_title 
                FROM t_feature f
                LEFT JOIN t_system s ON f.system_id = s.id
                ORDER BY f.id DESC
            `);
            res.json(result.rows);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // GET: Listar funcionalidades por sistema
    app.get('/api/feature/system/:systemId', async (req, res) => {
        try {
            const result = await client.query(
                'SELECT * FROM t_feature WHERE system_id = $1 ORDER BY id DESC',
                [req.params.systemId]
            );
            res.json(result.rows);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // GET: Listar uma funcionalidade específica com cenários
    app.get('/api/feature/:id', async (req, res) => {
        try {
            const featureResult = await client.query(`
                SELECT f.*, s.title as system_title 
                FROM t_feature f
                LEFT JOIN t_system s ON f.system_id = s.id
                WHERE f.id = $1
            `, [req.params.id]);

            if (featureResult.rows.length === 0) {
                return res.status(404).json({ error: 'Funcionalidade não encontrada' });
            }

            // Buscar cenários vinculados à funcionalidade
            const scenariosResult = await client.query(
                'SELECT * FROM t_scenario WHERE feature_id = $1 ORDER BY id DESC',
                [req.params.id]
            );

            // Buscar pré-requisitos e resultados esperados para cada cenário
            const scenariosWithDetails = await Promise.all(scenariosResult.rows.map(async (scenario) => {
                const [prerequisites, expectations] = await Promise.all([
                    client.query('SELECT id, description FROM t_scenario_pre WHERE scenario_id = $1 ORDER BY id', [scenario.id]),
                    client.query('SELECT id, description FROM t_scenario_expect WHERE scenario_id = $1 ORDER BY id', [scenario.id])
                ]);
                return {
                    ...scenario,
                    prerequisites: prerequisites.rows,
                    expectations: expectations.rows
                };
            }));

            res.json({
                ...featureResult.rows[0],
                scenarios: scenariosWithDetails
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // POST: Criar nova funcionalidade
    app.post('/api/feature', async (req, res) => {
        const { title, system_id } = req.body;

        if (!title) {
            return res.status(400).json({ error: 'Título da funcionalidade não pode ser vazio' });
        }
        if (!system_id) {
            return res.status(400).json({ error: 'ID do sistema é obrigatório' });
        }

        try {
            const result = await client.query(
                'INSERT INTO t_feature (title, system_id) VALUES ($1, $2) RETURNING *',
                [title, system_id]
            );
            res.status(201).json(result.rows[0]);
        } catch (err) {
            if (err.code === '23505') {
                return res.status(409).json({ error: 'Funcionalidade com esse título já existe' });
            }
            if (err.code === '23503') {
                return res.status(404).json({ error: 'Sistema não encontrado' });
            }
            res.status(500).json({ error: err.message });
        }
    });

    // PATCH: Atualizar uma funcionalidade
    app.patch('/api/feature/:id', async (req, res) => {
        const { title, system_id } = req.body;
        const { id } = req.params;

        try {
            const result = await client.query(
                `UPDATE t_feature 
                SET title = COALESCE($1, title),
                    system_id = COALESCE($2, system_id)
                WHERE id = $3 RETURNING *`,
                [title, system_id, id]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Funcionalidade não encontrada' });
            }
            res.json(result.rows[0]);
        } catch (err) {
            if (err.code === '23505') {
                return res.status(409).json({ error: 'Funcionalidade com esse título já existe' });
            }
            if (err.code === '23503') {
                return res.status(404).json({ error: 'Sistema não encontrado' });
            }
            res.status(500).json({ error: err.message });
        }
    });

    // DELETE: Remover funcionalidade
    app.delete('/api/feature/:id', async (req, res) => {
        try {
            const result = await client.query('DELETE FROM t_feature WHERE id = $1 RETURNING id', [req.params.id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Funcionalidade não encontrada' });
            }
            res.status(204).send();
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
};

