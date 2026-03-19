"use client";

import { useState, useRef, useCallback } from "react";
import Map, { Source, Layer, Marker, Popup } from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import LayerSidebar from "./LayerSidebar";
import SearchBar from "./SearchBar";
import { LAYERS, HAZ_COLOR, VULNERABILITY_COLOR } from "@/config/layers";

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
      "interpolate", ["linear"], ["get", "degHourDay"],
        0,    "#16a34a",
        6,    "#84cc16",
        17,   "#facc15",
        45,   "#f97316",
        80,   "#dc2626",
        122,  "#7f1d1d",
    ],
    "fill-opacity": 0.7,
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cesLayer = (id: string): any => ({
  id: "calenviroscreen-fill",
  source: id,
  type: "fill",
  paint: {
    // Light → dark purple scaled to CIscore range (1–65.1), nulls transparent
    "fill-color": [
      "interpolate", ["linear"],
      ["coalesce", ["get", "CIscore"], 0],
      0,    "transparent",
      1,    "#f3e8ff",
      16.5, "#c084fc",
      26.8, "#9333ea",
      36.7, "#6b21a8",
      65,   "#3b0764",
    ],
    "fill-opacity": 0.75,
  },
});

const POLLUTION_LABELS: Record<string, string> = {
  dieselP:  "Diesel PM",
  trafficP: "Traffic",
  pmP:      "PM2.5",
  ozoneP:   "Ozone",
  pestP:    "Pesticides",
  drinkP:   "Drinking water",
  leadP:    "Lead",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CesPopup({ props }: { props: Record<string, any> }) {
  const top3 = Object.entries(POLLUTION_LABELS)
    .map(([key, label]) => ({ label, pct: props[key] ?? 0 }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 3);

  return (
    <div className="text-xs text-gray-800 min-w-[200px]">
      <p className="font-semibold text-purple-800 mb-1">
        CES Score: {props.CIscore?.toFixed(1) ?? "N/A"}
        <span className="font-normal text-gray-500 ml-1">
          ({props.CIscoreP?.toFixed(0)}th %ile)
        </span>
      </p>
      <div className="border-t border-gray-200 pt-1 mb-1">
        <p className="font-medium text-gray-600 mb-0.5">Top pollution burdens</p>
        {top3.map(({ label, pct }) => (
          <div key={label} className="flex justify-between gap-4">
            <span>{label}</span>
            <span className="font-medium">{pct?.toFixed(0)}th %ile</span>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-200 pt-1">
        <p className="font-medium text-gray-600 mb-0.5">Demographics</p>
        <div className="flex justify-between gap-4">
          <span>Poverty rate</span>
          <span className="font-medium">{props.pov?.toFixed(0)}%</span>
        </div>
        {props.Hispanic_pct > 0 && (
          <div className="flex justify-between gap-4">
            <span>Hispanic</span>
            <span className="font-medium">{props.Hispanic_pct?.toFixed(0)}%</span>
          </div>
        )}
        {props.African_American_pct > 0 && (
          <div className="flex justify-between gap-4">
            <span>Black/African Am.</span>
            <span className="font-medium">{props.African_American_pct?.toFixed(0)}%</span>
          </div>
        )}
        {props.Asian_American_pct > 0 && (
          <div className="flex justify-between gap-4">
            <span>Asian American</span>
            <span className="font-medium">{props.Asian_American_pct?.toFixed(0)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

const wui        = LAYERS.find((l) => l.id === "wildfire-risk")!;
const slr        = LAYERS.find((l) => l.id === "sea-level-rise")!;
const vulnerable = LAYERS.find((l) => l.id === "community-vulnerability")!;
const uhi        = LAYERS.find((l) => l.id === "urban-heat-island")!;
const ces        = LAYERS.find((l) => l.id === "calenviroscreen")!;

type CesHover = { lng: number; lat: number; props: Record<string, number | null> } | null;

export default function MapView() {
  const mapRef = useRef<MapRef>(null);
  const [visible, setVisible] = useState<Record<string, boolean>>(
    Object.fromEntries(LAYERS.map((l) => [l.id, true]))
  );
  const [slrLevel, setSlrLevel] = useState(1.5);
  const [pin, setPin] = useState<{ lng: number; lat: number } | null>(null);
  const [cesHover, setCesHover] = useState<CesHover>(null);

  function toggleLayer(id: string) {
    setVisible((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleSearchSelect(lng: number, lat: number) {
    setPin({ lng, lat });
    mapRef.current?.flyTo({ center: [lng, lat], zoom: 13, duration: 1200 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMouseMove = useCallback((e: any) => {
    const feat = e.features?.[0];
    if (feat && feat.properties?.CIscore != null) {
      setCesHover({ lng: e.lngLat.lng, lat: e.lngLat.lat, props: feat.properties });
    } else {
      setCesHover(null);
    }
  }, []);

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
          interactiveLayerIds={visible["calenviroscreen"] ? ["calenviroscreen-fill"] : []}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setCesHover(null)}
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
          {visible["calenviroscreen"] && (
            <Source id="calenviroscreen" type="geojson" data={ces.geojsonPath}>
              <Layer {...cesLayer("calenviroscreen")} />
            </Source>
          )}
          {visible["urban-heat-island"] && (
            <Source id="urban-heat-island" type="geojson" data={uhi.geojsonPath}>
              <Layer {...uhiLayer("urban-heat-island")} />
            </Source>
          )}
          {cesHover && (
            <Popup
              longitude={cesHover.lng}
              latitude={cesHover.lat}
              closeButton={false}
              anchor="bottom-left"
              offset={8}
            >
              <CesPopup props={cesHover.props} />
            </Popup>
          )}
          {pin && <Marker longitude={pin.lng} latitude={pin.lat} />}
        </Map>
        <SearchBar onSelect={handleSearchSelect} />
      </div>
    </div>
  );
}
