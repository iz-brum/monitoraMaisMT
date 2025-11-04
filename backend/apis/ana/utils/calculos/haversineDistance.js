// @file backend/apis/ana/utils/analytics/haversineDistance.js

/**
 * @param   {number} lat1   Latitude do primeiro ponto.
 * @param   {number} lon1   Longitude do primeiro ponto.
 * @param   {number} lat2   Latitude do segundo ponto.
 * @param   {number} lon2   Longitude do segundo ponto.
 * @returns {number}        Distância entre os pontos em metros (fórmula de Haversine).
 *
 * @example
 * const dist = haversineDistance(-12.68, -56.92, -12.70, -56.95);
 * console.log(dist); // valor em metros
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Raio da Terra em metros
  const toRad = deg => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const lat1Rad = toRad(lat1);
  const lat2Rad = toRad(lat2);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // metros
}

/**
 * @param   {number}        latNova      Latitude da nova coordenada.
 * @param   {number}        lonNova      Longitude da nova coordenada.
 * @param   {Map}           mapa         Mapa com chaves no formato 'lat|lon'.
 * @param   {number}        raioMetros   Raio de tolerância em metros (default: 50).
 * @returns {boolean}                    Retorna true se já existe coordenada próxima no mapa, false caso contrário.
 *
 * @example
 * const existe = coordenadaJaExiste(-12.68, -56.92, mapa, 100);
 * console.log(existe); // true ou false
 */
export function coordenadaJaExiste(latNova, lonNova, mapa, raioMetros = 50) {
  for (const [key] of mapa.entries()) {
    const [lat, lon] = key.split('|').map(Number);
    const distancia = haversineDistance(lat, lon, latNova, lonNova);
    if (distancia <= raioMetros) return true;
  }
  return false;
}
