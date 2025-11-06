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
// Em produção (Render): process.env.PORT é fornecido dinamicamente
// Em desenvolvimento: usa 4001 como fallback
const PORT = process.env.PORT || 4001;

const NODE_ENV = process.env.NODE_ENV || 'development';

// Determina a URL base correta para cada ambiente
const getServerUrl = () => {
  if (NODE_ENV === 'production') {
    // Em produção no Render, usa a URL real fornecida ou constrói baseada no serviço
    return process.env.RENDER_EXTERNAL_URL || 'https://monitoramaismt.onrender.com';
  }
  return `http://localhost:${PORT}`;
};

// Inicia o servidor na porta definida e exibe mensagem de status no console
app.listen(PORT, () => {
  const serverUrl = getServerUrl();
  const isProduction = NODE_ENV === 'production';

  debugLog('Servidor Iniciado', {
    status: 'Online',
    porta: PORT,
    url: serverUrl,
    ambiente: NODE_ENV,
    plataforma: isProduction ? 'Render' : 'Local',
    timestamp: new Date().toISOString(),
    origem: 'server.js'
  });

  // Log adicional APENAS com informações úteis não redundantes
  if (isProduction) {
    console.log('🚀 monitora+MT online em produção');
    console.log('🔗 APIs disponíveis: /api/ana | /api/firms');
  } else {
    console.log('🔧 Desenvolvimento ativo');
    console.log('🔗 APIs disponíveis: /api/ana | /api/firms');
  }
});

export default app;