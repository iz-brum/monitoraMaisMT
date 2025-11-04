// src/components/dashboard/CidadesTopCard.jsx

import { useEffect, useState } from 'react';
import '@styles/dashboard/CidadesTopCard.css';
import { buscarCidadesComFocos } from '@services/cityService'
import Loader from '@components/common/Loader';
import { normalizeString } from '@domain/utils/normalizeString';
import { calcularCentroideGeoJSON } from "@services/locationService";
import { useAnaErro } from '@context/AnaErroContext';
import { useAnaDados } from '@context/AnaDadosContext';

export default function CidadesTopCard({ titulo, tipo = "focos", onCidadeClick, limitesGeoJson }) {
  const isFogo = titulo.includes('FOCOS');
  const { mediasPontos, loading: loadingAna, erro: erroAna } = useAnaDados();
  const [mostrarTodas, setMostrarTodas] = useState(false);

  // Para FIRMS, use o hook e serviço antigo
  const { cidades, isLoading, erro: erroLocal } = useCidades(tipo);

  // Para chuva, extraia do contexto ANA
  let cidadesChuva = [];
  if (tipo === "chuva" && mediasPontos && mediasPontos.length > 0) {
    const ultimo = mediasPontos[mediasPontos.length - 1];
    // o backend coloca o detalhamento no campo `municipios` do último dia
    const municipios = ultimo?.municipios || {};
    cidadesChuva = Object.entries(municipios)
      .map(([municipio, info]) => ({
        municipio,
        // usa a média municipal do dia e garante número
        media: Number(info?.media_municipio) || 0
      }))
      .filter(item => item.media > 0); // apenas com chuva > 0
  }

  // Para o card de chuva, use loading/erro do contexto ANA
  const erro = tipo === "chuva" ? erroAna : erroLocal;
  const loading = tipo === "chuva" ? loadingAna : isLoading;

  // Ordenação e paginação
  const cidadesFiltradas = tipo === "chuva"
    ? cidadesChuva
    : cidades;

  const exibidas = mostrarTodas
    ? [...cidadesFiltradas].sort((a, b) => b.media - a.media)
    : [...cidadesFiltradas].sort((a, b) => b.media - a.media).slice(0, 10);

  return (
    <div className={definirEstiloCard(isFogo)} role="region" aria-labelledby="cardTitle">
      <div id="cardTitle" className="titulo">{titulo}</div>
      <div className="conteudo" aria-live="polite">
        {loading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '250px'
          }}>
            <Loader />
          </div>
        ) : (
          renderizarConteudo(tipo, exibidas, onCidadeClick, erro, limitesGeoJson)
        )}
      </div>
      {!loading && cidadesFiltradas.length > 10 && (
        <BotaoToggle
          mostrar={mostrarTodas}
          total={cidadesFiltradas.length}
          onClick={() => setMostrarTodas(prev => !prev)}
        />
      )}
    </div>
  );
}

function useCidades(tipo) {
  const [cidades, setCidades] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);

    buscarCidadesComFocos()
      .then(setCidades)
      .catch(() => setCidades([]))
      .finally(() => setIsLoading(false));

  }, [tipo]);

  return { cidades, isLoading };
}

// ------------------------------
// Funções de Utilidade (Pure Functions)
// ------------------------------

function definirEstiloCard(isFogo) {
  return `cidades-top-card${isFogo ? ' cidades-top-card-fogo' : ''}`;
}

function renderizarConteudo(tipo, exibidas, onCidadeClick, erro, limitesGeoJson) {
  if (erro) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '250px'
      }}>
        <div style={{
          color: "#fff",
          background: "#e2600f7d",
          border: "1.5px solid #b28704",
          borderRadius: 4,
          padding: "2px 8px",
          fontSize: 13,
          fontWeight: 700,
          boxShadow: "0 1px 4px rgba(0,0,0,0.10)",
          letterSpacing: 0.2,
          textAlign: "center"
        }}>
          Erro ao buscar dados
        </div>
      </div>
    );
  }
  if (tipo === 'chuva') {
    return exibidas.length === 0 ? (
      <p style={{ color: '#fff', textAlign: 'center' }}>
        Nenhum município com chuva registrada
      </p>
    ) : (
      <ListaCidadesChuva cidades={exibidas} onCidadeClick={onCidadeClick} limitesGeoJson={limitesGeoJson} />
    );
  }
  return exibidas.length === 0 ? (
    <p style={{ color: '#fff', textAlign: 'center' }}>
      Nenhuma cidade com focos registrada
    </p>
  ) : (
    <ListaCidades cidades={exibidas} onCidadeClick={onCidadeClick} />
  );
}

function ListaCidades({ cidades, onCidadeClick }) {
  return cidades.length === 0 ? (
    <p style={{ color: '#fff', textAlign: 'center' }}>
      [Nenhuma cidade com focos]
    </p>
  ) : (
    <ul className="lista-cidades" role="list">
      {cidades.map((cidade, idx) => (
        <li
          key={idx}
          role="listitem"
          style={{ cursor: onCidadeClick ? 'pointer' : 'default' }}
          onClick={() => {
            if (onCidadeClick) onCidadeClick(cidade)
          }}
          tabIndex={0}
          onKeyDown={e => handleCidadeKeyDown(e, onCidadeClick, cidade)}
        >
          <strong>{idx + 1} - {cidade.cidade}</strong>: {cidade.totalFocos} focos
        </li>
      ))}
    </ul>
  );
}
void ListaCidades;

