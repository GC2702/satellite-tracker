# 🛰️ Live Satellite Tracker

A web-based satellite tracking application that displays the real-time position of selected satellites on an interactive world map.

The application uses orbital data from CelesTrak and the `satellite.js` library to calculate satellite positions and visualize their movement on Earth.

## 🚀 Features

- 🌍 Interactive world map
- 🛰️ Live satellite position tracking
- 🔄 Automatic position updates
- 📍 Latitude and longitude information
- 📏 Satellite altitude information
- 🛤️ Orbital trail visualization
- 🎯 Follow Satellite mode
- 🔭 Multiple satellite selection
- ⚡ Real-time orbital position calculations
- 📱 Responsive web interface

## 🛰️ Supported Satellites

The current version supports:

- **ISS (ZARYA)** — NORAD ID 25544
- **Hubble Space Telescope** — NORAD ID 20580
- **NOAA 20** — NORAD ID 43013

## 🛠️ Technologies Used

- **Next.js** — Web application framework
- **React** — User interface
- **TypeScript** — Type-safe development
- **Leaflet** — Interactive maps
- **React Leaflet** — React integration for Leaflet
- **satellite.js** — Satellite orbital calculations
- **CelesTrak** — Satellite orbital data
- **Git & GitHub** — Version control

## ⚙️ How It Works

The application follows this process:

```text
CelesTrak
    ↓
Satellite TLE Data
    ↓
Next.js API
    ↓
satellite.js
    ↓
Orbital Position Calculation
    ↓
Latitude / Longitude / Altitude
    ↓
Leaflet Interactive Map