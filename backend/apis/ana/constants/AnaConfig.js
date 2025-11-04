// @file backend/apis/ana/constants/AnaConfig.js

/**
 * Configurações gerais do módulo ANA
 */
export const AnaConfig = {
    HIDROLOGIA: {
        TIPOS: ['chuva', 'nivel', 'vazao'],

        INTERVALOS: {
            PADRAO: 'HORA_24',
            VALIDOS: ['MINUTO_15', 'MINUTO_30', 'HORA_1', 'HORA_2', 'HORA_3', 'HORA_4', 'HORA_5', 'HORA_6', 'HORA_7', 'HORA_8', 'HORA_9', 'HORA_10', 'HORA_11', 'HORA_12', 'HORA_13', 'HORA_14', 'HORA_15', 'HORA_16', 'HORA_17', 'HORA_18', 'HORA_19', 'HORA_20', 'HORA_21', 'HORA_22', 'HORA_23', 'HORA_24', 'DIAS_2', 'DIAS_7', 'DIAS_14', 'DIAS_21', 'DIAS_30']
        },

        UNIDADES: {
            chuva: 'mm',
            nivel: 'cm',
            vazao: 'm³/s'
        },

        DESCRICOES: {
            chuva: 'Precipitação',
            nivel: 'Nível da água',
            vazao: 'Vazão da água'
        },

        METRICAS: {
            chuva: ['acumulada', 'minima', 'maxima'],
            nivel: ['minima', 'maxima'],
            vazao: ['minima', 'maxima']
        },

        STATUS: {
            LIMITE_HORAS: 2, // horas para considerar a medição desatualizada
            ATUALIZADO: 'Atualizado',
            DESATUALIZADO: 'Desatualizado'
        }
    },

    TIMEOUT_HISTORICO_MS: 10000, // Timeout padrão de 10s para requisições de histórico

    QUALIDADE: {
        REGRAS_ATIVAS: {
            chuva: ['spikeCheck', 'stagnationCheck'],
            nivel: [],
            vazao: []
        },

        PARAMETROS: {
            spikeCheck: {
                deltaCritico: 50
            },
            stagnationCheck: {
                minValoresIguais: 2,
                ignorarZeros: true,
                severidade: {
                    2: 'Leve',
                    4: 'Moderado',
                    8: 'Critico'
                }
            }
        }
    },

    CACHE: {
        TTL: {
            ESTACOES: 60 * 60 * 1000,     // 1 hora
            HISTORICO: 60 * 60 * 1000     // 1 hora
        },
        KEYS: {
            ESTACOES: 'ana:estacoes',
            INVENTARIO: 'ana:estacoes:inventario',
            TEMPO_REAL: 'ana:estacoes:tempo_real',
            CONSOLIDADO: 'ana:estacoes:consolidado'
        }
    },

    BATCH: {
        MAX_POR_REQUISICAO: 95
    },

    ALLOWED_DIAS: Object.freeze([1, 2, 7, 14, 21, 30]),
    
    ALLOWED_DIAS_SET: new Set([1, 2, 7, 14, 21, 30]),
    
    DEFAULT_TZ_OFFSET_MINUTES: Number(process.env.ANA_TZ_OFFSET_MINUTES ?? -180)
};
