import L from 'leaflet';
import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';

import { useMap } from 'react-leaflet';

import '@styles/DraggablePortalPanel.css'

function useMapSafe() {
  try {
    return useMap();
  } catch {
    return null;
  }
}

const DraggablePortalPanel = ({
  children,
  className = '',
  initialPosition = { x: 100, y: 100 },
  portalTarget = null,
  leafletMap: propMap = null, // <-- renomeado
  onClose,
}) => {

  const contextMap = useMapSafe();
  const leafletMap = propMap || contextMap; // <-- prioridade para prop, fallback para hook

  const [position, setPosition] = useState(initialPosition);
  const [dragging, setDragging] = useState(false);
  const offset = useRef({ x: 0, y: 0 });
  const hudRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const onPointerDown = (e) => {
    setDragging(true);
    offset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    e.stopPropagation();
    if (leafletMap) leafletMap.dragging.disable();
  };

  const onPointerUp = () => {
    setDragging(false);
    if (leafletMap) leafletMap.dragging.enable();
  };

  const onPointerMove = (e) => {
    if (!dragging) return;
    setPosition({
      x: e.clientX - offset.current.x,
      y: e.clientY - offset.current.y,
    });
  };

  useEffect(() => {
    if (dragging) {
      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp);
    } else {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
    }
    return () => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
    };
  }, [dragging]);

  useEffect(() => {
    if (!leafletMap) return;

    // 🔍 Checa se o mapa já está em fullscreen no momento do mount
    const container = leafletMap.getContainer();
    const isCurrentlyFullscreen =
      document.fullscreenElement === container ||
      document.webkitFullscreenElement === container;

    setIsFullscreen(isCurrentlyFullscreen); // <-- corrige render inicial

    const onEnter = () => {
      setIsFullscreen(true);
      setPosition({ x: 100, y: 40 });
    };

    const onExit = () => {
      setIsFullscreen(false);
      setPosition({ x: 100, y: 40 });
    };

    leafletMap.on('enterFullscreen', onEnter);
    leafletMap.on('exitFullscreen', onExit);

    return () => {
      leafletMap.off('enterFullscreen', onEnter);
      leafletMap.off('exitFullscreen', onExit);
    };
  }, [leafletMap]);

  useEffect(() => {
    if (!hudRef.current) return;

    const hudEl = hudRef.current;

    const stop = L.DomEvent.stopPropagation;
    const prevent = L.DomEvent.preventDefault;

    L.DomEvent.disableClickPropagation(hudEl);
    L.DomEvent.disableScrollPropagation(hudEl);
    L.DomEvent.on(hudEl, 'contextmenu', prevent);
    L.DomEvent.on(hudEl, 'touchstart', stop);

    return () => {
      L.DomEvent.off(hudEl, 'contextmenu', prevent);
      L.DomEvent.off(hudEl, 'touchstart', stop);
    };
  }, [isFullscreen, leafletMap]);

  useEffect(() => {
    const limitPositionToViewport = () => {
      const maxX = window.innerWidth - 50;
      const maxY = window.innerHeight - 50;

      setPosition((prev) => ({
        x: Math.min(Math.max(prev.x, 0), maxX),
        y: Math.min(Math.max(prev.y, 0), maxY),
      }));
    };

    window.addEventListener('resize', limitPositionToViewport);
    return () => window.removeEventListener('resize', limitPositionToViewport);
  }, []);

  const content = (
    <div
      ref={hudRef}
      className={`draggable-portal-panel ${className}`}
      style={{
        position: 'absolute',
        top: position.y,
        left: position.x,
        zIndex: 9999,
      }}
    >
      <div
        className={`panel-header ${dragging ? 'dragging' : ''}`}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        {/* <span>Draggable Portal Panel</span> */}
        <span></span>
        {onClose && (
          <button
            className="panel-close-button"
            onClick={onClose}
            aria-label="Fechar painel"
          >
            ×
          </button>
        )}
      </div>

      <div
        className="panel-content-wrapper"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );

  const target = isFullscreen
    ? leafletMap?.getContainer() || document.body
    : portalTarget || document.body;

  return ReactDOM.createPortal(content, target);
};

export default DraggablePortalPanel;