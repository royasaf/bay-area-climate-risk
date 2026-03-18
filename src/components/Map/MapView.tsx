"use client";

import { useState, useRef } from "react";
import Map, { Source, Layer, Marker } from "react-map-gl/mapbox";
import type { MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import LayerSidebar from "./LayerSidebar";
import SearchBar from "./SearchBar";
import { LAYERS, HAZ_COLOR, VULNERABILITY_COLOR } from "@/config/layers";

const BAY_AREA = { longitude: -122.35, latitude: 37.65, zoom: 9 };

const wuiLayer = (sourceLayer: string) => ({
  id: "wildfire-risk-fill",
  type: "fill" as const,
  "source-layer": sourceLayer,
  minzoom: 5,
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

const vulnerabilityLayer = (sourceLayer: string) => ({
  id: "community-vulnerability-fill",
  type: "fill" as const,
  "source-layer": sourceLayer,
  minzoom: 5,
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

const wui        = LAYERS.find((l) => l.id === "wildfire-risk")!;
const vulnerable = LAYERS.find((l) => l.id === "community-vulnerability")!;

export default function MapView() {
  const mapRef = useRef<MapRef>(null);
  const [visible, setVisible] = useState<Record<string, boolean>>(
    Object.fromEntries(LAYERS.map((l) => [l.id, true]))
  );
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
      <LayerSidebar visible={visible} onToggle={toggleLayer} />
      <div className="flex-1 relative">
        <Map
          ref={mapRef}
          mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
          initialViewState={BAY_AREA}
          mapStyle="mapbox://styles/mapbox/light-v11"
        >
          {visible["wildfire-risk"] && (
            <Source id="wildfire-risk" type="vector" url={`mapbox://${wui.tilesetId}`}>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Layer {...(wuiLayer(wui.sourceLayer) as any)} />
            </Source>
          )}
          {visible["community-vulnerability"] && (
            <Source id="community-vulnerability" type="vector" url={`mapbox://${vulnerable.tilesetId}`}>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Layer {...(vulnerabilityLayer(vulnerable.sourceLayer) as any)} />
            </Source>
          )}
          {pin && <Marker longitude={pin.lng} latitude={pin.lat} />}
        </Map>
        <SearchBar onSelect={handleSearchSelect} />
      </div>
    </div>
  );
}
