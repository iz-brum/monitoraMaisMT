import React from 'react';
import { useMemo } from 'react';
import { useEffect, useState } from 'react';
import Loader from '@components/common/Loader';
import { useHUDManager } from '@hooks/useHUDManager';
import HUDDinamico from '@components/layout/HUDDinamico';
import DraggablePortalPanel from '@components/layout/DraggablePortalPanel';
import { buscarEnderecoTraduzido } from './SearchControl';

export default function RotasFlutuante({
    routeInfo,
    allRoutes,
    activeRouteIndex,
    handleRouteChange,
    onClearRoute,
    waypoints,
}) {
    const [loading, setLoading] = useState(true); // Estado de carregamento
    const [enderecos, setEnderecos] = useState({
        origem: '',
        paradas: [],
        destino: ''
    });

    useEffect(() => {
        if (waypoints && waypoints.length >= 2) {
            // Mostra imediatamente as coordenadas como fallback
            setEnderecos({
                origem: `${waypoints[0].lat.toFixed(5)}, ${waypoints[0].lng.toFixed(5)}`,
                destino: `${waypoints[waypoints.length - 1].lat.toFixed(5)}, ${waypoints[waypoints.length - 1].lng.toFixed(5)}`
            });
            setLoading(true); // Inicia o carregamento

            const fetchEnderecos = async () => {
                try {
                    const origem = await buscarEnderecoTraduzido(waypoints[0].lat, waypoints[0].lng);
                    const destino = await buscarEnderecoTraduzido(waypoints[waypoints.length - 1].lat, waypoints[waypoints.length - 1].lng);

                    console.log('Origem:', origem);
                    console.log('Destino:', destino);

                    const formatarEndereco = (end) => {
                        if (!end) return '';
                        return [
                            end.Rua,
                            end.Bairro,
                            end.Cidade
                        ].filter(Boolean).join(', ');
                    };

                    setEnderecos((prev) => ({
                        origem: formatarEndereco(origem) || prev.origem,
                        destino: formatarEndereco(destino) || prev.destino,
                    }));

                } catch (error) {
                    console.error('Erro ao buscar endereços:', error);
                } finally {
                    setLoading(false); // Finaliza o carregamento
                }
            };

            fetchEnderecos();
        }
    }, [waypoints]);


    const [abasVisiveis, setAbasVisiveis] = useState([]);
    const [abaAtivaId, setAbaAtivaId] = useState('infoRota');

    useEffect(() => {
        const generateGoogleMapsLink = () => {
            if (!waypoints || waypoints.length < 2) {
                console.warn('Waypoints insuficientes para gerar rota.');
                return '#';
            }

            const coords = waypoints.map(({ lat, lng }) => `${lat},${lng}`);
            return `https://www.google.com/maps/dir/${coords.join('/')}`;
        };

        const novaAbaInfo = {
            id: 'infoRota',
            key: 'infoRota',
            titulo: 'Informações da Rota',
            render: () => (
                <div className="route-info-container">
                    <div className="transport-mode">
                        <div className="transport-icon">🚗</div>
                        <span className="transport-label">driving-car</span>
                    </div>

                    <div className="route-metrics">
                        <div className="metric-card">
                            <div className="metric-icon">📏</div>
                            <div>
                                <div className="metric-label">Distância</div>
                                <div className="metric-value">{routeInfo?.distance || 'N/A'} km</div>
                            </div>
                        </div>

                        <div className="metric-card">
                            <div className="metric-icon">⏱️</div>
                            <div>
                                <div className="metric-label">Tempo estimado</div>
                                <div className="metric-value">{routeInfo?.time || 'N/A'} min</div>
                            </div>
                        </div>
                    </div>

                    {waypoints?.length >= 2 && (
                        <div className="waypoints-info">
                            {loading ? (
                                <div className="loading-container">
                                    <Loader />
                                </div>
                            ) : (
                                <>
                                    <div className="waypoint-card origin">
                                        <div className="waypoint-icon">📍</div>
                                        <div>
                                            <div className="waypoint-label">Origem</div>
                                            <div className="waypoint-address">{enderecos.origem || 'NÃO ENCONTRADO'}</div>
                                        </div>
                                    </div>

                                    <div className="waypoint-card destination">
                                        <div className="waypoint-icon">🏁</div>
                                        <div>
                                            <div className="waypoint-label">Destino</div>
                                            <div className="waypoint-address">{enderecos.destino || 'NÃO ENCONTRADO'}</div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                    )}
                    <div className="route-actions">
                        <button
                            className="route-btn"
                            onClick={() => window.open(generateGoogleMapsLink(), '_blank')}
                            title="Abrir rota no Google Maps"
                            style={{ marginRight: 8 }}
                        >
                            🔗 Abrir no Maps
                        </button>

                        <button
                            className="route-btn"
                            onClick={() => {
                                const url = generateGoogleMapsLink();
                                navigator.clipboard.writeText(url);
                            }}
                            title="Copiar link da rota"
                        >
                            📋 Copiar link
                        </button>
                    </div>

                </div>
            ),
        };

        const novaAbaInstrucoes = {
            id: 'instrucoes',
            key: 'instrucoes',
            titulo: 'Instruções',
            conteudo: (
                <div className="instructions-container">
                    {allRoutes[activeRouteIndex]?.segments.map((segment, segmentIndex) => (
                        <div key={segmentIndex} className="route-segment">
                            {segment.steps.map((step, stepIndex) => {
                                const stepType = getStepType(step.instruction);
                                return (
                                    <div
                                        key={stepIndex}
                                        className="navigation-step"
                                        data-type={stepType}
                                    >
                                        <div className="step-icon">
                                            {getStepIcon(step.instruction)}
                                        </div>
                                        <div className="step-content">
                                            <div className="step-instruction">
                                                {step.instruction}
                                            </div>
                                            <div className="step-metrics">
                                                <span className="metric distance">
                                                    📏 {step.distance} m
                                                </span>
                                                <span className="metric duration">
                                                    ⏱️ {Math.round(step.duration)} s
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )
        };

        // Função auxiliar para classificar o tipo de passo
        function getStepType(instruction) {
            const lowerInstruction = instruction.toLowerCase();

            // 1º - Estados especiais (prioridade máxima)
            if (lowerInstruction.includes('chegar')) return 'arrival';
            if (lowerInstruction.includes('partida')) return 'departure';

            // 2º - Direções básicas e manobras especiais
            if (lowerInstruction.includes('esquerda')) return 'left';
            if (lowerInstruction.includes('direita')) return 'right';
            if (lowerInstruction.includes('seguir') || lowerInstruction.includes('frente')) return 'straight';
            if (lowerInstruction.includes('retornar')) return 'u-turn';  
            if (lowerInstruction.includes('rotatória')) return 'roundabout';

            // 3º - Direções cardinais intermediárias
            if (lowerInstruction.includes('noroeste')) return 'northwest';
            if (lowerInstruction.includes('nordeste')) return 'northeast';
            if (lowerInstruction.includes('sudoeste')) return 'southwest';
            if (lowerInstruction.includes('sudeste')) return 'southeast';

            return 'default';
        }

        // Função para determinar ícones com base na instrução
        function getStepIcon(instruction) {
            const type = getStepType(instruction);

            const icons = {
                'left': '⬅️',
                'right': '➡️',
                'straight': '⬆️',
                'northwest': '↖️',
                'northeast': '↗️',
                'southwest': '↙️',
                'southeast': '↘️',
                'u-turn': '↩️',
                'roundabout': '🔄',
                'arrival': '🏁',
                'departure': '🚀',
                'default': '📍'
            };

            return icons[type] || icons['default'];
        }

        const novaAbaAlternativas = {
            id: 'rotasAlternativas',
            key: 'rotasAlternativas',
            titulo: 'Rotas Alternativas',
            conteudo: (
                <div>
                    {allRoutes.length > 1 ? (
                        <div className="route-alternatives">
                            <h4>Rotas Alternativas:</h4>
                            <div className="route-buttons">
                                {allRoutes.map((_, index) => (
                                    <button
                                        key={index}
                                        className={`route-btn ${index === activeRouteIndex ? 'active' : ''}`}
                                        onClick={() => handleRouteChange(index)}
                                        style={{
                                            margin: '5px',
                                            padding: '5px',
                                            border: '1px solid #ccc',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            backgroundColor: index === activeRouteIndex ? '#007bff' : '#fff',
                                            color: index === activeRouteIndex ? '#fff' : '#000',
                                        }}
                                    >
                                        Rota {index + 1}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : <p>Não há rotas alternativas disponíveis.</p>}
                </div>
            )
        };

        setAbasVisiveis([novaAbaInfo, novaAbaInstrucoes, novaAbaAlternativas]);
    }, [enderecos, loading, allRoutes, activeRouteIndex, routeInfo]);

    return (
        <DraggablePortalPanel
            className="hud-rotas"
            titulo={`Informações da Rota ${routeInfo.currentRoute}/${routeInfo.totalRoutes}`}
            onClose={onClearRoute}
            style={{
                minWidth: 340,
                minHeight: 200,
                backgroundColor: '#fff',
                borderRadius: '8px',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
            }}
        >
            <HUDDinamico
                abas={abasVisiveis}
                abaAtivaId={abaAtivaId}
                onAbaChange={(id) => {
                    console.log(`Trocar aba para: ${id}`);
                    setAbaAtivaId(id);
                }}
                onClose={(id) => {
                    setAbasVisiveis((prev) => prev.filter((a) => a.id !== id));
                }}
            />
        </DraggablePortalPanel>
    );
}