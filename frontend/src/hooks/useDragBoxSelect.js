// src/hooks/useDragBoxSelect.js
import { useEffect, useRef } from 'react';
import L from 'leaflet';

export default function useDragBoxSelect(map, focos, onSelecionarFocos) {
    const startPoint = useRef(null);
    const box = useRef(null);

    useEffect(() => {
        if (!map) return;

        function onMouseDown(e) {
            if (!e.originalEvent.shiftKey) return; // Usa SHIFT para evitar conflitos
            startPoint.current = e.latlng;

            box.current = L.rectangle([e.latlng, e.latlng], {
                color: '#3388ff',
                weight: 1,
                fillOpacity: 0.1,
            }).addTo(map);

            map.on('mousemove', onMouseMove);
            map.once('mouseup', onMouseUp);
        }

        function onMouseMove(e) {
            if (!box.current || !startPoint.current) return;
            box.current.setBounds(L.latLngBounds(startPoint.current, e.latlng));
        }

        function onMouseUp(e) {
            if (!box.current) return;

            const bounds = box.current.getBounds();

            // ⚠️ Filtros dos focos dentro do retângulo
            const focosSelecionados = focos.filter(f =>
                bounds.contains([f.latitude, f.longitude])
            );

            if (onSelecionarFocos) {
                onSelecionarFocos(focosSelecionados, bounds);
            }

            map.removeLayer(box.current);
            box.current = null;
            startPoint.current = null;

            map.off('mousemove', onMouseMove);
        }

        map.on('mousedown', onMouseDown);

        return () => {
            map.off('mousedown', onMouseDown);
            map.off('mousemove', onMouseMove);
        };
    }, [map, focos, onSelecionarFocos]);
}
