'use client';

import type { Feature, FeatureCollection, Geometry } from 'geojson';
import L from 'leaflet';
import { memo, useEffect, useMemo, useRef } from 'react';
import { CircleMarker, GeoJSON, MapContainer, TileLayer, Tooltip, useMap } from 'react-leaflet';

import type { Country } from '@/lib/types';
import { formatCountryName } from '@/lib/utils/display';

interface MapPanelProps {
  countries: Country[];
  completedIds: string[];
  missedIds: string[];
  targetCountry: Country | undefined;
  showOutcomeLabels: boolean;
}

const WORLD_CENTER: [number, number] = [20, 10];

const BASE_POLYGON_STYLE = {
  color: '#6b7280',
  opacity: 0.9,
  weight: 0.72,
  fill: true,
  fillColor: '#1f2937',
  fillOpacity: 0.36
} as const;

const TARGET_POLYGON_STYLE = {
  color: '#fbbf24',
  opacity: 1,
  weight: 2.35,
  fill: true,
  fillColor: '#f59e0b',
  fillOpacity: 0.62,
  className: 'leaflet-target-fill'
} as const;

const COMPLETE_POLYGON_STYLE = {
  color: '#22c55e',
  opacity: 1,
  weight: 2.25,
  fill: true,
  fillColor: '#1f2937',
  fillOpacity: 0.36
} as const;

const MISSED_POLYGON_STYLE = {
  color: '#ef4444',
  opacity: 1,
  weight: 2.25,
  fill: true,
  fillColor: '#1f2937',
  fillOpacity: 0.36
} as const;

const polygonGeometry = (geometry: Geometry): boolean =>
  geometry.type === 'Polygon' || geometry.type === 'MultiPolygon';

const toFeatureCollection = (features: Array<Feature<Geometry>>): FeatureCollection<Geometry> => ({
  type: 'FeatureCollection',
  features
});

const getFeatureId = (feature: Feature<Geometry> | undefined): string | undefined => {
  const maybeId = feature?.properties && typeof feature.properties === 'object' ? feature.properties.id : undefined;
  return typeof maybeId === 'string' ? maybeId : undefined;
};

const FlyToTarget = ({ targetCountry }: { targetCountry: Country | undefined }) => {
  const map = useMap();
  const lastTargetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!targetCountry) {
      return;
    }

    if (lastTargetIdRef.current === targetCountry.id) {
      return;
    }
    lastTargetIdRef.current = targetCountry.id;

    if (polygonGeometry(targetCountry.coordinates.geometry)) {
      const layer = L.geoJSON(targetCountry.coordinates as Feature<Geometry>);
      const bounds = layer.getBounds();

      if (bounds.isValid()) {
        const latSpan = Math.abs(bounds.getNorth() - bounds.getSouth());
        const lngSpan = Math.abs(bounds.getEast() - bounds.getWest());
        const largestSpan = Math.max(latSpan, lngSpan);
        const pad = largestSpan < 1 ? 0.15 : largestSpan < 4 ? 0.22 : largestSpan < 12 ? 0.3 : 0.36;

        const paddedBounds = bounds.pad(pad);
        const fitZoom = map.getBoundsZoom(paddedBounds, false, L.point(28, 28));
        const targetZoom = Math.max(2.8, Math.min(6.5, fitZoom));
        const targetCenter = paddedBounds.getCenter();
        const currentCenter = map.getCenter();
        const distance = currentCenter.distanceTo(targetCenter);
        const zoomDiff = Math.abs(map.getZoom() - targetZoom);

        map.stop();

        if (distance < 180000 && zoomDiff < 0.55) {
          map.panTo(targetCenter, {
            animate: true,
            duration: 0.45,
            easeLinearity: 0.22
          });
          if (zoomDiff > 0.2) {
            map.setZoom(targetZoom, { animate: true });
          }
          return;
        }

        map.flyTo(targetCenter, targetZoom, {
          animate: true,
          duration: 0.72,
          easeLinearity: 0.22,
          noMoveStart: true
        });
        return;
      }
    }

    map.stop();
    map.flyTo(targetCountry.centroid, 5.2, {
      animate: true,
      duration: 0.68,
      easeLinearity: 0.22,
      noMoveStart: true
    });
  }, [map, targetCountry]);

  return null;
};

const AttributionControl = () => {
  const map = useMap();

  useEffect(() => {
    map.attributionControl?.setPrefix(false);
  }, [map]);

  return null;
};

