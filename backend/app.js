import express from 'express';
import cors from 'cors';
import firmsRoutes from '#firms_routes';
import anaRoutes from '#ana_routes';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/firms', firmsRoutes);

app.use('/api/ana', anaRoutes);

app.use('/relatorios', express.static(path.join(__dirname, 'reports')));

app.use((err, req, res, next) => {
    console.error('=== ERRO NO MIDDLEWARE GLOBAL ===', err);

    // Log do erro
    console.log('Erro capturado pelo middleware', { erro: err.message, stack: err.stack });

    if (typeof err === 'object' && (err.status || err.tipo || err.origem)) {
        return res.status(err.status || 500).json({
            erroApp: err.message || err.mensagem || 'Erro desconhecido',
            tipo: err.tipo || 'ERRO_DESCONHECIDO',
            origem: err.origem || 'desconhecido'
        });
    }

    // Resposta padrão para erros desconhecidos
    res.status(500).json({
        sucesso: false,
        mensagem: 'Ocorreu um erro inesperado. Tente novamente mais tarde.',
        detalhes: process.env.NODE_ENV === 'desenvolvimento' ? err.message : undefined
    });
});

export default app;
