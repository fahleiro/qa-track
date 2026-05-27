/**
 * ============================================================
 *  API Service — v0.2.0
 * ============================================================
 *  Wrapper único de fetch para todas as chamadas à API.
 *  Centraliza:
 *    - Injeção do header `Authorization: Bearer <jwt>` (storage key
 *      `qa_track_jwt`).
 *    - Tratamento de 401 (limpa storage + redireciona p/ /login).
 *    - Parsing JSON + erros amigáveis.
 *
 *  Mudanças em relação à v0.1.x:
 *    - Endpoints agora exigem JWT (exceto whitelist). O `request()`
 *      injeta automaticamente.
 *    - Adicionados módulos novos: authAPI, nodesAPI, deviceFarmAPI.
 * ============================================================
 */

const API_BASE_URL = '/api';
const STORAGE_KEY = 'qa_track_jwt';

function getToken()    { return localStorage.getItem(STORAGE_KEY); }
function setToken(t)   { localStorage.setItem(STORAGE_KEY, t); }
function clearToken()  { localStorage.removeItem(STORAGE_KEY); }

async function request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const config = { ...options, headers };

    try {
        const response = await fetch(url, config);

        // 401 global: token inválido/expirado → expulsa para login
        if (response.status === 401) {
            clearToken();
            if (!window.location.pathname.startsWith('/login')) {
                window.location.href = '/login';
            }
            throw new Error('Sessão expirada');
        }

        if (response.status === 204) return null;

        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
            throw new Error(err.error || `HTTP ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Erro na requisição ${endpoint}:`, error);
        throw error;
    }
}

// ====================================================================
//  AUTH
// ====================================================================
export const authAPI = {
    login: async (username, password) => {
        const data = await request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
        setToken(data.token);
        return data;
    },
    me:     () => request('/auth/me'),
    logout: () => {
        const p = request('/auth/logout', { method: 'POST' }).catch(() => {});
        clearToken();
        return p;
    },
    generateDeviceToken: () => request('/auth/generate-device-token', { method: 'POST' }),
    getToken,
    clearToken,
    hasToken: () => !!getToken(),
};

// ====================================================================
//  qa-track core (sistemas, features, cenários, status, runs, kanban, config)
// ====================================================================
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

export const configAPI = {
    export: async () => {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/config/export`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
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

export const runsAPI = {
    getAll: () => request('/run'),
    getById: (id) => request(`/run/${id}`),
    updateDetailStatus: (detailId, result_status_id) => request(`/run/detail/${detailId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ result_status_id }),
    }),
};

// ====================================================================
//  Device Farm (v0.2.0)
// ====================================================================
export const nodesAPI = {
    list:   () => request('/nodes'),
    remove: (id) => request(`/nodes/${id}`, { method: 'DELETE' }),
};

export const deviceFarmAPI = {
    listDevices:    ()                   => request('/devicefarm/devices'),
    getDevice:      (udid)               => request(`/devicefarm/devices/${udid}`),
    lock:           (udid)               => request(`/devicefarm/devices/${udid}/lock`,        { method: 'POST' }),
    renewLock:      (udid)               => request(`/devicefarm/devices/${udid}/lock/renew`,  { method: 'POST' }),
    unlock:         (udid, force=false)  => request(`/devicefarm/devices/${udid}/lock${force ? '?force=true' : ''}`, { method: 'DELETE' }),
    listSessions:   ()                   => request('/devicefarm/sessions'),

    // <img src> não envia Authorization — buscamos como blob via fetch
    // autenticado e geramos um object URL para usar no src.
    screenshotBlob: async (udid) => {
        const token = getToken();
        const r = await fetch(`${API_BASE_URL}/devicefarm/devices/${udid}/screenshot?t=${Date.now()}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.blob();
    },
};
