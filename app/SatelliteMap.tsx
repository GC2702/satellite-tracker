"use client";

import { useEffect, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

type SatelliteData = {
  name: string;
  noradId: number;
  latitude: number;
  longitude: number;
  altitude: number;
  timestamp: string;
};

type Position = [number, number];

function FollowSatellite({
  position,
  following,
}: {
  position: Position | null;
  following: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (following && position) {
      map.panTo(position, {
        animate: true,
        duration: 0.5,
      });
    }
  }, [map, position, following]);

  return null;
}

export default function SatelliteMap() {
  const [satellite, setSatellite] =
    useState<SatelliteData | null>(null);

  const [position, setPosition] =
    useState<Position | null>(null);

  const [trail, setTrail] =
    useState<Position[]>([]);

  const [following, setFollowing] =
    useState(false);

  const [previousPosition, setPreviousPosition] =
    useState<Position | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchSatellite = async () => {
      try {
        const response = await fetch(
          "/api/satellite",
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `API returned ${response.status}`
          );
        }

        const data: SatelliteData =
          await response.json();

        if (
          cancelled ||
          data.latitude === undefined ||
          data.longitude === undefined
        ) {
          return;
        }

        const newPosition: Position = [
          data.latitude,
          data.longitude,
        ];

        setSatellite(data);

        setPreviousPosition(
          position ?? newPosition
        );

        setPosition(newPosition);

        setTrail((previousTrail) => {
          const updatedTrail = [
            ...previousTrail,
            newPosition,
          ];

          return updatedTrail.slice(-120);
        });
      } catch (error) {
        if (!cancelled) {
          console.warn(
            "Temporary satellite fetch failure:",
            error
          );
        }
      }
    };

    fetchSatellite();

    const interval = setInterval(
      fetchSatellite,
      5000
    );

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        minZoom={2}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FollowSatellite
          position={position}
          following={following}
        />

        {trail.length > 1 && (
          <Polyline
            positions={trail}
            pathOptions={{
              color: "red",
              weight: 3,
              opacity: 0.7,
            }}
          />
        )}

        {satellite && position && (
          <CircleMarker
            center={position}
            radius={10}
            pathOptions={{
              color: "red",
              fillColor: "red",
              fillOpacity: 0.8,
            }}
          >
            <Popup>
              <strong>{satellite.name}</strong>
              <br />
              NORAD ID: {satellite.noradId}
              <br />
              Latitude:{" "}
              {satellite.latitude.toFixed(2)}°
              <br />
              Longitude:{" "}
              {satellite.longitude.toFixed(2)}°
              <br />
              Altitude:{" "}
              {satellite.altitude.toFixed(0)} km
            </Popup>
          </CircleMarker>
        )}
      </MapContainer>

      {satellite && (
        <div className="absolute left-4 top-4 z-[1000] w-72 rounded-xl border border-white/20 bg-black/80 p-5 text-white shadow-2xl backdrop-blur-md">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20 text-xl">
              🛰️
            </div>

            <div>
              <h2 className="font-semibold">
                {satellite.name}
              </h2>

              <p className="text-xs text-gray-400">
                NORAD {satellite.noradId}
              </p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">
                Latitude
              </span>

              <span>
                {satellite.latitude.toFixed(2)}°
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">
                Longitude
              </span>

              <span>
                {satellite.longitude.toFixed(2)}°
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">
                Altitude
              </span>

              <span>
                {satellite.altitude.toFixed(0)} km
              </span>
            </div>

            <div className="border-t border-white/10 pt-3">
              <p className="text-xs text-gray-500">
                Last updated
              </p>

              <p className="mt-1 text-xs">
                {new Date(
                  satellite.timestamp
                ).toLocaleTimeString()}
              </p>
            </div>

            <button
              onClick={() =>
                setFollowing((value) => !value)
              }
              className="mt-2 w-full rounded-lg bg-red-500 px-4 py-2 font-medium text-white transition hover:bg-red-600"
            >
              {following
                ? "Stop Following"
                : "Follow ISS"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}