import { NextResponse } from "next/server";
import * as satellite from "satellite.js";

const TLE_URL =
  "https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE";

const TLE_CACHE_TIME = 2 * 60 * 60 * 1000;

const FALLBACK_TLE = {
  line1:
    "1 25544U 98067A   26250.69200809  .00005759  00000+0  11253-3 0  9999",
  line2:
    "2 25544  51.6306 251.7517 0004980 116.5212 243.6288 15.49021131584546",
};

let cachedTle = {
  ...FALLBACK_TLE,
  fetchedAt: 0,
};

async function refreshTLE() {
  try {
    const response = await fetch(TLE_URL, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      return;
    }

    const tle = await response.text();

    const lines = tle
      .trim()
      .split("\n")
      .map((line) => line.trim());

    if (lines.length < 3) {
      return;
    }

    if (!lines[1] || !lines[2]) {
      return;
    }

    cachedTle = {
      line1: lines[1],
      line2: lines[2],
      fetchedAt: Date.now(),
    };
  } catch {
  }
}

async function getTLE() {
  const now = Date.now();

  if (now - cachedTle.fetchedAt >= TLE_CACHE_TIME) {
    refreshTLE();
  }

  return cachedTle;
}

export async function GET() {
  try {
    const tle = await getTLE();

    const satrec = satellite.twoline2satrec(
      tle.line1,
      tle.line2
    );

    const now = new Date();

    const positionAndVelocity =
      satellite.propagate(satrec, now);

    if (
      !positionAndVelocity.position ||
      typeof positionAndVelocity.position === "boolean"
    ) {
      throw new Error(
        "Unable to calculate satellite position"
      );
    }

    const gmst = satellite.gstime(now);

    const geodetic = satellite.eciToGeodetic(
      positionAndVelocity.position,
      gmst
    );

    const latitude = satellite.degreesLat(
      geodetic.latitude
    );

    const longitude = satellite.degreesLong(
      geodetic.longitude
    );

    const altitude = geodetic.height;

    return NextResponse.json({
      name: "ISS (ZARYA)",
      noradId: 25544,
      latitude,
      longitude,
      altitude,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Satellite calculation error:", error);

    return NextResponse.json(
      {
        error: "Unable to calculate satellite position",
      },
      {
        status: 500,
      }
    );
  }
}