// frontend/src/components/dashboard/DashboardMapaCidades.jsx

import CidadesTopCard from '@components/dashboard/CidadesTopCard'
void CidadesTopCard
import MapaCard from '@components/dashboard/MapaCard'
void MapaCard

import { useEffect, useState } from "react";
import { buscarFocosComLocalizacao, encontrarCoordenadasCidade } from "@services/locationService";
import { useMapaContexto } from '@context/MapaContexto'
import { normalizeString } from '@domain/utils/normalizeString';

/**
 * 🗺️ Componente principal da seção de cidades com focos no dashboard.
 *
 * Esse layout combina:
 * - Um painel à esquerda com dados acumulados por cidade.
 * - Um mapa central com foco geográfico.
 * - Um painel à direita com focos ativos por cidade.
 *
 * Estrutura visual:
 * ┌───────────────────────────────────────────────────┐
 * │ [Acumulados Por Cidade] [Mapa] [Focos por Cidade] │
 * └───────────────────────────────────────────────────┘
 *
 * Layout baseado em grid CSS com 3 colunas:
 * - 1fr (esquerda): Cidades acumuladas
 * - 2fr (centro): Mapa interativo
 * - 1fr (direita): Cidades com focos
 *
 * @returns {JSX.Element} Interface organizada em 3 colunas com cards e mapa.
 */
export default function DashboardMapaCidades() {
  const { cidadesSelecionadas, setCidadesSelecionadas } = useMapaContexto(); // Contexto do mapa para gerenciar cidades selecionadas
  const [focosLocalizados, setFocosLocalizados] = useState([]); // Estado para focos com localização (FIRMS)
  const [cidadesComChuvaLocalizadas, setCidadesComChuvaLocalizadas] = useState([]); // Estado para cidades com chuva localizadas (ANA)
  const [error, setError] = useState(null); // Estado para erros de carregamento
  const [limitesGeoJson, setLimitesGeoJson] = useState(null);

  const handleDesmarcarCidade = (cidadeNome) => {
    setCidadesSelecionadas(cidadesSelecionadas.filter(c => c.cidade !== cidadeNome));
  };

  const [isGeoJsonLoading, setIsGeoJsonLoading] = useState(true);

  useEffect(() => {
    fetch('/assets/geo/limites_administrativos.json')
      .then(res => res.json())
      .then(data => setLimitesGeoJson(data))
      .finally(() => setIsGeoJsonLoading(false));
  }, []);

  const [isFocosLoading, setIsFocosLoading] = useState(true);

  useEffect(() => {
    const carregarFocos = async () => {
      try {
        setIsFocosLoading(true);
        setError(null);
        const focos = await buscarFocosComLocalizacao();
        setFocosLocalizados(focos);
      } catch (err) {
        setError('Não foi possível carregar os dados dos focos.');
      } finally {
        setIsFocosLoading(false);
      }
    };
    carregarFocos();
  }, []);

  // Use este loading combinado:
  const isLoading = isGeoJsonLoading || isFocosLoading;

  function getRandomColor() {
    // Tons suaves e modernos
    const colors = ['#005aff', '#00b894', '#fdcb6e', '#e17055', '#6c5ce7', '#00cec9', '#fd79a8', '#636e72'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  const handleCidadeClick = (cidade, tipo) => {
    if (isLoading) {
      alert("Aguarde, os dados ainda estão sendo carregados...");
      return;
    }

    if (error) {
      alert("Não foi possível localizar as cidades devido a um erro no carregamento dos dados.");
      return;
    }

    let coords = null;

    if (tipo === "focos") {
      if (focosLocalizados.length === 0) {
        alert("Não há dados de localização disponíveis para hoje.");
        return;
      }
      coords = encontrarCoordenadasCidade(focosLocalizados, cidade.cidade);
    } else if (tipo === "chuva") {
      // Supondo que você tenha um array cidadesComChuvaLocalizadas
      coords = encontrarCoordenadasCidade(cidadesComChuvaLocalizadas, cidade.cidade);
    }

    console.log(`[${tipo.toUpperCase()}] Cidade:`, cidade.cidade, "| Coords:", coords);
    const glowColor = getRandomColor();
    if (coords && coords.lat && coords.lng) {
      // Adiciona cidade com coordenadas para zoom
      const jaSelecionada = cidadesSelecionadas.some(sel => sel.cidade === cidade.cidade);
      if (!jaSelecionada) {
        setCidadesSelecionadas([...cidadesSelecionadas, { ...cidade, ...coords, tipo, clickId: Date.now(), glowColor }]);
      } else {
        setCidadesSelecionadas(cidadesSelecionadas.map(sel =>
          sel.cidade === cidade.cidade
            ? { ...sel, ...coords, clickId: Date.now(), glowColor }
            : sel
        ));
      }
    } else {
      // Adiciona cidade só para destacar o limite, sem zoom
      const jaSelecionada = cidadesSelecionadas.some(sel => sel.cidade === cidade.cidade);
      if (!jaSelecionada) {
        setCidadesSelecionadas([...cidadesSelecionadas, { ...cidade, tipo, clickId: Date.now(), glowColor }]);
      } else {
        setCidadesSelecionadas(cidadesSelecionadas.map(sel =>
          sel.cidade === cidade.cidade
            ? { ...sel, clickId: Date.now(), glowColor }
            : sel
        ));
      }
    }
  };

  return (
    <div
      style={{
        display: 'grid',
        height: '100%',
        gridTemplateColumns: '1fr 2fr 1fr',
        gap: '0.15rem'
      }}
    >
      <CidadesTopCard
        titulo="MÉDIA POR MUNICÍPIO HOJE"
        tipo="chuva"
        onCidadeClick={cidade => handleCidadeClick(cidade, "chuva")}
        isLoading={isLoading}
        error={error}
        limitesGeoJson={limitesGeoJson}
      />

      <MapaCard
        cidadesSelecionadas={cidadesSelecionadas}
        onDesmarcarCidade={handleDesmarcarCidade}
      />

      <CidadesTopCard
        titulo="FOCOS DE CALOR POR MUNICÍPIO HOJE"
        tipo="focos"
        onCidadeClick={cidade => handleCidadeClick(cidade, "focos")}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
}
