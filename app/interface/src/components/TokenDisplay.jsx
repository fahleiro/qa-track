/**
 * ============================================================
 *  ARQUIVO: interface/src/components/TokenDisplay.jsx
 * ============================================================
 *  Caixinha que mostra o df_token e oferece copy-to-clipboard.
 *  O df_token é destinado a uso humano (futura colagem em
 *  capabilities Appium); não é usado em chamadas API internas.
 * ============================================================
 */

import { useState } from 'react'

export default function TokenDisplay({ token, label = 'device_token' }) {
    const [copied, setCopied] = useState(false)
    if (!token) return null

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(token)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        } catch {}
    }

    return (
        <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
            <div className="token-display">
                <code style={{ flex: 1 }}>{token}</code>
                <button className="btn btn-sm" onClick={handleCopy}>{copied ? '✓ copiado' : 'copiar'}</button>
            </div>
        </div>
    )
}
