/**
 * ============================================================
 *  ARQUIVO: interface/src/components/DeviceCard.jsx
 * ============================================================
 *  Card visual de 1 device na grade da página DeviceFarm.
 *  Mostra model, UDID curto, badge de status (livre/ocupado/
 *  offline) e o node owner. Click → navega para /:udid.
 * ============================================================
 */

import { Link } from 'react-router-dom'

function shorten(udid) {
    if (!udid) return ''
    return udid.length > 14 ? udid.slice(0, 6) + '…' + udid.slice(-6) : udid
}

export default function DeviceCard({ device }) {
    const isOffline = device.status !== 'device'
    const isLocked  = !!device.lock
    const cls = `device-card${isLocked ? ' device-locked' : ''}${isOffline ? ' device-offline' : ''}`

    return (
        <Link to={`/device-farm/${encodeURIComponent(device.udid)}`} className={cls} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="device-model">{device.model || 'Device sem modelo'}</div>
            <div className="device-udid">{shorten(device.udid)}</div>
            <div className="device-meta">
                {device.manufacturer && <>{device.manufacturer} · </>}
                Android {device.os_version || '—'}
            </div>
            <div className="device-meta">node: <strong>{device.node?.name}</strong></div>

            {isOffline ? (
                <span className="device-badge device-badge-offline">offline</span>
            ) : isLocked ? (
                <span className="device-badge device-badge-locked">
                    {device.lock.is_self ? 'você' : `em uso · ${device.lock.locked_by}`}
                </span>
            ) : (
                <span className="device-badge device-badge-free">livre</span>
            )}
        </Link>
    )
}
