import PDFDocument from 'pdfkit'
import * as fs from 'fs'
import * as path from 'path'
import { EvidenceFile, ApiEvidence, WebEvidence, DbEvidence } from '../shared/evidence'

const REPORTS_DIR = path.resolve(__dirname, '../reports')
const OUT_PDF = path.join(REPORTS_DIR, 'qa-track-report.pdf')

const MARGIN = 50
const PAGE_W = 595
const PAGE_H = 842
const CONTENT_W = PAGE_W - MARGIN * 2

// Colors
const C = {
  title:   '#1a252f',
  section: '#2c3e50',
  suite:   '#34495e',
  muted:   '#7f8c8d',
  code:    '#555555',
  green:   '#27ae60',
  red:     '#e74c3c',
  blue:    '#2980b9',
  orange:  '#e67e22',
  line:    '#dde1e4',
  bg:      '#f8f9fa',
}

function readEvidence(filename: string): EvidenceFile | null {
  const p = path.join(REPORTS_DIR, filename)
  if (!fs.existsSync(p)) return null
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')) } catch { return null }
}

function statusColor(status: number): string {
  if (status >= 200 && status < 300) return C.green
  if (status >= 400 && status < 500) return C.orange
  return C.red
}

function truncateJson(obj: unknown, max = 350): string {
  if (obj === null || obj === undefined) return 'null'
  const str = typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2)
  return str.length > max ? str.slice(0, max) + '\n  [truncado...]' : str
}

function addPageHeader(doc: PDFKit.PDFDocument, title: string): void {
  doc.save()
  doc.rect(0, 0, PAGE_W, 35).fill(C.section)
  doc.fontSize(10).fillColor('#ffffff').font('Helvetica-Bold')
    .text('QA Track — Relatório de Testes', MARGIN, 11, { continued: true })
    .font('Helvetica').text(`  |  ${title}`, { align: 'left' })
  doc.restore()
  doc.moveDown(2.5)
}

function sectionHeader(doc: PDFKit.PDFDocument, title: string): void {
  if (doc.y > PAGE_H - MARGIN - 80) doc.addPage()
  doc.moveDown(0.5)
  const y = doc.y
  doc.rect(MARGIN, y, CONTENT_W, 24).fill(C.section)
  doc.fontSize(13).fillColor('#ffffff').font('Helvetica-Bold')
    .text(title, MARGIN + 8, y + 6)
  doc.font('Helvetica').moveDown(1)
}

function suiteLabel(doc: PDFKit.PDFDocument, name: string): void {
  doc.moveDown(0.3)
  doc.fontSize(11).fillColor(C.suite).font('Helvetica-Bold').text(`▸ ${name}`)
  doc.font('Helvetica').moveDown(0.3)
}

function divider(doc: PDFKit.PDFDocument): void {
  doc.strokeColor(C.line).lineWidth(0.5)
    .moveTo(MARGIN, doc.y).lineTo(MARGIN + CONTENT_W, doc.y).stroke()
  doc.moveDown(0.3)
}

function checkPage(doc: PDFKit.PDFDocument, needed = 80): void {
  if (doc.y > PAGE_H - MARGIN - needed) doc.addPage()
}

function renderApiCall(doc: PDFKit.PDFDocument, call: ApiEvidence): void {
  checkPage(doc, 100)

  const color = statusColor(call.responseStatus)

  // Method + URL line
  doc.fontSize(9).fillColor(C.muted).font('Helvetica')
    .text(new Date(call.timestamp).toLocaleTimeString('pt-BR'), { indent: 8 })

  doc.fontSize(10).font('Helvetica-Bold').fillColor(C.blue)
    .text(`${call.method}  `, { indent: 8, continued: true })
    .font('Helvetica').fillColor(C.code).text(call.url)

  // Status badge
  doc.fontSize(10).fillColor(color).font('Helvetica-Bold')
    .text(`HTTP ${call.responseStatus}`, { indent: 8 })
  doc.font('Helvetica')

  // Request body
  if (call.requestBody !== null) {
    checkPage(doc, 50)
    doc.fontSize(8).fillColor(C.muted).text('► Request:', { indent: 12 })
    doc.fontSize(7.5).fillColor(C.code).font('Courier')
      .text(truncateJson(call.requestBody), { indent: 20, lineGap: 1 })
    doc.font('Helvetica')
  }

  // Response body
  checkPage(doc, 50)
  doc.fontSize(8).fillColor(C.muted).text('◄ Response:', { indent: 12 })
  doc.fontSize(7.5).fillColor(C.code).font('Courier')
    .text(truncateJson(call.responseBody), { indent: 20, lineGap: 1 })
  doc.font('Helvetica')

  doc.moveDown(0.4)
  divider(doc)
}

function renderWebStep(doc: PDFKit.PDFDocument, step: WebEvidence): void {
  checkPage(doc, 60)

  const icon = step.passed ? '✓' : '✗'
  const color = step.passed ? C.green : C.red

  doc.fontSize(10).fillColor(color).font('Helvetica-Bold')
    .text(`  ${icon}  ${step.step.replace(/_/g, ' ')}`, { indent: 8 })
  doc.font('Helvetica')

  if (step.screenshotPath && fs.existsSync(step.screenshotPath)) {
    checkPage(doc, 220)
    const imgY = doc.y + 4
    try {
      doc.image(step.screenshotPath, MARGIN + 8, imgY, { fit: [CONTENT_W - 16, 180] })
      doc.y = imgY + 185
    } catch { /* skip broken images */ }
  }

  doc.moveDown(0.5)
  divider(doc)
}

