/**
* ====================================
* ROTAS PARA GERENCIAMENTO DE CENÁRIOS
* v0.1.0
* ====================================
*/

module.exports = (app, client) => {
    // Helper: Buscar pré-requisitos de um cenário
    const getPrerequisites = async (scenarioId) => {
        const result = await client.query(
            'SELECT id, description FROM t_scenario_pre WHERE scenario_id = $1 ORDER BY id',
            [scenarioId]
        );
        return result.rows;
    };

    // Helper: Buscar resultados esperados de um cenário
    const getExpectations = async (scenarioId) => {
        const result = await client.query(
            'SELECT id, description FROM t_scenario_expect WHERE scenario_id = $1 ORDER BY id',
            [scenarioId]
        );
        return result.rows;
    };

    // Helper: Buscar sistemas de um cenário
    const getSystems = async (scenarioId) => {
        const result = await client.query(`
            SELECT s.* FROM t_system s
            INNER JOIN t_scenario_system ss ON s.id = ss.system_id
            WHERE ss.scenario_id = $1
        `, [scenarioId]);
        return result.rows;
    };

    // Helper: Buscar status de um cenário
    const getStatus = async (statusId) => {
        if (!statusId) return null;
        const result = await client.query(
            'SELECT * FROM t_scenario_status WHERE id = $1',
            [statusId]
        );
        return result.rows[0] || null;
    };

    // Helper: Buscar feature de um cenário
    const getFeature = async (featureId) => {
        if (!featureId) return null;
        const result = await client.query(
            'SELECT * FROM t_feature WHERE id = $1',
            [featureId]
        );
        return result.rows[0] || null;
    };

    // GET: Listar todos os cenários com sistemas, pré-requisitos e resultados esperados
    app.get('/api/scenario', async (req, res) => {
        try {
            const result = await client.query('SELECT * FROM t_scenario ORDER BY id DESC');
            
            const scenarios = await Promise.all(result.rows.map(async (scenario) => {
                const [systems, prerequisites, expectations, status, feature] = await Promise.all([
                    getSystems(scenario.id),
                    getPrerequisites(scenario.id),
                    getExpectations(scenario.id),
                    getStatus(scenario.status_id),
                    getFeature(scenario.feature_id)
                ]);
                return { ...scenario, systems, prerequisites, expectations, status, feature };
            }));
            
            res.json(scenarios);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // GET: Listar um cenário específico com sistemas, pré-requisitos e resultados esperados
    app.get('/api/scenario/:id', async (req, res) => {
        try {
            const result = await client.query('SELECT * FROM t_scenario WHERE id = $1', [req.params.id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Cenário não encontrado' });
            }

            const scenario = result.rows[0];
            const [systems, prerequisites, expectations, status, feature] = await Promise.all([
                getSystems(req.params.id),
                getPrerequisites(req.params.id),
                getExpectations(req.params.id),
                getStatus(scenario.status_id),
                getFeature(scenario.feature_id)
            ]);

            res.json({
                ...scenario,
                systems,
                prerequisites,
                expectations,
                status,
                feature
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // POST: Criar novo cenário
    app.post('/api/scenario', async (req, res) => {
        const { title, feature_id, status_id, system_ids, prerequisites, expectations } = req.body;
        
        if (!title) {
            return res.status(400).json({ error: 'Título do cenário não pode ser vazio' });
        }
        if (!prerequisites || !Array.isArray(prerequisites) || prerequisites.length === 0) {
            return res.status(400).json({ error: 'Pelo menos um pré-requisito é obrigatório' });
        }
        if (!expectations || !Array.isArray(expectations) || expectations.length === 0) {
            return res.status(400).json({ error: 'Pelo menos um resultado esperado é obrigatório' });
        }

        try {
            const result = await client.query(
                'INSERT INTO t_scenario (title, feature_id, status_id) VALUES ($1, $2, $3) RETURNING *',
                [title, feature_id || null, status_id || null]
            );
            
            const scenario = result.rows[0];

            // Inserir pré-requisitos
            for (const pre of prerequisites) {
                if (pre && pre.trim()) {
                    await client.query(
                        'INSERT INTO t_scenario_pre (scenario_id, description) VALUES ($1, $2)',
                        [scenario.id, pre.trim()]
                    );
                }
            }

            // Inserir resultados esperados
            for (const exp of expectations) {
                if (exp && exp.trim()) {
                    await client.query(
                        'INSERT INTO t_scenario_expect (scenario_id, description) VALUES ($1, $2)',
                        [scenario.id, exp.trim()]
                    );
                }
            }

            // Vincular sistemas se fornecidos
            if (system_ids && Array.isArray(system_ids) && system_ids.length > 0) {
                for (const systemId of system_ids) {
                    await client.query(
                        'INSERT INTO t_scenario_system (scenario_id, system_id) VALUES ($1, $2)',
                        [scenario.id, systemId]
                    );
                }
            }

            // Buscar dados relacionados para retorno
            const [systems, prereqs, exps, status, feature] = await Promise.all([
                getSystems(scenario.id),
                getPrerequisites(scenario.id),
                getExpectations(scenario.id),
                getStatus(scenario.status_id),
                getFeature(scenario.feature_id)
            ]);

            res.status(201).json({ 
                ...scenario, 
                systems, 
                prerequisites: prereqs, 
                expectations: exps,
                status,
                feature
            });
        } catch (err) {
            if (err.code === '23505') {
                return res.status(409).json({ error: 'Cenário com esse título já existe' });
            }
            if (err.code === '23503') {
                return res.status(404).json({ error: 'Feature ou Status não encontrado' });
            }
            res.status(500).json({ error: err.message });
        }
    });

    // PATCH: Atualizar parcialmente um cenário
    app.patch('/api/scenario/:id', async (req, res) => {
        const { title, feature_id, status_id, system_ids } = req.body;
        const { id } = req.params;
        
        try {
            const result = await client.query(
                `UPDATE t_scenario 
                SET title = COALESCE($1, title),
                    feature_id = COALESCE($2, feature_id),
                    status_id = COALESCE($3, status_id)
                WHERE id = $4 RETURNING *`,
                [title, feature_id, status_id, id]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Cenário não encontrado' });
            }

            const scenario = result.rows[0];

            // Atualizar sistemas se fornecidos
            if (system_ids !== undefined && Array.isArray(system_ids)) {
                await client.query('DELETE FROM t_scenario_system WHERE scenario_id = $1', [id]);
                
                for (const systemId of system_ids) {
                    await client.query(
                        'INSERT INTO t_scenario_system (scenario_id, system_id) VALUES ($1, $2)',
                        [id, systemId]
                    );
                }
            }

            // Buscar dados relacionados para retorno
            const [systems, prerequisites, expectations, status, feature] = await Promise.all([
                getSystems(id),
                getPrerequisites(id),
                getExpectations(id),
                getStatus(scenario.status_id),
                getFeature(scenario.feature_id)
            ]);

            res.json({ 
                ...scenario, 
                systems, 
                prerequisites, 
                expectations,
                status,
                feature
            });
        } catch (err) {
            if (err.code === '23505') {
                return res.status(409).json({ error: 'Cenário com esse título já existe' });
            }
            if (err.code === '23503') {
                return res.status(404).json({ error: 'Feature ou Status não encontrado' });
            }
            res.status(500).json({ error: err.message });
        }
    });

    // DELETE: Remover cenário
    app.delete('/api/scenario/:id', async (req, res) => {
        try {
            const result = await client.query('DELETE FROM t_scenario WHERE id = $1 RETURNING id', [req.params.id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Cenário não encontrado' });
            }
            res.status(204).send();
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // ====================================
    // ROTAS PARA PRÉ-REQUISITOS
    // ====================================

    // POST: Adicionar pré-requisito a um cenário
    app.post('/api/scenario/:id/pre', async (req, res) => {
        const { description } = req.body;
        const { id } = req.params;

        if (!description || !description.trim()) {
            return res.status(400).json({ error: 'Descrição do pré-requisito não pode ser vazia' });
        }

        try {
            // Verificar se cenário existe
            const scenarioCheck = await client.query('SELECT id FROM t_scenario WHERE id = $1', [id]);
            if (scenarioCheck.rows.length === 0) {
                return res.status(404).json({ error: 'Cenário não encontrado' });
            }

            const result = await client.query(
                'INSERT INTO t_scenario_pre (scenario_id, description) VALUES ($1, $2) RETURNING *',
                [id, description.trim()]
            );

            res.status(201).json(result.rows[0]);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // PATCH: Atualizar pré-requisito
    app.patch('/api/scenario/pre/:preId', async (req, res) => {
        const { description } = req.body;
        const { preId } = req.params;

        if (!description || !description.trim()) {
            return res.status(400).json({ error: 'Descrição do pré-requisito não pode ser vazia' });
        }

        try {
            const result = await client.query(
                'UPDATE t_scenario_pre SET description = $1 WHERE id = $2 RETURNING *',
                [description.trim(), preId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Pré-requisito não encontrado' });
            }

            res.json(result.rows[0]);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // DELETE: Remover pré-requisito
    app.delete('/api/scenario/pre/:preId', async (req, res) => {
        try {
            const result = await client.query(
                'DELETE FROM t_scenario_pre WHERE id = $1 RETURNING id',
                [req.params.preId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Pré-requisito não encontrado' });
            }

            res.status(204).send();
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // ====================================
    // ROTAS PARA RESULTADOS ESPERADOS
    // ====================================

    // POST: Adicionar resultado esperado a um cenário
    app.post('/api/scenario/:id/expect', async (req, res) => {
        const { description } = req.body;
        const { id } = req.params;

        if (!description || !description.trim()) {
            return res.status(400).json({ error: 'Descrição do resultado esperado não pode ser vazia' });
        }

        try {
            // Verificar se cenário existe
            const scenarioCheck = await client.query('SELECT id FROM t_scenario WHERE id = $1', [id]);
            if (scenarioCheck.rows.length === 0) {
                return res.status(404).json({ error: 'Cenário não encontrado' });
            }

            const result = await client.query(
                'INSERT INTO t_scenario_expect (scenario_id, description) VALUES ($1, $2) RETURNING *',
                [id, description.trim()]
            );

            res.status(201).json(result.rows[0]);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // PATCH: Atualizar resultado esperado
    app.patch('/api/scenario/expect/:expectId', async (req, res) => {
        const { description } = req.body;
        const { expectId } = req.params;

        if (!description || !description.trim()) {
            return res.status(400).json({ error: 'Descrição do resultado esperado não pode ser vazia' });
        }

        try {
            const result = await client.query(
                'UPDATE t_scenario_expect SET description = $1 WHERE id = $2 RETURNING *',
                [description.trim(), expectId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Resultado esperado não encontrado' });
            }

            res.json(result.rows[0]);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // DELETE: Remover resultado esperado
    app.delete('/api/scenario/expect/:expectId', async (req, res) => {
        try {
            const result = await client.query(
                'DELETE FROM t_scenario_expect WHERE id = $1 RETURNING id',
                [req.params.expectId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Resultado esperado não encontrado' });
            }

            res.status(204).send();
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
};
