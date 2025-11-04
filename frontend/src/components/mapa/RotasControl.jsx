import { useEffect, useState } from 'react';
import L from 'leaflet';
import { useMap } from 'react-leaflet';
import polyline from '@mapbox/polyline'; // Importa a biblioteca para decodificar polylines
import { MAPA_CONFIG } from '@domain/config/mapaConfig';
import RotasFlutuante from './RotasFlutuante'; // Importa o componente RotasFlutuante

export default function RotasControl({ waypoints, onRouteCalculated }) {
    const map = useMap();
    const [routeInfo, setRouteInfo] = useState(null);
    const [routeLayer, setRouteLayer] = useState(null);
    const [markers, setMarkers] = useState([]);
    const [allRoutes, setAllRoutes] = useState([]);
    const [activeRouteIndex, setActiveRouteIndex] = useState(0);
    const [enderecosPorCoordenada, setEnderecosPorCoordenada] = useState(new Map());

    // Função para buscar rota da API OpenRouteService
    const fetchRouteFromORS = async (waypoints) => {
        const apiKey = MAPA_CONFIG.OPENROUTESERVICE_API_KEY; // Certifique-se de definir isso no seu arquivo de configuração
        const url = 'https://api.openrouteservice.org/v2/directions/driving-car';
        const coordinates = waypoints.map(point => [point.lng, point.lat]);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': apiKey,
                },
                body: JSON.stringify({
                    coordinates,
                    language: 'pt'
                }),
            });

            if (!response.ok) {
                throw new Error(`Erro ao buscar rota: ${response.statusText}`);
            }

            const data = await response.json();
            return data.routes; // Retorna todas as rotas encontradas
        } catch (error) {
            console.error('Erro ao buscar rota da API OpenRouteService:', error);
            return null;
        }
    };

    // Atualiza a rota no mapa
    useEffect(() => {
        if (!map || !waypoints || waypoints.length < 2) {
            // Limpa rota e marcadores se waypoints forem insuficientes
            if (routeLayer) {
                map.removeLayer(routeLayer);
                setRouteLayer(null);
            }
            markers.forEach(marker => map.removeLayer(marker));
            setMarkers([]);
            setRouteInfo(null);
            setAllRoutes([]);
            return;
        }

        // Busca rota da API OpenRouteService
        fetchRouteFromORS(waypoints).then(routes => {
            if (!routes || routes.length === 0) return;

            const activeRoute = routes[activeRouteIndex];

            // Remove rota anterior
            if (routeLayer) {
                map.removeLayer(routeLayer);
            }

            // Remove marcadores anteriores
            markers.forEach(marker => map.removeLayer(marker));

            // Decodifica a polyline da rota ativa
            const decodedCoords = polyline.decode(activeRoute.geometry);

            // Adiciona nova rota ao mapa
            const polylineLayer = L.polyline(decodedCoords.map(([lat, lng]) => [lat, lng]), {
                color: MAPA_CONFIG.ROUTE_COLOR || 'blue',
                weight: MAPA_CONFIG.ROUTE_WEIGHT || 5,
                opacity: MAPA_CONFIG.ROUTE_OPACITY || 0.8,
            }).addTo(map);

            setRouteLayer(polylineLayer);

            // Adiciona marcadores para origem e destino
            const startMarker = L.marker([waypoints[0].lat, waypoints[0].lng], { title: 'Origem' }).addTo(map);
            const endMarker = L.marker([waypoints[waypoints.length - 1].lat, waypoints[waypoints.length - 1].lng], { title: 'Destino' }).addTo(map);
            setMarkers([startMarker, endMarker]);

            // Atualiza informações da rota
            setRouteInfo({
                distance: (activeRoute.summary.distance / 1000).toFixed(2), // Distância em km
                time: Math.round(activeRoute.summary.duration / 60), // Tempo em minutos
                alternatives: routes.length - 1,
                currentRoute: activeRouteIndex + 1,
                totalRoutes: routes.length,
            });

            setAllRoutes(routes);

            // Callback para informar que a rota foi calculada
            if (onRouteCalculated) {
                onRouteCalculated({
                    distance: activeRoute.summary.distance,
                    time: activeRoute.summary.duration,
                });
            }
        });
    }, [map, waypoints, activeRouteIndex]);

    const handleRouteChange = (index) => {
        setActiveRouteIndex(index);
    };

    return (
        <>
            {routeInfo && (
                <RotasFlutuante
                    routeInfo={routeInfo}
                    allRoutes={allRoutes}
                    activeRouteIndex={activeRouteIndex}
                    handleRouteChange={handleRouteChange}
                    onClearRoute={() => {
                        if (routeLayer) {
                            map.removeLayer(routeLayer);
                            setRouteLayer(null);
                        }
                        markers.forEach(marker => map.removeLayer(marker));
                        setMarkers([]);
                        setRouteInfo(null);
                        setAllRoutes([]);
                        if (onRouteCalculated) onRouteCalculated({ clear: true });
                    }}
                    leafletMap={map}
                    waypoints={waypoints}
                    enderecosPorCoordenada={enderecosPorCoordenada}
                />
            )}
        </>
    );
}