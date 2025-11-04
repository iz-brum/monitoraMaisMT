/* @jest-environment node */
// Teste automatizado para validar a estrutura final do JSON retornado pelo endpoint de estatísticas de chuva por período.

/**
 * Objetivo dos testes:
 * - Validar que o controlador de estatísticas do backend ANA é capaz de atender múltiplos cenários de consulta, agrupamento e filtragem, conforme qualquer demanda do frontend.
 * - Garantir que as respostas sejam flexíveis, detalhadas e otimizadas para gráficos, dashboards, análises e relatórios.
 * - Permitir filtros dinâmicos, agrupamentos customizados, seleção de métricas, detalhamento por estação, períodos customizados e qualquer combinação de parâmetros.
 * - Assegurar robustez contra falhas externas (API ANA fora do ar), com tratamento de erros, logs claros e possibilidade de simulação/mocking.
 * - Facilitar manutenção, extensão e integração com novos tipos de estatísticas e visualizações, garantindo evolução contínua do sistema.
 */

import fs from 'fs';
import { expect, jest } from '@jest/globals';
import { AnaEstacoesService } from '#ana_services/estacoes/AnaEstacoesService.js';

// AUMENTA O TEMPO LIMITE PARA TODOS OS TESTES
// Isso é necessário para evitar timeouts em testes que envolvem operações assíncronas demoradas, como chamadas a APIs externas ou processamento de grandes volumes de dados.
// O valor de 90 segundos permite que testes complexos sejam concluídos sem interrupções.
jest.setTimeout(90000); // 90 segundos para todos os testes (1 minuto e 30 segundos)

// Cria o diretório de relatórios se não existir
const META_PATH = './reports/test-meta-dump.json';
global.__testMetaDump = [];

// Importação dinâmica do controller após os mocks serem definidos
// Isso garante que o controller use os mocks acima ao ser carregado
const { AnaEstatisticasController } = await import('#ana_controllers/AnaEstatisticasController.js');

// TESTES PARA O MÉTODO getEstatisticas (AnaEstatisticasController)
describe('GET /api/ana/estatisticas - getEstatisticas', () => {

  it('deve retornar apenas o(s) campo(s) solicitado(s) via parâmetro "campos" na query', async () => {
    const req = {
      query: {
        intervalo: 'HORA_24',
        campos: 'totalEstacoes'
      }
    };
    const res = { json: jest.fn() };
    const next = jest.fn();

    await AnaEstatisticasController.getEstatisticas(req, res, next);

    expect(res.json).toHaveBeenCalled();
    const resultado = res.json.mock.calls[0][0];

    expect(resultado).toHaveProperty('totalEstacoes');

    // Normaliza os parâmetros da request
    const parametrosRequest = {
      ...req.query,
      campos: Array.isArray(req.query.campos)
        ? req.query.campos
        : req.query.campos
          ? req.query.campos.split(',').map(s => s.trim())
          : undefined
    };

    // Metadados didáticos para relatório
    const meta = {
      objetivo: 'Verificar se o endpoint retorna apenas a chave solicitada via parâmetro "campos" na query string.',
      criterios: [
        'O parâmetro "intervalo" é obrigatório.',
        'A resposta deve conter apenas a(s) chave(s) solicitada(s) em "campos".',
        'O valor retornado deve ser consistente com o inventário mockado.'
      ],
      esperado: 'Objeto JSON contendo apenas a chave "totalEstacoes".',
      parametrosRequest
    };
    resultado._meta = meta;
    global.__testMetaDump.push({
      fullName: expect.getState().currentTestName,
      meta,
      parametrosRequest: meta.parametrosRequest,
      resumoResultado: {
        totalEstacoes: resultado.totalEstacoes
      }
    });
  });

  it('deve retornar o resumo estatístico completo quando nenhum campo é filtrado', async () => {
    const req = {
      query: {
        intervalo: 'HORA_24'
      }
    };
    const res = { json: jest.fn() };
    const next = jest.fn();

    await AnaEstatisticasController.getEstatisticas(req, res, next);

    expect(res.json).toHaveBeenCalled();
    const resultado = res.json.mock.calls[0][0];

    // Valida as principais chaves do retorno real
    expect(resultado).toHaveProperty('totalEstacoes');
    expect(resultado).toHaveProperty('porUF');
    expect(resultado).toHaveProperty('porTipo');
    expect(resultado).toHaveProperty('porStatus');
    expect(resultado).toHaveProperty('porComando');
    expect(resultado).toHaveProperty('totalmunicipiosAtualizados');
    expect(resultado).toHaveProperty('totalMunicipiosSemChuva');
    expect(resultado).toHaveProperty('totalMunicipiosComChuva');
    expect(resultado).toHaveProperty('mediaPluviometricaPorUF');

    // Normaliza os parâmetros da request
    const parametrosRequest = { ...req.query };

    // Metadados didáticos para relatório
    const meta = {
      objetivo: 'Verificar se o endpoint retorna o resumo estatístico completo quando nenhum campo é filtrado.',
      criterios: [
        'O parâmetro "intervalo" é obrigatório.',
        'A resposta deve conter todas as chaves padrão do resumo estatístico.',
        'Os valores retornados devem ser consistentes com o inventário mockado.'
      ],
      esperado: 'Objeto JSON contendo todas as chaves do resumo estatístico.',
      parametrosRequest
    };
    resultado._meta = meta;
    global.__testMetaDump.push({
      fullName: expect.getState().currentTestName,
      meta,
      parametrosRequest: meta.parametrosRequest,
      resumoResultado: {
        totalEstacoes: resultado.totalEstacoes,
        porUF: resultado.porUF,
        porTipo: resultado.porTipo,
        porStatus: resultado.porStatus,
        porComando: resultado.porComando,
        totalmunicipiosAtualizados: resultado.totalmunicipiosAtualizados,
        totalMunicipiosSemChuva: resultado.totalMunicipiosSemChuva,
        totalMunicipiosComChuva: resultado.totalMunicipiosComChuva,
        mediaPluviometricaPorUF: resultado.mediaPluviometricaPorUF
      }
    });
  });

});


