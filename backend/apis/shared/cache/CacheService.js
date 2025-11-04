// @file: backend/apis/shared/cache/CacheService.js
class CacheService {
    constructor() {
        this.cache = new Map();
        this.timeouts = new Map();
    }

    async get(key) {
        return this.cache.get(key);
    }

    async set(key, value, ttl) {
        // Limpa timeout anterior se existir
        if (this.timeouts.has(key)) {
            clearTimeout(this.timeouts.get(key));
        }

        // Armazena o valor
        this.cache.set(key, value);

        // Converte TTL para milissegundos
        const ttlMs = this.parseTTL(ttl);

        // Define novo timeout para expiração
        const timeout = setTimeout(() => {
            this.cache.delete(key);
            this.timeouts.delete(key);
        }, ttlMs);

        this.timeouts.set(key, timeout);
    }

    async delete(key) {
        this.cache.delete(key);
        if (this.timeouts.has(key)) {
            clearTimeout(this.timeouts.get(key));
            this.timeouts.delete(key);
        }
    }

    async clear() {
        // Limpa todos os timeouts
        for (const timeout of this.timeouts.values()) {
            clearTimeout(timeout);
        }

        // Limpa cache e timeouts
        this.cache.clear();
        this.timeouts.clear();
    }

    // Converte string de TTL para milissegundos
    parseTTL(ttl) {
        if (typeof ttl === 'number') return ttl;

        const matches = ttl.match(/^(\d+)([smhd])$/);
        if (!matches) throw new Error('Formato de TTL inválido');

        const [, value, unit] = matches;
        const num = parseInt(value, 10);

        switch (unit) {
            case 's': return num * 1000;
            case 'm': return num * 60 * 1000;
            case 'h': return num * 60 * 60 * 1000;
            case 'd': return num * 24 * 60 * 60 * 1000;
            default: throw new Error('Unidade de TTL inválida');
        }
    }
}

export default CacheService;