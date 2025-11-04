// backend/utils/terminalConfig/timerConsole.js

/**
 * Utilitário melhorado para cronômetro no terminal com:
 * - Controle preciso de atualizações
 * - Prevenção de flickering
 * - Limpeza automática em caso de erro
 * - Suporte a múltiplos timers concorrentes
 * 
 * Exemplo:
 *   const timer = new ConsoleTimer('Processando dados');
 *   // ... operação ...
 *   timer.stop(); // ou timer.stopWithSummary();
 */
export class ConsoleTimer {
  constructor(label = '', context = '') {
    this.label = context ? `${label} (${context})` : label;
    this.startTime = Date.now();
    this.lastOutput = '';
    this.interval = setInterval(() => this.update(), 100);
    this.stopped = false;
    
    // Garante limpeza no encerramento do processo
    process.on('exit', () => this.cleanup());
  }

  update() {
    if (this.stopped) return;
    
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    if (elapsed !== this.lastOutput) {
      this.lastOutput = elapsed;
      process.stdout.write(`\r⏱️  ${this.label}: ${elapsed}s`);
    }
  }

  stop() {
    if (this.stopped) return;
    this.cleanup();
  }

  stopWithSummary() {
    if (this.stopped) return;
    const total = ((Date.now() - this.startTime) / 1000).toFixed(1);
    this.cleanup();
    console.log(`✓ ${this.label} concluído em ${total}s`);
  }

  cleanup() {
    clearInterval(this.interval);
    if (!this.stopped) {
      process.stdout.write('\n');
      this.stopped = true;
    }
  }
}

// Versão simplificada para uso rápido (API similar à original)
export function startTimer(label, context) {
  const timer = new ConsoleTimer(label, context);
  return () => timer.stop();
}