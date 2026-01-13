/**
 * ====================================
 * EXECUTOR DE TODOS OS TESTES WEB
 * ====================================
 * Executa todos os scripts de teste web em sequência
 * Similar ao run-all-tests.js da API
 */

const { spawn } = require('child_process');
const path = require('path');

const tests = [
    '01-system.test.js',
    '02-feature.test.js',
    '03-status.test.js',
    '04-filters.test.js'
];

let currentTest = 0;
let failedTests = [];
let passedTests = [];

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║   EXECUTANDO TODOS OS TESTES WEB v0.1.0                    ║');
console.log('║   Selenium WebDriver + Node.js                             ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log('\x1b[36mℹ\x1b[0m Testes a serem executados:');
tests.forEach((test, index) => {
    console.log(`   ${index + 1}. ${test}`);
});
console.log('');

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
    const startTime = Date.now();

    for (const test of tests) {
        currentTest++;
        console.log(`\n\x1b[36m╔════════════════════════════════════════════════════════════╗\x1b[0m`);
        console.log(`\x1b[36m║ [${currentTest}/${tests.length}] Executando: ${test.padEnd(38)}║\x1b[0m`);
        console.log(`\x1b[36m╚════════════════════════════════════════════════════════════╝\x1b[0m`);
        
        try {
            await runTest(test);
            passedTests.push(test);
            console.log(`\x1b[32m✓ ${test} - PASSOU\x1b[0m`);
        } catch (error) {
            failedTests.push({ test, error: error.message });
            console.log(`\x1b[31m✗ ${test} - FALHOU\x1b[0m`);
        }
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    // Resumo final
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║   RESUMO FINAL DOS TESTES WEB                              ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log(`\x1b[36mℹ\x1b[0m Tempo total de execução: ${duration}s\n`);

    // Testes aprovados
    if (passedTests.length > 0) {
        console.log(`\x1b[32m✓ Testes aprovados (${passedTests.length}/${tests.length}):\x1b[0m`);
        passedTests.forEach(test => {
            console.log(`   \x1b[32m✓\x1b[0m ${test}`);
        });
    }

    // Testes falhados
    if (failedTests.length > 0) {
        console.log(`\n\x1b[31m✗ Testes falhados (${failedTests.length}/${tests.length}):\x1b[0m`);
        failedTests.forEach(({ test, error }) => {
            console.log(`   \x1b[31m✗\x1b[0m ${test}`);
            console.log(`      Erro: ${error}`);
        });
    }

    // Resultado final
    console.log('');
    if (failedTests.length > 0) {
        console.log('\x1b[31m╔════════════════════════════════════════════════════════════╗\x1b[0m');
        console.log('\x1b[31m║   ✗ ALGUNS TESTES FALHARAM                                 ║\x1b[0m');
        console.log('\x1b[31m╚════════════════════════════════════════════════════════════╝\x1b[0m\n');
        process.exit(1);
    } else {
        console.log('\x1b[32m╔════════════════════════════════════════════════════════════╗\x1b[0m');
        console.log('\x1b[32m║   ✓ TODOS OS TESTES WEB PASSARAM COM SUCESSO!             ║\x1b[0m');
        console.log('\x1b[32m╚════════════════════════════════════════════════════════════╝\x1b[0m\n');
    }
}

// Verificar pré-requisitos antes de executar
async function checkPrerequisites() {
    console.log('\x1b[36mℹ\x1b[0m Verificando pré-requisitos...\n');

    // Verificar se selenium-webdriver está instalado
    try {
        require('selenium-webdriver');
        console.log('\x1b[32m✓\x1b[0m selenium-webdriver instalado');
    } catch {
        console.log('\x1b[31m✗\x1b[0m selenium-webdriver não encontrado');
        console.log('\x1b[33m⚠\x1b[0m Execute: npm install selenium-webdriver');
        process.exit(1);
    }

    // Verificar se pg está instalado
    try {
        require('pg');
        console.log('\x1b[32m✓\x1b[0m pg (PostgreSQL) instalado');
    } catch {
        console.log('\x1b[31m✗\x1b[0m pg não encontrado');
        console.log('\x1b[33m⚠\x1b[0m Execute: npm install pg');
        process.exit(1);
    }

    console.log('');
}

// Executar
async function main() {
    try {
        await checkPrerequisites();
        await runAllTests();
    } catch (err) {
        console.error('\n\x1b[31m✗ Erro fatal ao executar testes:\x1b[0m', err);
        process.exit(1);
    }
}

main();
