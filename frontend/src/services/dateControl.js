// src/services/dateControl.js

let currentDate = new Date();
let mode = 'ontem'; // 'fixa' | 'ontem' | 'hoje'

/**
 * Define a estratégia de data para requisições.
 * 
 * @param {'fixa'|'ontem'|'hoje'} novoModo - Modo de uso da data
 * @param {string|Date} [dataFixa] - Opcional, usado apenas se modo === 'fixa'
 */
export function setRequestDate(novoModo = 'ontem', dataFixa = null) {
  mode = novoModo;

  if (mode === 'fixa' && dataFixa) {
    currentDate = typeof dataFixa === 'string'
      ? new Date(dataFixa)
      : new Date(dataFixa);
  } else {
    currentDate = new Date(); // Atualiza para hoje no caso de 'hoje' ou 'ontem'
  }
}

/**
 * Retorna a data usada atualmente nas requisições
 * no formato ISO (YYYY-MM-DD)
 */
export function getRequestDate() {
  const data = new Date(currentDate);

  if (mode === 'ontem') {
    data.setDate(data.getDate() - 1);
  }

  return data.toISOString().split('T')[0];
}

/**
 * Retorna o modo atual da data (debug ou logs)
 */
export function getRequestMode() {
  return mode;
}


// ====== Exemplos de uso ======

// 🧪 Em testes ou debug:
// setRequestDate('fixa', '2025-07-02');

// 🗓️ Produção (usar ontem):
// setRequestDate('ontem');

// ⚠️ Especial: usar hoje como exceção:
// setRequestDate('hoje');

// 🔍 Para saber o modo:
// console.log(getRequestMode()); // 'ontem' | 'fixa' | 'hoje'

// 🔁 Em qualquer ponto:
// const data = getRequestDate(); // retorna '2025-07-01' ou '2025-07-03', etc