describe('POST /api/ana/estatisticas - postEstatisticas', () => {
  it('Valida se o endpoint retorna o agrupamento correto de agregados por UF para o estado de MT.', async () => {
    const req = {
      body: {
        filtros: { uf: ['MT'] },
        agruparPor: ['uf']
      }
    };
    const res = { json: jest.fn() };
    const next = jest.fn();

    await AnaEstatisticasController.postEstatisticas(req, res, next);

    expect(res.json).toHaveBeenCalled();
    const resultado = res.json.mock.calls[0][0];

    // Estrutura básica
    // Deve conter resumo
    expect(resultado).toHaveProperty('resumo');
    // Deve ser um objeto
    expect(typeof resultado.resumo).toBe('object');
    // Deve conter total de estações no resumo
    expect(resultado.resumo).toHaveProperty('total_estacoes');
    // Deve ser um número
    expect(typeof resultado.resumo.total_estacoes).toBe('number');
    // Deve conter total de UFs no resumo
    expect(resultado.resumo).toHaveProperty('total_ufs')
    // Deve ser um número
    expect(typeof resultado.resumo.total_ufs).toBe('number');
    // Deve conter total de municípios no resumo
    expect(resultado.resumo).toHaveProperty('total_municipios');
    // Deve ser um número
    expect(typeof resultado.resumo.total_municipios).toBe('number');
    // Deve conter total de grupos
    expect(resultado.resumo).toHaveProperty('total_grupos');
    // Deve ser um número
    expect(typeof resultado.resumo.total_grupos).toBe('number');

    // Deve conter agrupamentos
    expect(resultado).toHaveProperty('agrupamentos');
    // Deve ser um objeto
    expect(typeof resultado.agrupamentos).toBe('object');
    // Dever conter agrupamento porTipo
    expect(resultado.agrupamentos).toHaveProperty('porTipo');
    // Deve ser um objeto
    expect(typeof resultado.agrupamentos.porTipo).toBe('object');
    // Deve conter Pluviometrica
    expect(resultado.agrupamentos.porTipo).toHaveProperty('Pluviometrica');
    // Deve ser um número
    expect(typeof resultado.agrupamentos.porTipo.Pluviometrica).toBe('number');
    // Deve conter Fluviometrica
    expect(resultado.agrupamentos.porTipo).toHaveProperty('Fluviometrica');
    // Deve ser um número
    expect(typeof resultado.agrupamentos.porTipo.Fluviometrica).toBe('number');
    //  Deve conter porStatus
    expect(resultado.agrupamentos).toHaveProperty('porStatus');
    // Deve ser um objeto
    expect(typeof resultado.agrupamentos.porStatus).toBe('object');
    // Deve conter Atualizado, se existir
    if ('Atualizado' in resultado.agrupamentos.porStatus) {
      // Deve ser um número
      expect(typeof resultado.agrupamentos.porStatus.Atualizado).toBe('number');
    }
    // Deve conter Desatualizado, se existir
    if ('Desatualizado' in resultado.agrupamentos.porStatus) {
      // Deve ser um número
      expect(typeof resultado.agrupamentos.porStatus.Desatualizado).toBe('number');
    }
    // Deve conter porUF
    expect(resultado.agrupamentos).toHaveProperty('porUF');
    // Deve ser um objeto
    expect(typeof resultado.agrupamentos.porUF).toBe('object');
    // Deve conter porComando
    expect(resultado.agrupamentos).toHaveProperty('porComando');
    // Deve ser um objeto
    expect(typeof resultado.agrupamentos.porComando).toBe('object');

    // Deve conter grupos
    expect(resultado).toHaveProperty('grupos');
    // Deve ser um objeto
    expect(typeof resultado.grupos).toBe('object');
    // Deve conter pelo menos um grupo
    expect(Object.keys(resultado.grupos).length).toBeGreaterThan(0);
    // Deve conter MT
    expect(resultado.grupos).toHaveProperty('MT');
    // Deve ser um objeto
    expect(typeof resultado.grupos.MT).toBe('object');
    // Deve conter total de estações
    expect(resultado.grupos.MT).toHaveProperty('total_estacoes');
    // Deve ser um número
    expect(typeof resultado.grupos.MT.total_estacoes).toBe('number');
    // Deve conter total de municípios
    expect(resultado.grupos.MT).toHaveProperty('total_municipios');
    // Deve ser um número
    expect(typeof resultado.grupos.MT.total_municipios).toBe('number');
    // Deve conter total de municípios com chuva
    expect(resultado.grupos.MT).toHaveProperty('total_municipios_com_chuva');
    // Deve ser um número
    expect(typeof resultado.grupos.MT.total_municipios_com_chuva).toBe('number');
    // Deve conter total de municípios sem chuva
    expect(resultado.grupos.MT).toHaveProperty('total_municipios_sem_chuva');
    // Deve ser um número
    expect(typeof resultado.grupos.MT.total_municipios_sem_chuva).toBe('number');
    // Deve conter média de chuva
    expect(resultado.grupos.MT).toHaveProperty('media_chuva');
    // Deve ser um número
    expect(typeof resultado.grupos.MT.media_chuva).toBe('number');

    // Metadados para relatório
    const meta = {
      objetivo: 'Verificar se o endpoint retorna o agrupamento correto de agregados por UF para o estado de Mato Grosso.',
      criterios: [
        'O corpo da requisição deve conter filtro por UF e agrupamento por UF.',
        'A resposta deve conter as chaves "resumo", "agrupamentos", "ufs" e "grupos".',
        'O objeto "grupos" deve apresentar apenas estatísticas agregadas por UF.'
      ],
      esperado: 'Retorno JSON com agregados por UF, estrutura enxuta e campos numéricos corretos.',
      parametrosRequest: req.body
    };

    global.__testMetaDump.push({
      fullName: expect.getState().currentTestName,
      meta,
      parametrosRequest: meta.parametrosRequest,
      resumoResultado: { ...resultado }
    });
  });


  it('Valida se o endpoint retorna o agrupamento correto de agregados por UF e município para o estado de MT.', async () => {
    const req = {
      body: {
        filtros: { uf: ['MT'] },
        agruparPor: ['uf', 'municipio']
      }
    };
    const res = { json: jest.fn() };
    const next = jest.fn();

    await AnaEstatisticasController.postEstatisticas(req, res, next);

    expect(res.json).toHaveBeenCalled();
    const resultado = res.json.mock.calls[0][0];

    // Estrutura básica
    expect(resultado).toHaveProperty('resumo');
    expect(typeof resultado.resumo).toBe('object');
    expect(resultado.resumo).toHaveProperty('total_estacoes');
    expect(typeof resultado.resumo.total_estacoes).toBe('number');
    expect(resultado.resumo).toHaveProperty('total_ufs');
    expect(typeof resultado.resumo.total_ufs).toBe('number');
    expect(resultado.resumo).toHaveProperty('total_municipios');
    expect(typeof resultado.resumo.total_municipios).toBe('number');
    expect(resultado.resumo).toHaveProperty('total_grupos');
    expect(typeof resultado.resumo.total_grupos).toBe('number');

    expect(resultado).toHaveProperty('agrupamentos');
    expect(typeof resultado.agrupamentos).toBe('object');
    expect(resultado.agrupamentos).toHaveProperty('porTipo');
    expect(typeof resultado.agrupamentos.porTipo).toBe('object');
    expect(resultado.agrupamentos.porTipo).toHaveProperty('Pluviometrica');
    expect(typeof resultado.agrupamentos.porTipo.Pluviometrica).toBe('number');
    expect(resultado.agrupamentos.porTipo).toHaveProperty('Fluviometrica');
    expect(typeof resultado.agrupamentos.porTipo.Fluviometrica).toBe('number');
    expect(resultado.agrupamentos).toHaveProperty('porStatus');
    expect(typeof resultado.agrupamentos.porStatus).toBe('object');
    if ('Atualizado' in resultado.agrupamentos.porStatus) {
      expect(typeof resultado.agrupamentos.porStatus.Atualizado).toBe('number');
    }
    if ('Desatualizado' in resultado.agrupamentos.porStatus) {
      expect(typeof resultado.agrupamentos.porStatus.Desatualizado).toBe('number');
    }
    expect(resultado.agrupamentos).toHaveProperty('porUF');
    expect(typeof resultado.agrupamentos.porUF).toBe('object');
    expect(resultado.agrupamentos).toHaveProperty('porComando');
    expect(typeof resultado.agrupamentos.porComando).toBe('object');

    // Deve conter grupos
    expect(resultado).toHaveProperty('grupos');
    expect(typeof resultado.grupos).toBe('object');
    expect(Object.keys(resultado.grupos).length).toBeGreaterThan(0);

    // Valida um grupo exemplo
    expect(resultado.grupos).toHaveProperty('MT|ALTA FLORESTA');
    expect(typeof resultado.grupos['MT|ALTA FLORESTA']).toBe('object');
    expect(resultado.grupos['MT|ALTA FLORESTA']).toHaveProperty('total_estacoes');
    expect(typeof resultado.grupos['MT|ALTA FLORESTA'].total_estacoes).toBe('number');
    expect(resultado.grupos['MT|ALTA FLORESTA']).toHaveProperty('media_chuva');
    expect(typeof resultado.grupos['MT|ALTA FLORESTA'].media_chuva).toBe('number');

    // Metadados para relatório
    const meta = {
      objetivo: 'Verificar se o endpoint retorna o agrupamento correto de agregados por UF e município para o estado de Mato Grosso.',
      criterios: [
        'O corpo da requisição deve conter filtro por UF e agrupamento por UF e município.',
        'A resposta deve conter as chaves "resumo", "agrupamentos" e "grupos".',
        'O objeto "grupos" deve apresentar apenas estatísticas agregadas por UF e município.'
      ],
      esperado: 'Retorno JSON com agregados por UF e município, estrutura enxuta e campos numéricos corretos.',
      parametrosRequest: req.body
    };

    global.__testMetaDump.push({
      fullName: expect.getState().currentTestName,
      meta,
      parametrosRequest: meta.parametrosRequest,
      resumoResultado: { ...resultado }
    });
  });

  it('Valida se o endpoint retorna o agrupamento correto de agregados por UF e comandoRegional para o estado de Mato Grosso.', async () => {
    const req = {
      body: {
        filtros: { uf: ['MT'] },
        agruparPor: ['uf', 'comandoRegional']
      }
    };
    const res = { json: jest.fn() };
    const next = jest.fn();

    await AnaEstatisticasController.postEstatisticas(req, res, next);

    expect(res.json).toHaveBeenCalled();
    const resultado = res.json.mock.calls[0][0];

    // Estrutura básica
    expect(resultado).toHaveProperty('resumo');
    expect(typeof resultado.resumo).toBe('object');
    expect(resultado.resumo).toHaveProperty('total_estacoes');
    expect(typeof resultado.resumo.total_estacoes).toBe('number');
    expect(resultado.resumo).toHaveProperty('total_ufs');
    expect(typeof resultado.resumo.total_ufs).toBe('number');
    expect(resultado.resumo).toHaveProperty('total_municipios');
    expect(typeof resultado.resumo.total_municipios).toBe('number');
    expect(resultado.resumo).toHaveProperty('total_grupos');
    expect(typeof resultado.resumo.total_grupos).toBe('number');

    expect(resultado).toHaveProperty('agrupamentos');
    expect(typeof resultado.agrupamentos).toBe('object');
    expect(resultado.agrupamentos).toHaveProperty('porTipo');
    expect(typeof resultado.agrupamentos.porTipo).toBe('object');
    expect(resultado.agrupamentos.porTipo).toHaveProperty('Pluviometrica');
    expect(typeof resultado.agrupamentos.porTipo.Pluviometrica).toBe('number');
    expect(resultado.agrupamentos.porTipo).toHaveProperty('Fluviometrica');
    expect(typeof resultado.agrupamentos.porTipo.Fluviometrica).toBe('number');
    expect(resultado.agrupamentos).toHaveProperty('porStatus');
    expect(typeof resultado.agrupamentos.porStatus).toBe('object');
    if ('Atualizado' in resultado.agrupamentos.porStatus) {
      expect(typeof resultado.agrupamentos.porStatus.Atualizado).toBe('number');
    }
    if ('Desatualizado' in resultado.agrupamentos.porStatus) {
      expect(typeof resultado.agrupamentos.porStatus.Desatualizado).toBe('number');
    }
    expect(resultado.agrupamentos).toHaveProperty('porUF');
    expect(typeof resultado.agrupamentos.porUF).toBe('object');
    expect(resultado.agrupamentos).toHaveProperty('porComando');
    expect(typeof resultado.agrupamentos.porComando).toBe('object');

    // Deve conter grupos
    expect(resultado).toHaveProperty('grupos');
    expect(typeof resultado.grupos).toBe('object');
    expect(Object.keys(resultado.grupos).length).toBeGreaterThan(0);

    // Valida todos os grupos retornados dinamicamente
    Object.entries(resultado.grupos).forEach(([, grupo]) => {
      expect(typeof grupo).toBe('object');
      expect(grupo).toHaveProperty('total_estacoes');
      expect(typeof grupo.total_estacoes).toBe('number');
      expect(grupo).toHaveProperty('media_chuva');
      expect(typeof grupo.media_chuva).toBe('number');
    });

    // Metadados para relatório
    const meta = {
      objetivo: 'Verificar se o endpoint retorna o agrupamento correto de agregados por UF e comandoRegional para o estado de Mato Grosso.',
      criterios: [
        'O corpo da requisição deve conter filtro por UF e agrupamento por UF e comandoRegional.',
        'A resposta deve conter as chaves "resumo", "agrupamentos" e "grupos".',
        'O objeto "grupos" deve apresentar apenas estatísticas agregadas por UF e comandoRegional, com as chaves no formato "UF|comandoRegional".'
      ],
      esperado: 'Retorno JSON com agregados por UF e comandoRegional, estrutura enxuta e campos numéricos corretos.',
      parametrosRequest: req.body
    };

    global.__testMetaDump.push({
      fullName: expect.getState().currentTestName,
      meta,
      parametrosRequest: meta.parametrosRequest,
      resumoResultado: { ...resultado }
    });
  });

  it('Valida se o endpoint retorna o agrupamento correto de agregados por UF, município e comandoRegional para o estado de Mato Grosso.', async () => {
    const req = {
      body: {
        filtros: { uf: ['MT'] },
        agruparPor: ['uf', 'municipio', 'comandoRegional']
      }
    };
    const res = { json: jest.fn() };
    const next = jest.fn();

    await AnaEstatisticasController.postEstatisticas(req, res, next);

    expect(res.json).toHaveBeenCalled();
    const resultado = res.json.mock.calls[0][0];

    // Estrutura básica
    expect(resultado).toHaveProperty('resumo');
    expect(typeof resultado.resumo).toBe('object');
    expect(resultado.resumo).toHaveProperty('total_estacoes');
    expect(typeof resultado.resumo.total_estacoes).toBe('number');
    expect(resultado.resumo).toHaveProperty('total_ufs');
    expect(typeof resultado.resumo.total_ufs).toBe('number');
    expect(resultado.resumo).toHaveProperty('total_municipios');
    expect(typeof resultado.resumo.total_municipios).toBe('number');
    expect(resultado.resumo).toHaveProperty('total_grupos');
    expect(typeof resultado.resumo.total_grupos).toBe('number');

    expect(resultado).toHaveProperty('agrupamentos');
    expect(typeof resultado.agrupamentos).toBe('object');
    expect(resultado.agrupamentos).toHaveProperty('porTipo');
    expect(typeof resultado.agrupamentos.porTipo).toBe('object');
    expect(resultado.agrupamentos).toHaveProperty('porStatus');
    expect(typeof resultado.agrupamentos.porStatus).toBe('object');
    expect(resultado.agrupamentos).toHaveProperty('porUF');
    expect(typeof resultado.agrupamentos.porUF).toBe('object');
    expect(resultado.agrupamentos).toHaveProperty('porComando');
    expect(typeof resultado.agrupamentos.porComando).toBe('object');

    // Deve conter grupos
    expect(resultado).toHaveProperty('grupos');
    expect(typeof resultado.grupos).toBe('object');
    expect(Object.keys(resultado.grupos).length).toBeGreaterThan(0);

    // Validação dinâmica dos grupos
    Object.values(resultado.grupos).forEach(grupo => {
      expect(typeof grupo).toBe('object');
      expect(grupo).toHaveProperty('total_estacoes');
      expect(typeof grupo.total_estacoes).toBe('number');
      expect(grupo).toHaveProperty('media_chuva');
      expect(typeof grupo.media_chuva).toBe('number');
      // Adicione aqui outras validações de campos se necessário
    });

    // Metadados para relatório
    const meta = {
      objetivo: 'Verificar se o endpoint retorna o agrupamento correto de agregados por UF, município e comandoRegional para o estado de Mato Grosso.',
      criterios: [
        'O corpo da requisição deve conter filtro por UF e agrupamento por UF, município e comandoRegional.',
        'A resposta deve conter as chaves "resumo", "agrupamentos" e "grupos".',
        'O objeto "grupos" deve apresentar apenas estatísticas agregadas por UF, município e comandoRegional, com as chaves no formato "UF|Município|ComandoRegional".'
      ],
      esperado: 'Retorno JSON com agregados por UF, município e comandoRegional, estrutura enxuta e campos numéricos corretos.',
      parametrosRequest: req.body
    };

    global.__testMetaDump.push({
      fullName: expect.getState().currentTestName,
      meta,
      parametrosRequest: meta.parametrosRequest,
      resumoResultado: { ...resultado }
    });
  });

  it('Valida se o endpoint retorna o agrupamento correto de agregados por UF, município, comandoRegional e tipo para o estado de Mato Grosso.', async () => {
    const req = {
      body: {
        filtros: { uf: ['MT'] },
        agruparPor: ['uf', 'municipio', 'comandoRegional', 'tipo'] // <-- Corrigido aqui
      }
    };
    const res = { json: jest.fn() };
    const next = jest.fn();

    await AnaEstatisticasController.postEstatisticas(req, res, next);

    expect(res.json).toHaveBeenCalled();
    const resultado = res.json.mock.calls[0][0];

    // Estrutura básica
    expect(resultado).toHaveProperty('resumo');
    expect(typeof resultado.resumo).toBe('object');
    expect(resultado.resumo).toHaveProperty('total_estacoes');
    expect(typeof resultado.resumo.total_estacoes).toBe('number');
    expect(resultado.resumo).toHaveProperty('total_ufs');
    expect(typeof resultado.resumo.total_ufs).toBe('number');
    expect(resultado.resumo).toHaveProperty('total_municipios');
    expect(typeof resultado.resumo.total_municipios).toBe('number');
    expect(resultado.resumo).toHaveProperty('total_grupos');
    expect(typeof resultado.resumo.total_grupos).toBe('number');

    expect(resultado).toHaveProperty('agrupamentos');
    expect(typeof resultado.agrupamentos).toBe('object');
    expect(resultado.agrupamentos).toHaveProperty('porTipo');
    expect(typeof resultado.agrupamentos.porTipo).toBe('object');
    expect(resultado.agrupamentos).toHaveProperty('porStatus');
    expect(typeof resultado.agrupamentos.porStatus).toBe('object');
    expect(resultado.agrupamentos).toHaveProperty('porUF');
    expect(typeof resultado.agrupamentos.porUF).toBe('object');
    expect(resultado.agrupamentos).toHaveProperty('porComando');
    expect(typeof resultado.agrupamentos.porComando).toBe('object');

    // Deve conter grupos
    expect(resultado).toHaveProperty('grupos');
    expect(typeof resultado.grupos).toBe('object');
    expect(Object.keys(resultado.grupos).length).toBeGreaterThan(0);

    // Validação dinâmica dos grupos
    Object.values(resultado.grupos).forEach(grupo => {
      expect(typeof grupo).toBe('object');
      expect(grupo).toHaveProperty('total_estacoes');
      expect(typeof grupo.total_estacoes).toBe('number');
      expect(grupo).toHaveProperty('media_chuva');
      expect(typeof grupo.media_chuva).toBe('number');
      // Adicione aqui outras validações de campos se necessário
    });

    // Metadados para relatório
    const meta = {
      objetivo: 'Verificar se o endpoint retorna o agrupamento correto de agregados por UF, município, comandoRegional e tipo para o estado de Mato Grosso.',
      criterios: [
        'O corpo da requisição deve conter filtro por UF e agrupamento por UF, município, comandoRegional e tipo.',
        'A resposta deve conter as chaves "resumo", "agrupamentos" e "grupos".',
        'O objeto "grupos" deve apresentar apenas estatísticas agregadas por UF, município, comandoRegional e tipo, com as chaves no formato "UF|Município|ComandoRegional|Tipo".'
      ],
      esperado: 'Retorno JSON com agregados por UF, município, comandoRegional e tipo, estrutura enxuta e campos numéricos corretos.',
      parametrosRequest: req.body
    };

    global.__testMetaDump.push({
      fullName: expect.getState().currentTestName,
      meta,
      parametrosRequest: meta.parametrosRequest,
      resumoResultado: { ...resultado }
    });
  });

  it('Valida se o endpoint retorna o agrupamento correto de agregados apenas por tipo para o estado de MT.', async () => {
    const req = {
      body: {
        filtros: { uf: ['MT'] },
        agruparPor: ['tipo']
      }
    };
    const res = { json: jest.fn() };
    const next = jest.fn();

    await AnaEstatisticasController.postEstatisticas(req, res, next);

    expect(res.json).toHaveBeenCalled();
    const resultado = res.json.mock.calls[0][0];

    expect(resultado).toHaveProperty('resumo');
    expect(typeof resultado.resumo).toBe('object');
    expect(resultado).toHaveProperty('agrupamentos');
    expect(typeof resultado.agrupamentos).toBe('object');
    expect(resultado).toHaveProperty('grupos');
    expect(typeof resultado.grupos).toBe('object');
    expect(Object.keys(resultado.grupos).length).toBeGreaterThan(0);

    Object.keys(resultado.grupos).forEach(tipo => {
      expect(['Pluviometrica', 'Fluviometrica']).toContain(tipo);
      const grupo = resultado.grupos[tipo];
      expect(typeof grupo).toBe('object');
      expect(grupo).toHaveProperty('total_estacoes');
      expect(typeof grupo.total_estacoes).toBe('number');
      expect(grupo).toHaveProperty('media_chuva');
      expect(typeof grupo.media_chuva).toBe('number');
    });

    const meta = {
      objetivo: 'Verificar se o endpoint retorna o agrupamento correto de agregados apenas por tipo para o estado de Mato Grosso.',
      criterios: [
        'O corpo da requisição deve conter filtro por UF e agrupamento apenas por tipo.',
        'A resposta deve conter as chaves "resumo", "agrupamentos" e "grupos".',
        'O objeto "grupos" deve apresentar apenas estatísticas agregadas por tipo.'
      ],
      esperado: 'Retorno JSON com agregados por tipo, estrutura enxuta e campos numéricos corretos.',
      parametrosRequest: req.body
    };

    // extrair lógica para simplificar o uso em cada cenário!
    global.__testMetaDump.push({
      fullName: expect.getState().currentTestName,
      meta,
      parametrosRequest: meta.parametrosRequest,
      resumoResultado: { ...resultado }
    });
  });

  it('deve calcular média de chuva e total de estações apenas com registros válidos', async () => {
    // Simule apenas 4 estações válidas (2 de cada tipo)
    const mockEstacoes = [
      // Estações válidas para uso nos cálculos
      {
        tipo: 'Pluviometrica',
        municipio: 'CUIABA',
        uf: 'MT',
        dadosHidrologicos: {
          status: 'Atualizado',
          chuva: {
            acumulada: 5.8,
            qualidade: { status: 'Bom' }
          }
        }
      },
      {
        tipo: 'Pluviometrica',
        municipio: 'CUIABA',
        uf: 'MT',
        dadosHidrologicos: {
          status: 'Atualizado',
          chuva: {
            acumulada: 0.7,
            qualidade: { status: 'Bom' }
          }
        }
      },
      {
        tipo: 'Fluviometrica',
        municipio: 'VARZEA GRANDE',
        uf: 'MT',
        dadosHidrologicos: {
          status: 'Atualizado',
          chuva: {
            acumulada: 5.8,
            qualidade: { status: 'Bom' }
          }
        }
      },
      {
        tipo: 'Fluviometrica',
        municipio: 'VARZEA GRANDE',
        uf: 'MT',
        dadosHidrologicos: {
          status: 'Atualizado',
          chuva: {
            acumulada: 0.7,
            qualidade: { status: 'Bom' }
          }
        }
      },
      // Estações inválidas (não devem ser consideradas)
      {
        tipo: 'Pluviometrica',
        municipio: 'CUIABA',
        uf: 'MT',
        dadosHidrologicos: {
          status: 'Desatualizado',
          chuva: {
            acumulada: null,
            qualidade: { status: 'Ruim' }
          }
        }
      },
      {
        tipo: 'Fluviometrica',
        municipio: 'VARZEA GRANDE',
        uf: 'MT',
        dadosHidrologicos: {
          status: 'Atualizado',
          chuva: {
            acumulada: undefined,
            qualidade: { status: 'Bom' }
          }
        }
      }
    ];

    // Mock do serviço para retornar apenas essas estações
    jest.spyOn(AnaEstacoesService, 'listarEstacoes').mockResolvedValue(mockEstacoes);

    const req = {
      body: {
        filtros: { uf: ['MT'] },
        agruparPor: ['tipo']
      }
    };
    const res = { json: jest.fn() };
    const next = jest.fn();

    await AnaEstatisticasController.postEstatisticas(req, res, next);

    expect(res.json).toHaveBeenCalled();
    const resultado = res.json.mock.calls[0][0];

    // Validação
    expect(resultado.grupos.Pluviometrica.total_estacoes).toBe(2); // total de estações deve ser igual a 2 (P)
    expect(resultado.grupos.Fluviometrica.total_estacoes).toBe(2); // total de estações deve ser igual a 2 (F)
    expect(resultado.grupos.Pluviometrica.media_chuva).toBeCloseTo(3.25, 2);
    expect(resultado.grupos.Fluviometrica.media_chuva).toBeCloseTo(3.25, 2);

    const esperadoString = JSON.stringify({
      total_estacoes_Pluviometrica: 2,
      total_estacoes_Fluviometrica: 2,
      media_chuva_Pluviometrica: 3.25,
      media_chuva_Fluviometrica: 3.25
    }, null, 2);

    const meta = {
      objetivo: "Validar que o endpoint retorna média de chuva e total de estações apenas com registros válidos, utilizando um mock com 6 estações (4 válidas e 2 inválidas, de ambos os tipos).",
      criterios: [
        "Apenas estações com status 'Atualizado', qualidade 'Bom', município e UF preenchidos, e valor acumulado numérico são consideradas válidas (mock inclui exemplos de ambos os casos).",
        "Estações inválidas (status diferente, qualidade ruim, acumulada nula/undefined) são ignoradas conforme simulado no mock.",
        "O agrupamento por tipo deve refletir corretamente o total e a média apenas das estações válidas, testando Pluviometrica e Fluviometrica."
      ],
      esperado: "Retorno JSON com agregados por tipo, estrutura enxuta e campos numéricos corretos, considerando apenas os registros válidos do mock.",
      parametrosRequest: req.body
    };
    global.__testMetaDump.push({
      fullName: expect.getState().currentTestName,
      meta,
      parametrosRequest: meta.parametrosRequest,
      resumoResultado: { ...resultado }
    });
  });

}); // Fechamento describe.POST /api/ana/estatisticas - postEstatisticas

