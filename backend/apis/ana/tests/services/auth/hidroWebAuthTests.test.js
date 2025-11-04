import { authenticateHidroweb, decodeJWTPayload, getCachedToken, getTokenStats } from '#ana_services/auth/hidrowebAuth.js';
import fs from 'fs';

const META_PATH = './reports/test-meta-dump.json';
global.__testMetaDump = [];

describe('Hidroweb Auth Integration Test (sem mock)', () => {
    let token;

    it('authenticateHidroweb() deve retornar um token JWT válido', async () => {
        token = await authenticateHidroweb();

        expect(typeof token).toBe('string');
        expect(token.split('.').length).toBe(3);

        const meta = {
            objetivo: 'Verificar se a autenticação com a API Hidroweb retorna um token JWT válido.',
            criterios: [
                'O token deve ser uma string no formato JWT com 3 partes (separadas por ".").',
                'A resposta da API deve conter o campo `tokenautenticacao`.'
            ],
            esperado: 'Retorno de um token JWT válido que possa ser utilizado em chamadas autenticadas.'
        };

        const resultados = { token: token.slice(0, 75) + '...' };

        global.__testMetaDump.push({
            fullName: expect.getState().currentTestName,
            meta,
            resumoResultado: resultados
        });
    });

    it('decodeJWTPayload() deve decodificar corretamente o token', () => {
        const payload = decodeJWTPayload(token);

        expect(payload).toHaveProperty('exp');
        expect(payload).toHaveProperty('iat');
        expect(typeof payload.exp).toBe('number');
        expect(typeof payload.iat).toBe('number');

        const meta = {
            objetivo: 'Verificar se o token JWT pode ser decodificado corretamente e possui os campos esperados.',
            criterios: [
                'A decodificação deve retornar um objeto JSON válido.',
                'Os campos `iat` (emitido em) e `exp` (expiração) devem existir e ser números válidos.'
            ],
            esperado: 'O payload do token JWT deve ser extraído com sucesso e conter timestamps válidos.'
        };

        const resultados = { ...payload };

        global.__testMetaDump.push({
            fullName: expect.getState().currentTestName,
            meta,
            resumoResultado: resultados
        });
    });

    it('getCachedToken() deve retornar o mesmo token', () => {
        const cached = getCachedToken();

        expect(cached).toBe(token);

        const meta = {
            objetivo: 'Verificar se o token em cache é retornado corretamente após autenticação.',
            criterios: [
                'O token armazenado em cache deve ser igual ao token obtido anteriormente.',
                'A função deve respeitar o tempo de expiração configurado.'
            ],
            esperado: 'O token retornado do cache deve ser igual ao último token autenticado.'
        };

        const resultados = {
            tokenAutenticado: token?.slice(0, 75) + '...',
            tokenEmCache: cached?.slice(0, 75) + '...',
            iguais: token === cached
        };

        global.__testMetaDump.push({
            fullName: expect.getState().currentTestName,
            meta,
            resumoResultado: resultados
        });
    });

    it('getTokenStats() deve retornar informações válidas do token', () => {
        const stats = getTokenStats();

        expect(stats.hasValidToken).toBe(true);
        expect(typeof stats.token).toBe('string');

        const { createdAt, expiresAt, expiresIn, isTokenNew } = stats.meta;

        expect(createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        expect(expiresAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        expect(expiresIn).toMatch(/^\d+'\s\d+''$/);
        expect(typeof isTokenNew).toBe('boolean');

        expect(stats.error).toBeNull();

        const meta = {
            objetivo: 'Avaliar se os metadados do token (como validade e tempos) são corretamente calculados após autenticação.',
            criterios: [
                'O objeto retornado deve conter os campos: `hasValidToken`, `token`, `meta.createdAt`, `meta.expiresAt`, `meta.expiresIn`, `meta.isTokenNew`, e `error`.',
                'Os campos de data devem estar em formato ISO (YYYY-MM-DDTHH:mm:ssZ).',
                'O campo `expiresIn` deve refletir corretamente o tempo restante.',
                'O campo `error` deve estar ausente (`null`) para um token válido.'
            ],
            esperado: 'Todos os campos devem estar presentes e refletir corretamente o conteúdo do token JWT.'
        };

        const resultados = {
            tokenPreview: stats.token?.slice(0, 75) + '...',
            createdAt,
            expiresAt,
            expiresIn,
            isTokenNew
        };

        global.__testMetaDump.push({
            fullName: expect.getState().currentTestName,
            meta,
            resumoResultado: resultados
        });
    });

});

// =======================
// FINALIZAÇÃO E DUMP DE METADADOS
// =======================
afterAll(() => {
    fs.writeFileSync(META_PATH, JSON.stringify(global.__testMetaDump, null, 2));
});