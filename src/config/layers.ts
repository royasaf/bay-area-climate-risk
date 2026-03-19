export interface LayerConfig {
  id: string;
  label: string;
  color: string;
  geojsonPath: string;
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
    geojsonPath: "/data/wildfire-risk.geojson",
    source: {
      name: "Wildland Urban Interface",
      organization: "CAL FIRE",
      url: "https://hub.arcgis.com/maps/ab3148666b084efcbe3bec0bf6af7441/about",
      year: "2022",
    },
  },
  {
    id: "sea-level-rise",
    label: "Sea Level Rise",
    color: "#3b82f6",
    geojsonPath: "/data/sea-level-rise.geojson",
    source: {
      name: "Sea Level Rise Inundation Scenarios",
      organization: "NOAA",
      url: "https://coast.noaa.gov/slrdata/Sea_Level_Rise_Vectors/CA/index.html",
      year: "2023",
    },
  },
  {
    id: "community-vulnerability",
    label: "Flooding Community Vulnerability",
    color: "#a855f7",
    geojsonPath: "/data/community-vulnerability.geojson",
    source: {
      name: "Community Vulnerability BCDC 2020",
      organization: "BCDC",
      url: "https://data.ca.gov/dataset/community-vulnerability-bcdc-2020",
      year: "2020",
    },
  },
  {
    id: "urban-heat-island",
    label: "Urban Heat Island Effect",
    color: "#f97316",
    geojsonPath: "/data/urban-heat-island.geojson",
    source: {
      name: "Urban Heat Island Interactive Maps",
      organization: "CalEPA",
      url: "https://calepa.ca.gov/urban-heat-island-interactive-maps/",
      year: "2023",
    },
  },
];

// Shared hazard class palette
export const HAZ_COLOR: Record<string, string> = {
  "Very High": "#dc2626",
  "High":      "#f97316",
  "Moderate":  "#fbbf24",
};

export const WILDFIRE_COLOR = HAZ_COLOR;

export const VULNERABILITY_COLOR: Record<string, string> = {
  "Highest social vulnerability":  "#6d28d9",
  "High social vulnerability":     "#a855f7",
  "Moderate social vulnerability": "#c4b5fd",
  "Low social vulnerability":      "#ede9fe",
};
