// frontend/src/components/layout/HUDDinamico.jsx

import React, { useState, useEffect, useRef } from 'react';
import '@styles/dashboard/HUDDinamico.css';
import { hudLogger } from '@shared/utils/hudLogger';
import ConteudoDinamico from '@components/layout/ConteudoDinamico';
void ConteudoDinamico

const HUDDinamico = ({ abas, abaAtivaId, onClose, onAbaChange }) => {
    const tabsContainerRef = useRef(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);

    const scrollEsquerda = () => {
        tabsContainerRef.current.scrollLeft -= 100;
    };

    const scrollDireita = () => {
        tabsContainerRef.current.scrollLeft += 100;
    };

    useEffect(() => {
        const el = tabsContainerRef.current;
        if (!el) return;

        const onWheel = (e) => {
            if (e.deltaY === 0) return;
            e.preventDefault();
            el.scrollLeft += e.deltaY;
        };

        el.addEventListener('wheel', onWheel);
        return () => el.removeEventListener('wheel', onWheel);
    }, []);

    useEffect(() => {
        const el = tabsContainerRef.current;
        if (!el) return;

        const updateArrows = () => {
            setShowLeftArrow(el.scrollLeft > 0);
            setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
        };

        updateArrows();
        el.addEventListener('scroll', updateArrows);
        window.addEventListener('resize', updateArrows);
        return () => {
            el.removeEventListener('scroll', updateArrows);
            window.removeEventListener('resize', updateArrows);
        };
    }, []);

    useEffect(() => {
        const el = tabsContainerRef.current;
        if (!el) return;

        const isOverflowing = el.scrollWidth > el.clientWidth;
        setShowLeftArrow(el.scrollLeft > 0);
        setShowRightArrow(isOverflowing && el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
    }, [abas]);

    // useEffect(() => {
    //     console.log(`HUDDinamico recebeu abaAtivaId: ${abaAtivaId}`);
    // }, [abaAtivaId]);

    const mudarAba = (id) => {
        if (id !== abaAtivaId) {
            onAbaChange?.(id);
            hudLogger.logAbaAtiva(id);
        }
    };

    const renderConteudo = (aba) => {
        if (!aba) {
            console.error(`Aba ativa não encontrada: ${abaAtivaId}`);
            return <p className="hud-no-content">Conteúdo não disponível</p>;
        }
        console.log(`Renderizando conteúdo da aba: ${aba.id}`);
        if (aba?.render) {
            return aba.render({ dados: aba.dados, fechar: () => onClose?.(aba.id) });
        } else if (aba?.dados) {
            return <ConteudoDinamico dados={aba.dados} titulo={aba.titulo} />;
        } else if (aba?.conteudo) {
            return aba.conteudo;
        }
        return <p className="hud-no-content">Conteúdo não disponível</p>;
    };

    return (
        <div className="hud-dinamico-container">
            <div className="hud-tabs-bar">
                {showLeftArrow && (
                    <button className="hud-tabs-arrow left" onClick={scrollEsquerda}>
                        ◀
                    </button>
                )}

                <div className="hud-tabs-container" ref={tabsContainerRef}>
                    {abas.map((aba) => (
                        <div key={aba.id} className="hud-tab-wrapper">
                            <button
                                onClick={() => mudarAba(aba.id)}
                                className={`hud-tab-button ${aba.id === abaAtivaId ? 'active' : ''}`}
                            >
                                {aba.titulo}
                                <span
                                    className="hud-tab-close"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onClose?.(aba.id);
                                    }}
                                >
                                    ×
                                </span>
                            </button>
                        </div>
                    ))}
                </div>

                {showRightArrow && (
                    <button className="hud-tabs-arrow right" onClick={scrollDireita}>
                        ▶
                    </button>
                )}
            </div>

            <div className="hud-content-container">
                {abas.length > 0
                    ? renderConteudo(abas.find((aba) => aba.id === abaAtivaId))
                    : <p className="hud-no-content">Nenhuma aba disponível</p>}
            </div>
        </div>
    );
};

export default HUDDinamico;
