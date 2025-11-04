// frontend/src/components/dashboard/DashboardIndicadores.jsx

'use client'

import React, { useEffect, useState } from 'react'
import IndicadorMetric from '@components/dashboard/IndicadorMetric'
import Loader from '@components/common/Loader'
import { fetchDados } from '@services/metricsService'
import { useAnaErro } from '@context/AnaErroContext'
import { useAnaDados } from '@context/AnaDadosContext';
import IntensidadeFogoIndicador from './IntensidadeFogoIndicador';
import '@styles/intensidadeFogo.css';

// ==================== CONFIGURAÇÕES SEPARADAS ====================

// HIDRO: 2 colunas x 3 linhas (esquerda)
const configHidro = [
    [
        { titulo: "Total de Estações Operando", campo: "estacoesOperando" },
        { titulo: "Total de Municípios Monitorados", campo: "cidadesMonitoradas" }
    ],
    [
        { titulo: "Municípios Sem Registro de Chuva", campo: "cidadesSemChuva" },
        { titulo: "Municípios Com Registro de Chuva", campo: "cidadesComChuva" }
    ],
    [
        { titulo: "Estacoes Com Dados De Chuva", campo: "estacoesComDadoChuva" },
        { titulo: "Média Pluviométrica (mm)", campo: "mediaChuvaGeral" }
    ]
]

// FOGO: 2 colunas x 3 linhas (direita)
const configFogo = [
    [
        { titulo: "Focos de Calor Detectados", campo: "totalFocos" },
        { titulo: "Média Fire Radiative Power (MW)", campo: "frpMedio" }
    ],
    [
        { titulo: "Temperatura Média (Kelvin)", campo: "temperaturaMedia" },
        { titulo: "Horário com Maior Detecção", campo: "horarioDeteccaoPico" }
    ],
    [
        { titulo: "Regional Com Mais Focos", campo: "CRBMComMaisFocos" },
        { titulo: "Intensidade dos Focos de Calor", campo: "indicadorFogo" }
    ]
]

// ==================== HOOKS E UTILITÁRIOS ====================

function useIndicadoresAtuais() {
    const [dadosFogo, setDadosFogo] = useState(null)
    useEffect(() => {
        fetchDados(setDadosFogo)

        const interval = setInterval(() => fetchDados(setDadosFogo), 30 * 60 * 1000)
        return () => clearInterval(interval)
    }, [])
    return { dadosFogo }
}

function valorEhNulo(valor) { return valor == null }
function deveFormatarComoDecimal(valor, arredondar) { return arredondar && typeof valor === 'number' }
function deveArredondarValor(titulo) { return titulo !== 'Focos de Calor Detectados' }
function ehNulo(valor) { return valorEhNulo(valor) }
function ehDecimal(valor, arredondar) { return deveFormatarComoDecimal(valor, arredondar) }

const tiposFormatacao = [
    { condicao: ehNulo, tipo: 'nulo' },
    { condicao: ehDecimal, tipo: 'decimal' }
]
function obterTipoFormatacao(valor, arredondar) {
    const regra = tiposFormatacao.find(r => r.condicao(valor, arredondar))
    return regra ? regra.tipo : 'padrao'
}
const formatadores = {
    nulo: () => <Loader />,
    decimal: (valor) => valor.toFixed(2),
    padrao: (valor) => valor
}
function formatarValor(atual, arredondar) {
    const tipo = obterTipoFormatacao(atual, arredondar)
    return formatadores[tipo](atual)
}

// ==================== RENDERIZAÇÃO DOS CARTÕES ====================

function renderHidroCartao({ titulo, campo, imagem, valor }, idx, dadosHidro, erroAna) {
    let valorFinal
    if (erroAna) {
        valorFinal = (
            <span style={{
                color: "#fff",
                background: "#eb5e07c6",
                border: "1.5px solid #ae0606ff",
                borderRadius: 4,
                padding: "1px 7px",
                fontSize: 13,
                fontWeight: 700,
                display: "inline-block",
                boxShadow: "0 1px 4px rgba(0,0,0,0.10)",
                letterSpacing: 0.2
            }}>
                Erro ao buscar dados
            </span>
        )
    } else if (campo) {
        valorFinal = dadosHidro?.indicadores?.[campo]
        if (valorFinal === undefined || valorFinal === null) {
            valorFinal = <Loader />
        } else if (typeof valorFinal === 'number') {
            valorFinal = valorFinal % 1 === 0 ? valorFinal : valorFinal.toFixed(2)
        }
    } else {
        valorFinal = valor
    }
    return (
        <IndicadorMetric
            key={`hidro-${idx}`}
            cor="blue"
            titulo={titulo}
            valor={valorFinal}
            imagem={imagem}
        />
    )
}

