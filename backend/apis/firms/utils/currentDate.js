import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';

dayjs.extend(utc);

// 🗓️ Troque aqui para a data fixa desejada (ou comente para usar data real)
const FIXED_DATE = "2025-06-03"; // Exemplo: '2025-07-01'

/**
 * 📦 Retorna a "data atual" usada em TODO o sistema
 */
export function getToday() {
    return FIXED_DATE ? dayjs.utc(FIXED_DATE) : dayjs.utc();
}

/**
 * 🧱 Retorna a data em formato ISO (YYYY-MM-DD)
 */
export function getTodayISO() {
    return getToday().format('YYYY-MM-DD');
}
