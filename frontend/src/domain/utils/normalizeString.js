// /domain/utils/normalizeString.js

/**
 * Normaliza uma string removendo acentuação, minúsculas e espaços extras.
 * @param {string} str - String a ser normalizada.
 * @returns {string}
 */
export function normalizeString(str) {
  return str
    ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
    : '';
}
