/**
* ====================================
* SERVIDOR API BACKEND
* ====================================
*/

const express = require('express');
const cors = require('cors');
const { Client } = require('pg');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

const POSTGRES_HOST = 'localhost';
const POSTGRES_DATABASE = 'qa_track';
const POSTGRES_USER = 'postgres';
const POSTGRES_PASSWORD = 'postgres';
const POSTGRES_PORT = 5432;

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
}));
app.use(bodyParser.json());

// Conectar ao Postgres
const client = new Client({
    host: POSTGRES_HOST,
    database: POSTGRES_DATABASE,
    user: POSTGRES_USER,
    password: POSTGRES_PASSWORD,
    port: POSTGRES_PORT
});
try {
    await client.connect();
    console.log('Conectado ao Postgres');
    
  
    // Importar e registrar todas as rotas após validar o banco
    const routes = require('./routes');
    routes(app, client);
} catch (err) {
    console.error('✗ Erro ao conectar, tentando novamente em 2s...', err.message);
    setTimeout(connectWithRetry, 2000);
}

// Iniciar servidor
app.listen(port, () => {
    console.log(`QA Track API rodando na porta ${port}`);
});