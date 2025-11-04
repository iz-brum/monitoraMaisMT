// @file backend/apis/ana/utils/calculos/acumuladoChuva.js

const DAY_MS = 24 * 60 * 60 * 1000;

/** Formata timestamp no fuso desejado como "YYYY-MM-DD HH:mm:ss.0" (padrão Hidroweb) */
function formatAsHidroweb(ts, tzOffsetMinutes = -180) {
  const d = new Date(ts + tzOffsetMinutes * 60 * 1000); // aplica fuso
  const pad = n => String(n).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  const mm = pad(d.getUTCMonth() + 1);
  const dd = pad(d.getUTCDate());
  const HH = pad(d.getUTCHours());
  const MM = pad(d.getUTCMinutes());
  const SS = pad(d.getUTCSeconds());
  return `${yyyy}-${mm}-${dd} ${HH}:${MM}:${SS}.0`;
}

/**
 * Soma de Chuva_Adotada em duas casas.
 */
export function calculaChuvaAcumulada(items) {
  // Filtra apenas valores numéricos válidos
  const chuvasValidas = items
    .map(r => {
      const v = parseFloat(String(r.Chuva_Adotada).replace(',', '.'));
      return Number.isFinite(v) ? v : null;
    })
    .filter(v => v !== null);

  if (chuvasValidas.length === 0) return null;

  const total = chuvasValidas.reduce((sum, v) => sum + v, 0);
  return Number(total.toFixed(2));
}

/**
 * Converte "YYYY-MM-DD HH:mm:ss.0" (no fuso local informado) para epoch UTC (ms).
 */
function parseLocalToUtcEpoch(s, tzOffsetMinutes) {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?$/.exec(String(s).trim());
  if (!m) return null;

  const [, Y, M, D, H, Min, S] = m;
  return Date.UTC(+Y, +M - 1, +D, +H, +Min, +S) - tzOffsetMinutes * 60 * 1000;
}

const byAsc = (a, b) => a - b;
const byDesc = (a, b) => b - a;

function groupRelative(valid) {
  if (!valid.length) return { groups: {}, buckets: [], endFor: () => 0 };

  const ordered = [...valid].sort((a, b) => b.ts - a.ts);
  const latestTs = ordered[0].ts;

  const groups = ordered.reduce((acc, it) => {
    const k = Math.floor((latestTs - it.ts) / DAY_MS);
    (acc[k] ||= []).push(it);
    return acc;
  }, {});

  const buckets = Object.keys(groups).map(Number).sort(byAsc);
  const endFor = (k) => latestTs - k * DAY_MS;

  return { groups, buckets, endFor };
}

function groupCalendar(valid, tzOffsetMinutes) {
  if (!valid.length) return { groups: {}, buckets: [], endFor: () => 0 };

  const shift = tzOffsetMinutes * 60 * 1000;

  const groups = valid.reduce((acc, it) => {
    const k = Math.floor((it.ts + shift) / DAY_MS);
    (acc[k] ||= []).push(it);
    return acc;
  }, {});

  const buckets = Object.keys(groups).map(Number).sort(byDesc);
  const endFor = (k) => (k + 1) * DAY_MS - shift;

  return { groups, buckets, endFor };
}

export function agruparAcumulosPor24h(
  items,
  { tzOffsetMinutes = -180, mode = 'RELATIVE' } = {}
) {
  const valid = items
    .map(it => ({ ...it, ts: parseLocalToUtcEpoch(it.Data_Hora_Medicao, tzOffsetMinutes) }))
    .filter(it => it.ts != null);

  const { groups, buckets, endFor } =
    mode === 'CALENDAR'
      ? groupCalendar(valid, tzOffsetMinutes)
      : groupRelative(valid);

  const janelas = buckets.map(k => {
    const arr = groups[k];
    const acumulado = calculaChuvaAcumulada(arr);
    return {
      data_hora_referencia: formatAsHidroweb(endFor(k), tzOffsetMinutes),
      acumulado_chuva: acumulado,
      qtd_registros: arr.length
    };
  });

  // Se todas as janelas têm acumulado_chuva null, retorna null
  if (janelas.length === 0 || janelas.every(j => j.acumulado_chuva === null)) {
    return null;
  }

  return janelas;
}

export function calcularAcumulados(items, opts = {}) {
  const acumulado_geral = calculaChuvaAcumulada(items);
  const janelas_24h = agruparAcumulosPor24h(items, opts);
  return {
    acumulado_geral,
    janelas_24h
  };
}