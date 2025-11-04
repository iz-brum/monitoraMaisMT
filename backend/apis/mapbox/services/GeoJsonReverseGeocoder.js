/** @file: backend/apis/mapbox/services/GeoJsonReverseGeocoder.js */

import * as turf from '@turf/turf';
import fs from 'fs';
import path from 'path';

// Carregue o GeoJSON uma vez na inicialização
const geojsonPath = path.resolve(process.cwd(), 'public/assets/geoRef/limites_administrativos.json');
const geojson = JSON.parse(fs.readFileSync(geojsonPath, 'utf-8'));

export function getMunicipioByLatLng(lat, lng) {
  const point = turf.point([lng, lat]);
  for (const feature of geojson.features) {
    if (turf.booleanPointInPolygon(point, feature)) {
      // Ajuste o campo conforme seu GeoJSON
      return feature.properties.name || feature.properties.mn_no;
    }
  }
  return null;
}

export function batchGeoJsonReverseGeocode(coordinates) {
  return coordinates.map(coord => ({
    ...coord,
    localizacao: {
      cidade: getMunicipioByLatLng(coord.latitude, coord.longitude) || 'N/A'
    }
  }));
}