/**
* ====================================
* ROTAS PARA GERENCIAMENTO DE FLOWS
* ====================================
*/

module.exports = (app, client) => {
    // GET: Listar todos os flows
    app.get('/api/flow', async (req, res) => {
        try {
            const result = await client.query('SELECT * FROM t_flow ORDER BY id DESC');
            res.json(result.rows);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // GET: Buscar flow específico com detalhes (ordenado por position)
    app.get('/api/flow/:id', async (req, res) => {
        try {
            const flowResult = await client.query('SELECT * FROM t_flow WHERE id = $1', [req.params.id]);
            if (flowResult.rows.length === 0) {
                return res.status(404).json({ error: 'Flow não encontrado' });
            }

            // Buscar cenários do flow ordenados por position
            const detailsResult = await client.query(`
                SELECT 
                    fd.id,
                    fd.flow_id,
                    fd.scenario_id,
                    fd.position,
                    s.title
                FROM t_flow_detail fd
                INNER JOIN t_scenario s ON fd.scenario_id = s.id
                WHERE fd.flow_id = $1
                ORDER BY fd.position ASC
            `, [req.params.id]);

            // Buscar pré-requisitos e resultados esperados para cada cenário
            const scenariosWithDetails = await Promise.all(detailsResult.rows.map(async (row) => {
                const [prerequisites, expectations] = await Promise.all([
                    client.query('SELECT id, description FROM t_scenario_pre WHERE scenario_id = $1 ORDER BY id', [row.scenario_id]),
                    client.query('SELECT id, description FROM t_scenario_expect WHERE scenario_id = $1 ORDER BY id', [row.scenario_id])
                ]);
                return {
                    ...row,
                    prerequisites: prerequisites.rows,
                    expectations: expectations.rows
                };
            }));

            res.json({
                ...flowResult.rows[0],
                scenarios: scenariosWithDetails
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // POST: Criar novo flow
    app.post('/api/flow', async (req, res) => {
        const { title } = req.body;
        if (!title) {
            return res.status(400).json({ error: 'Título do flow não pode ser vazio' });
        }

        try {
            const result = await client.query(
                'INSERT INTO t_flow (title) VALUES ($1) RETURNING *',
                [title]
            );
            res.status(201).json(result.rows[0]);
        } catch (err) {
            if (err.code === '23505') {
                return res.status(409).json({ error: 'Flow com esse título já existe' });
            }
            res.status(500).json({ error: err.message });
        }
    });

    // PATCH: Atualizar título do flow
    app.patch('/api/flow/:id', async (req, res) => {
        const { title } = req.body;
        const { id } = req.params;

        try {
            const result = await client.query(
                'UPDATE t_flow SET title = COALESCE($1, title) WHERE id = $2 RETURNING *',
                [title, id]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Flow não encontrado' });
            }
            res.json(result.rows[0]);
        } catch (err) {
            if (err.code === '23505') {
                return res.status(409).json({ error: 'Flow com esse título já existe' });
            }
            res.status(500).json({ error: err.message });
        }
    });

    // DELETE: Remover flow
    app.delete('/api/flow/:id', async (req, res) => {
        try {
            const result = await client.query('DELETE FROM t_flow WHERE id = $1 RETURNING id', [req.params.id]);
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Flow não encontrado' });
            }
            res.status(204).send();
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // POST: Adicionar cenário ao flow (calcula próxima position automaticamente)
    app.post('/api/flow/:id/scenario', async (req, res) => {
        const { scenario_id } = req.body;
        const { id } = req.params;

        if (!scenario_id) {
            return res.status(400).json({ error: 'ID do cenário é obrigatório' });
        }

        try {
            // Verificar se o flow existe
            const flowCheck = await client.query('SELECT id FROM t_flow WHERE id = $1', [id]);
            if (flowCheck.rows.length === 0) {
                return res.status(404).json({ error: 'Flow não encontrado' });
            }

            // Verificar se o cenário existe
            const scenarioCheck = await client.query('SELECT id FROM t_scenario WHERE id = $1', [scenario_id]);
            if (scenarioCheck.rows.length === 0) {
                return res.status(404).json({ error: 'Cenário não encontrado' });
            }

            // Verificar se cenário já está no flow
            const duplicateCheck = await client.query(
                'SELECT id FROM t_flow_detail WHERE flow_id = $1 AND scenario_id = $2',
                [id, scenario_id]
            );
            if (duplicateCheck.rows.length > 0) {
                return res.status(409).json({ error: 'Cenário já está no flow' });
            }

            // Calcular próxima position (MAX + 1)
            const positionResult = await client.query(
                'SELECT COALESCE(MAX(position), 0) + 1 AS next_position FROM t_flow_detail WHERE flow_id = $1',
                [id]
            );
            const nextPosition = positionResult.rows[0].next_position;

            const result = await client.query(
                'INSERT INTO t_flow_detail (flow_id, scenario_id, position) VALUES ($1, $2, $3) RETURNING *',
                [id, scenario_id, nextPosition]
            );
            res.status(201).json(result.rows[0]);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // DELETE: Remover cenário do flow (reordena positions restantes)
    app.delete('/api/flow/:flowId/scenario/:scenarioId', async (req, res) => {
        const { flowId, scenarioId } = req.params;

        try {
            // Buscar a position do cenário a ser removido
            const detailResult = await client.query(
                'SELECT position FROM t_flow_detail WHERE flow_id = $1 AND scenario_id = $2',
                [flowId, scenarioId]
            );
            
            if (detailResult.rows.length === 0) {
                return res.status(404).json({ error: 'Cenário não encontrado no flow' });
            }

            const removedPosition = detailResult.rows[0].position;

            // Remover o cenário
            await client.query(
                'DELETE FROM t_flow_detail WHERE flow_id = $1 AND scenario_id = $2',
                [flowId, scenarioId]
            );

            // Reordenar positions dos cenários restantes (decrementar positions maiores)
            await client.query(
                'UPDATE t_flow_detail SET position = position - 1 WHERE flow_id = $1 AND position > $2',
                [flowId, removedPosition]
            );

            res.status(204).send();
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // PATCH: Mover cenário (trocar position com vizinho)
    app.patch('/api/flow/:flowId/scenario/:scenarioId/move', async (req, res) => {
        const { flowId, scenarioId } = req.params;
        const { direction } = req.body; // 'up' ou 'down'

        if (!direction || !['up', 'down'].includes(direction)) {
            return res.status(400).json({ error: 'Direção inválida. Use "up" ou "down"' });
        }

        try {
            // Buscar position atual do cenário
            const currentResult = await client.query(
                'SELECT position FROM t_flow_detail WHERE flow_id = $1 AND scenario_id = $2',
                [flowId, scenarioId]
            );

            if (currentResult.rows.length === 0) {
                return res.status(404).json({ error: 'Cenário não encontrado no flow' });
            }

            const currentPosition = currentResult.rows[0].position;
            const targetPosition = direction === 'up' ? currentPosition - 1 : currentPosition + 1;

            // Verificar se pode mover (position 1 é o mínimo)
            if (targetPosition < 1) {
                return res.status(400).json({ error: 'Cenário já está na primeira posição' });
            }

            // Buscar cenário na posição de destino
            const targetResult = await client.query(
                'SELECT scenario_id FROM t_flow_detail WHERE flow_id = $1 AND position = $2',
                [flowId, targetPosition]
            );

            if (targetResult.rows.length === 0) {
                return res.status(400).json({ error: 'Cenário já está na última posição' });
            }

            const targetScenarioId = targetResult.rows[0].scenario_id;

            // Trocar positions (usando position temporária para evitar conflito de UNIQUE)
            await client.query(
                'UPDATE t_flow_detail SET position = -1 WHERE flow_id = $1 AND scenario_id = $2',
                [flowId, scenarioId]
            );
            await client.query(
                'UPDATE t_flow_detail SET position = $1 WHERE flow_id = $2 AND scenario_id = $3',
                [currentPosition, flowId, targetScenarioId]
            );
            await client.query(
                'UPDATE t_flow_detail SET position = $1 WHERE flow_id = $2 AND scenario_id = $3',
                [targetPosition, flowId, scenarioId]
            );

            res.json({ success: true, newPosition: targetPosition });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
};
