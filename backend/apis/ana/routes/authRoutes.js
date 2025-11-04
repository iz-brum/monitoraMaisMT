/**
 * @file backend/apis/ana/routes/authRoutes.js
 * Rotas de autenticação e health-check para o módulo ANA.
 */

import { Router } from 'express';
import { authenticateHidroweb, getTokenStats } from '#ana_services/auth/hidrowebAuth.js';
import { errorTypes } from '#backend_utils/handler/apiANAErrorHandler.js'; // Importa tipos de erro personalizados

const router = Router();

// Middleware de logging para todas as rotas
router.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
    next();
});

/**
 * GET /auth/
 * Health-check de autenticação ANA: retorna status do token e força fetch se expirado.
 */
router.get('/', async (req, res) => {
    try {
        let stats = getTokenStats();

        if (!stats.hasValidToken) {
            await authenticateHidroweb();
            stats = getTokenStats(); // pega o novo
        }

        return res.json({
            status: 'success',
            code: 200,
            message: 'Token successfully obtained!',
            token: stats.token,
            meta: stats.meta
        });

    } catch (error) {
        console.error('[Auth Test] Erro:', error);

        if (error.error?.type) {
            return res.status(error.error.code).json(error);
        }

        const apiError = errorTypes.AUTH.GENERIC(error);
        return res.status(500).json(apiError.toJSON());
    }
});

export default router;
