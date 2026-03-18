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
      name: "Mean Tide Level Inundation Scenarios",
      organization: "BCDC",
      url: "https://www.bcdc.ca.gov/planning/climate-change/sea-level-rise-adaptation/",
      year: "2023",
    },
  },
  {
    id: "community-vulnerability",
    label: "Community Vulnerability",
    color: "#a855f7",
    geojsonPath: "/data/community-vulnerability.geojson",
    source: {
      name: "Community Vulnerability BCDC 2020",
      organization: "BCDC",
      url: "https://data.ca.gov/dataset/community-vulnerability-bcdc-2020",
      year: "2020",
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
