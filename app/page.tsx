"use client";

import dynamic from "next/dynamic";

const SatelliteMap = dynamic(() => import("./SatelliteMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center bg-black text-white">
      Loading map...
    </div>
  ),
});

export default function Home() {
  return (
    <main className="h-screen w-full bg-black">
      <SatelliteMap />
    </main>
  );
}