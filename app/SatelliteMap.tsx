"use client";

import { useEffect, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
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

export default function SatelliteMap() {
  const [satellite, setSatellite] = useState<SatelliteData | null>(null);

  useEffect(() => {
    const fetchSatellite = async () => {
      try {
        const response = await fetch("/api/satellite");
        const data = await response.json();

        if (!data.error) {
          setSatellite(data);
        }
      } catch (error) {
        console.error("Failed to fetch satellite data:", error);
      }
    };

    fetchSatellite();

    const interval = setInterval(fetchSatellite, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
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

      {satellite && (
        <CircleMarker
          center={[satellite.latitude, satellite.longitude]}
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
            Latitude: {satellite.latitude.toFixed(2)}°
            <br />
            Longitude: {satellite.longitude.toFixed(2)}°
            <br />
            Altitude: {satellite.altitude.toFixed(0)} km
          </Popup>
        </CircleMarker>
      )}
    </MapContainer>
  );
}