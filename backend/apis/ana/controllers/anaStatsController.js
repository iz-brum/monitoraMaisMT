// ana/controllers/anaStatsController.js

/**
O arquivo `anaStatsController.js` é um *controller* de rota HTTP para a API Express. Ele deve ser responsável apenas por receber requisições, validar parâmetros, chamar serviços e montar respostas HTTP.
*/

import { getStateDailyMunicipalMeans } from '#ana_services/stats/anaStatsService.js';

export async function getStateDailyAveragesSeries(req, res) {
  const { uf, dias } = req.params;
  try {
    const series = await getStateDailyMunicipalMeans(uf, Number(dias), true);
    res.json(series);
  } catch (err) {
    console.error('[getStateDailyAveragesSeries]', err);
    res.status(502).json({ erro: 'Falha ao calcular médias', detalhes: err.message });
  }
}
