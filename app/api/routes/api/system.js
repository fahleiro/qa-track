/**
* ====================================
* ROTAS PARA GERENCIAMENTO DE SISTEMAS
* ====================================
*/

module.exports = (app, client) => {
    // GET: Listar todos os sistemas
    app.get('/api/system', async (req, res) => {
        try {
            const result = await client.query('SELECT * FROM t_system ORDER BY id DESC');
            res.json(result.rows);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // GET: Listar um sistema específico com funcionalidades e cenários relacionados
    app.get('/api/system/:id', async (req, res) => {
        try {
            const systemResult = await client.query('SELECT * FROM t_system WHERE id = $1', [req.params.id]);
            if (systemResult.rows.length === 0) {
                return res.status(404).json({ error: 'Sistema não encontrado' });
            }

            // Buscar funcionalidades do sistema
            const featuresResult = await client.query(
                'SELECT * FROM t_feature WHERE system_id = $1 ORDER BY id DESC',
                [req.params.id]
            );

            // Buscar cenários relacionados via t_scenario_system
            const scenariosResult = await client.query(`
                SELECT s.* FROM t_scenario s
                INNER JOIN t_scenario_system ss ON s.id = ss.scenario_id
                WHERE ss.system_id = $1
                ORDER BY s.id DESC
            `, [req.params.id]);

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
                ...systemResult.rows[0],
                features: featuresResult.rows,
                scenarios: scenariosWithDetails
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // POST: Criar novo sistema
    app.post('/api/system', async (req, res) => {
        const { title } = req.body;
        if (!title) {
            return res.status(400).json({ error: 'Título do sistema não pode ser vazio' });
        }

        try {
            const result = await client.query(
                'INSERT INTO t_system (title) VALUES ($1) RETURNING *',
                [title]
            );
            res.status(201).json(result.rows[0]);
        } catch (err) {
            if (err.code === '23505') {
                return res.status(409).json({ error: 'Sistema com esse título já existe' });
            }
            res.status(500).json({ error: err.message });
        }
    });

    // PATCH: Atualizar um sistema
    app.patch('/api/system/:id', async (req, res) => {
        const { title } = req.body;
        const { id } = req.params;
        
        try {
            const result = await client.query(
                `UPDATE t_system 
                SET title = COALESCE($1, title)
                WHERE id = $2 RETURNING *`,
                [title, id]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Sistema não encontrado' });
            }
            res.json(result.rows[0]);
        } catch (err) {
            if (err.code === '23505') {
                return res.status(409).json({ error: 'Sistema com esse título já existe' });
            }
            res.status(500).json({ error: err.message });
        }
    });

    // DELETE: Remover sistema
    app.delete('/api/system/:id', async (req, res) => {
        try {
            const result = await client.query('DELETE FROM t_system WHERE id = $1 RETURNING id', [req.params.id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Sistema não encontrado' });
            }
            res.status(204).send();
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // POST: Adicionar cenário ao sistema
    app.post('/api/system/:id/scenario', async (req, res) => {
        const { scenario_id } = req.body;
        const { id } = req.params;

        if (!scenario_id) {
            return res.status(400).json({ error: 'ID do cenário é obrigatório' });
        }

        try {
            await client.query(
                'INSERT INTO t_scenario_system (system_id, scenario_id) VALUES ($1, $2)',
                [id, scenario_id]
            );
            res.status(201).json({ message: 'Cenário adicionado ao sistema' });
        } catch (err) {
            if (err.code === '23505') {
                return res.status(409).json({ error: 'Cenário já está vinculado a este sistema' });
            }
            if (err.code === '23503') {
                return res.status(404).json({ error: 'Sistema ou cenário não encontrado' });
            }
            res.status(500).json({ error: err.message });
        }
    });

    // DELETE: Remover cenário do sistema
    app.delete('/api/system/:id/scenario/:scenarioId', async (req, res) => {
        const { id, scenarioId } = req.params;

        try {
            const result = await client.query(
                'DELETE FROM t_scenario_system WHERE system_id = $1 AND scenario_id = $2 RETURNING system_id',
                [id, scenarioId]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Vínculo não encontrado' });
            }
            res.status(204).send();
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
};
