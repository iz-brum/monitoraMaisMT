// src/components/layers/MapLayersManager.jsx
import React from 'react';
import { useMap } from 'react-leaflet';
import FocosLayerControlPanel from './FocosLayerControlPanel';
import AnaLayerControlPanel from './AnaLayerControlPanel';

export default function MapLayersManager() {
    const map = useMap();

    return (
        <>
            <FocosLayerControlPanel />
            <AnaLayerControlPanel />
        </>
    );
}