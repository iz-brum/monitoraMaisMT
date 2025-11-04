// @file backend/server.js

// Arquivo de entrada do servidor Express
// Este arquivo é o ponto de entrada do servidor Express, onde as variáveis de ambiente são
// carregadas e o servidor é iniciado na porta especificada.

// Importa o pacote dotenv para gerenciar variáveis de ambiente
import dotenv from 'dotenv';

// Importa a aplicação principal (Express) configurada
import app from './app.js';

import { debugLog } from '#backend_utils/debugLog.js';

// Carrega as variáveis de ambiente do arquivo .env para o process.env
dotenv.config();

// Define a porta do servidor a partir da variável de ambiente PORT
// eslint-disable-next-line no-undef
const PORT = process.env.PORT;

// const API_BASE = process.env.API_BASE || `http://localhost:${PORT}`;

// Inicia o servidor na porta definida e exibe mensagem de status no console
app.listen(PORT, () => {
  debugLog('Servidor Iniciado', {
    status: 'Online',
    porta: PORT,
    url: `http://localhost:${PORT}`,
    // eslint-disable-next-line no-undef
    ambiente: process.env.NODE_ENV || 'desenvolvimento',
    origem: 'server.js'
  });
});

export default app;