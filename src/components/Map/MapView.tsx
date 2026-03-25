"use client";

import { useState, useRef, useCallback, useEffect } from "react";
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
const cumulativeLayer = (id: string): any => ({
  id: "cumulative-impact-fill",
  source: id,
  type: "fill",
  paint: {
    "fill-color": [
      "interpolate", ["linear"], ["get", "composite"],
      0,    "#fef9c3",
      11.7, "#fde047",
      20.7, "#f97316",
      32.1, "#dc2626",
      74.4, "#450a0a",
    ],
    "fill-opacity": 0.75,
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cesLayer = (id: string): any => ({
  id: "calenviroscreen-fill",
  source: id,
  type: "fill",
  paint: {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CumulativePopup({ props }: { props: Record<string, any> }) {
  const components = [
    { label: "CalEnviroScreen",  score: props.score_ces,  weight: "50%" },
    { label: "Urban Heat Island", score: props.score_uhi, weight: "20%" },
    { label: "Wildfire Risk",    score: props.score_wui,  weight: "15%" },
    { label: "Sea Level Rise",   score: props.score_slr,  weight: "15%" },
  ];
  return (
    <div className="text-xs text-gray-800 min-w-[200px]">
      <p className="font-semibold text-red-800 mb-1">
        Cumulative Impact: {props.composite?.toFixed(1)}
        <span className="font-normal text-gray-500 ml-1">/ 75</span>
      </p>
      <div className="border-t border-gray-200 pt-1">
        <p className="font-medium text-gray-600 mb-0.5">Component scores</p>
        {components.map(({ label, score, weight }) => (
          <div key={label} className="flex justify-between gap-4">
            <span>{label} <span className="text-gray-400">({weight})</span></span>
            <span className="font-medium">{score?.toFixed(0)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const LAYER_DATA = {
  "wildfire-risk":        LAYERS.find((l) => l.id === "wildfire-risk")!,
  "sea-level-rise":       LAYERS.find((l) => l.id === "sea-level-rise")!,
  "community-vulnerability": LAYERS.find((l) => l.id === "community-vulnerability")!,
  "calenviroscreen":      LAYERS.find((l) => l.id === "calenviroscreen")!,
  "urban-heat-island":    LAYERS.find((l) => l.id === "urban-heat-island")!,
  "cumulative-impact":    LAYERS.find((l) => l.id === "cumulative-impact")!,
};

// MapLibre layer ID for each data layer
const FILL_ID: Record<string, string> = {
  "wildfire-risk":           "wildfire-risk-fill",
  "sea-level-rise":          "sea-level-rise-fill",
  "community-vulnerability": "community-vulnerability-fill",
  "calenviroscreen":         "calenviroscreen-fill",
  "urban-heat-island":       "urban-heat-island-fill",
  "cumulative-impact":       "cumulative-impact-fill",
};

type HoverPopup = { lng: number; lat: number; props: Record<string, number | null> } | null;

// Heavy layers defaulted off on mobile to avoid memory crashes (wildfire is 20 MB)
const MOBILE_DEFAULT_OFF = new Set(["wildfire-risk", "sea-level-rise", "community-vulnerability"]);

export default function MapView({ initialIsMobile = false }: { initialIsMobile?: boolean }) {
  const mapRef = useRef<MapRef>(null);
  const [visible, setVisible] = useState<Record<string, boolean>>(() => {
    const base = Object.fromEntries(LAYERS.map((l) => [l.id, true]));
    if (initialIsMobile) MOBILE_DEFAULT_OFF.forEach((id) => { base[id] = false; });
    return base;
  });
  // Top of list = rendered on top of the map (rendered last in MapLibre)
  const [layerOrder, setLayerOrder] = useState(LAYERS.map((l) => l.id));
  const [slrLevel, setSlrLevel] = useState(1.5);
  const [pin, setPin] = useState<{ lng: number; lat: number } | null>(null);
  const [cesHover, setCesHover] = useState<HoverPopup>(null);
  const [ciHover, setCiHover] = useState<HoverPopup>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(initialIsMobile);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      if (mobile !== isMobile) setIsMobile(mobile);
      if (mobile) {
        setVisible((prev) => {
          const next = { ...prev };
          MOBILE_DEFAULT_OFF.forEach((id) => { next[id] = false; });
          return next;
        });
      }
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleLayer(id: string) {
    setVisible((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleReorder(fromId: string, toId: string) {
    setLayerOrder((prev) => {
      const next = [...prev];
      const fromIdx = next.indexOf(fromId);
      const toIdx = next.indexOf(toId);
      next.splice(fromIdx, 1);
      next.splice(toIdx, 0, fromId);
      return next;
    });
  }

  function handleSearchSelect(lng: number, lat: number) {
    setPin({ lng, lat });
    mapRef.current?.flyTo({ center: [lng, lat], zoom: 13, duration: 1200 });
  }

  // Sync MapLibre layer z-order whenever layerOrder or visibility changes.
  // JSX render order alone doesn't reorder already-added MapLibre layers;
  // moveLayer() must be called explicitly. Moving each layer to the top in
  // renderOrder sequence puts renderOrder[last] (= layerOrder[0]) on top.
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    const apply = () => {
      [...layerOrder].reverse().forEach((id) => {
        const fillId = FILL_ID[id];
        if (map.getLayer(fillId)) map.moveLayer(fillId);
      });
    };
    if (map.isStyleLoaded()) apply();
    else map.once("load", apply);
  }, [layerOrder]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMouseMove = useCallback((e: any) => {
    const feat = e.features?.[0];
    if (!feat) {
      setCesHover(null);
      setCiHover(null);
      return;
    }
    if (feat.layer?.id === "cumulative-impact-fill") {
      setCiHover({ lng: e.lngLat.lng, lat: e.lngLat.lat, props: feat.properties });
      setCesHover(null);
    } else if (feat.properties?.CIscore != null) {
      setCesHover({ lng: e.lngLat.lng, lat: e.lngLat.lat, props: feat.properties });
      setCiHover(null);
    } else {
      setCesHover(null);
      setCiHover(null);
    }
  }, []);

  // Render bottom-to-top: reverse so first item in layerOrder renders last (on top)
  const renderOrder = [...layerOrder].reverse();

  const sidebarProps = {
    visible, onToggle: toggleLayer, slrLevel,
    onSlrLevelChange: setSlrLevel, layerOrder, onReorder: handleReorder,
  };

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw" }}>

      {/* Sidebar: left panel on desktop, fixed bottom sheet on mobile */}
      <div style={isMobile ? {
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 30,
        transform: sidebarOpen ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.3s ease",
        maxHeight: "70vh",
      } : {
        width: 240, flexShrink: 0, height: "100%",
      }}>
        {isMobile && (
          <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 4px", background: "white", borderRadius: "16px 16px 0 0" }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: "#d1d5db" }} />
          </div>
        )}
        <LayerSidebar {...sidebarProps} />
      </div>

      {/* Map area */}
      <div style={{ flex: 1, position: "relative" }}>
        <Map
          ref={mapRef}
          initialViewState={BAY_AREA}
          mapStyle={OPENFREEMAP_STYLE}
          interactiveLayerIds={[
            ...(visible["calenviroscreen"] ? ["calenviroscreen-fill"] : []),
            ...(visible["cumulative-impact"] ? ["cumulative-impact-fill"] : []),
          ]}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => { setCesHover(null); setCiHover(null); }}
        >
          {renderOrder.map((id) => {
            if (!visible[id]) return null;
            const data = LAYER_DATA[id as keyof typeof LAYER_DATA];
            if (id === "wildfire-risk") return (
              <Source key={id} id={id} type="geojson" data={data.geojsonPath}>
                <Layer {...wuiLayer(id)} />
              </Source>
            );
            if (id === "sea-level-rise") return (
              <Source key={id} id={id} type="geojson" data={data.geojsonPath}>
                <Layer {...slrLayer(id)} filter={["==", ["get", "level"], slrLevel]} />
              </Source>
            );
            if (id === "community-vulnerability") return (
              <Source key={id} id={id} type="geojson" data={data.geojsonPath}>
                <Layer {...vulnerabilityLayer(id)} />
              </Source>
            );
            if (id === "calenviroscreen") return (
              <Source key={id} id={id} type="geojson" data={data.geojsonPath}>
                <Layer {...cesLayer(id)} />
              </Source>
            );
            if (id === "urban-heat-island") return (
              <Source key={id} id={id} type="geojson" data={data.geojsonPath}>
                <Layer {...uhiLayer(id)} />
              </Source>
            );
            if (id === "cumulative-impact") return (
              <Source key={id} id={id} type="geojson" data={data.geojsonPath}>
                <Layer {...cumulativeLayer(id)} />
              </Source>
            );
            return null;
          })}
          {cesHover && (
            <Popup longitude={cesHover.lng} latitude={cesHover.lat} closeButton={false} anchor="bottom-left" offset={8}>
              <CesPopup props={cesHover.props} />
            </Popup>
          )}
          {ciHover && (
            <Popup longitude={ciHover.lng} latitude={ciHover.lat} closeButton={false} anchor="bottom-left" offset={8}>
              <CumulativePopup props={ciHover.props} />
            </Popup>
          )}
          {pin && <Marker longitude={pin.lng} latitude={pin.lat} />}
        </Map>
        <SearchBar onSelect={handleSearchSelect} />

        {/* Mobile toggle button */}
        {isMobile && (
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            style={{
              position: "absolute", bottom: 24, right: 16, zIndex: 40,
              background: "white", border: "1px solid #e5e7eb",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              borderRadius: 999, padding: "8px 16px",
              fontSize: 14, fontWeight: 500, color: "#374151",
              display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
            }}
          >
            {sidebarOpen ? "✕ Close" : "☰ Layers"}
          </button>
        )}
      </div>
    </div>
  );
}
