'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import MAP_COORDINATES from './map_coordinates.json';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

export default function MapboxMap({ projectKey, projectName }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Buscar configuración de coordenadas o usar Quito Centro por defecto
    const config = MAP_COORDINATES[projectKey] || {
      center: [-78.4900, -0.2100], // Centro por defecto de Quito
      zoom: 13
    };

    // Crear el mapa interactivo de Mapbox
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12', // Estilo de calles claro y limpio
      center: config.center,
      zoom: config.zoom
    });

    mapRef.current = map;

    // Agregar botones de zoom y rotación
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.on('load', () => {
      // Agregar un marcador personalizado en el centro del proyecto
      new mapboxgl.Marker({ color: '#24367f' }) // Azul Municipal
        .setLngLat(config.center)
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <div style="font-family: var(--font-heading); padding: 5px;">
                <h4 style="margin: 0; color: #24367f;">${projectName}</h4>
                <p style="margin: 5px 0 0 0; color: #5c6784; font-size: 12px;">Proyecto Estratégico Intervenido</p>
              </div>
            `)
        )
        .addTo(map);

      // Si tenemos un trazado del sendero, lo pintamos en el mapa
      if (config.geojson) {
        map.addSource('route', {
          type: 'geojson',
          data: config.geojson
        });

        const geomType = config.geojson.geometry?.type;

        if (geomType === 'Polygon') {
          map.addLayer({
            id: 'route-fill',
            type: 'fill',
            source: 'route',
            paint: {
              'fill-color': '#f2b705', // Amarillo de Quito Municipal
              'fill-opacity': 0.25
            }
          });

          map.addLayer({
            id: 'route-outline',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#f2b705',
              'line-width': 3,
              'line-opacity': 0.85
            }
          });
        } else {
          map.addLayer({
            id: 'route-line',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#f2b705', // Amarillo de Quito Municipal
              'line-width': 6,
              'line-opacity': 0.85
            }
          });
        }
      }
    });

    // Destruir mapa al desmontar el componente para evitar fugas de memoria
    return () => {
      map.remove();
    };
  }, [projectKey]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '400px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
