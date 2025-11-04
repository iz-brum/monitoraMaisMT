/* 
 * @file backend/apis/ana/routes/index.js
 *
 * Importa o roteador Express e as rotas do módulo ANA.
 *
 * Este arquivo centraliza a integração das rotas ANA sob o prefixo "/estacoes",
 * facilitando a organização e modularização do backend.
 */

import { Router } from 'express';
import anaRoutes from './anaRoutes.js';
import authRoutes from './authRoutes.js';

/**
 * Instância do roteador Express para as rotas do módulo ANA.
 *
 * Utilizado para definir e agrupar todas as rotas relacionadas às estações hidrológicas,
 * estatísticas e histórico de medições, facilitando a organização e manutenção do backend.
 *
 * @type {import('express').Router}
 */
const router = Router();

router.use('/estacoes', anaRoutes);

router.use('/auth', authRoutes);

/**
 * Exporta o roteador principal do módulo ANA para integração com o servidor Express.
 *
 * Permite que todas as rotas agrupadas neste módulo sejam utilizadas pela aplicação,
 * facilitando a modularização e manutenção do backend.
 *
 */
export default router;