"use client";

import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function SatelliteMap() {
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
    </MapContainer>
  );
}