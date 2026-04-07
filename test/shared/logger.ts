export const log = {
  success: (msg: string): void => console.log('\x1b[32m✓\x1b[0m', msg),
  error:   (msg: string): void => console.log('\x1b[31m✗\x1b[0m', msg),
  info:    (msg: string): void => console.log('\x1b[36mℹ\x1b[0m', msg),
  warn:    (msg: string): void => console.log('\x1b[33m⚠\x1b[0m', msg),
  section: (msg: string): void => console.log(`\n\x1b[33m===== ${msg} =====\x1b[0m`),
}