function renderDbCheck(doc: PDFKit.PDFDocument, check: DbEvidence): void {
  checkPage(doc, 25)
  const icon = check.passed ? '✓' : '✗'
  const color = check.passed ? C.green : C.red
  doc.fontSize(10).fillColor(color)
    .text(`  ${icon}  [${check.table}]  ${check.check}`, { indent: 8 })
  doc.font('Helvetica')
}

async function generate(): Promise<void> {
  const apiFile = readEvidence('evidence-api.json')
  const webFile = readEvidence('evidence-web.json')
  const dbFile  = readEvidence('evidence-db.json')

  fs.mkdirSync(REPORTS_DIR, { recursive: true })

  const doc = new PDFDocument({
    size: 'A4',
    margin: MARGIN,
    info: { Title: 'QA Track — Relatório de Testes', Author: 'QA Track CI' },
    autoFirstPage: false,
  })

  doc.pipe(fs.createWriteStream(OUT_PDF))

  // ── COVER PAGE ─────────────────────────────────────────────────────────────
  doc.addPage()

  doc.rect(0, 0, PAGE_W, 200).fill(C.section)
  doc.fontSize(32).fillColor('#ffffff').font('Helvetica-Bold')
    .text('QA Track', MARGIN, 60, { align: 'center', width: CONTENT_W })
  doc.fontSize(16).font('Helvetica').fillColor('#bdc3c7')
    .text('Relatório de Testes Automatizados', MARGIN, 110, { align: 'center', width: CONTENT_W })

  const executedAt = apiFile?.startedAt ?? webFile?.startedAt ?? dbFile?.startedAt ?? new Date().toISOString()
  doc.y = 220
  doc.fontSize(12).fillColor(C.section).font('Helvetica-Bold').text('Data de execução', { align: 'center' })
  doc.fontSize(12).fillColor(C.code).font('Helvetica')
    .text(new Date(executedAt).toLocaleString('pt-BR'), { align: 'center' })

  // Summary table
  const apiCalls = apiFile?.api ?? []
  const webSteps = webFile?.web ?? []
  const dbChecks = dbFile?.db ?? []

  const passedWeb = webSteps.filter(e => e.passed).length
  const passedDb  = dbChecks.filter(e => e.passed).length

  doc.moveDown(2)
  doc.fontSize(13).fillColor(C.section).font('Helvetica-Bold').text('Resumo', { align: 'center' })
  doc.moveDown(0.5)

  const rows: [string, string][] = [
    ['Chamadas de API registradas', `${apiCalls.length}`],
    ['Steps de testes web', `${passedWeb} / ${webSteps.length} ok`],
    ['Validações de schema (DB)', `${passedDb} / ${dbChecks.length} ok`],
  ]

  const colW = CONTENT_W / 2
  let rowY = doc.y
  for (const [label, value] of rows) {
    doc.rect(MARGIN, rowY, colW, 22).fill(C.bg).stroke(C.line)
    doc.rect(MARGIN + colW, rowY, colW, 22).fill('#ffffff').stroke(C.line)
    doc.fontSize(10).fillColor(C.suite).font('Helvetica-Bold')
      .text(label, MARGIN + 6, rowY + 6, { width: colW - 12 })
    doc.fontSize(10).fillColor(C.code).font('Helvetica')
      .text(value, MARGIN + colW + 6, rowY + 6, { width: colW - 12 })
    rowY += 22
  }
  doc.y = rowY + 10

  // ── API SECTION ─────────────────────────────────────────────────────────────
  if (apiCalls.length > 0) {
    doc.addPage()
    addPageHeader(doc, 'Testes de API')
    sectionHeader(doc, 'Testes de API')

    let currentSuite = ''
    for (const call of apiCalls) {
      if (call.suite !== currentSuite) {
        currentSuite = call.suite
        suiteLabel(doc, currentSuite)
      }
      renderApiCall(doc, call)
    }
  }

  // ── WEB SECTION ─────────────────────────────────────────────────────────────
  if (webSteps.length > 0) {
    doc.addPage()
    addPageHeader(doc, 'Testes Web (E2E)')
    sectionHeader(doc, 'Testes Web — Selenium')

    let currentSuite = ''
    for (const step of webSteps) {
      if (step.suite !== currentSuite) {
        currentSuite = step.suite
        suiteLabel(doc, currentSuite)
      }
      renderWebStep(doc, step)
    }
  }

  // ── DB SECTION ──────────────────────────────────────────────────────────────
  if (dbChecks.length > 0) {
    doc.addPage()
    addPageHeader(doc, 'Validações de Schema (DB)')
    sectionHeader(doc, 'Validações de Schema — PostgreSQL')

    let currentTable = ''
    for (const check of dbChecks) {
      if (check.table !== currentTable) {
        currentTable = check.table
        doc.moveDown(0.3)
        doc.fontSize(11).fillColor(C.suite).font('Helvetica-Bold').text(`▸ ${currentTable}`, { indent: 8 })
        doc.font('Helvetica').moveDown(0.2)
      }
      renderDbCheck(doc, check)
    }
  }

  doc.end()
  console.log(`\n✅ PDF gerado: ${OUT_PDF}`)
}

generate().catch(err => {
  console.error('Erro ao gerar PDF:', err)
  process.exit(1)
})
