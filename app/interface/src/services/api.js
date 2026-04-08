/**
 * API Service - v0.1.0
 * Serviço centralizado para chamadas à API
 */

const API_BASE_URL = '/api';

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
            return null;
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

// --- SISTEMAS ---
export const systemsAPI = {
    getAll: () => request('/system'),
    getById: (id) => request(`/system/${id}`),
    create: (title) => request('/system', {
        method: 'POST',
        body: JSON.stringify({ title }),
    }),
    update: (id, data) => request(`/system/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    }),
    delete: (id) => request(`/system/${id}`, {
        method: 'DELETE',
    }),
};

// --- FEATURES (FUNCIONALIDADES) ---
export const featuresAPI = {
    getAll: () => request('/feature'),
    getById: (id) => request(`/feature/${id}`),
    getBySystem: (systemId) => request(`/feature/system/${systemId}`),
    create: (title, system_id) => request('/feature', {
        method: 'POST',
        body: JSON.stringify({ title, system_id }),
    }),
    update: (id, data) => request(`/feature/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    }),
    delete: (id) => request(`/feature/${id}`, {
        method: 'DELETE',
    }),
};

// --- STATUS DE CENÁRIOS ---
export const statusAPI = {
    getAll: () => request('/config/status/scenario'),
    getById: (id) => request(`/config/status/scenario/${id}`),
    create: (title) => request('/config/status/scenario', {
        method: 'POST',
        body: JSON.stringify({ title }),
    }),
    update: (id, data) => request(`/config/status/scenario/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    }),
    delete: (id) => request(`/config/status/scenario/${id}`, {
        method: 'DELETE',
    }),
};

// --- CENÁRIOS ---
export const scenariosAPI = {
    getAll: () => request('/scenario'),
    getById: (id) => request(`/scenario/${id}`),
    create: (data) => request('/scenario', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id, data) => request(`/scenario/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    }),
    delete: (id) => request(`/scenario/${id}`, {
        method: 'DELETE',
    }),
    // Pré-requisitos
    addPre: (scenarioId, description) => request(`/scenario/${scenarioId}/pre`, {
        method: 'POST',
        body: JSON.stringify({ description }),
    }),
    updatePre: (preId, description) => request(`/scenario/pre/${preId}`, {
        method: 'PATCH',
        body: JSON.stringify({ description }),
    }),
    deletePre: (preId) => request(`/scenario/pre/${preId}`, {
        method: 'DELETE',
    }),
    // Resultados esperados
    addExpect: (scenarioId, description) => request(`/scenario/${scenarioId}/expect`, {
        method: 'POST',
        body: JSON.stringify({ description }),
    }),
    updateExpect: (expectId, description) => request(`/scenario/expect/${expectId}`, {
        method: 'PATCH',
        body: JSON.stringify({ description }),
    }),
    deleteExpect: (expectId) => request(`/scenario/expect/${expectId}`, {
        method: 'DELETE',
    }),
};

// --- CONFIGURAÇÃO (EXPORT/IMPORT) ---
export const configAPI = {
    export: async () => {
        const response = await fetch(`${API_BASE_URL}/config/export`);
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
            throw new Error(error.error || `HTTP ${response.status}`);
        }
        return response.blob();
    },
    import: async (jsonData) => request('/config/import', {
        method: 'POST',
        body: JSON.stringify(jsonData),
    }),
};

// --- STATUS DE RESULTADO ---
export const resultStatusAPI = {
    getAll: () => request('/config/status/result'),
    create: (title) => request('/config/status/result', {
        method: 'POST',
        body: JSON.stringify({ title }),
    }),
    update: (id, data) => request(`/config/status/result/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    }),
    delete: (id) => request(`/config/status/result/${id}`, { method: 'DELETE' }),
};

// --- KANBAN ---
export const kanbanAPI = {
    getStatuses: () => request('/kanban/status'),
    getCards: () => request('/kanban/card'),
    getCard: (id) => request(`/kanban/card/${id}`),
    createCard: (data) => request('/kanban/card', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    moveCard: (id, data) => request(`/kanban/card/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    }),
    deleteCard: (id) => request(`/kanban/card/${id}`, { method: 'DELETE' }),
};

// --- RUNS ---
export const runsAPI = {
    getAll: () => request('/run'),
    getById: (id) => request(`/run/${id}`),
    updateDetailStatus: (detailId, result_status_id) => request(`/run/detail/${detailId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ result_status_id }),
    }),
};