// src/services/locationService.js

import {
  montarUrl,
  buscarJson,
  logErroFetch,
  obterDataDeHoje,
} from '@shared/utils/apiHelpers'

import { normalizeString } from '@domain/utils/normalizeString';
import { getRequestDate } from './dateControl';

/**
 * Endpoint de focos com coordenadas (INPE/FIRMS)
 * Estrutura: GET /api/firms/fires/locations?dt=YYYY-MM-DD
 */
const FIRE_LOCATIONS = '/api/firms/fires/locations'

/** Verifica se json.dados existe e é um array */
function dadosSaoValidos(json) {
  return Array.isArray(json?.dados)
}

/** Extrai json.dados ou retorna array vazio */
function extrairDadosOuVazio(json) {
  return dadosSaoValidos(json) ? json.dados : []
}

/**
 * Busca todos os focos de calor do dia, retornando array de objetos com
 * latitude, longitude, intensity e, em localizacao, nome da cidade etc.
 *
 * @returns {Promise<Array<object>>}
 */
export async function buscarFocosComLocalizacao() {
  try {
    const url = montarUrl(FIRE_LOCATIONS, {
      // dt: obterDataDeHoje(),
      dt: getRequestDate()
    })
    const json = await buscarJson(url)
    return extrairDadosOuVazio(json)
  } catch (error) {
    logErroFetch(error)
    return []
  }
}

/**
 * Dada uma lista “focos” (cada foco tem .localizacao.cidade) e o nome de uma cidade,
 * encontra as coordenadas [lat, lng] da cidade, procurando primeiro em 
 * localizacao.outros_dados.features (GeoJSON) e, se não achar, usando
 * latitude/longitude diretos do próprio foco.
 *
 * @param {Array<object>} focos       Lista de focos obtida por buscarFocosComLocalizacao()
 * @param {string} nomeCidade         Nome “original” da cidade a buscar
 * @returns {{ lat: number, lng: number } | null}
 */
export function encontrarCoordenadasCidade(lista, nomeCidade) {
  const nomeCidadeNorm = normalizeString(nomeCidade);

  // Procura por cidade em diferentes formatos de objeto
  const item = lista.find((obj) => {
    // Para focos
    if (obj.localizacao && obj.localizacao.cidade) {
      return normalizeString(obj.localizacao.cidade) === nomeCidadeNorm;
    }
    // Para estações ANA
    if (obj.Municipio_Nome) {
      return normalizeString(obj.Municipio_Nome) === nomeCidadeNorm;
    }
    return false;
  });

  if (!item) return null;

  // Para focos (GeoJSON ou lat/lng direto)
  if (item.localizacao) {
    const features = item.localizacao?.outros_dados?.features;
    if (Array.isArray(features)) {
      const featCidade = features.find(
        (f) => f.properties?.feature_type === 'place'
      );
      if (featCidade && featCidade.geometry?.coordinates) {
        return {
          lat: featCidade.geometry.coordinates[1],
          lng: featCidade.geometry.coordinates[0],
        };
      }
    }
    if (item.latitude && item.longitude) {
      return { lat: item.latitude, lng: item.longitude };
    }
  }

  // Para estações ANA
  if (item.Latitude && item.Longitude) {
    return {
      lat: Number(item.Latitude),
      lng: Number(item.Longitude),
    };
  }

  return null;
}

export function calcularCentroideGeoJSON(feature) {
  let coords = [];
  if (feature.geometry.type === 'Polygon') {
    coords = feature.geometry.coordinates[0];
  } else if (feature.geometry.type === 'MultiPolygon') {
    coords = feature.geometry.coordinates[0][0];
  }
  const n = coords.length;
  let x = 0, y = 0;
  coords.forEach(([lng, lat]) => {
    x += lng;
    y += lat;
  });
  return { lat: y / n, lng: x / n };
}

