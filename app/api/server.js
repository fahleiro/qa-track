/**
 * ====================================
 * QA Track API - v0.1.0
 * ====================================
 */

const express = require('express');
const cors = require('cors');
const { Client } = require('pg');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;
const interfacePort = process.env.P_INTERFACE || 5173;

// Configuração do Postgres
const pgConfig = {
    host: process.env.POSTGRES_HOST || 'localhost',
    database: process.env.POSTGRES_DATABASE || 'qa_test_track',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    port: process.env.POSTGRES_PORT || 5432
};

// Middleware
app.use(cors({
    origin: [`http://localhost:${interfacePort}`, `http://localhost:${port}`],
    credentials: true
}));
app.use(bodyParser.json());

// Cliente Postgres
const client = new Client(pgConfig);

// Função para conectar com retry
async function connectWithRetry(retries = 10, delay = 2000) {
    for (let i = 0; i < retries; i++) {
        try {
            await client.connect();
            console.log('✓ Conectado ao Postgres');
            return true;
        } catch (err) {
            console.log(`✗ Tentativa ${i + 1}/${retries} - Erro: ${err.message}`);
            if (i < retries - 1) {
                console.log(`  Tentando novamente em ${delay / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    throw new Error('Não foi possível conectar ao Postgres');
}

// Inicialização
async function init() {
    try {
        await connectWithRetry();
        
        // Registrar rotas
        const routes = require('./routes');
        routes(app, client);
        
        // Iniciar servidor
        app.listen(port, '0.0.0.0', () => {
            console.log(`✓ QA Track API v0.1.0 rodando na porta ${port}`);
        });
    } catch (err) {
        console.error('✗ Erro fatal:', err.message);
        process.exit(1);
    }
}

init();
