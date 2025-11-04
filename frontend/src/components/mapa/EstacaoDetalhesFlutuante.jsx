// @file src/components/mapa/EstacaoDetalhesFlutuante.jsx

import React, { useEffect, useState } from 'react';
import DraggablePortalPanel from '@components/layout/DraggablePortalPanel';
import HUDDinamico from '@components/layout/HUDDinamico';
import { useHUDManager } from '@hooks/useHUDManager';
import HistoricoGrafico from './HistoricoGrafico';
import GraficoCard from '@components/dashboard/GraficoCard'
void GraficoCard
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import Loader from '@components/common/Loader';
import { buscarHistoricoEstacao } from '@services/anaService';
import { useAnaDados } from '@context/AnaDadosContext';

// Componente para dados básicos da estação
function DadosBasicosEstacao({ estacao, onClose }) {
  return (
    <div className="estacao-dados-basicos">
      <h2>📍Ficha da estação</h2>
      <div className="estacao-info-card">
        <div className="info-grid">
          <div className="info-item">
            <span className="label">Altitude</span>
            <span className="value">{estacao.Altitude ? `${estacao.Altitude} m` : 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="label">Área de Drenagem</span>
            <span className="value">{estacao.Area_Drenagem ? `${estacao.Area_Drenagem} km²` : 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="label">Código</span>
            <span className="value">{estacao.codigo_Estacao || 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="label">Município</span>
            <span className="value">{estacao.Municipio_Nome ? estacao.Municipio_Nome.toLowerCase() : 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="label">Nome</span>
            <span className="value">{estacao.Estacao_Nome ? estacao.Estacao_Nome.toLowerCase() : 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="label">Rio</span>
            <span className="value">{estacao.Rio_Nome ? estacao.Rio_Nome.toLowerCase() : 'N/A'}</span>
          </div>
          {/* <div className="info-item">
            <span className="label">Status</span>
            <span className='value'>
              {estacao.status.toLowerCase() || 'N/A'}
            </span>
          </div> */}
          <div className="info-item">
            <span className="label">Tipo</span>
            <span className="value">{estacao.Tipo_Estacao ? estacao.Tipo_Estacao.toLowerCase() : 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="label">UF</span>
            <span className="value">{estacao.UF_Estacao || 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="label">Coordenadas</span>
            <span className="value">{estacao.Latitude || 'N/A'}, {estacao.Longitude || 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente para medições da estação
function MedicoesEstacao({ estacao, onClose }) {
  const { dados } = useAnaDados();

  // Busca a estação no contexto global (dados pode ser null no carregamento inicial)
  const estacaoContexto = Array.isArray(dados)
    ? dados.find(e => e.codigo_Estacao === estacao.codigo_Estacao)
    : null;

  // Histórico do contexto ou do próprio objeto
  const h = estacaoContexto?.historico || estacao?.historico || {};
  const itens = Array.isArray(h.items) ? h.items : [];
  const last = itens.length ? itens[itens.length - 1] : null;

  const formatarData = (dataString) => {
    if (!dataString) return 'N/A';
    return new Date(dataString).toLocaleString('pt-BR');
  };

  const formatarNumero = (valor, unidade, decimais = 2) => {
    if (typeof valor !== 'number' || isNaN(valor)) return 'N/A';
    return `${valor.toFixed(decimais)} ${unidade}`;
  };

  // Acumulado 24h: prioriza contexto, depois histórico individual
  const acumulado24h =
    Array.isArray(h.acumulado_intervalos_24h) && h.acumulado_intervalos_24h.length
      ? Number(h.acumulado_intervalos_24h[0].acumulado_chuva)
      : (typeof h.acumulado_intervalo_completo === 'number' ? h.acumulado_intervalo_completo : undefined);

  // Data de referência do acumulado de chuva (prioridade máxima)
  const dataReferenciaChuva = h.acumulado_intervalos_24h?.[0]?.data_hora_referencia ?? null;
  // Última medição: prioriza data de referência do acumulado, depois último item
  const medicaoMaisRecente = dataReferenciaChuva
    || (itens.length ? itens[itens.length - 1]?.Data_Hora_Medicao : null);

  const atualizacaoMaisRecente = itens.length
    ? itens.map(i => i.Data_Atualizacao).filter(Boolean).sort().at(-1)
    : null;

  // Métricas pontuais (nível e vazão) a partir do último item
  const nivelUltima = last?.Cota_Adotada != null ? Number(last.Cota_Adotada) : undefined;
  const vazaoUltima = last?.Vazao_Adotada != null ? Number(last.Vazao_Adotada) : undefined;

  // Qualidade básica da chuva (se tiver contador de registros na janela)
  const qtdReg = h.acumulado_intervalos_24h?.[0]?.qtd_registros ?? null;
  const qualidade = (() => {
    if (qtdReg == null) return { status: 'Indefinido', problemas: [] };
    return qtdReg >= 16
      ? { status: 'Bom', problemas: [] }
      : { status: 'Atenção', problemas: [{ severidade: 'Média', mensagem: `Cobertura baixa: ${qtdReg}/24 leituras nas últimas 24h.` }] };
  })();

  const dadosHidrologicos = {
    medicaoMaisRecente,
    atualizacaoMaisRecente,
    status: h.status || 'Indefinido',
    nivel: { ultima: nivelUltima },
    vazao: { ultima: vazaoUltima },
    chuva: {
      acumulada: Number.isFinite(acumulado24h) ? acumulado24h : undefined,
      qualidade
    }
  };
  const { nivel, vazao, chuva } = dadosHidrologicos;

  return (
    <div className="estacao-medicoes-detalhadas">
      <div className="medicoes-stack">
    {/* Card de Nível */}
    <div className="medicao-card nivel">
      <div className="medicao-content">
        <div className="medicao-text">
          <div className="medicao-header">
            <span className="medicao-icon">📈</span>
            <h4>Nível d'Água</h4>
          </div>
          <div className="medicao-info">
            Medição de altura da água
          </div>
        </div>
        <div className="medicao-valor">
          {formatarNumero(nivel?.ultima, 'cm')}
        </div>
      </div>
    </div>

    {/* Card de Vazão */}
    <div className="medicao-card vazao">
      <div className="medicao-content">
        <div className="medicao-text">
          <div className="medicao-header">
            <span className="medicao-icon">💦</span>
            <h4>Vazão</h4>
          </div>
          <div className="medicao-info">
            Volume de água por segundo
          </div>
        </div>
        <div className="medicao-valor">
          {formatarNumero(vazao?.ultima, 'm³/s')}
        </div>
      </div>
    </div>

    {/* Card de Chuva Acumulada */}
    <div className="medicao-card chuva">
      <div className="medicao-content">
        <div className="medicao-text">
          <div className="medicao-header">
            <span className="medicao-icon">🌧️</span>
            <h4>Chuva Acumulada</h4>
          </div>
          <div className="medicao-info">
            Últimas 24 horas
          </div>
        </div>
        <div className="medicao-valor">
          {formatarNumero(chuva?.acumulada, 'mm')}
          {/* {chuva?.qualidade?.status !== 'Bom' && (
            <div className={`medicao-alerta status-${chuva.qualidade.status?.toLowerCase()}`}>
              ⚠️ Qualidade: {chuva.qualidade.status}
            </div>
          )} */}
        </div>
      </div>
    </div>
  </div>

      {/* Informações de Data */}
      <div className="timestamp-container">
        <div className="timestamp-grid">
          <div className="timestamp-card">
            <div className="timestamp-icon">📅</div>
            <div className="timestamp-content">
              <div className="timestamp-label">Última Medição</div>
              <div className="timestamp-value">
                {formatarData(medicaoMaisRecente)}
              </div>
            </div>
          </div>

          <div className="timestamp-card">
            <div className="timestamp-icon">🔄</div>
            <div className="timestamp-content">
              <div className="timestamp-label">Última Atualização</div>
              <div className="timestamp-value">
                {formatarData(atualizacaoMaisRecente)}
              </div>
            </div>
          </div>

          <div className="timestamp-card">
            <div className="timestamp-icon">⚡</div>
            <div className="timestamp-content">
              <div className="timestamp-label">Status</div>
              <div className={`timestamp-value status-${dadosHidrologicos?.status_estacao?.toLowerCase() || 'indefinido'}`}>
                {h.status_estacao || 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Card de Problemas em linha separada */}
        {chuva?.qualidade?.status !== 'Bom' && chuva?.qualidade?.problemas?.length > 0 && (
          <div className="qualidade-alerta-card">
            <div className="timestamp-card qualidade-alerta">
              <div className="timestamp-icon">🚨</div>
              <div className="timestamp-content">
                <div className="timestamp-label">Problemas Detectados</div>
                <ul className="problemas-lista">
                  {chuva.qualidade.problemas.map((p, idx) => (
                    <li key={idx}>
                      <strong>{p.severidade}:</strong> {p.mensagem}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente principal usando o sistema HUD
export default function EstacaoAnaDetalhesFlutuante({ estacao, onFechar, leafletMap }) {
  const [abasVisiveis, setAbasVisiveis] = useState([]);
  const [abaAtivaId, setAbaAtivaId] = useState(null);
  const [historicoVazio, setHistoricoVazio] = useState(true); // Estado para verificar se o histórico está vazio

  useEffect(() => {
    const criarAbas = () => {
      const abas = [];
      abas.push({
        id: `estacao-info-${estacao.codigo_Estacao}`,
        titulo: `📍 ${estacao.codigo_Estacao}`,
        conteudo: <DadosBasicosEstacao estacao={estacao} />,
      });

      const temMedicoes =
        estacao.dadosHidrologicos?.nivel?.ultima !== null ||
        estacao.dadosHidrologicos?.vazao?.ultima !== null ||
        estacao.dadosHidrologicos?.chuva?.acumulada !== null;

      if (temMedicoes) {
        abas.push({
          id: `estacao-medicoes-${estacao.codigo_Estacao}`,
          titulo: `📊 Medições`,
          conteudo: <MedicoesEstacao estacao={estacao} />,
        });
      }

      if (estacao.codigo_Estacao) {
        abas.push({
          id: `estacao-dados-${estacao.codigo_Estacao}`,
          titulo: `🔍 Histórico`,
          conteudo: (
            <AbaHistorico
              estacao={estacao}
              onHistoricoVazio={setHistoricoVazio} // Atualiza o estado do histórico
            />
          ),
        });
      }

      return abas;
    };

    const novasAbas = criarAbas();
    setAbasVisiveis(novasAbas);
    setAbaAtivaId(novasAbas[0]?.id || null);
  }, [estacao]);

  const handleFecharAba = (id) => {
    const novasAbas = abasVisiveis.filter(aba => aba.id !== id);
    if (novasAbas.length === 0) {
      onFechar();
      return;
    }
    setAbasVisiveis(novasAbas);
    if (abaAtivaId === id) {
      const idx = abasVisiveis.findIndex(aba => aba.id === id);
      const novaAbaAtiva = novasAbas[idx - 1] || novasAbas[0];
      setAbaAtivaId(novaAbaAtiva.id);
    }
  };

  const handleFecharHUD = () => {
    onFechar();
  };

  if (abasVisiveis.length === 0) return null;

  const historicoAtivo = abaAtivaId && abaAtivaId.startsWith('estacao-dados-') && !historicoVazio;
  const panelClass = `estacao-ana-hud${historicoAtivo ? ' historico-ativo' : ''}`;

  return (
    <DraggablePortalPanel
      leafletMap={leafletMap}
      onClose={handleFecharHUD}
      className={panelClass}
      initialPosition={{ x: 120, y: 80 }}
    >
      <HUDDinamico
        abas={abasVisiveis}
        abaAtivaId={abaAtivaId}
        onAbaChange={setAbaAtivaId}
        onClose={handleFecharAba}
      />
    </DraggablePortalPanel>
  );
}


function AbaHistorico({ estacao, onHistoricoVazio }) {
  const [tipo, setTipo] = useState('chuva'); // Tipo inicial
  const [intervalo, setIntervalo] = useState('HORA_24'); // Intervalo inicial
  const [dados, setDados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  // Mapeamento de tipos para labels e unidades
  const tipoConfig = {
    chuva: { label: 'Chuva', unidade: 'mm' },
    nivel: { label: 'Nível', unidade: 'cm' },
    vazao: { label: 'Vazão', unidade: 'm³/s' }
  };

  // Configuração dos intervalos disponíveis
  const intervalosConfig = {
    minutos: [
      { valor: 'MINUTO_5', label: '5 minutos' },
      { valor: 'MINUTO_10', label: '10 minutos' },
      { valor: 'MINUTO_15', label: '15 minutos' },
      { valor: 'MINUTO_30', label: '30 minutos' }
    ],
    horas: Array.from({ length: 24 }, (_, i) => {
      const hora = i + 1;
      return {
        valor: `HORA_${hora}`,
        label: `${hora} ${hora === 1 ? 'hora' : 'horas'}`
      };
    }),
    dias: [
      { valor: 'DIAS_2', label: '2 dias' },
      { valor: 'DIAS_7', label: '7 dias' },
      { valor: 'DIAS_14', label: '14 dias' },
      { valor: 'DIAS_21', label: '21 dias' },
      { valor: 'DIAS_30', label: '30 dias' }
    ]
  };

  // util: "YYYY-MM-DD HH:mm:ss.0" -> "YYYY-MM-DDTHH:mm:ss"
  const toIsoLike = (s) => (s ? String(s).replace(' ', 'T').replace(/\.0$/, '') : s);

  // converte itens do backend para o formato do gráfico
  const mapItems = (items = []) =>
    items.map(it => ({
      dataHoraMedicao: toIsoLike(it.Data_Hora_Medicao),
      chuva: it.Chuva_Adotada == null ? null : Number(it.Chuva_Adotada),
      nivel: it.Cota_Adotada == null ? null : Number(it.Cota_Adotada),
      vazao: it.Vazao_Adotada == null ? null : Number(it.Vazao_Adotada),
    })).filter(x => x.dataHoraMedicao);

  // Busca os dados do backend ao alterar o intervalo
  useEffect(() => {
    const carregarHistorico = async () => {
      if (!estacao?.codigo_Estacao) return;

      setLoading(true);
      setErro(null);

      try {
        const dataAtual = new Date().toISOString().split('T')[0]; // Data atual no formato 'YYYY-MM-DD'
        const historico = await buscarHistoricoEstacao(
          estacao.codigo_Estacao,
          'DATA_LEITURA',
          dataAtual,
          intervalo
        );

        const items = Array.isArray(historico?.items) ? historico.items : [];
        const base = mapItems(items).sort((a, b) =>
          new Date(a.dataHoraMedicao) - new Date(b.dataHoraMedicao)
        );
        setDados(base);

        if (!base.length) onHistoricoVazio?.();
      } catch (e) {
        console.error('[AbaHistorico] Erro ao buscar histórico:', e);
        setErro('Não foi possível carregar os dados históricos.');
        setDados([]);
        onHistoricoVazio?.();
      } finally {
        setLoading(false);
      }
    };

    carregarHistorico();
  }, [estacao, intervalo]);

  return (
    <div className="aba-historico-container">
      <div className="historico-controls-inline">
        <div className="select-group inline">
          <label>Tipo de Medição:</label>
          <select value={tipo} onChange={e => setTipo(e.target.value)} className="control-select small">
            {Object.entries(tipoConfig).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div className="select-group inline">
          <label>Intervalo:</label>
          <select value={intervalo} onChange={e => setIntervalo(e.target.value)} className="control-select small">
            <optgroup label="Por Minuto">
              {intervalosConfig.minutos.map(({ valor, label }) => (
                <option key={valor} value={valor}>{label}</option>
              ))}
            </optgroup>
            <optgroup label="Por Hora">
              {intervalosConfig.horas.map(({ valor, label }) => (
                <option key={valor} value={valor}>{label}</option>
              ))}
            </optgroup>
            <optgroup label="Por Dia">
              {intervalosConfig.dias.map(({ valor, label }) => (
                <option key={valor} value={valor}>{label}</option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      {erro && (
        <div className="alerta-erro" style={{
          color: '#fff',
          background: '#d32f2f',
          padding: '0.8em 1em',
          borderRadius: '6px',
          margin: '1em 0',
          fontWeight: 500
        }}>
          {erro}
        </div>
      )}

      {loading ? (
        <div
          className="loading-indicator"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.8rem',
            padding: '1rem',
            minHeight: '160px' // garante altura no card
          }}
        >
          <span className="loader loader-grande" aria-label="Carregando..." role="status" />
        </div>
      ) : (
        <GraficoCard tipo={tipo}>
          <HistoricoGrafico dados={dados} tipo={tipo} intervalo={intervalo} />
        </GraficoCard>
      )}
    </div>
  );
}