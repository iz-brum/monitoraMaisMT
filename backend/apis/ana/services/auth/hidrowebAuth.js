/**
 * @file backend/apis/ana/services/auth/hidrowebAuth.js
 * Ultra-optimized authentication module for ANA Hidroweb API
 */

import axios from 'axios';
import dotenv from 'dotenv';
import { handleAuthError, errorTypes } from '#backend_utils/handler/apiANAErrorHandler.js'; // Custom error handler
import { startTimer } from '#backend_utils/terminalConfig/timerConsole.js';  // ajuste o caminho conforme seu alias

dotenv.config();

const HIDROWEB_AUTH_URL = 'https://www.ana.gov.br/hidrowebservice/EstacoesTelemetricas/OAUth/v1';
const NEW_TOKEN_THRESHOLD_MS = 60 * 1000; // 1 minute - token é considerado "novo"

let token = null;
let pendingAuth = null;

// Optimized JWT payload decoder with structured error handling
export function decodeJWTPayload(t) {
  try {
    if (typeof t !== 'string') {
      throw {
        type: 'INVALID_TOKEN_TYPE',
        message: 'Token must be a string',
        received: typeof t
      };
    }

    const parts = t.split('.');
    if (parts.length !== 3) {
      throw {
        type: 'MALFORMED_TOKEN',
        message: 'JWT must have 3 parts separated by dots',
        partsCount: parts.length
      };
    }

    return JSON.parse(Buffer.from(parts[1], 'base64url').toString());
  } catch (err) {
    return {
      error: {
        ...(err.type ? err : {
          type: 'DECODE_ERROR',
          message: err.message
        }),
        stack: err.stack
      }
    };
  }
}

/** Handles authentication errors with structured error types
 * @param {Error} error
 * @return {Error} Structured error
 */
const TOKEN_EXPIRATION_BUFFER_MS = 10 * 60 * 1000; // 10 minutos de margem (token ANA TTL = 1 hora)

let tokenCache = {
  value: null,
  expiration: 0,
  refreshPromise: null
};

/**
 * Authenticates with Hidroweb with minimal operations
 * 
 * ANA Token TTL: 1 HORA (3600 segundos)
 * - Token criado: iat (issued at)
 * - Token expira: exp (expiration time)  
 * - Renovação automática: 10 minutos antes do vencimento
 */
export async function authenticateHidroweb() {
  const now = Date.now();

  // 1. Retorna token válido se existir e não estiver perto de expirar
  if (tokenCache.value && now < (tokenCache.expiration - TOKEN_EXPIRATION_BUFFER_MS)) {
    return tokenCache.value;
  }

  // 2. Se já tem refresh em andamento, retorna a mesma promise
  if (tokenCache.refreshPromise) {
    return tokenCache.refreshPromise;
  }

  // 3. Cria nova promise de autenticação
  tokenCache.refreshPromise = (async () => {
    const stopTimer = startTimer('Autenticando token', 'Hidroweb');

    try {
      // Verifica se as credenciais estão configuradas
      if (!process.env.HIDROWEB_USERNAME || !process.env.HIDROWEB_PASSWORD) {
        console.error('❌ Credenciais Hidroweb não configuradas!');
        console.error('   HIDROWEB_USERNAME:', process.env.HIDROWEB_USERNAME ? '✓ definido' : '❌ indefinido');
        console.error('   HIDROWEB_PASSWORD:', process.env.HIDROWEB_PASSWORD ? '✓ definido' : '❌ indefinido');
        console.error('   Configure as variáveis no Render Dashboard → Environment');
        throw errorTypes.AUTH.MISSING_CREDENTIALS();
      }

      console.log('🔐 Solicitando novo token ANA (TTL: 1 hora)...');
      const { data } = await axios.get(HIDROWEB_AUTH_URL, {
        headers: {
          Identificador: process.env.HIDROWEB_USERNAME,
          Senha: process.env.HIDROWEB_PASSWORD,
          Accept: '*/*'
        },
        timeout: 15000
      });

      const newToken = data.items?.tokenautenticacao;
      if (!newToken) {
        throw errorTypes.AUTH.MISSING_TOKEN();
      }

      // Decodifica para obter expiration time preciso
      const decoded = decodeJWTPayload(newToken);
      if (decoded.error) {
        console.error('Erro ao decodificar token:', decoded.error);
        throw errorTypes.AUTH.INVALID_TOKEN();
      }

      // Atualiza cache ANTES de limpar refreshPromise
      const newExpiration = (decoded.exp || 0) * 1000;
      tokenCache.value = newToken;
      tokenCache.expiration = newExpiration;

      // Log de sucesso com info do TTL
      const expiresInMs = newExpiration - Date.now();
      const expiresInMin = Math.floor(expiresInMs / 60000);
      console.log(`✅ Token ANA obtido com sucesso! Expira em ${expiresInMin} minutos`);

      return newToken;
    } catch (error) {
      // Só limpa o refreshPromise em caso de erro REAL, não sucesso
      const authError = handleAuthError(error);
      throw authError;
    } finally {
      // Limpa refreshPromise no finally para garantir limpeza
      tokenCache.refreshPromise = null;
      stopTimer();
    }
  })();

  return tokenCache.refreshPromise;
}

/** Obtém o token atual do cache, se válido
 * @returns {string|null} Token ou null se não estiver disponível
 */
export const getCachedToken = () => {
  return (tokenCache.value && Date.now() < tokenCache.expiration)
    ? tokenCache.value
    : null;
};

/**
 * Efficient token stats calculator
 */
export function getTokenStats() {
  const activeToken = tokenCache.value;

  if (!activeToken) return {
    hasValidToken: false,
    token: null,
    meta: {
      isTokenNew: false,
      createdAt: null,
      expiresAt: null,
      expiresIn: null,
    },
    error: null
  };

  const decoded = decodeJWTPayload(activeToken);
  if (decoded.error) {
    return {
      hasValidToken: false,
      token: activeToken,
      meta: {
        isTokenNew: false,
        createdAt: null,
        expiresAt: null,
        expiresIn: null
      },
      error: decoded.error
    };
  }

  const now = Date.now();
  const { iat = 0, exp = 0 } = decoded;
  const expiresMs = exp * 1000;
  const diffSec = Math.max(0, (expiresMs - now) / 1000 | 0);

  // Verifica se o token está expirado (com margem de segurança)
  const isExpired = now >= (expiresMs - TOKEN_EXPIRATION_BUFFER_MS);

  return {
    hasValidToken: !isExpired,
    token: activeToken,
    meta: {
      isTokenNew: (now - iat * 1000) < NEW_TOKEN_THRESHOLD_MS,
      createdAt: new Date(iat * 1000).toISOString(),
      expiresAt: new Date(expiresMs).toISOString(),
      expiresIn: `${diffSec / 60 | 0}' ${diffSec % 60}''`,
      isExpired
    },
    error: null
  };
}

