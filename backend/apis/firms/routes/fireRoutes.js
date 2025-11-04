// @file: backend/apis/firms/routes/fireRoutes.js

/**
 * 🚏 Router
 *
 * Importa o roteador do Express para definição das rotas do módulo.
 */
import { Router } from 'express';

/**
 * 🔥 FireController
 *
 * Controller principal para tratamento das requisições, centralizando a lógica dos focos de queimada.
 */
import FireController from '#firms_controllers';

// const ROUTE_PREFIX = '/api/firms/fires';

/**
 * Fire Routes
 * ------------
 * Define endpoints relacionados aos focos de queimada (FIRMS).
 * Prefixo de rota: /firms/fires
 *
 * Endpoints:
 *   GET /          - Retorna lista de focos de queimada, com filtros de intervalo e data.
 */

/**
 * 🛤️ Instancia o roteador Express para definição dos endpoints deste módulo.
 */
const router = Router();

/**
 * 🚦 GET /firms/fires
 *
 * Retorna lista de focos de queimada, com suporte a filtros por data, intervalo, e paginação.
 *
 * Query params:
 *   - dr (number): Dias para frente de data inicial
 *   - dt (string): Data inicial (YYYY-MM-DD)
 *   - Outros filtros/paginações conforme documentação do FireController
 */
router.get('/', FireController.getFires);

/**
 * 📍 GET /firms/fires/locations
 *
 * Retorna lista de focos de queimada já enriquecidos com localização geocodificada (cidade, estado, etc).
 *
 * Query params:
 *   - dr (number): Dias para frente de data inicial
 *   - dt (string): Data inicial (YYYY-MM-DD)
 */
router.get('/locations', FireController.getFireLocations);

/**
 * 📊 GET /firms/fires/stats
 *
 * Retorna estatísticas agregadas dos focos de queimada, como totais, médias e agrupamentos.
 *
 * Query params:
 *   - dr (number): Dias para frente de data inicial
 *   - dt (string): Data inicial (YYYY-MM-DD)
 */
router.get('/stats', FireController.getFireStats);

/**
 * 📈 GET /firms/fires/weekly-stats
 *
 * Retorna estatísticas semanais dos focos de calor, agregadas por dia.
 * Fornece dados dos últimos 7 dias com total de focos por data.
 */
router.get('/weekly-stats', FireController.getWeeklyFireStats);


/**
 * 🚀 Exporta o roteador configurado para ser utilizado pelo app principal.
 */
export default router;
