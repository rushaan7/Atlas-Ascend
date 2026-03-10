'use client';

import type { Feature, FeatureCollection, Geometry, GeoJsonProperties } from 'geojson';
import L from 'leaflet';
import { useCallback, useEffect, useMemo } from 'react';
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

const polygonGeometry = (geometry: Geometry): boolean =>
  geometry.type === 'Polygon' || geometry.type === 'MultiPolygon';

const FlyToTarget = ({ targetCountry }: { targetCountry: Country | undefined }) => {
  const map = useMap();

  useEffect(() => {
    if (!targetCountry) {
      return;
    }

    if (polygonGeometry(targetCountry.coordinates.geometry)) {
      const layer = L.geoJSON(targetCountry.coordinates as Feature<Geometry>);
      const bounds = layer.getBounds();

      if (bounds.isValid()) {
        const latSpan = Math.abs(bounds.getNorth() - bounds.getSouth());
        const lngSpan = Math.abs(bounds.getEast() - bounds.getWest());
        const largestSpan = Math.max(latSpan, lngSpan);
        const pad =
          largestSpan < 1 ? 0.16 : largestSpan < 4 ? 0.22 : largestSpan < 12 ? 0.3 : 0.38;

        const paddedBounds = bounds.pad(pad);
        const fitZoom = map.getBoundsZoom(paddedBounds, false, L.point(36, 36));
        const targetZoom = Math.max(2.6, Math.min(6.35, fitZoom));
        const targetCenter = paddedBounds.getCenter();
        const currentCenter = map.getCenter();

        // Ignore tiny moves to prevent camera jitter between near-identical targets.
        if (currentCenter.distanceTo(targetCenter) < 7000 && Math.abs(map.getZoom() - targetZoom) < 0.14) {
          return;
        }

        map.stop();
        map.flyTo(targetCenter, targetZoom, {
          animate: true,
          duration: 0.82,
          easeLinearity: 0.24,
          noMoveStart: true
        });
        return;
      }
    }

    map.stop();
    map.flyTo(targetCountry.centroid, 5, {
      animate: true,
      duration: 0.8,
      easeLinearity: 0.24,
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

export const MapPanel = ({
  countries,
  completedIds,
  missedIds,
  targetCountry,
  showOutcomeLabels
}: MapPanelProps) => {
  const completeSet = useMemo(() => new Set(completedIds), [completedIds]);
  const missedSet = useMemo(() => new Set(missedIds), [missedIds]);

  const collection = useMemo<FeatureCollection<Geometry>>(
    () => ({
      type: 'FeatureCollection',
      features: countries
        .filter((country) => polygonGeometry(country.coordinates.geometry))
        .map((country) => ({
          ...country.coordinates,
          properties: {
            ...(country.coordinates.properties || {}),
            id: country.id,
            name: formatCountryName(country.name)
          }
        }))
    }),
    [countries]
  );

  const completedCollection = useMemo<FeatureCollection<Geometry>>(
    () => ({
      type: 'FeatureCollection',
      features: countries
        .filter(
          (country) => polygonGeometry(country.coordinates.geometry) && completeSet.has(country.id)
        )
        .map((country) => ({
          ...country.coordinates,
          properties: {
            ...(country.coordinates.properties || {}),
            id: country.id,
            name: formatCountryName(country.name)
          }
        }))
    }),
    [completeSet, countries]
  );

  const missedCollection = useMemo<FeatureCollection<Geometry>>(
    () => ({
      type: 'FeatureCollection',
      features: countries
        .filter((country) => polygonGeometry(country.coordinates.geometry) && missedSet.has(country.id))
        .map((country) => ({
          ...country.coordinates,
          properties: {
            ...(country.coordinates.properties || {}),
            id: country.id,
            name: formatCountryName(country.name)
          }
        }))
    }),
    [countries, missedSet]
  );

  const targetPolygon = useMemo<Feature<Geometry> | null>(() => {
    if (!targetCountry || !polygonGeometry(targetCountry.coordinates.geometry)) {
      return null;
    }

    return targetCountry.coordinates as Feature<Geometry>;
  }, [targetCountry]);

  const targetPoint = useMemo<[number, number] | null>(() => {
    if (!targetCountry || polygonGeometry(targetCountry.coordinates.geometry)) {
      return null;
    }

    return targetCountry.centroid;
  }, [targetCountry]);

  const outcomePointCountries = useMemo(
    () =>
      countries.filter((country) => {
        if (polygonGeometry(country.coordinates.geometry)) {
          return false;
        }

        return completeSet.has(country.id) || missedSet.has(country.id);
      }),
    [completeSet, countries, missedSet]
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

  const regionFillStyle = useCallback(
    () => ({
      stroke: false,
      fillColor: '#1f2937',
      fillOpacity: 0.36
    }),
    []
  );

  const completeFillStyle = useCallback(
    () => ({
      stroke: false,
      fillColor: '#10b981',
      fillOpacity: 0.62
    }),
    []
  );

  const missedFillStyle = useCallback(
    () => ({
      stroke: false,
      fillColor: '#ef4444',
      fillOpacity: 0.62
    }),
    []
  );

  const regionOutlineStyle = useCallback(
    (feature?: Feature<Geometry, GeoJsonProperties>) => {
      const id = feature?.properties?.id as string | undefined;
      const isCurrent = id === targetCountry?.id;
      const isMissed = !!id && missedSet.has(id);
      const isComplete = !!id && completeSet.has(id);

      if (isCurrent) {
        return {
          color: '#fbbf24',
          opacity: 1,
          weight: 2,
          fill: false
        };
      }

      if (isMissed) {
        return {
          color: '#ef4444',
          opacity: 1,
          weight: 1.85,
          fill: false
        };
      }

      if (isComplete) {
        return {
          color: '#22c55e',
          opacity: 1,
          weight: 1.85,
          fill: false
        };
      }

      return {
        color: '#6b7280',
        opacity: 0.9,
        weight: 0.72,
        fill: false
      };
    },
    [completeSet, missedSet, targetCountry?.id]
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
        preferCanvas
        zoomAnimation
        fadeAnimation
        markerZoomAnimation
        className="h-full w-full rounded-2xl"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          keepBuffer={3}
          updateWhenZooming={false}
          updateWhenIdle
        />

        <GeoJSON data={collection} style={regionFillStyle} interactive={false} />
        <GeoJSON data={missedCollection} style={missedFillStyle} interactive={false} />
        <GeoJSON data={completedCollection} style={completeFillStyle} interactive={false} />

        {targetPolygon && (
          <GeoJSON
            key={`target-${targetCountry?.id}`}
            data={targetPolygon}
            style={() => ({
              stroke: false,
              fillColor: '#f59e0b',
              fillOpacity: 0.62,
              className: 'leaflet-target-fill'
            })}
            interactive={false}
          />
        )}

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
                  fillOpacity: 0.75,
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

        <GeoJSON data={collection} style={regionOutlineStyle} />

        <FlyToTarget targetCountry={targetCountry} />
        <AttributionControl />
      </MapContainer>
    </section>
  );
};
