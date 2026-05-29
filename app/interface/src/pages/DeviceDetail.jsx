/**
 * ============================================================
 *  ARQUIVO: interface/src/pages/DeviceDetail.jsx
 * ============================================================
 *  Página de detalhe de 1 device.
 *    - Screenshot atualizado a cada 5s.
 *    - Sidebar com info + botão Reservar / Liberar.
 *    - Keepalive a cada 30s enquanto reservado por mim.
 *    - Botão "gerar device token" quando reservado.
 *
 *  Nota: o <img src> não envia Authorization, então buscamos
 *  o PNG via fetch autenticado (blob) e usamos URL.createObjectURL.
 * ============================================================
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { deviceFarmAPI, authAPI } from '../services/api'
import { useAuth } from '../auth/useAuth'
import TokenDisplay from '../components/TokenDisplay'

const POLL_MS = 5000
const KEEPALIVE_MS = 30 * 1000

export default function DeviceDetail() {
    const { udid } = useParams()
    const { user, refreshUser } = useAuth()

    const [device, setDevice] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [busy, setBusy] = useState(false)
    const [screenshotSrc, setScreenshotSrc] = useState(null)
    const [generatingToken, setGeneratingToken] = useState(false)
    const keepaliveRef = useRef(null)
    const lastBlobUrlRef = useRef(null)

    const load = useCallback(async () => {
        try {
            const d = await deviceFarmAPI.getDevice(udid)
            setDevice(d); setError(null)
        } catch (err) { setError(err.message) }
        finally { setLoading(false) }
    }, [udid])

    const refreshScreenshot = useCallback(async () => {
        try {
            const blob = await deviceFarmAPI.screenshotBlob(udid)
            const url = URL.createObjectURL(blob)
            if (lastBlobUrlRef.current) URL.revokeObjectURL(lastBlobUrlRef.current)
            lastBlobUrlRef.current = url
            setScreenshotSrc(url)
        } catch (err) {
            console.warn('[screenshot] falhou:', err.message)
        }
    }, [udid])

    useEffect(() => {
        load()
        refreshScreenshot()
        const i = setInterval(() => {
            load()
            refreshScreenshot()
        }, POLL_MS)
        return () => {
            clearInterval(i)
            if (lastBlobUrlRef.current) { URL.revokeObjectURL(lastBlobUrlRef.current); lastBlobUrlRef.current = null }
        }
    }, [load, refreshScreenshot])

    useEffect(() => {
        const isOwner = device?.lock?.is_self
        if (!isOwner) {
            if (keepaliveRef.current) { clearInterval(keepaliveRef.current); keepaliveRef.current = null }
            return
        }
        if (keepaliveRef.current) return
        keepaliveRef.current = setInterval(() => {
            deviceFarmAPI.renewLock(udid).catch(err => console.warn('[keepalive] falhou:', err.message))
        }, KEEPALIVE_MS)
        return () => { if (keepaliveRef.current) { clearInterval(keepaliveRef.current); keepaliveRef.current = null } }
    }, [device?.lock?.is_self, udid])

    const handleLock = async () => {
        setBusy(true)
        try { await deviceFarmAPI.lock(udid); await load() }
        catch (err) { setError(err.message) }
        finally { setBusy(false) }
    }
    const handleUnlock = async (force = false) => {
        setBusy(true)
        try { await deviceFarmAPI.unlock(udid, force); await load() }
        catch (err) { setError(err.message) }
        finally { setBusy(false) }
    }
    const handleGenerateToken = async () => {
        setGeneratingToken(true)
        try { await authAPI.generateDeviceToken(); await refreshUser() }
        catch (err) { setError(err.message) }
        finally { setGeneratingToken(false) }
    }

    if (loading) return <div className="empty"><div className="empty-text">Carregando…</div></div>
    if (error && !device) return (
        <div className="import-status import-error">
            <strong>Erro:</strong> {error}
            <div style={{ marginTop: 8 }}><Link to="/device-farm" className="btn btn-ghost btn-sm">← voltar</Link></div>
        </div>
    )
    if (!device) return null

    const isOffline = device.last_status !== 'device' || !device.node?.online
    const isMyLock  = device.lock?.is_self
    const isLocked  = !!device.lock

    return (
        <div>
            <div className="page-header">
                <div>
                    <Link to="/device-farm" className="btn-link">← Device Farm</Link>
                    <h1 className="page-title" style={{ marginTop: 6 }}>{device.model || 'Device'}</h1>
                </div>
            </div>

            {error && (
                <div className="import-status import-error" style={{ marginBottom: 16 }}>
                    <strong>Erro:</strong> {error}
                </div>
            )}

            <div className="modal-body-two-col" style={{ alignItems: 'flex-start' }}>
                <div className="modal-col-main">
                    {isOffline ? (
                        <div className="empty" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                            <div className="empty-icon">○</div>
                            <div className="empty-text">Device ou node offline.</div>
                        </div>
                    ) : (
                        <div style={{ background: '#000', borderRadius: 'var(--radius)', overflow: 'hidden', padding: 8, textAlign: 'center', minHeight: 200 }}>
                            {screenshotSrc ? (
                                <img src={screenshotSrc} alt="screenshot" style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }} />
                            ) : (
                                <div style={{ color: '#999', padding: 60, fontSize: 13 }}>Carregando screenshot…</div>
                            )}
                        </div>
                    )}
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, textAlign: 'center' }}>
                        screenshot refresh: {POLL_MS / 1000}s
                    </p>
                </div>

                <div className="modal-col-side" style={{ width: 280 }}>
                    <div className="section">
                        <div className="section-title">Device</div>
                        <div className="detail-row"><span className="detail-label">UDID:</span> <code style={{ fontSize: 11 }}>{device.udid}</code></div>
                        <div className="detail-row"><span className="detail-label">Modelo:</span> {device.model || '—'}</div>
                        <div className="detail-row"><span className="detail-label">Fabricante:</span> {device.manufacturer || '—'}</div>
                        <div className="detail-row"><span className="detail-label">{device.platform === 'ios' ? 'iOS' : 'Android'}:</span> {device.os_version || '—'}</div>
                        <div className="detail-row"><span className="detail-label">Plataforma:</span> {device.platform}</div>
                        <div className="detail-row">
                            <span className="detail-label">Node:</span>
                            <span className={`node-badge ${device.node?.online ? 'online' : 'offline'}`}>{device.node?.name}</span>
                        </div>
                    </div>

                    <div className="section">
                        <div className="section-title">Status</div>
                        {isLocked ? (
                            <>
                                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                    Em uso por <strong>{device.lock.locked_by}</strong>{isMyLock && ' (você)'}.
                                </p>
                                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                    Lock expira: {new Date(device.lock.expires_at).toLocaleTimeString('pt-BR')}
                                </p>
                            </>
                        ) : (
                            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Livre.</p>
                        )}
                    </div>

                    <div className="section">
                        {!isLocked && !isOffline && (
                            <button className="btn btn-primary" onClick={handleLock} disabled={busy} style={{ width: '100%' }}>
                                {busy ? '…' : 'Reservar device'}
                            </button>
                        )}
                        {isMyLock && (
                            <button className="btn btn-danger" onClick={() => handleUnlock(false)} disabled={busy} style={{ width: '100%' }}>
                                {busy ? '…' : 'Liberar'}
                            </button>
                        )}
                        {isLocked && !isMyLock && user?.role === 'admin' && (
                            <button className="btn btn-danger" onClick={() => handleUnlock(true)} disabled={busy} style={{ width: '100%', marginTop: 8 }}>
                                Forçar liberação (admin)
                            </button>
                        )}
                    </div>

                    {isMyLock && (
                        <div className="section">
                            <div className="section-title">Device Token (Appium)</div>
                            {user?.df_token ? (
                                <TokenDisplay token={user.df_token} />
                            ) : (
                                <button className="btn btn-secondary btn-sm" onClick={handleGenerateToken} disabled={generatingToken} style={{ width: '100%' }}>
                                    {generatingToken ? 'Gerando…' : 'Gerar device_token'}
                                </button>
                            )}
                            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                                Token informativo — cole em capabilities Appium futuras.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
