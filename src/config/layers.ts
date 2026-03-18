export interface LayerConfig {
  id: string;
  label: string;
  color: string;
  geojsonPath: string;
  tilesetId: string;    // mapbox://tilesetId
  sourceLayer: string;  // layer name inside the tileset
  source: {
    name: string;
    organization: string;
    url: string;
    year: string;
  };
}

export const LAYERS: LayerConfig[] = [
  {
    id: "wildfire-risk",
    label: "Wildfire Risk (WUI)",
    color: "#ef4444",
    geojsonPath: "/data/Wildland_Urban_Interface.geojson",
    tilesetId: "royasaf.wildfire-risk",
    sourceLayer: "wildfire_risk",
    source: {
      name: "Wildland Urban Interface",
      organization: "CAL FIRE",
      url: "https://hub.arcgis.com/maps/ab3148666b084efcbe3bec0bf6af7441/about",
      year: "2022",
    },
  },
  {
    id: "community-vulnerability",
    label: "Community Vulnerability",
    color: "#a855f7",
    geojsonPath: "/data/CommunityVulnerability2020_-7044967969664837102.geojson",
    tilesetId: "royasaf.community-vuln",
    sourceLayer: "community_vulnerability",
    source: {
      name: "Community Vulnerability BCDC 2020",
      organization: "BCDC",
      url: "https://data.ca.gov/dataset/community-vulnerability-bcdc-2020",
      year: "2020",
    },
  },
];

// Shared hazard class palette (used by WUI HAZ_DESC and FHSZ Haz_Class)
export const HAZ_COLOR: Record<string, string> = {
  "Very High": "#dc2626",
  "High":      "#f97316",
  "Moderate":  "#fbbf24",
};

// Backward-compat alias
export const WILDFIRE_COLOR = HAZ_COLOR;

export const VULNERABILITY_COLOR: Record<string, string> = {
  "Highest social vulnerability":  "#6d28d9",
  "High social vulnerability":     "#a855f7",
  "Moderate social vulnerability": "#c4b5fd",
  "Low social vulnerability":      "#ede9fe",
};