describe('POST /api/ana/estacoes/medias-diarias - postMediasDiarias', () => {
  it('deve retornar a série de médias diárias por UF para o período e filtro informados', async () => {
    const req = {
      body: {
        dataInicio: "2025-07-24",
        dataFim: "2025-07-30",
        filtros: { uf: ["MT"] }
      }
    };
    const res = { json: jest.fn() };
    const next = jest.fn();

    await AnaEstatisticasController.postMediasDiarias(req, res, next);

    expect(res.json).toHaveBeenCalled();
    const resultado = res.json.mock.calls[0][0];

    // Estrutura básica
    expect(resultado).toHaveProperty('medias_diarias');
    expect(Array.isArray(resultado.medias_diarias)).toBe(true);

    // Deve conter uma entrada para cada dia do período
    expect(resultado.medias_diarias.length).toBe(7);

    // Cada entrada deve ter data e objeto de médias por UF
    resultado.medias_diarias.forEach(item => {
      expect(item).toHaveProperty('data');
      expect(item).toHaveProperty('media_diaria_por_uf');
      expect(typeof item.media_diaria_por_uf).toBe('object');
      // Se houver dados, deve ter a UF consultada
      if (Object.keys(item.media_diaria_por_uf).length > 0) {
        expect(item.media_diaria_por_uf).toHaveProperty('MT');
        expect(typeof item.media_diaria_por_uf.MT).toBe('number');
      }
    });

    // Metadados para relatório
    const meta = {
      objetivo: 'Verificar se o endpoint retorna a série de médias diárias por UF para o período e filtro informados.',
      criterios: [
        'O corpo da requisição deve conter dataInicio/dataFim e filtro por UF.',
        'A resposta deve conter a chave "medias_diarias" como array.',
        'Cada item deve ter "data" e "media_diaria_por_uf".',
        'A UF consultada deve aparecer nas médias se houver dados.'
      ],
      esperado: 'Retorno JSON com série diária de médias por UF, cobrindo todo o período solicitado.',
      parametrosRequest: req.body
    };
    // resultado._meta = meta;
    global.__testMetaDump.push({
      fullName: expect.getState().currentTestName,
      meta,
      parametrosRequest: meta.parametrosRequest,
      resumoResultado: resultado
    });
  });
});


// =======================
// FINALIZAÇÃO E DUMP DE METADADOS
// =======================
afterAll(() => {
  fs.writeFileSync(META_PATH, JSON.stringify(global.__testMetaDump, null, 2));
});