/* 
 * @file backend/apis/ana/routes/anaRoutes.js
 *
 * Importa controladores e utilitários necessários para definir as rotas do módulo ANA.
 *
 * Este arquivo centraliza a configuração das rotas relacionadas às estações hidrológicas
 * e histórico de medições, facilitando a organização do backend.
 */

import { Router } from 'express';
import { listStations } from '#ana_controllers/anaController.js';
// import { getStateDailyAveragesSeries, getDashboardStats } from '#ana_controllers/anaStatsController.js';
import { getStateDailyAveragesSeries } from '#ana_controllers/anaStatsController.js';

/**
 * Instância do roteador Express para as rotas do módulo ANA.
 *
 * Utilizado para definir e agrupar todas as rotas relacionadas às estações hidrológicas
 * e histórico de medições, facilitando a organização e manutenção do backend.
 *
 * @type {import('express').Router}
 */
const router = Router();

// Middleware de logging para todas as rotas
router.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

/**
* Rota GET /estacoes/lista
* Lista todas as estações do inventário estático.
*/
router.get('/lista', listStations);

/**
 * Rota GET /estatisticas/medias-diarias/:uf/:dias
 * Obtém médias diárias de chuva para um estado e período específico.
 */
router.get('/estatisticas/medias-diarias/:uf/:dias', getStateDailyAveragesSeries);

/**
 * Rota GET /estatisticas/dashboard
 * Obtém estatísticas resumidas para o dashboard.
 */
// router.get('/estatisticas/dashboard', getDashboardStats);

/**
 * Exporta o roteador configurado para uso no módulo principal da aplicação.
 *
 * Permite que todas as rotas definidas neste arquivo sejam integradas ao servidor Express,
 * organizando os endpoints relacionados às estações ANA sob um único módulo.
 */
export default router;
