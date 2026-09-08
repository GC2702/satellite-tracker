import { NextResponse } from "next/server";
import * as satellite from "satellite.js";

export async function GET() {
  try {
    const response = await fetch(
      "https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE",
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch satellite data");
    }

    const tle = await response.text();

    const lines = tle.trim().split("\n").map((line) => line.trim());

    const line1 = lines[1];
    const line2 = lines[2];

    if (!line1 || !line2) {
      throw new Error("Invalid TLE data");
    }

    const satrec = satellite.twoline2satrec(line1, line2);

    const now = new Date();

    const positionAndVelocity = satellite.propagate(satrec, now);

    if (
      !positionAndVelocity.position ||
      typeof positionAndVelocity.position === "boolean"
    ) {
      throw new Error("Unable to calculate satellite position");
    }

    const gmst = satellite.gstime(now);

    const geodetic = satellite.eciToGeodetic(
      positionAndVelocity.position,
      gmst
    );

    const latitude =
      satellite.degreesLat(geodetic.latitude);

    const longitude =
      satellite.degreesLong(geodetic.longitude);

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
    console.error(error);

    return NextResponse.json(
      {
        error: "Unable to retrieve satellite position",
      },
      { status: 500 }
    );
  }
}