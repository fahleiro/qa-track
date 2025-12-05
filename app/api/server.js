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

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
}));
app.use(bodyParser.json());

// Conectar ao Postgres
main 
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