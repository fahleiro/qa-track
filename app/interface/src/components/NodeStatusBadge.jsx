/**
 * ============================================================
 *  ARQUIVO: interface/src/components/NodeStatusBadge.jsx
 * ============================================================
 *  Badge inline com bolinha verde/cinza + nome do node. Online
 *  = heartbeat há menos de 60s.
 * ============================================================
 */

function relativeTime(iso) {
    if (!iso) return 'nunca'
    const diff = (Date.now() - new Date(iso).getTime()) / 1000
    if (diff < 60) return `${Math.floor(diff)}s atrás`
    if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`
    return `${Math.floor(diff / 3600)}h atrás`
}

export default function NodeStatusBadge({ name, online, last_heartbeat }) {
    return (
        <span className={`node-badge ${online ? 'online' : 'offline'}`} title={`last heartbeat: ${relativeTime(last_heartbeat)}`}>
            {name}
        </span>
    )
}
