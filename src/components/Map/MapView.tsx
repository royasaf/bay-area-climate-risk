"use client";

import { useState, useRef } from "react";
import Map, { Source, Layer, Marker } from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import LayerSidebar from "./LayerSidebar";
import SearchBar from "./SearchBar";
import { LAYERS, HAZ_COLOR, VULNERABILITY_COLOR, UHI_COLOR } from "@/config/layers";

const BAY_AREA = { longitude: -122.35, latitude: 37.65, zoom: 9 };
const OPENFREEMAP_STYLE = "https://tiles.openfreemap.org/styles/positron";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const wuiLayer = (id: string): any => ({
  id: "wildfire-risk-fill",
  source: id,
  type: "fill",
  paint: {
    "fill-color": [
      "match", ["get", "HAZ_DESC"],
      "Very High", HAZ_COLOR["Very High"],
      "High",      HAZ_COLOR["High"],
      "Moderate",  HAZ_COLOR["Moderate"],
      "transparent",
    ],
    "fill-opacity": 0.6,
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const slrLayer = (id: string): any => ({
  id: "sea-level-rise-fill",
  source: id,
  type: "fill",
  paint: {
    "fill-color": "#3b82f6",
    "fill-opacity": 0.5,
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const vulnerabilityLayer = (id: string): any => ({
  id: "community-vulnerability-fill",
  source: id,
  type: "fill",
  paint: {
    "fill-color": [
      "match", ["get", "socVulnRank"],
      "Highest social vulnerability",  VULNERABILITY_COLOR["Highest social vulnerability"],
      "High social vulnerability",     VULNERABILITY_COLOR["High social vulnerability"],
      "Moderate social vulnerability", VULNERABILITY_COLOR["Moderate social vulnerability"],
      "Low social vulnerability",      VULNERABILITY_COLOR["Low social vulnerability"],
      "transparent",
    ],
    "fill-opacity": 0.65,
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const uhiLayer = (id: string): any => ({
  id: "urban-heat-island-fill",
  source: id,
  type: "fill",
  paint: {
    "fill-color": [
      "match", ["get", "uhiiRank"],
      "Very High", UHI_COLOR["Very High"],
      "High",      UHI_COLOR["High"],
      "Moderate",  UHI_COLOR["Moderate"],
      "Low",       UHI_COLOR["Low"],
      "transparent",
    ],
    "fill-opacity": 0.7,
  },
});

const wui        = LAYERS.find((l) => l.id === "wildfire-risk")!;
const slr        = LAYERS.find((l) => l.id === "sea-level-rise")!;
const vulnerable = LAYERS.find((l) => l.id === "community-vulnerability")!;
const uhi        = LAYERS.find((l) => l.id === "urban-heat-island")!;

// Debug: log UHI data distribution when loaded
async function logUhiStats() {
  const res = await fetch(uhi.geojsonPath);
  const data = await res.json();
  const vals: number[] = data.features
    .map((f: { properties: { degHourDay?: number } }) => f.properties.degHourDay)
    .filter((v: unknown) => v != null && (v as number) > 0)
    .sort((a: number, b: number) => a - b);
  const n = vals.length;
  const nullCount = data.features.length - n;
  console.group("UHI degHourDay stats");
  console.log("Total features:", data.features.length);
  console.log("Null/zero values:", nullCount);
  console.log("Min:", vals[0], "Max:", vals[n - 1]);
  console.log("p25:", vals[Math.floor(n * 0.25)], "p50:", vals[Math.floor(n * 0.5)], "p75:", vals[Math.floor(n * 0.75)]);
  console.log("Sample (first 10):", vals.slice(0, 10));
  console.log("Thresholds used — Low:<10, Moderate:10-30, High:30-70, Very High:>70");
  console.log("Counts by rank:", Object.fromEntries(
    ["Low","Moderate","High","Very High"].map(r => [r, data.features.filter((f: {properties:{uhiiRank:string}}) => f.properties.uhiiRank === r).length])
  ));
  console.groupEnd();
}
if (typeof window !== "undefined") logUhiStats();

export default function MapView() {
  const mapRef = useRef<MapRef>(null);
  const [visible, setVisible] = useState<Record<string, boolean>>(
    Object.fromEntries(LAYERS.map((l) => [l.id, true]))
  );
  const [slrLevel, setSlrLevel] = useState(1.5);
  const [pin, setPin] = useState<{ lng: number; lat: number } | null>(null);

  function toggleLayer(id: string) {
    setVisible((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleSearchSelect(lng: number, lat: number) {
    setPin({ lng, lat });
    mapRef.current?.flyTo({ center: [lng, lat], zoom: 13, duration: 1200 });
  }

  return (
    <div className="flex h-screen w-screen">
      <LayerSidebar
        visible={visible}
        onToggle={toggleLayer}
        slrLevel={slrLevel}
        onSlrLevelChange={setSlrLevel}
      />
      <div className="flex-1 relative">
        <Map
          ref={mapRef}
          initialViewState={BAY_AREA}
          mapStyle={OPENFREEMAP_STYLE}
        >
          {visible["wildfire-risk"] && (
            <Source id="wildfire-risk" type="geojson" data={wui.geojsonPath}>
              <Layer {...wuiLayer("wildfire-risk")} />
            </Source>
          )}
          {visible["sea-level-rise"] && (
            <Source id="sea-level-rise" type="geojson" data={slr.geojsonPath}>
              <Layer
                {...slrLayer("sea-level-rise")}
                filter={["==", ["get", "level"], slrLevel]}
              />
            </Source>
          )}
          {visible["community-vulnerability"] && (
            <Source id="community-vulnerability" type="geojson" data={vulnerable.geojsonPath}>
              <Layer {...vulnerabilityLayer("community-vulnerability")} />
            </Source>
          )}
          {visible["urban-heat-island"] && (
            <Source id="urban-heat-island" type="geojson" data={uhi.geojsonPath}>
              <Layer {...uhiLayer("urban-heat-island")} />
            </Source>
          )}
          {pin && <Marker longitude={pin.lng} latitude={pin.lat} />}
        </Map>
        <SearchBar onSelect={handleSearchSelect} />
      </div>
    </div>
  );
}
