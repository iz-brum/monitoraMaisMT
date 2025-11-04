import { useEffect } from "react";
import L from "leaflet";
import { useMap } from "react-leaflet";

export default function FloatingHudControl({ onClick, visible = true }) {
    const map = useMap();

    useEffect(() => {
        if (!visible) return;

        // Cria controle Leaflet padrão, igual aos outros!
        const CustomHudControl = L.Control.extend({
            onAdd: function () {
                const btn = L.DomUtil.create("button", "leaflet-bar leaflet-control leaflet-control-custom");
                btn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#232c4c" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="4" y1="21" x2="4" y2="14"/>
                    <line x1="4" y1="10" x2="4" y2="3"/>
                    <line x1="12" y1="21" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12" y2="3"/>
                    <line x1="20" y1="21" x2="20" y2="16"/>
                    <line x1="20" y1="12" x2="20" y2="3"/>
                    <circle cx="4" cy="12" r="2.1"/>
                    <circle cx="12" cy="10" r="2.1"/>
                    <circle cx="20" cy="14" r="2.1"/>
                </svg>
                `
                btn.title = "Abrir painel de camadas";
                btn.style.fontSize = "28px";
                btn.style.display = "flex";
                btn.style.alignItems = "center";
                btn.style.justifyContent = "center";
                btn.style.width = "38px";
                btn.style.height = "38px";
                btn.style.background = "#fff";
                btn.style.borderRadius = "8px";
                btn.style.boxShadow = "0 2px 6px #232c4c19";
                btn.style.border = "none";
                btn.style.cursor = "pointer";
                btn.style.color = "#232c4c";

                btn.onclick = function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    onClick();
                };

                L.DomEvent.disableClickPropagation(btn);
                L.DomEvent.disableScrollPropagation(btn);

                return btn;
            },
            onRemove: function () { }
        });

        // Adiciona na mesma posição dos outros controles (topleft, top right, etc)
        const control = new CustomHudControl({ position: "topright" });
        map.addControl(control);

        // Limpeza ao desmontar
        return () => {
            map.removeControl(control);
        };
    }, [map, onClick, visible]);

    return null; // Não renderiza nada direto
}
