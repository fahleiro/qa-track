/**
 * ============================================================
 *  ARQUIVO: interface/src/pages/DeviceFarm.jsx
 * ============================================================
 *  Listagem agregada de devices vindos de TODOS os node-agents
 *  online. Polling 5s. Filtros: status + node.
 * ============================================================
 */

import { useState, useEffect } from 'react'
import { deviceFarmAPI, nodesAPI } from '../services/api'
import DeviceCard from '../components/DeviceCard'
import NodeStatusBadge from '../components/NodeStatusBadge'

const POLL_MS = 5000

export default function DeviceFarm() {
    const [devices, setDevices] = useState([])
    const [nodes, setNodes] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const [filterStatus, setFilterStatus] = useState('')
    const [filterNode, setFilterNode] = useState('')

    useEffect(() => {
        let alive = true
        const load = async () => {
            try {
                const [d, n] = await Promise.all([deviceFarmAPI.listDevices(), nodesAPI.list()])
                if (!alive) return
                setDevices(d); setNodes(n); setError(null)
            } catch (err) {
                if (!alive) return
                setError(err.message)
            } finally {
                if (alive) setLoading(false)
            }
        }
        load()
        const i = setInterval(load, POLL_MS)
        return () => { alive = false; clearInterval(i) }
    }, [])

    const filtered = devices.filter(d => {
        if (filterNode && d.node?.name !== filterNode) return false
        if (filterStatus === 'free'    && (d.status !== 'device' || d.lock)) return false
        if (filterStatus === 'locked'  && !d.lock) return false
        if (filterStatus === 'offline' && d.status === 'device') return false
        return true
    })

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Device Farm</h1>
                <div className="page-actions">
                    {nodes.map(n => (
                        <NodeStatusBadge key={n.id} name={n.name} online={n.online} last_heartbeat={n.last_heartbeat} />
                    ))}
                </div>
            </div>

            <div className="filters">
                <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="">Todos os status</option>
                    <option value="free">Livres</option>
                    <option value="locked">Em uso</option>
                    <option value="offline">Offline</option>
                </select>
                <select className="filter-select" value={filterNode} onChange={e => setFilterNode(e.target.value)}>
                    <option value="">Todos os nodes</option>
                    {nodes.map(n => <option key={n.id} value={n.name}>{n.name}</option>)}
                </select>
                {(filterStatus || filterNode) && (
                    <button className="btn btn-ghost btn-sm" onClick={() => { setFilterStatus(''); setFilterNode('') }}>Limpar</button>
                )}
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>
                    {filtered.length} de {devices.length} · auto-refresh {POLL_MS / 1000}s
                </span>
            </div>

            {error && (
                <div className="import-status import-error" style={{ marginBottom: 16 }}>
                    <strong>Erro:</strong> {error}
                </div>
            )}

            {loading ? (
                <div className="empty"><div className="empty-text">Carregando devices…</div></div>
            ) : filtered.length === 0 ? (
                <div className="empty">
                    <div className="empty-icon">○</div>
                    <div className="empty-text">
                        {devices.length === 0
                            ? 'Nenhum device descoberto. Verifique se ao menos um node-agent está online.'
                            : 'Nenhum device com os filtros aplicados.'}
                    </div>
                </div>
            ) : (
                <div className="device-grid">
                    {filtered.map(d => <DeviceCard key={d.udid} device={d} />)}
                </div>
            )}
        </div>
    )
}
