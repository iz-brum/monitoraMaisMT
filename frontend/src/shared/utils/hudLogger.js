export const hudLogger = {
    lastAction: null,

    logAbaAtiva: function (id) {
        if (this.lastAction === `ativa-${id}`) return;
        this.lastAction = `ativa-${id}`;

        console.groupCollapsed(`%c[HUD] Aba ativa: ${id}`, 'color: #2ecc71; font-weight: bold');
        console.trace('Origem da mudança:');
        console.groupEnd();
    },

    logAbaFechada: function (id, restantes) {
        console.group(`%c[HUD] Aba fechada`, 'color: #e74c3c');
        console.log(`ID: ${id}`);
        console.log(`Abas restantes: ${restantes}`);
        console.groupEnd();
        this.lastAction = `fechada-${id}`;
    },

    logHudFechado: function (motivo) {
        if (this.lastAction === `fechado-${motivo}`) return;
        console.groupCollapsed(`%c[HUD] Fechado - ${motivo}`, 'color: #f39c12; font-weight: bold');
        console.trace('Origem do fechamento:');
        console.groupEnd();
        this.lastAction = `fechado-${motivo}`;
    }
};