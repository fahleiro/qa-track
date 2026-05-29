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

    // ---------- Gravador de interações (POC, sessionStorage) ----------
    const REC_KEY = `qatrack:rec:${udid}`
    const [recording, setRecording] = useState(false)
    const [recLog, setRecLog] = useState(() => {
        try { return JSON.parse(sessionStorage.getItem(REC_KEY) || '[]') } catch { return [] }
    })
    const [textVal, setTextVal] = useState('')
    const [appVal, setAppVal] = useState('')
    const [recMsg, setRecMsg] = useState(null)
    const [elements, setElements] = useState([])
    const dragRef = useRef(null)

    const addEntry = useCallback((entry) => {
        setRecLog(prev => {
            const next = [...prev, { ts: new Date().toISOString(), ...entry }]
            try { sessionStorage.setItem(REC_KEY, JSON.stringify(next)) } catch { /* quota */ }
            return next
        })
    }, [REC_KEY])
    const clearLog = () => { setRecLog([]); try { sessionStorage.removeItem(REC_KEY) } catch { /* noop */ } }
    const exportLog = () => {
        const blob = new Blob([JSON.stringify(recLog, null, 2)], { type: 'application/json' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `qatrack-rec-${udid.slice(0, 8)}-${Date.now()}.json`
        a.click(); URL.revokeObjectURL(a.href)
    }

    const screenCoords = (img, clientX, clientY) => {
        const rect = img.getBoundingClientRect()
        const clamp = (v, max) => Math.max(0, Math.min(max, v))
        return {
            x: clamp(Math.round((clientX - rect.left) * (img.naturalWidth / rect.width)), img.naturalWidth),
            y: clamp(Math.round((clientY - rect.top) * (img.naturalHeight / rect.height)), img.naturalHeight),
        }
    }
    const onScreenDown = (e) => {
        if (!recording || !device?.lock?.is_self || device?.platform === 'ios') return
        const img = e.currentTarget.querySelector('img')
        if (!img) return
        e.preventDefault()
        dragRef.current = { img, t: Date.now(), ...screenCoords(img, e.clientX, e.clientY) }
    }
    const onScreenUp = async (e) => {
        const d = dragRef.current; dragRef.current = null
        if (!d) return
        const end = screenCoords(d.img, e.clientX, e.clientY)
        const dist = Math.hypot(end.x - d.x, end.y - d.y)
        try {
            if (dist < 12) {
                const r = await deviceFarmAPI.tap(udid, d.x, d.y)
                addEntry({ action: 'tap', x: d.x, y: d.y, element: r.element || null })
            } else {
                const dur = Math.min(Math.max(Date.now() - d.t, 120), 1500)
                await deviceFarmAPI.swipe(udid, d.x, d.y, end.x, end.y, dur)
                addEntry({ action: 'swipe', x: d.x, y: d.y, x2: end.x, y2: end.y })
            }
            setRecMsg(null); setTimeout(refreshScreenshot, 400)
        } catch (err) { setRecMsg(err.message) }
    }
    const doGesture = async (action) => {
        try { await deviceFarmAPI.gesture(udid, action); if (recording) addEntry({ action }); setTimeout(refreshScreenshot, 400) }
        catch (err) { setRecMsg(err.message) }
    }
    const doText = async () => {
        if (!textVal) return
        try { await deviceFarmAPI.setText(udid, textVal); if (recording) addEntry({ action: 'text', text: textVal }); setTextVal(''); setTimeout(refreshScreenshot, 400) }
        catch (err) { setRecMsg(err.message) }
    }
    const doLaunch = async () => {
        if (!appVal) return
        try { await deviceFarmAPI.launchApp(udid, appVal); if (recording) addEntry({ action: 'launch', app: appVal }); setTimeout(refreshScreenshot, 800) }
        catch (err) { setRecMsg(err.message) }
    }
    const doInspect = async () => {
        try {
            const r = await deviceFarmAPI.getSource(udid)
            let els = []
            if (r.platform === 'ios') {
                els = (r.elements || []).map(e => e.caption || e.spoken_description || '(sem rótulo)')
            } else if (r.xml) {
                const doc = new DOMParser().parseFromString(r.xml, 'text/xml')
                els = [...doc.querySelectorAll('node')]
                    .map(n => n.getAttribute('text') || n.getAttribute('content-desc') || n.getAttribute('resource-id') || n.getAttribute('class'))
                    .filter(Boolean)
            }
            setElements(els)
            if (recording) addEntry({ action: 'inspect', elements: els.length })
            setRecMsg(`Inspecionado: ${els.length} elementos na tela`)
        } catch (err) { setRecMsg(err.message) }
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
    const isAndroid = device.platform !== 'ios'

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
                        <div onMouseDown={onScreenDown} onMouseUp={onScreenUp} onDragStart={e => e.preventDefault()} style={{ background: '#000', borderRadius: 'var(--radius)', overflow: 'hidden', padding: 8, textAlign: 'center', minHeight: 200, cursor: (recording && isMyLock && isAndroid) ? 'crosshair' : 'default', userSelect: 'none' }}>
                            {screenshotSrc ? (
                                <img src={screenshotSrc} alt="screenshot" draggable={false} style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', userSelect: 'none' }} />
                            ) : (
                                <div style={{ color: '#999', padding: 60, fontSize: 13 }}>Carregando screenshot…</div>
                            )}
                        </div>
                    )}
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, textAlign: 'center' }}>
                        screenshot refresh: {POLL_MS / 1000}s
                    </p>

                    {isMyLock && !isOffline && (
                        <div className="section" style={{ marginTop: 12 }}>
                            <div className="section-title">
                                Gravador de interações {recording && <span style={{ color: '#e05260' }}>● gravando</span>}
                            </div>
                            {!isAndroid && (
                                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                    iOS: tap por coordenada, gestos e texto exigem WDA assinado. Disponíveis: <strong>abrir app</strong> e <strong>inspecionar elementos</strong>.
                                </p>
                            )}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                                <button className={`btn btn-sm ${recording ? 'btn-danger' : 'btn-primary'}`} onClick={() => setRecording(v => !v)}>
                                    {recording ? 'Parar' : 'Gravar'}
                                </button>
                                <button className="btn btn-secondary btn-sm" onClick={() => doGesture('home')}    disabled={!isAndroid} title={isAndroid ? '' : 'requer WDA'}>Home</button>
                                <button className="btn btn-secondary btn-sm" onClick={() => doGesture('back')}    disabled={!isAndroid} title={isAndroid ? '' : 'requer WDA'}>Voltar</button>
                                <button className="btn btn-secondary btn-sm" onClick={() => doGesture('recents')} disabled={!isAndroid} title={isAndroid ? '' : 'requer WDA'}>Apps</button>
                                <button className="btn btn-ghost btn-sm" onClick={doInspect}>Inspecionar tela</button>
                            </div>
                            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                                <input placeholder="texto p/ campo focado" value={textVal} onChange={e => setTextVal(e.target.value)} disabled={!isAndroid}
                                    style={{ flex: 1, padding: '5px 8px', fontSize: 12, borderRadius: 6, border: '1px solid var(--border)' }} />
                                <button className="btn btn-secondary btn-sm" onClick={doText} disabled={!isAndroid || !textVal}>Digitar</button>
                            </div>
                            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                                <input placeholder={isAndroid ? 'package (ex: com.android.settings)' : 'bundle id (ex: com.apple.Preferences)'} value={appVal} onChange={e => setAppVal(e.target.value)}
                                    style={{ flex: 1, padding: '5px 8px', fontSize: 12, borderRadius: 6, border: '1px solid var(--border)' }} />
                                <button className="btn btn-secondary btn-sm" onClick={doLaunch} disabled={!appVal}>Abrir app</button>
                            </div>
                            {isAndroid && (
                                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                                    Com <strong>Gravar</strong> ligado, clique na tela para tocar e registrar o elemento.
                                </p>
                            )}
                            {recMsg && <p style={{ fontSize: 11, color: '#c08', marginTop: 6 }}>{recMsg}</p>}

                            {elements.length > 0 && (
                                <div style={{ marginTop: 10 }}>
                                    <strong style={{ fontSize: 12 }}>Elementos na tela ({elements.length})</strong>
                                    <div style={{ maxHeight: 160, overflow: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, marginTop: 4, fontSize: 11 }}>
                                        {elements.map((el, i) => (
                                            <div key={i} title={el} style={{ padding: '3px 8px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{el}</div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div style={{ marginTop: 10 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <strong style={{ fontSize: 12 }}>Log ({recLog.length})</strong>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button className="btn btn-ghost btn-sm" onClick={exportLog} disabled={!recLog.length}>Exportar JSON</button>
                                        <button className="btn btn-ghost btn-sm" onClick={clearLog} disabled={!recLog.length}>Limpar</button>
                                    </div>
                                </div>
                                <div style={{ maxHeight: 220, overflow: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, marginTop: 6, fontSize: 11, fontFamily: 'monospace' }}>
                                    {recLog.length === 0 ? (
                                        <div style={{ padding: 10, color: 'var(--text-muted)' }}>Sem interações. Ligue "Gravar" e interaja com o device.</div>
                                    ) : recLog.map((e, i) => (
                                        <div key={i} style={{ padding: '4px 8px', borderBottom: '1px solid var(--border)' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>{e.ts?.slice(11, 19)}</span>{' '}
                                            <strong>{e.action}</strong>{' '}
                                            {e.action === 'tap' && `(${e.x},${e.y}) → ${e.element?.text || e.element?.resourceId || e.element?.contentDesc || e.element?.class || '—'}`}
                                            {e.action === 'text' && `"${e.text}"`}
                                            {e.action === 'launch' && e.app}
                                            {e.action === 'inspect' && `${e.elements} elementos`}
                                        </div>
                                    ))}
                                </div>
                                <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                                    Logs ficam na sessão do navegador (sessionStorage) e somem ao fechar a aba.
                                </p>
                            </div>
                        </div>
                    )}
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
