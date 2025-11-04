import React, { createContext, useContext, useEffect, useState } from 'react';

const MapaContexto = createContext();

export function MapStateProvider({ children }) {

    // Exemplos de estados globais
    const [cidadesSelecionadas, setCidadesSelecionadas] = useState([]);
    const [focosSelecionados, setFocosSelecionados] = useState([]);
    const [arquivosImportados, setArquivosImportados] = useState([]);
    const [popupVisivel, setPopupVisivel] = useState(false);
    const [mapPosition, setMapPosition] = useState({ center: [-12.6, -56.1], zoom: 6 });
    const [hydrated, setHydrated] = useState(false);
    const [estacoesAna, setEstacoesAna] = useState([]);


    useEffect(() => {
        const salvo = localStorage.getItem('MAPA_ESTADO');
        if (salvo) {
            try {
                const {
                    cidadesSelecionadas, focosSelecionados, arquivosImportados, popupVisivel, mapPosition: posSalva,
                } = JSON.parse(salvo);
                setCidadesSelecionadas(cidadesSelecionadas || []);
                setFocosSelecionados(focosSelecionados || []);
                setArquivosImportados(arquivosImportados || []);
                setPopupVisivel(!!popupVisivel);
                setMapPosition(posSalva || { center: [-12.6, -56.1], zoom: 6 });
            } catch (e) {
                alert('Problemas com: ' + e)
            }
        }
        setHydrated(true);
    }, []);

    useEffect(() => {
        localStorage.setItem(
            'MAPA_ESTADO',
            JSON.stringify({ cidadesSelecionadas, focosSelecionados, arquivosImportados, popupVisivel, mapPosition })
        );
    }, [cidadesSelecionadas, focosSelecionados, arquivosImportados, popupVisivel, mapPosition]);

    // ⬇️ ⬇️ Só renderiza os filhos depois de hidratado!
    if (!hydrated) return <div>Carregando app...</div>; // ou <div>Carregando app...</div>
    return (
        <MapaContexto.Provider value={{
            cidadesSelecionadas, setCidadesSelecionadas,
            focosSelecionados, setFocosSelecionados,
            arquivosImportados, setArquivosImportados,
            popupVisivel, setPopupVisivel,
            mapPosition, setMapPosition,
            hydrated,
            estacoesAna, setEstacoesAna,
        }}>
            {children}
        </MapaContexto.Provider>
    );
}

export function useMapaContexto() {
    const ctx = useContext(MapaContexto);
    if (!ctx) throw new Error('useMapaContexto deve ser usado dentro de <MapStateProvider>');
    return ctx;
}
