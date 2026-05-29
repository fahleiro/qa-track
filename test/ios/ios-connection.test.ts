/**
 * ============================================================
 *  TESTE SIMPLES: screenshot do device iOS (validação manual)
 * ============================================================
 *  Pega a tela do iPhone pelo node-agent e salva em test/reports/
 *  para o HUMANO abrir e conferir visualmente se a captura veio.
 *  Não é XCUITest — é o smoke da plumbing (device alcançável +
 *  serviços de desenvolvedor respondendo via DVT/tunnel).
 *
 *  Self-contained (sem deps do test/): rode com
 *    npx -y tsx test/ios/ios-connection.test.ts
 *
 *  Envs: NODE_AGENT_URL (default http://192.168.0.43:4724)
 *        IOS_UDID       (default 00008030-000259520205402E)
 * ============================================================
 */

import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const AGENT    = process.env.NODE_AGENT_URL ?? 'http://192.168.0.43:4724'
const IOS_UDID = process.env.IOS_UDID       ?? '00008030-000259520205402E'
const OUT_DIR  = process.env.OUT_DIR        ?? join(__dirname, '..', 'reports')

const isPng = (b: Buffer) => b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47

export async function run(): Promise<void> {
  console.log('\n===== TESTE: screenshot iOS (validação manual) =====')
  console.log(`agent=${AGENT}  udid=${IOS_UDID}\n`)

  const t0 = Date.now()
  const res = await fetch(`${AGENT}/agent/devices/${encodeURIComponent(IOS_UDID)}/screenshot`)
  const ms = Date.now() - t0
  const buf = Buffer.from(await res.arrayBuffer())

  if (res.status !== 200 || !isPng(buf)) {
    console.log(`\x1b[31m✗\x1b[0m screenshot falhou → HTTP ${res.status} · ${buf.length}B`)
    process.exitCode = 1
    return
  }

  mkdirSync(OUT_DIR, { recursive: true })
  const file = join(OUT_DIR, `ios-screenshot-${IOS_UDID.slice(0, 8)}.png`)
  writeFileSync(file, buf)

  console.log(`\x1b[32m✓\x1b[0m screenshot OK → HTTP ${res.status} · ${buf.length}B · ${ms}ms`)
  console.log(`\x1b[36mℹ\x1b[0m salvo em: ${file}`)
  console.log('\x1b[33m⚠\x1b[0m  VALIDAÇÃO MANUAL: abra o arquivo e confirme que a tela do iPhone veio correta.')
}

run().catch((e) => { console.error(e); process.exit(1) })
