// Serviço centralizado para chamadas à API

const API_BASE_URL = '/api';

// Helper para fazer requisições
async function request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    };

    try {
        const response = await fetch(url, config);
        
        if (response.status === 204) {
            return null; // No content
        }
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
            throw new Error(error.error || `HTTP ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`Erro na requisição ${endpoint}:`, error);
        throw error;
    }
}

// --- SUITES ---

export const suitesAPI = {
    getAll: () => request('/suite'),
    
    getById: (id) => request(`/suite/${id}`),
    
    create: (title, description = null) => request('/suite', {
        method: 'POST',
        body: JSON.stringify({ title, description }),
    }),
    
    update: (id, data) => request(`/suite/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    }),
    
    delete: (id) => request(`/suite/${id}`, {
        method: 'DELETE',
    }),
};

// --- CENÁRIOS (SCENARIOS) ---

export const scenariosAPI = {
    getAll: () => request('/scenario'),
    
    getById: (id) => request(`/scenario/${id}`),
    
    create: (title, prerequisites, expectations, suite_id = null, system_ids = []) => request('/scenario', {
        method: 'POST',
        body: JSON.stringify({ title, prerequisites, expectations, suite_id, system_ids }),
    }),
    
    update: (id, data) => request(`/scenario/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    }),
    
    delete: (id) => request(`/scenario/${id}`, {
        method: 'DELETE',
    }),

    // Pré-requisitos
    addPrerequisite: (scenarioId, description) => request(`/scenario/${scenarioId}/pre`, {
        method: 'POST',
        body: JSON.stringify({ description }),
    }),
    
    updatePrerequisite: (preId, description) => request(`/scenario/pre/${preId}`, {
        method: 'PATCH',
        body: JSON.stringify({ description }),
    }),
    
    deletePrerequisite: (preId) => request(`/scenario/pre/${preId}`, {
        method: 'DELETE',
    }),

    // Resultados Esperados
    addExpectation: (scenarioId, description) => request(`/scenario/${scenarioId}/expect`, {
        method: 'POST',
        body: JSON.stringify({ description }),
    }),
    
    updateExpectation: (expectId, description) => request(`/scenario/expect/${expectId}`, {
        method: 'PATCH',
        body: JSON.stringify({ description }),
    }),
    
    deleteExpectation: (expectId) => request(`/scenario/expect/${expectId}`, {
        method: 'DELETE',
    }),
};

// --- STATUS DE CENÁRIOS ---

export const scenarioStatusAPI = {
    getAll: () => request('/config/status/scenario'),
    
    create: (title, description = null, is_default = false) => request('/config/status/scenario', {
        method: 'POST',
        body: JSON.stringify({ title, description, is_default }),
    }),

    update: (id, data) => request(`/config/status/scenario/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    }),
    
    delete: (id) => request(`/config/status/scenario/${id}`, {
        method: 'DELETE',
    }),
};

// --- STATUS DE EXECUÇÕES ---

export const runStatusAPI = {
    getAll: () => request('/config/status/run'),
    
    create: (title, description = null, is_default = false) => request('/config/status/run', {
        method: 'POST',
        body: JSON.stringify({ title, description, is_default }),
    }),

    update: (id, data) => request(`/config/status/run/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    }),
    
    delete: (id) => request(`/config/status/run/${id}`, {
        method: 'DELETE',
    }),
};

// --- STATUS DE RESULTADOS ---

export const resultStatusAPI = {
    getAll: () => request('/config/status/result'),
    
    create: (title, description = null, is_default = false) => request('/config/status/result', {
        method: 'POST',
        body: JSON.stringify({ title, description, is_default }),
    }),

    update: (id, data) => request(`/config/status/result/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    }),
    
    delete: (id) => request(`/config/status/result/${id}`, {
        method: 'DELETE',
    }),
};

// --- EXECUÇÕES (RUNS) ---

export const runsAPI = {
    getAll: () => request('/run'),
    
    getById: (id, expand = false) => request(`/run/${id}${expand ? '?expand=details' : ''}`),
    
    create: (title, description, status = null) => request('/run', {
        method: 'POST',
        body: JSON.stringify({ title, description, status }),
    }),
    
    update: (id, data) => request(`/run/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    }),
    
    delete: (id) => request(`/run/${id}`, {
        method: 'DELETE',
    }),

    // Adicionar cenário à execução
    addScenario: (runId, scenario_id) => request(`/run/${runId}/scenario`, {
        method: 'POST',
        body: JSON.stringify({ scenario_id }),
    }),

    // Remover cenário da execução
    removeScenario: (runId, scenarioId) => request(`/run/${runId}/scenario/${scenarioId}`, {
        method: 'DELETE',
    }),
};

// --- RESULTADOS ---

export const resultsAPI = {
    getAll: () => request('/result'),
    
    getById: (id) => request(`/result/${id}`),
    
    create: (scenario_id, run_id, status) => request('/result', {
        method: 'POST',
        body: JSON.stringify({ scenario_id, run_id, status }),
    }),
    
    update: (id, status) => request(`/result/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    }),
    
    delete: (id) => request(`/result/${id}`, {
        method: 'DELETE',
    }),
};

// --- SISTEMAS ---

export const systemsAPI = {
    getAll: () => request('/system'),
    
    getById: (id) => request(`/system/${id}`),
    
    create: (description) => request('/system', {
        method: 'POST',
        body: JSON.stringify({ description }),
    }),
    
    update: (id, data) => request(`/system/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    }),
    
    delete: (id) => request(`/system/${id}`, {
        method: 'DELETE',
    }),

    // Adicionar cenário ao sistema
    addScenario: (systemId, scenario_id) => request(`/system/${systemId}/scenario`, {
        method: 'POST',
        body: JSON.stringify({ scenario_id }),
    }),

    // Remover cenário do sistema
    removeScenario: (systemId, scenarioId) => request(`/system/${systemId}/scenario/${scenarioId}`, {
        method: 'DELETE',
    }),
};

// --- FLOWS ---

export const flowsAPI = {
    getAll: () => request('/flow'),
    
    getById: (id) => request(`/flow/${id}`),
    
    create: (title) => request('/flow', {
        method: 'POST',
        body: JSON.stringify({ title }),
    }),
    
    update: (id, data) => request(`/flow/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    }),
    
    delete: (id) => request(`/flow/${id}`, {
        method: 'DELETE',
    }),

    // Adicionar cenário ao flow (position calculada automaticamente)
    addScenario: (flowId, scenario_id) => request(`/flow/${flowId}/scenario`, {
        method: 'POST',
        body: JSON.stringify({ scenario_id }),
    }),

    // Remover cenário do flow
    removeScenario: (flowId, scenarioId) => request(`/flow/${flowId}/scenario/${scenarioId}`, {
        method: 'DELETE',
    }),

    // Mover cenário (trocar position)
    moveScenario: (flowId, scenarioId, direction) => request(`/flow/${flowId}/scenario/${scenarioId}/move`, {
        method: 'PATCH',
        body: JSON.stringify({ direction }),
    }),
};

// Compatibilidade com código antigo (deprecated - usar scenariosAPI)
export const testesAPI = scenariosAPI;

// Compatibilidade com código antigo (deprecated - usar runsAPI)
export const testRunsAPI = runsAPI;

// Compatibilidade com código antigo (deprecated - usar scenarioStatusAPI e runStatusAPI)
export const statusAPI = scenarioStatusAPI;
