import React, { useEffect, useState } from 'react';
import { buscarDadosSemanais } from '@services/weeklyService';
import Loader from '@components/common/Loader';

const niveis = {
    BAIXA: { 
        cor: '#FFB74D', 
        tamanho: 1,
        pulsacao: '1.5s'
    },
    MEDIA: { 
        cor: '#FF9800', 
        tamanho: 2,
        pulsacao: '1.2s'
    },
    ALTA: { 
        cor: '#F57C00', 
        tamanho: 3,
        pulsacao: '0.9s'
    },
    CRITICA: { 
        cor: '#E65100', 
        tamanho: 4,
        pulsacao: '0.6s'
    }
};

function determinarIntensidade(focosHoje, mediaSemanal) {
    if (!focosHoje || !mediaSemanal) return 'BAIXA';
    const razao = focosHoje / mediaSemanal;
    if (razao <= 0.5) return 'BAIXA';
    if (razao <= 1.0) return 'MEDIA';
    if (razao <= 2.0) return 'ALTA';
    return 'CRITICA';
}

// Componente de Indicador Compacto
const IndicadorFogo = ({ nivel }) => {
    const { cor, tamanho, pulsacao } = niveis[nivel];

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '25px',
            height: '20px'
        }}>
            {/* Ícone de chama compacto */}
            <div style={{
                position: 'relative',
                width: '16px',
                height: '16px'
            }}>
                {/* Chama principal */}
                <div style={{
                    width: '100%',
                    height: '100%',
                    background: cor,
                    borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                    animation: `pulsar ${pulsacao} infinite ease-in-out`,
                    boxShadow: `0 0 4px ${cor}, 0 0 8px ${cor}80`,
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* Brilho interno */}
                    <div style={{
                        position: 'absolute',
                        top: '2px',
                        left: '4px',
                        width: '4px',
                        height: '4px',
                        background: '#FFFFFF80',
                        borderRadius: '50%'
                    }}></div>
                </div>
                
                {/* Mini faíscas */}
                <div style={{
                    position: 'absolute',
                    top: '-1px',
                    right: '2px',
                    width: '3px',
                    height: '3px',
                    background: cor,
                    borderRadius: '50%',
                    animation: `faisca ${pulsacao} infinite`,
                    opacity: 0.7
                }}></div>
            </div>

            {/* Pontinhos indicadores */}
            <div style={{
                display: 'flex',
                gap: '2px',
                alignItems: 'center'
            }}>
                {[1, 2, 3, 4].map((item) => (
                    <div
                        key={item}
                        style={{
                            width: '8px',
                            height: '8px',
                            background: item <= tamanho ? cor : `${cor}40`,
                            borderRadius: '50%',
                            transition: 'all 0.3s ease',
                            animation: item <= tamanho ? `pontoPiscar ${pulsacao} infinite` : 'none',
                            animationDelay: item <= tamanho ? `${item * 0.1}s` : '0s'
                        }}
                    />
                ))}
            </div>

            <style>{`
                @keyframes pulsar {
                    0% { 
                        transform: scale(1);
                        opacity: 0.8;
                    }
                    50% { 
                        transform: scale(1.1);
                        opacity: 1;
                    }
                    100% { 
                        transform: scale(1);
                        opacity: 0.8;
                    }
                }

                @keyframes faisca {
                    0%, 100% { 
                        opacity: 0;
                        transform: translateY(0) scale(0.5);
                    }
                    50% { 
                        opacity: 0.8;
                        transform: translateY(-2px) scale(1);
                    }
                }

                @keyframes pontoPiscar {
                    0%, 100% { 
                        opacity: 0.6;
                        transform: scale(1);
                    }
                    50% { 
                        opacity: 1;
                        transform: scale(1.2);
                    }
                }
            `}</style>
        </div>
    );
};

function IntensidadeFogo({ focosHoje }) {
    const [dadosSemanais, setDadosSemanais] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const carregarDados = async () => {
            try {
                const dados = await buscarDadosSemanais();
                setDadosSemanais(dados);
            } catch (error) {
                console.error('Erro ao carregar dados:', error);
            } finally {
                setLoading(false);
            }
        };
        carregarDados();
    }, []);

    if (loading) return <Loader />;

    const mediaSemanal = dadosSemanais.length > 1
        ? dadosSemanais.slice(0, -1).reduce((acc, dia) => acc + dia.focos, 0) / (dadosSemanais.length - 1)
        : focosHoje || 1;

    const intensidade = determinarIntensidade(focosHoje, mediaSemanal);
    const { cor } = niveis[intensidade];

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            height: '25px',
            maxWidth: '200px',
            boxSizing: 'border-box'
        }}>

            {/* Texto da intensidade */}
            <span style={{
                color: 'white',
                fontWeight: 'bold',
                fontSize: '0.85em',
                textShadow: `0 0 4px ${cor}80`,
                minWidth: '70px',
                textAlign: 'center'
            }}>
                {intensidade}
            </span>
                {/* Indicador visual */}
                <IndicadorFogo nivel={intensidade} />
        </div>
    );
}

export default IntensidadeFogo;