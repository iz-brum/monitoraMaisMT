/**
 * @file stationLists.js
 * @description Carregamento e fornecimento das listas de whitelist/blacklist de estações.
 * @escopo
 *   - Leitura única (com cache) dos arquivos JSON de listas.
 *   - Exposição de estruturas (Set) prontas para uso em filtragens.
 * @nao_conter
 *   - Regras de negócio de filtragem (ficam em index.js da pasta).
 *   - Qualquer outra fonte de dados que não as listas locais JSON.
 *   - Modificação direta de dados de inventário.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// determina __dirname do módulo
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// data/ fica em /apis/ana/utils/filtragem_estacoes/
const DATA_DIR = path.join(__dirname, 'data');
const BLACK_PATH = path.join(DATA_DIR, 'blacklist.json');
const WHITE_PATH = path.join(DATA_DIR, 'whitelist.json');

async function ensureFiles() {
    await fs.mkdir(DATA_DIR, { recursive: true });
    for (const p of [BLACK_PATH, WHITE_PATH]) {
        try {
            await fs.access(p);
        } catch (err) {
            if (err.code === 'ENOENT') {
                await fs.writeFile(p, '[]', 'utf8');
            } else {
                throw err;
            }
        }
    }
}

export async function loadLists() {
    await ensureFiles();
    const [black, white] = await Promise.all(
        [BLACK_PATH, WHITE_PATH].map(p =>
            fs.readFile(p, 'utf8')
                .then(JSON.parse)
                .catch(() => [])
        )
    );
    return { black: new Set(black), white: new Set(white) };
}

export async function saveLists(blackSet, whiteSet) {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await Promise.all([
        fs.writeFile(BLACK_PATH, JSON.stringify([...blackSet], null, 2), 'utf8'),
        fs.writeFile(WHITE_PATH, JSON.stringify([...whiteSet], null, 2), 'utf8')
    ]);
}