function ListaCidadesChuva({ cidades, onCidadeClick, limitesGeoJson }) {
  const cidadesComChuva = cidades.filter(cidade => Number(cidade.media) > 0);

  if (cidadesComChuva.length === 0) {
    return (
      <p style={{ color: '#fff', textAlign: 'center' }}>
        Nenhum município com chuva registrada (ListaCidadesChuva)
      </p>
    );
  }

  return (
    <ul className="lista-cidades" role="list">
      {cidadesComChuva.map((cidade, idx) => {
        let centroide = {};
        if (limitesGeoJson && limitesGeoJson.features) {
          const nomeNorm = normalizeString(cidade.municipio);
          const feature = limitesGeoJson.features.find(
            f => normalizeString(f.properties.name) === nomeNorm
          );
          if (feature) {
            centroide = calcularCentroideGeoJSON(feature);
          }
        }
        return (
          <li
            key={idx}
            role="listitem"
            style={{ cursor: onCidadeClick ? 'pointer' : 'default' }}
            onClick={() =>
              onCidadeClick &&
              onCidadeClick({
                ...cidade,
                cidade: cidade.municipio,
                ...centroide
              })
            }
            tabIndex={0}
            onKeyDown={e =>
              handleCidadeKeyDown(e, onCidadeClick, {
                ...cidade,
                cidade: cidade.municipio,
                ...centroide
              })
            }
          >
            <strong>{idx + 1} - {cidade.municipio}</strong>: {Number(cidade.media).toFixed(2)} mm
          </li>
        );
      })}
    </ul>
  );
}
void ListaCidadesChuva;


/**
 * Componente de toggle para controle de visualização
 * 
 * @param {Object} props - Propriedades do componente
 * @param {boolean} props.mostrar - Estado atual da exibição
 * @param {number} props.total - Total de itens disponíveis
 * @param {function} props.onClick - Handler de clique
 * 
 * @ux
 * - Oculto quando há menos de 10 itens
 * - Labels dinâmicos para melhor affordance
 * 
 * @todo Adicionar aria-labels para melhor acessibilidade
 */
function BotaoToggle({ mostrar, total, onClick }) {
  if (total <= 10) return null; // Limiar configurável

  return (
    <button
      className="toggle-cidades"
      onClick={onClick}
      aria-expanded={mostrar}
    >
      {obterLabelToggle(mostrar)}
    </button>
  );
}
void BotaoToggle;

/**
 * Gera label dinâmico para o botão de toggle
 * 
 * @param {boolean} mostrar - Estado atual da exibição
 * @returns {string} Texto localizado para controle
 * 
 * @i18n
 * - Strings hardcoded - considerar sistema de tradução futuro
 */
function obterLabelToggle(mostrar) {
  return mostrar ? 'Mostrar menos' : 'Ver todas';
}

/**
 * 🖱️ hasCidadeClickHandler
 *
 * Verifica se o parâmetro onCidadeClick é uma função válida (handler de clique).
 *
 * @param {Function} onCidadeClick - Função de callback para clique na cidade
 * @returns {boolean} True se for uma função, false caso contrário
 */
function hasCidadeClickHandler(onCidadeClick) {
  return typeof onCidadeClick === 'function';
}

/**
 * ⌨️ isKeyAcionavel
 *
 * Verifica se a tecla pressionada é "Enter" ou "Espaço" (teclas acionáveis para acessibilidade).
 *
 * @param {KeyboardEvent} e - Evento de teclado
 * @returns {boolean} True se for tecla Enter ou Espaço
 */
function isKeyAcionavel(e) {
  return e.key === 'Enter' || e.key === ' ';
}

/**
 * 🔄 shouldHandleCidadeKeyDown
 *
 * Determina se o evento de teclado na cidade deve ser tratado,
 * considerando a existência do handler e se a tecla é acionável.
 *
 * @param {KeyboardEvent} e - Evento de teclado
 * @param {Function} onCidadeClick - Handler de clique na cidade
 * @returns {boolean} True se deve tratar o evento
 */
function shouldHandleCidadeKeyDown(e, onCidadeClick) {
  return hasCidadeClickHandler(onCidadeClick) && isKeyAcionavel(e);
}

/**
 * 🏙️ handleCidadeKeyDown
 *
 * Handler principal para eventos de teclado em cidades.
 * Executa o callback de clique se as condições forem atendidas.
 *
 * @param {KeyboardEvent} e - Evento de teclado
 * @param {Function} onCidadeClick - Função callback para o clique
 * @param {string} cidade - Nome da cidade
 */
function handleCidadeKeyDown(e, onCidadeClick, cidade) {
  if (!shouldHandleCidadeKeyDown(e, onCidadeClick)) return;
  e.preventDefault();
  onCidadeClick(cidade);
}
