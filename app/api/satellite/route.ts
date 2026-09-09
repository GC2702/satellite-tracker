import { NextRequest, NextResponse } from "next/server";
import * as satellite from "satellite.js";

const TLE_CACHE_TIME = 2 * 60 * 60 * 1000;

const SATELLITES: Record<
  string,
  {
    name: string;
    line1: string;
    line2: string;
  }
> = {
  "25544": {
    name: "ISS (ZARYA)",
    line1:
      "1 25544U 98067A   26250.69200809  .00005759  00000+0  11253-3 0  9999",
    line2:
      "2 25544  51.6306 251.7517 0004980 116.5212 243.6288 15.49021131584546",
  },
};

const cachedTles: Record<
  string,
  {
    line1: string;
    line2: string;
    fetchedAt: number;
  }
> = {};

async function refreshTLE(noradId: string) {
  const url =
    `https://celestrak.org/NORAD/elements/gp.php?CATNR=${noradId}&FORMAT=TLE`;

  try {
    const response = await fetch(url, {
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

    if (lines.length < 3 || !lines[1] || !lines[2]) {
      return;
    }

    cachedTles[noradId] = {
      line1: lines[1],
      line2: lines[2],
      fetchedAt: Date.now(),
    };
  } catch {}
}

async function getTLE(noradId: string) {
  const cached = cachedTles[noradId];

  if (
    cached &&
    Date.now() - cached.fetchedAt < TLE_CACHE_TIME
  ) {
    return cached;
  }

  if (!cached && SATELLITES[noradId]) {
    cachedTles[noradId] = {
      line1: SATELLITES[noradId].line1,
      line2: SATELLITES[noradId].line2,
      fetchedAt: 0,
    };
  }

  refreshTLE(noradId);

  return cachedTles[noradId] ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const noradId =
      request.nextUrl.searchParams.get("norad") ?? "25544";

    const tle = await getTLE(noradId);

    if (!tle) {
      return NextResponse.json(
        {
          error: "Satellite not found",
        },
        {
          status: 404,
        }
      );
    }

    const satelliteInfo = SATELLITES[noradId];

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
      name: satelliteInfo?.name ?? `NORAD ${noradId}`,
      noradId: Number(noradId),
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