'use client';

import { useRef, useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { FeatureCollection, Point } from 'geojson';

const arbres: FeatureCollection<Point, { espece: string }> = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { espece: "Chêne" },
      geometry: { type: "Point", coordinates: [-1.660, 48.1134] },
    },
    {
      type: "Feature",
      properties: { espece: "Érable" },
      geometry: { type: "Point", coordinates: [-1.661, 48.1136] },
    },
    {
      type: "Feature",
      properties: { espece: "Chêne" },
      geometry: { type: "Point", coordinates: [-1.659, 48.1132] },
    },
  ],
};


// https://geoservices.ign.fr/documentation/services/api-et-services-ogc/tuiles-vectorielles-tmswmts/styles
// const STYLE = 'https://data.geopf.fr/annexes/ressources/vectorTiles/styles/PLAN.IGN/standard.json';
const STYLE = "/plan-ign-standard.json"

export default function Home() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (map.current) return;

    if (!mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: STYLE,
      center: [-1.660801, 48.113455],
      zoom: 17,
      maxZoom: 22 //18 max disponible dans le service web pbf, configuré à la main dans /public/plan-ign-standard.json
    });

    map.current.addControl(new maplibregl.NavigationControl());

    map.current.on('load', () => {
      map.current?.addSource('arbres', { type: 'geojson', data: arbres });
      map.current?.addLayer({
        id: 'arbres-points',
        type: 'circle',
        source: 'arbres',
        paint: {
          'circle-radius': 6,
          'circle-color': [
            'match',
            ['get', 'espece'],
            'Chêne', '#8B4513',
            'Érable', '#FF4500',
            '#228B22',
          ],
          'circle-stroke-color': '#000',
          'circle-stroke-width': 1,
        },
      });

      map.current!.on('click', 'arbres-points', (e) => {
        if (!e.features || e.features.length === 0) return;

        const feature = e.features[0];
        const coordinates = feature.geometry.type === 'Point'
          ? [feature.geometry.coordinates[0], feature.geometry.coordinates[1]] as [number, number]
          : null;
        const espece = feature.properties?.espece ?? 'Inconnu';

        if (!coordinates) return;

        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        new maplibregl.Popup()
          .setLngLat(coordinates)
          .setHTML(`<strong>Espèce:</strong> ${espece}`)
          .addTo(map.current!);
      });

      map.current!.on('mouseenter', 'arbres-points', () => {
        map.current!.getCanvas().style.cursor = 'pointer';
      });
      map.current!.on('mouseleave', 'arbres-points', () => {
        map.current!.getCanvas().style.cursor = '';
      });
    });

    return () => map.current?.remove();
  }, []);

  return (
    <div ref={mapContainer} style={{ width: '100vw', height: '100vh' }} />
  );
}
