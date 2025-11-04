// @file: backend/apis/ana/controllers/anaController.js

/**
O arquivo `anaController.js` é um *controller* de rota HTTP para a API Express. Ele deve ser responsável apenas por receber requisições, validar parâmetros, chamar serviços e montar respostas HTTP.

---

# O que DEVE ficar em um controller:

1. Funções de controle de fluxo HTTP
   - Funções exportadas que recebem `req` e `res` (como `listStations`).

2. Validação de parâmetros de rota e query
   - Checagem de parâmetros obrigatórios ou válidos, como feito com `VALID_QUERY_KEYS`.

3. Chamada a serviços de negócio ou dados
   - Exemplo: chamada a `getStationsData`.

4. Montagem e envio de respostas HTTP
   - Uso de `res.status(...).json(...)` para enviar respostas de sucesso ou erro.

5. Helpers pequenos e específicos para resposta HTTP
   - Pequenas funções ou constantes para validação de query, como `VALID_QUERY_KEYS`.

6. Tratamento de erros e logging relacionado à requisição
   - Exemplo: `console.error` para logar falhas da requisição.

---

# O que NÃO DEVE ficar em um controller:

1. Lógica de negócio ou manipulação de dados complexa
   - Não deve conter cálculos, transformações, ou regras de negócio.
   - Exemplo: não deve calcular acumulados, ordenar arrays, etc.

2. Acesso direto a banco de dados ou APIs externas
   - Deve delegar isso para serviços (`service`), nunca acessar diretamente.

3. Funções utilitárias genéricas
   - Helpers genéricos (ex: manipulação de datas, arrays, etc.) devem ficar em arquivos utilitários.

4. Configurações globais da aplicação
   - Não deve definir middlewares, variáveis de ambiente, etc.

5. Definição de rotas Express
   - O controller só exporta funções; a definição de rotas (`app.get(...)`) deve ficar em arquivos de rotas.

6. Renderização de views/templates
   - Não deve renderizar HTML, ejs, pug, etc.

7. Testes unitários ou mocks
   - Testes devem ficar em arquivos separados, geralmente em uma pasta `tests`.
*/

import { getStationsData } from '#ana_services/data/stationsService.js';

const VALID_QUERY_KEYS = new Set([
   'codigo', 'tipo', 'municipio', 'uf', 'bacia', 'rio',
   'incluirHistorico', 'tipoFiltroData', 'dataBusca', 'intervalo'
]);

export const listStations = async (req, res) => {
   const { incluirHistorico, tipoFiltroData, dataBusca, intervalo, ...filters } = req.query;

   // validação de chaves não suportadas
   const keys = Object.keys(req.query);
   if (keys.length > 0 && !keys.every(k => VALID_QUERY_KEYS.has(k))) {
      return res.status(400).json({
         erro: 'Parâmetro inválido',
         parametros_validos: Array.from(VALID_QUERY_KEYS)
      });
   }

   try {
      const data = await getStationsData({
         filters,
         incluirHistorico,
         tipoFiltroData,
         dataBusca,
         intervalo
      });

      // se vier 'codigo', devolve somente a estação correspondente
      if (req.query.codigo) {
         const one = data.estacoes.find(e => String(e.codigo_Estacao) === String(req.query.codigo));
         if (!one) return res.status(404).json({ erro: 'Estação não encontrada ou não está em operação' });
         return res.json(one);
      }

      const temFiltros = Object.keys(filters).length > 0;
      if (temFiltros && data.estacoes.length === 0) {
         return res.status(404).json({ erro: 'Nenhuma estação encontrada para os filtros aplicados' });
      }

      // retorna apenas o array de estações
      return res.json(data.estacoes);
   } catch (err) {
      console.error('[listStations]', err);
      const msg = err?.message || 'Falha ao listar estações';
      return res.status(502).json({ erro: 'Falha ao listar estações', detalhes: msg });
   }
};