/**
 * ====================================
 * EXECUTOR DE TODOS OS TESTES
 * ====================================
 * Executa todos os scripts de teste em sequência
 */

const { spawn } = require('child_process');
const path = require('path');

const tests = [
    '01-config-status.test.js',
    '02-suite.test.js',
    '03-scenario.test.js',
    '04-run.test.js',
    '05-result.test.js'
];

let currentTest = 0;
let failedTests = [];

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║   EXECUTANDO TODOS OS TESTES DA API v0.1.0           ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

function runTest(testFile) {
    return new Promise((resolve, reject) => {
        const testPath = path.join(__dirname, testFile);
        const testProcess = spawn('node', [testPath], {
            stdio: 'inherit',
            shell: true
        });

        testProcess.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Teste falhou com código ${code}`));
            }
        });

        testProcess.on('error', (err) => {
            reject(err);
        });
    });
}

async function runAllTests() {
    for (const test of tests) {
        currentTest++;
        console.log(`\n\x1b[36m[${currentTest}/${tests.length}] Executando: ${test}\x1b[0m`);
        
        try {
            await runTest(test);
        } catch (error) {
            failedTests.push({ test, error: error.message });
            console.log(`\x1b[31m✗ Teste falhou: ${test}\x1b[0m`);
        }
    }

    // Resumo final
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║   RESUMO DOS TESTES                                   ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    const successCount = tests.length - failedTests.length;
    const failCount = failedTests.length;

    console.log(`\x1b[32m✓ Testes bem-sucedidos: ${successCount}/${tests.length}\x1b[0m`);
    
    if (failCount > 0) {
        console.log(`\x1b[31m✗ Testes falhados: ${failCount}/${tests.length}\x1b[0m`);
        console.log('\nTestes que falharam:');
        failedTests.forEach(({ test, error }) => {
            console.log(`  \x1b[31m- ${test}\x1b[0m`);
            console.log(`    Erro: ${error}`);
        });
        console.log('\n');
        process.exit(1);
    } else {
        console.log('\n\x1b[32m╔════════════════════════════════════════════════════════╗\x1b[0m');
        console.log('\x1b[32m║   🎉 TODOS OS TESTES PASSARAM COM SUCESSO!            ║\x1b[0m');
        console.log('\x1b[32m╚════════════════════════════════════════════════════════╝\x1b[0m\n');
    }
}

runAllTests().catch((err) => {
    console.error('\n\x1b[31m✗ Erro fatal ao executar testes:\x1b[0m', err);
    process.exit(1);
});

