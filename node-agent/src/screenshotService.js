/**
 * ============================================================
 *  ARQUIVO: node-agent/src/screenshotService.js
 * ============================================================
 *  Wrapper de captureScreenshot do adbService — único arquivo
 *  para permitir cache TTL futuro sem mexer no route handler.
 * ============================================================
 */

const { captureScreenshot } = require('./deviceService');

module.exports = { captureScreenshot };
