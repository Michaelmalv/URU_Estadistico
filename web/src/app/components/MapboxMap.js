'use strict';
'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import MAP_COORDINATES from './map_coordinates.json';

const getFallbackToken = () => {
  if (process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
    return process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  }
  try {
    const encoded = 'cGsuZXlKMUlqb2liV0ZzYjNCbGVuWWlMQ0poSWpvaVkyMXhhVE55T0RaMk1ESnRlREp5Y1hsdGVqRnphbkZ5WXlKOS4zRXFtbm9DTkNJNVVxRXljbmlCaWJn';
    if (typeof window !== 'undefined' && window.atob) {
      return window.atob(encoded);
    }
    return Buffer.from(encoded, 'base64').toString('utf8');
  } catch (e) {
    return '';
  }
};

export default function MapboxMap({ projectKey, projectName }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const token = getFallbackToken();
    mapboxgl.accessToken = token;

    // Buscar configuración de coordenadas o usar Quito Centro por defecto
    const config = MAP_COORDINATES[projectKey] || {
      center: [-78.4900, -0.2100], // Centro por defecto de Quito
      zoom: 13
    };

    let map = null;

    try {
      // Crear el mapa interactivo de Mapbox
      map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: config.center,
        zoom: config.zoom
      });

      mapRef.current = map;

      // Agregar botones de zoom y rotación
      map.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.on('load', () => {
        try {
          // Agregar un marcador personalizado en el centro del proyecto
          new mapboxgl.Marker({ color: '#24367f' })
            .setLngLat(config.center)
            .setPopup(
              new mapboxgl.Popup({ offset: 25 })
                .setHTML(`
                  <div style="font-family: var(--font-heading); padding: 5px;">
                    <h4 style="margin: 0; color: #24367f;">${projectName || 'Proyecto'}</h4>
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
                  'fill-color': '#f2b705',
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
                  'line-color': '#f2b705',
                  'line-width': 6,
                  'line-opacity': 0.85
                }
              });
            }
          }
        } catch (layerErr) {
          console.warn('Error loading map layers:', layerErr);
        }
      });

      map.on('error', (e) => {
        console.warn('Mapbox internal event error:', e);
      });

    } catch (err) {
      console.error('Error initializing Mapbox map:', err);
      setMapError(true);
    }

    // Destruir mapa al desmontar el componente para evitar fugas de memoria
    return () => {
      try {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      } catch (removeErr) {
        console.warn('Error removing mapbox instance:', removeErr);
      }
    };
  }, [projectKey, projectName]);

  if (mapError) {
    return (
      <div style={{ 
        width: '100%', 
        height: '350px', 
        borderRadius: '12px', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border-color)',
        padding: '2rem'
      }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>
          Mapa de ubicación referencial para <strong>{projectName}</strong>
        </p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '400px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
