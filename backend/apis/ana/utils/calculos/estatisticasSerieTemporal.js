// estatisticasSerieTemporal.js

// Função para converter string para número seguro
const toNumber = v => {
  if (v == null) return null;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

// Função genérica para extrair valores numéricos de um campo
export function extrairValoresSerie(items, campo) {
  return items
    .map(r => toNumber(r[campo]))
    .filter(v => v !== null);
}

// Estatísticas básicas
export function calcularMedia(arr) {
  if (!arr.length) return null;
  return Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2));
}

export function calcularMediana(arr) {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Number(((s[mid - 1] + s[mid]) / 2).toFixed(2));
}

export function calcularDesvioPadrao(arr) {
  if (!arr.length) return null;
  const media = calcularMedia(arr);
  const variancia = arr.reduce((acc, v) => acc + Math.pow(v - media, 2), 0) / arr.length;
  return Number(Math.sqrt(variancia).toFixed(2));
}

export function calcularMaximo(arr) {
  if (!arr.length) return null;
  return Math.max(...arr);
}

export function calcularMinimo(arr) {
  if (!arr.length) return null;
  return Math.min(...arr);
}

export function calcularModa(arr) {
  if (!arr.length) return null;
  const freq = {};
  arr.forEach(v => freq[v] = (freq[v] || 0) + 1);
  let maxFreq = 0, moda = null;
  for (const v in freq) {
    if (freq[v] > maxFreq) {
      maxFreq = freq[v];
      moda = Number(v);
    }
  }
  return moda;
}

// Percentual de registros válidos para um campo
export function percentualRegistrosValidos(items, campo) {
  if (!items.length) return null;
  const total = items.length;
  const validos = extrairValoresSerie(items, campo).length;
  return Number(((validos / total) * 100).toFixed(2));
}

// Função genérica para calcular estatísticas de qualquer campo
export function calcularEstatisticasSerie(items, campo) {
  const valores = extrairValoresSerie(items, campo);
  return {
    media: calcularMedia(valores),
    mediana: calcularMediana(valores),
    desvio_padrao: calcularDesvioPadrao(valores),
    maximo: calcularMaximo(valores),
    minimo: calcularMinimo(valores),
    moda: calcularModa(valores),
    percentual_validos: percentualRegistrosValidos(items, campo),
    tendencia: tendenciaLinear(valores)
    // Adicione outros indicadores se desejar
  };
}

// Eventos e sequências só fazem sentido para chuva (ou campos booleanos/eventos)
export function quantidadeEventos(arr, condFn) {
  if (!arr.length) return 0;
  return arr.filter(condFn).length;
}

export function sequenciaMaxima(arr, condFn) {
  let maxSeq = 0, atual = 0;
  for (const v of arr) {
    if (condFn(v)) {
      atual++;
      if (atual > maxSeq) maxSeq = atual;
    } else {
      atual = 0;
    }
  }
  return maxSeq;
}

// Exemplos de uso para chuva:
export function quantidadeEventosChuva(arr) {
  return quantidadeEventos(arr, v => v > 0);
}
export function sequenciaMaximaChuva(arr) {
  return sequenciaMaxima(arr, v => v > 0);
}
export function sequenciaMaximaSemChuva(arr) {
  return sequenciaMaxima(arr, v => v === 0);
}

// Regressão linear simples (tendência)
export function tendenciaLinear(arr) {
  if (arr.length < 2) return null;
  const n = arr.length;
  const sumX = (n - 1) * n / 2;
  const sumY = arr.reduce((a, b) => a + b, 0);
  const sumXY = arr.reduce((a, y, x) => a + x * y, 0);
  const sumX2 = (n - 1) * n * (2 * n - 1) / 6;
  const numerador = n * sumXY - sumX * sumY;
  const denominador = n * sumX2 - sumX * sumX;
  if (denominador === 0) return null;
  return Number((numerador / denominador).toFixed(4));
}