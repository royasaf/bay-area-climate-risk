"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Map, { Source, Layer, Marker, Popup } from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import LayerSidebar from "./LayerSidebar";
import SearchBar from "./SearchBar";
import { LAYERS, HAZ_COLOR } from "@/config/layers";

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
const seismicLayer = (id: string): any => ({
  id: "seismic-hazard-fill",
  source: id,
  type: "fill",
  paint: {
    "fill-color": [
      "interpolate", ["linear"], ["get", "seismic_score"],
        0,  "#fef3c7",
        10, "#fde68a",
        45, "#f97316",
        60, "#dc2626",
        90, "#7f1d1d",
    ],
    "fill-opacity": 0.7,
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const faultLinesLayer = (): any => ({
  id: "seismic-faults-line",
  source: "seismic-faults",
  type: "line",
  paint: {
    "line-color": "#dc2626",
    "line-width": 1.5,
    "line-opacity": 0.8,
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adaptiveCapacityLayer = (id: string): any => ({
  id: "adaptive-capacity-fill",
  source: id,
  type: "fill",
  paint: {
    "fill-color": [
      "interpolate", ["linear"], ["get", "ac_score"],
      0,   "#dc2626",
      25,  "#f97316",
      50,  "#facc15",
      75,  "#84cc16",
      100, "#16a34a",
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
      1.9,  "#fde047",
      7.4,  "#f97316",
      16.8, "#dc2626",
      40.0, "#450a0a",
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

function formatTract(tract: number | string | null | undefined): string {
  if (tract == null) return "—";
  const s = String(tract).padStart(11, "0");
  const num = s.slice(5); // last 6 digits = tract number
  return `${parseInt(num.slice(0, 4))}.${num.slice(4)}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CesPopup({ props }: { props: Record<string, any> }) {
  const top3 = Object.entries(POLLUTION_LABELS)
    .map(([key, label]) => ({ label, pct: props[key] ?? 0 }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 3);

  return (
    <div className="text-xs text-gray-800 min-w-[200px]">
      <p className="text-gray-400 mb-1">Census Tract {formatTract(props.tract)}</p>
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
function AdaptiveCapacityPopup({ props }: { props: Record<string, any> }) {
  const ac = props.ac_score;
  const label = ac >= 75 ? "High" : ac >= 50 ? "Moderate" : ac >= 25 ? "Low" : "Very Low";
  const color = ac >= 75 ? "text-green-700" : ac >= 50 ? "text-yellow-600" : ac >= 25 ? "text-orange-600" : "text-red-700";
  return (
    <div className="text-xs text-gray-800 min-w-[160px]">
      <p className="text-gray-400 mb-1">Census Tract {formatTract(props.tract)}</p>
      <p className={`font-semibold mb-1 ${color}`}>
        Adaptive Capacity: {ac != null ? ac.toFixed(0) : "N/A"}/100
        <span className="font-normal text-gray-500 ml-1">({label})</span>
      </p>
      <p className="text-gray-500">SVI: {props.svi_score != null ? props.svi_score.toFixed(0) : "N/A"}/100</p>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SeismicPopup({ props }: { props: Record<string, any> }) {
  const score = props.seismic_score;
  const label = score >= 80 ? "Very High" : score >= 60 ? "High" : score >= 40 ? "Moderate" : score >= 20 ? "Low" : "Very Low";
  const color = score >= 80 ? "text-red-800" : score >= 60 ? "text-red-700" : score >= 40 ? "text-orange-600" : "text-yellow-700";
  return (
    <div className="text-xs text-gray-800 min-w-[180px]">
      <p className="text-gray-400 mb-1">Census Tract {formatTract(props.tract)}</p>
      <p className={`font-semibold mb-1 ${color}`}>
        Seismic Score: {score != null ? score.toFixed(0) : "N/A"}/100
        <span className="font-normal text-gray-500 ml-1">({label})</span>
      </p>
      <div className="border-t border-gray-200 pt-1 space-y-0.5">
        <div className="flex justify-between gap-4">
          <span>Fault proximity</span>
          <span className="font-medium">{props.fault_score != null ? props.fault_score : "N/A"}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Liquefaction zone</span>
          <span className="font-medium">{props.liq_score != null ? props.liq_score : "N/A"}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Ground shaking (PGA)</span>
          <span className="font-medium">{props.pga_score != null ? props.pga_score.toFixed(1) : "N/A"}</span>
        </div>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CumulativePopup({ props }: { props: Record<string, any> }) {
  const components = [
    { label: "Wildfire Risk",     score: props.score_wui,     weight: "25%" },
    { label: "Flood / SLR",       score: props.score_slr,     weight: "25%" },
    { label: "Seismic Hazard",    score: props.score_seismic, weight: "20%" },
    { label: "Urban Heat Island", score: props.score_uhi,     weight: "20%" },
    { label: "Air Quality",       score: props.score_aq,      weight: "10%" },
  ];
  const fmt = (v: number | null | undefined) =>
    v == null || isNaN(v as number) ? "N/A" : (v as number).toFixed(0);
  return (
    <div className="text-xs text-gray-800 min-w-[200px]">
      <p className="text-gray-400 mb-1">Census Tract {formatTract(props.tract)}</p>
      <p className="font-semibold text-red-800 mb-1">
        Vulnerability Score: {props.composite?.toFixed(1) ?? "N/A"}
      </p>
      <div className="border-t border-gray-200 pt-1 mb-1">
        <p className="font-medium text-gray-600 mb-0.5">Hazard exposure ({props.hazard?.toFixed(0) ?? "N/A"})</p>
        {components.map(({ label, score, weight }) => (
          <div key={label} className="flex justify-between gap-4">
            <span>{label} <span className="text-gray-400">({weight})</span></span>
            <span className={`font-medium ${fmt(score) === "N/A" ? "text-gray-400" : ""}`}>{fmt(score)}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-200 pt-1 space-y-0.5">
        <div className="flex justify-between gap-4">
          <span className="font-medium text-gray-600">CES Sensitivity</span>
          <span className="font-medium">
            {props.score_ces != null
              ? `${((50 + props.score_ces) / 100).toFixed(2)}×`
              : "N/A"}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="font-medium text-gray-600">Adaptive Capacity</span>
          <span className="font-medium">{props.ac_score?.toFixed(0) ?? "N/A"}</span>
        </div>
      </div>
    </div>
  );
}

const LAYER_DATA = {
  "wildfire-risk":           LAYERS.find((l) => l.id === "wildfire-risk")!,
  "sea-level-rise":          LAYERS.find((l) => l.id === "sea-level-rise")!,
  "calenviroscreen":         LAYERS.find((l) => l.id === "calenviroscreen")!,
  "urban-heat-island":       LAYERS.find((l) => l.id === "urban-heat-island")!,
  "seismic-hazard":          LAYERS.find((l) => l.id === "seismic-hazard")!,
  "adaptive-capacity":       LAYERS.find((l) => l.id === "adaptive-capacity")!,
  "cumulative-impact":       LAYERS.find((l) => l.id === "cumulative-impact")!,
};

// MapLibre layer ID for each data layer
const FILL_ID: Record<string, string> = {
  "wildfire-risk":           "wildfire-risk-fill",
  "sea-level-rise":          "sea-level-rise-fill",
  "calenviroscreen":         "calenviroscreen-fill",
  "urban-heat-island":       "urban-heat-island-fill",
  "seismic-hazard":          "seismic-hazard-fill",
  "adaptive-capacity":       "adaptive-capacity-fill",
  "cumulative-impact":       "cumulative-impact-fill",
};

type HoverPopup = { lng: number; lat: number; props: Record<string, number | null> } | null;

// Heavy layers defaulted off on mobile to avoid memory crashes (wildfire is 20 MB)
const MOBILE_DEFAULT_OFF = new Set(["sea-level-rise"]);

export default function MapView({ initialIsMobile = false }: { initialIsMobile?: boolean }) {
  const mapRef = useRef<MapRef>(null);
  const [visible, setVisible] = useState<Record<string, boolean>>(() => {
    const base = Object.fromEntries(LAYERS.map((l) => [l.id, l.id === "cumulative-impact"]));
    return base;
  });
  // Top of list = rendered on top of the map (rendered last in MapLibre)
  const [layerOrder, setLayerOrder] = useState(LAYERS.map((l) => l.id));
  const [slrLevel, setSlrLevel] = useState(1.5);
  const [pin, setPin] = useState<{ lng: number; lat: number } | null>(null);
  const [cesHover, setCesHover] = useState<HoverPopup>(null);
  const [ciHover, setCiHover] = useState<HoverPopup>(null);
  const [acHover, setAcHover] = useState<HoverPopup>(null);
  const [seismicHover, setSeismicHover] = useState<HoverPopup>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(initialIsMobile);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
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
  }, []);

  function toggleLayer(id: string) {
    setVisible((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleReorder(id: string, direction: "up" | "down") {
    setLayerOrder((prev) => {
      const next = [...prev];
      const idx = next.indexOf(id);
      const swap = direction === "up" ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
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
      setCesHover(null); setAcHover(null); setSeismicHover(null);
    } else if (feat.layer?.id === "adaptive-capacity-fill") {
      setAcHover({ lng: e.lngLat.lng, lat: e.lngLat.lat, props: feat.properties });
      setCesHover(null); setCiHover(null); setSeismicHover(null);
    } else if (feat.layer?.id === "seismic-hazard-fill") {
      setSeismicHover({ lng: e.lngLat.lng, lat: e.lngLat.lat, props: feat.properties });
      setCesHover(null); setCiHover(null); setAcHover(null);
    } else if (feat.properties?.CIscore != null) {
      setCesHover({ lng: e.lngLat.lng, lat: e.lngLat.lat, props: feat.properties });
      setCiHover(null); setAcHover(null); setSeismicHover(null);
    } else {
      setCesHover(null); setCiHover(null); setAcHover(null); setSeismicHover(null);
    }
  }, []);

  // Render bottom-to-top: reverse so first item in layerOrder renders last (on top)
  const renderOrder = [...layerOrder].reverse();

  const sidebarProps = {
    visible, onToggle: toggleLayer, slrLevel,
    onSlrLevelChange: setSlrLevel, layerOrder, onReorder: handleReorder, isMobile,
  };

  return (
    <div className="map-root" style={{ display: "flex", height: "100vh", width: "100vw" }}>

      {/* Desktop: sidebar as direct flex child */}
      {!isMobile && <LayerSidebar {...sidebarProps} />}

      {/* Map area */}
      <div style={{ flex: 1, position: "relative" }}>
        <Map
          ref={mapRef}
          initialViewState={BAY_AREA}
          mapStyle={OPENFREEMAP_STYLE}
          interactiveLayerIds={[
            ...(visible["calenviroscreen"] ? ["calenviroscreen-fill"] : []),
            ...(visible["adaptive-capacity"] ? ["adaptive-capacity-fill"] : []),
            ...(visible["seismic-hazard"] ? ["seismic-hazard-fill"] : []),
            ...(visible["cumulative-impact"] ? ["cumulative-impact-fill"] : []),
          ]}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => { setCesHover(null); setCiHover(null); setAcHover(null); setSeismicHover(null); }}
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
            if (id === "seismic-hazard") return (
              <Source key={id} id={id} type="geojson" data={data.geojsonPath}>
                <Layer {...seismicLayer(id)} />
              </Source>
            );
            if (id === "adaptive-capacity") return (
              <Source key={id} id={id} type="geojson" data={data.geojsonPath}>
                <Layer {...adaptiveCapacityLayer(id)} />
              </Source>
            );
            if (id === "cumulative-impact") return (
              <Source key={id} id={id} type="geojson" data={data.geojsonPath}>
                <Layer {...cumulativeLayer(id)} />
              </Source>
            );
            return null;
          })}
          {/* Fault lines — shown when seismic-hazard layer is visible */}
          {visible["seismic-hazard"] && (
            <Source id="seismic-faults" type="geojson" data="/data/seismic-faults.geojson">
              <Layer {...faultLinesLayer()} />
            </Source>
          )}
          {cesHover && (
            <Popup longitude={cesHover.lng} latitude={cesHover.lat} closeButton={false} anchor="bottom-left" offset={8}>
              <CesPopup props={cesHover.props} />
            </Popup>
          )}
          {acHover && (
            <Popup longitude={acHover.lng} latitude={acHover.lat} closeButton={false} anchor="bottom-left" offset={8}>
              <AdaptiveCapacityPopup props={acHover.props} />
            </Popup>
          )}
          {seismicHover && (
            <Popup longitude={seismicHover.lng} latitude={seismicHover.lat} closeButton={false} anchor="bottom-left" offset={8}>
              <SeismicPopup props={seismicHover.props} />
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

        {/* Mobile: fixed toggle button — always on top of map */}
        {isMobile && (
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            style={{
              position: "fixed", bottom: 24, right: 16, zIndex: 1000,
              background: "white", border: "1px solid #e5e7eb",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              borderRadius: 999, padding: "10px 20px",
              fontSize: 15, fontWeight: 600, color: "#374151",
              display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
            }}
          >
            {sidebarOpen ? "✕ Close" : "☰ Layers"}
          </button>
        )}

        {/* Mobile: backdrop */}
        {isMobile && sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 998, background: "rgba(0,0,0,0.3)" }}
          />
        )}

        {/* Mobile: bottom sheet */}
        {isMobile && (
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 999,
            background: "white", borderRadius: "16px 16px 0 0",
            boxShadow: "0 -4px 24px rgba(0,0,0,0.15)",
            maxHeight: "70vh", overflowY: "auto",
            transform: sidebarOpen ? "translateY(0)" : "translateY(100%)",
            transition: "transform 0.3s ease",
          }}>
            <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 4px" }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: "#d1d5db" }} />
            </div>
            <LayerSidebar {...sidebarProps} />
          </div>
        )}
      </div>
    </div>
  );
}
