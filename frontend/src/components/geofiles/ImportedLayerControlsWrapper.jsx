// src/components/geofiles/ImportedLayerControlsWrapper.jsx

import React from "react";
import ImportedLayerControls from "@components/geofiles/ImportedLayerControls";
void ImportedLayerControls;

export default function ImportedLayerControlsWrapper({
  layer,
  onChangeOpacity,
  onFechar
}) {
  if (!layer) return <div>Carregando camada...</div>;

  return (
    <ImportedLayerControls
      layer={layer}
      onChangeOpacity={onChangeOpacity}
      onFechar={onFechar}
    />
  );
}