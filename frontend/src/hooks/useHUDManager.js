// src/shared/hooks/useHUDManager.js

import { useState, useEffect, useRef } from 'react';
import { hudLogger } from '@shared/utils/hudLogger';

export const useHUDManager = (abasIniciais) => {
    const [abasVisiveis, setAbasVisiveis] = useState(abasIniciais);
    const [abaAtivaId, setAbaAtivaId] = useState(abasIniciais[0]?.id);
    const [hudVisivel, setHudVisivel] = useState(true);

    // ⚠️ Ref para manter abaAtivaId sempre atual dentro de fechamentos
    const abaAtivaIdRef = useRef(abaAtivaId);
    useEffect(() => {
        abaAtivaIdRef.current = abaAtivaId;
    }, [abaAtivaId]);

    useEffect(() => {
        if (abasVisiveis.length === 0 && hudVisivel) {
            setHudVisivel(false);
        }
    }, [abasVisiveis]);

    useEffect(() => {
        if (abasVisiveis.length > 0) {
            setHudVisivel(true);
        }
    }, [abasVisiveis]);

    const fecharAba = (id) => {
        setAbasVisiveis((prev) => {
            const indexFechada = prev.findIndex((a) => a.id === id);
            const novasAbas = prev.filter((a) => a.id !== id);
            const abaFechada = prev[indexFechada];

            abaFechada?.onClose?.();

            if (novasAbas.length === 0) {
                hudLogger.logHudFechado('Última aba fechada');
                setHudVisivel(false);
            } else if (id === abaAtivaIdRef.current) {
                const novaAbaAtiva =
                    novasAbas[indexFechada - 1]?.id ||
                    novasAbas[indexFechada]?.id ||
                    novasAbas[0]?.id;

                setAbaAtivaId(novaAbaAtiva);
                hudLogger.logAbaAtiva(novaAbaAtiva, 'ao fechar aba ativa');
            }

            return novasAbas;
        });
    };

    const fecharTodasAbas = () => {
        setAbasVisiveis([]);
        setHudVisivel(false);
        hudLogger.logHudFechado('Todas abas fechadas manualmente');
    };

    const fecharHUD = () => {
        hudLogger.logHudFechado('Fechamento manual');
        setHudVisivel(false);
    };

    const reabrirHUD = () => {
        setHudVisivel(true);
    };

    const adicionarAba = (aba) => {
        setAbasVisiveis((prev) => {
            const existe = prev.some((a) => a.id === aba.id);
            if (existe) {
                setAbaAtivaId(aba.id);
                hudLogger.logAbaAtiva(aba.id, 'aba já existe');
                return prev;
            }

            hudLogger.logAbaAdicionada?.(aba.id);
            setAbaAtivaId(aba.id);
            return [...prev, aba];
        });

        if (!hudVisivel) {
            setHudVisivel(true);
        }
    };

    return {
        abasVisiveis,
        abaAtivaId,
        hudVisivel,
        fecharAba,
        fecharHUD,
        fecharTodasAbas,
        reabrirHUD,
        setAbaAtivaId,
        adicionarAba,
    };
};
