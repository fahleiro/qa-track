/**
* ====================================
* SERVIDOR API BACKEND
* ====================================
*/

const express = require('express');
const cors = require('cors');
const { Client } = require('pg');
const bodyParser = require('body-parser');
const { validateDatabaseTables } = require('./validateDatabase');

const app = express();
const port = 3000;

// Configuração do Postgres (Rodando localmente no mesmo container)
const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'qa_test_track',
    password: 'postgres',
    port: 5432,
});

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
}));
app.use(bodyParser.json());

// Tenta conectar ao banco com retry (pois o banco pode demorar a subir no start.sh)
const connectWithRetry = async () => {
    try {
        await client.connect();
        console.log('✓ Conectado ao Postgres');
        
        // Valida se todas as tabelas existem
        console.log('🔍 Validando relações do banco de dados...');
        const validation = await validateDatabaseTables(client);
        
        if (!validation.valid) {
            console.error('✗ ERRO: Validação do banco de dados falhou!');
            
            if (validation.missing.length > 0) {
                console.error(`✗ Tabelas faltando: ${validation.missing.join(', ')}`);
            }
            
            if (validation.errors.length > 0) {
                console.error('✗ Erros encontrados:');
                validation.errors.forEach(err => console.error(`  - ${err}`));
            }
            
            console.error('\n⚠️  Execute o script de criação de tabelas antes de iniciar a API.');
            console.error('   Script: db/01_create_tables.sql\n');
            
            process.exit(1);
        }
        
        console.log('✓ Todas as relações do banco de dados estão presentes');
        
        // Importar e registrar todas as rotas após validar o banco
        const routes = require('./routes');
        routes(app, client);
    } catch (err) {
        console.error('✗ Erro ao conectar, tentando novamente em 2s...', err.message);
        setTimeout(connectWithRetry, 2000);
    }
};

connectWithRetry();

// Iniciar servidor
app.listen(port, () => {
    console.log(`✓ API Backend rodando na porta ${port}`);
});