function rangeHoraPico(horarioPico) {
    if (!horarioPico) return ""
    const horaStart = horarioPico
    const hora = parseInt(horarioPico.split(":")[0], 10)
    const horaEnd = String((hora + 1) % 24).padStart(2, "0") + ":00"
    return `${horaStart}h às ${horaEnd}h`
}
function getPicoTexto(hora, quantidade) { return `${rangeHoraPico(hora)} (${quantidade} focos)` }
function getPicoRangeTexto(hora, quantidade) {
    if (!hora || quantidade === undefined) return <Loader />
    return getPicoTexto(hora, quantidade)
}
function extrairHorarioPico(dados) { return dados ? dados.horarioPico : undefined }
function extrairQuantidadeHorarioPico(dados) { return dados ? dados.quantidadeHorarioPico : undefined }
function getPicoValorAtual(dados) {
    const horarioPico = extrairHorarioPico(dados)
    const quantidadeHorarioPico = extrairQuantidadeHorarioPico(dados)
    return getPicoRangeTexto(horarioPico, quantidadeHorarioPico)
}
function getCrbmTexto(dados) {
    const crbm = dados?.CRBMComMaisFocos
    if (crbm === 'N/A') return 'N/A'
    if (!Array.isArray(crbm) || crbm.length === 0) return <Loader />
    const { comandoRegional, totalFocos } = crbm[0]
    return `${comandoRegional} (${totalFocos} focos)`
}

function renderFogoCartao({ titulo, icone, campo }, dadosAtuais, idx) {
    let valorAtual = dadosAtuais ? dadosAtuais[campo] : undefined
    let valorFormatado
    if (campo === "horarioDeteccaoPico") {
        valorFormatado = getPicoValorAtual(dadosAtuais)
    } else if (campo === "CRBMComMaisFocos") {
        valorFormatado = getCrbmTexto(dadosAtuais)
    } else if (campo === "indicadorFogo") {
        valorFormatado = <IntensidadeFogoIndicador focosHoje={dadosAtuais?.totalFocos} />
    } else if (campo) {
        const arredondar = deveArredondarValor(titulo)
        valorFormatado = formatarValor(valorAtual, arredondar)
    } else {
        valorFormatado = valorAtual
    }
    return (
        <IndicadorMetric
            key={`fogo-${idx}`}
            cor="red"
            titulo={titulo}
            imagem={icone}
            valor={valorFormatado}
        />
    )
}

// ==================== GRID FINAL ====================

function renderDashboardGrid(configHidro, configFogo, dadosFogo, dadosHidro, erroAna) {
    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 2fr',
            gap: '0.15rem',
            height: '100%',
            minHeight: 0
        }}>
            {/* HIDRO */}
            <div style={{
                display: 'grid',
                gridTemplateRows: 'repeat(3, 1fr)',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.15rem',
                minHeight: 0
            }}>
                {configHidro.flatMap((linha, i) =>
                    linha.map((cartao, j) =>
                        <div key={`hidro-${i}${j}`} style={{ minHeight: 0 }}>
                            {renderHidroCartao(cartao, `${i}${j}`, dadosHidro, erroAna)}
                        </div>
                    )
                )}
            </div>
            {/* FOGO */}
            <div style={{
                display: 'grid',
                gridTemplateRows: 'repeat(3, 1fr)',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.15rem',
                minHeight: 0
            }}>
                {configFogo.flatMap((linha, i) =>
                    linha.map((cartao, j) =>
                        <div key={`fogo-${i}${j}`} style={{ minHeight: 0 }}>
                            {renderFogoCartao(cartao, dadosFogo, `${i}${j}`)}
                        </div>
                    )
                )}
            </div>
        </div>
    )
}

export default function DashboardIndicadores() {
    const { erroAna } = useAnaErro();
    const { dadosFogo } = useIndicadoresAtuais();

    // Agora vem tudo do contexto:
    const { dashboard } = useAnaDados();

    // Mapeamento dos cards HIDRO a partir da rota atual (/medias-diarias)
    const indicadores = dashboard
        ? {
            estacoesOperando: dashboard.dashboard_resumo?.total_estacoes_verificadas,
            cidadesMonitoradas: dashboard.dashboard_resumo?.total_municipios_monitorados,
            cidadesSemChuva: dashboard.dashboard_resumo?.total_municipios_sem_registro_de_chuva,
            cidadesComChuva: dashboard.dashboard_resumo?.total_municipios_com_registro_de_chuva,
            estacoesComDadoChuva: `${dashboard.dashboard_resumo?.porcentagem_estacoes_com_dados_chuva ?? 0}%`,
            mediaChuvaGeral: (() => {
                const arr = dashboard.series || [];
                if (!arr.length) return undefined;
                const last = arr[arr.length - 1];
                return typeof last.media === 'number' ? last.media : undefined;
            })()
        }
        : {};

    return renderDashboardGrid(configHidro, configFogo, dadosFogo, { indicadores }, erroAna);
}