const MapPanelComponent = ({
  countries,
  completedIds,
  missedIds,
  targetCountry,
  showOutcomeLabels
}: MapPanelProps) => {
  const completeSet = useMemo(() => new Set(completedIds), [completedIds]);
  const missedSet = useMemo(() => new Set(missedIds), [missedIds]);

  const { baseCollection, pointCountries } = useMemo(() => {
    const polygonFeatures: Array<Feature<Geometry>> = [];
    const points: Country[] = [];

    for (const country of countries) {
      if (polygonGeometry(country.coordinates.geometry)) {
        const feature = {
          ...country.coordinates,
          properties: {
            ...(country.coordinates.properties || {}),
            id: country.id,
            name: formatCountryName(country.name)
          }
        } as Feature<Geometry>;

        polygonFeatures.push(feature);
      } else {
        points.push(country);
      }
    }

    return {
      baseCollection: toFeatureCollection(polygonFeatures),
      pointCountries: points
    };
  }, [countries]);

  const polygonStyle = useMemo(() => {
    const targetId = targetCountry?.id;

    return (feature?: Feature<Geometry>) => {
      const countryId = getFeatureId(feature);

      if (!countryId) {
        return BASE_POLYGON_STYLE;
      }

      if (targetId && countryId === targetId) {
        return TARGET_POLYGON_STYLE;
      }

      if (missedSet.has(countryId)) {
        return MISSED_POLYGON_STYLE;
      }

      if (completeSet.has(countryId)) {
        return COMPLETE_POLYGON_STYLE;
      }

      return BASE_POLYGON_STYLE;
    };
  }, [completeSet, missedSet, targetCountry?.id]);

  const polygonLayerKey = useMemo(
    () => `${targetCountry?.id || 'none'}-${completedIds.length}-${missedIds.length}`,
    [completedIds.length, missedIds.length, targetCountry?.id]
  );

  const targetPoint = useMemo<[number, number] | null>(() => {
    if (!targetCountry || polygonGeometry(targetCountry.coordinates.geometry)) {
      return null;
    }

    return targetCountry.centroid;
  }, [targetCountry]);

  const outcomePointCountries = useMemo(
    () => pointCountries.filter((country) => completeSet.has(country.id) || missedSet.has(country.id)),
    [completeSet, missedSet, pointCountries]
  );

  const outcomeLabelCountries = useMemo(
    () =>
      countries.filter(
        (country) =>
          polygonGeometry(country.coordinates.geometry) &&
          (completeSet.has(country.id) || missedSet.has(country.id))
      ),
    [completeSet, countries, missedSet]
  );

  return (
    <section className="surface-card h-[460px] p-3 sm:h-[560px]" aria-label="Interactive world map">
      <MapContainer
        center={WORLD_CENTER}
        zoom={2}
        minZoom={2}
        maxZoom={7}
        scrollWheelZoom
        zoomControl={false}
        worldCopyJump
        zoomAnimation
        fadeAnimation
        markerZoomAnimation
        className="h-full w-full rounded-2xl"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          keepBuffer={4}
          updateWhenZooming={false}
          updateWhenIdle
        />

        <GeoJSON key={`polygons-${polygonLayerKey}`} data={baseCollection} style={polygonStyle} interactive={false} />

        {targetPoint && (
          <CircleMarker
            key={`target-point-${targetCountry?.id}`}
            center={targetPoint}
            radius={12}
            pathOptions={{
              className: 'leaflet-target-fill',
              color: '#f59e0b',
              fillColor: '#f59e0b',
              fillOpacity: 0.6,
              weight: 3
            }}
            interactive={false}
          />
        )}

        {outcomePointCountries.map((country) => {
          const isMissed = missedSet.has(country.id);
          const color = isMissed ? '#ef4444' : '#10b981';

          return (
            <CircleMarker
              key={`outcome-point-${country.id}`}
              center={country.centroid}
              radius={6.5}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: 0.76,
                weight: 2
              }}
              interactive={false}
            >
              {showOutcomeLabels && (
                <Tooltip
                  permanent
                  direction="top"
                  opacity={0.96}
                  className={isMissed ? 'leaflet-tooltip-missed' : 'leaflet-tooltip-correct'}
                >
                  {formatCountryName(country.name)}
                </Tooltip>
              )}
            </CircleMarker>
          );
        })}

        {showOutcomeLabels &&
          outcomeLabelCountries.map((country) => {
            const isMissed = missedSet.has(country.id);
            const className = isMissed ? 'leaflet-tooltip-missed' : 'leaflet-tooltip-correct';

            return (
              <CircleMarker
                key={`label-anchor-${country.id}`}
                center={country.centroid}
                radius={0.1}
                pathOptions={{
                  color: 'transparent',
                  fillColor: 'transparent',
                  fillOpacity: 0,
                  opacity: 0,
                  weight: 0
                }}
                interactive={false}
              >
                <Tooltip permanent direction="center" opacity={0.96} className={className}>
                  {formatCountryName(country.name)}
                </Tooltip>
              </CircleMarker>
            );
          })}

        <FlyToTarget targetCountry={targetCountry} />
        <AttributionControl />
      </MapContainer>
    </section>
  );
};

export const MapPanel = memo(MapPanelComponent);
MapPanel.displayName = 'MapPanel';
