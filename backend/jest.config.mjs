// FILE: backend/jest.config.mjs

import path from 'path';

const reporterPath = path.resolve('./scripts/jest-meta-reporter.js');

export default {
    // não usamos transform( ), deixamos vazio para não usar Babel
    transform: {},

    // ambiente de teste
    testEnvironment: 'node',

    // mapeamento de aliases
    moduleNameMapper: {
        '^#ana_services/(.*)$': '<rootDir>/apis/ana/services/$1',
        '^#ana_controllers/(.*)$': '<rootDir>/apis/ana/controllers/$1'
    },

    /**
     * REPORTERS DO JEST
     * 
     * - "default": Usa o reporter padrão do Jest, que exibe o resultado dos testes no terminal.
     * - [reporterPath, { ... }]: Adiciona um reporter customizado (implementado em scripts/jest-meta-reporter.js).
     *     - Esse reporter é responsável por salvar os resultados dos testes em formato JSON no arquivo especificado em "outputFile".
     *     - O arquivo gerado (./reports/test-meta-report.json) pode ser consumido por sistemas externos, dashboards ou relatórios automatizados.
     *     - Para customizar o conteúdo do JSON (ex: incluir data/hora de geração), edite o script do reporter.
     */
    reporters: [
        "default",
        [reporterPath, { "outputFile": "./reports/test-meta-report.json" }]
    ],

    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};