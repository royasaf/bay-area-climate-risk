export type LayerGroup = "climate-risk" | "vulnerability";

export interface LayerConfig {
  id: string;
  label: string;
  group: LayerGroup;
  color: string;
  geojsonPath: string;
  source: {
    name: string;
    organization: string;
    url: string;
    year: string;
  };
  methodology: string;
}

export const LAYERS: LayerConfig[] = [
  {
    id: "wildfire-risk",
    label: "Wildfire Risk (WUI)",
    group: "climate-risk",
    color: "#ef4444",
    geojsonPath: "/data/wildfire-risk.geojson",
    source: {
      name: "Wildland Urban Interface",
      organization: "CAL FIRE",
      url: "https://hub.arcgis.com/maps/ab3148666b084efcbe3bec0bf6af7441/about",
      year: "2022",
    },
    methodology: "CAL FIRE designates Fire Hazard Severity Zones (FHSZ) based on fuel load, slope, fire weather, and ember production modeled across the landscape. The Wildland-Urban Interface (WUI) layer marks where structures intermingle with or are adjacent to wildland vegetation, identifying communities at elevated ignition and spread risk.",
  },
  {
    id: "sea-level-rise",
    label: "Sea Level Rise",
    group: "climate-risk",
    color: "#3b82f6",
    geojsonPath: "/data/sea-level-rise.geojson",
    source: {
      name: "Sea Level Rise Inundation Scenarios",
      organization: "NOAA",
      url: "https://coast.noaa.gov/slrdata/Sea_Level_Rise_Vectors/CA/index.html",
      year: "2023",
    },
    methodology: "NOAA's Office for Coastal Management models inundation by overlaying sea level rise scenarios (0.5–9.5 ft above current mean higher high water) onto a high-resolution digital elevation model (DEM) derived from lidar surveys. Each scenario shows the land area that would be permanently flooded under that water level, assuming no additional storm surge.",
  },
  {
    id: "community-vulnerability",
    label: "Flooding Community Vulnerability",
    group: "vulnerability",
    color: "#a855f7",
    geojsonPath: "/data/community-vulnerability.geojson",
    source: {
      name: "Community Vulnerability BCDC 2020",
      organization: "BCDC",
      url: "https://data.ca.gov/dataset/community-vulnerability-bcdc-2020",
      year: "2020",
    },
    methodology: "The San Francisco Bay Conservation and Development Commission (BCDC) scores census tracts by combining physical flood exposure with social vulnerability indicators — including poverty rate, disability status, linguistic isolation, and housing quality — drawn from the American Community Survey. Tracts with both high flood risk and low adaptive capacity rank highest.",
  },
  {
    id: "calenviroscreen",
    label: "CalEnviroScreen 4.0",
    group: "vulnerability",
    color: "#9333ea",
    geojsonPath: "/data/calenviroscreen.geojson",
    source: {
      name: "CalEnviroScreen 4.0",
      organization: "CalEPA / OEHHA",
      url: "https://oehha.ca.gov/calenviroscreen/report/calenviroscreen-40",
      year: "2021",
    },
    methodology: "OEHHA scores every California census tract using 21 indicators split into two groups: Pollution Burden (air quality, drinking water contaminants, pesticides, toxic releases, traffic, cleanup sites) and Population Characteristics (health outcomes like asthma and cardiovascular disease, plus socioeconomic factors like poverty and educational attainment). The two group scores are multiplied to produce the overall CES score, so that disadvantaged communities facing multiple stressors rank highest.",
  },
  {
    id: "urban-heat-island",
    label: "Urban Heat Island Effect",
    group: "climate-risk",
    color: "#f97316",
    geojsonPath: "/data/urban-heat-island.geojson",
    source: {
      name: "Urban Heat Island Interactive Maps",
      organization: "CalEPA",
      url: "https://calepa.ca.gov/urban-heat-island-interactive-maps/",
      year: "2023",
    },
    methodology: "CalEPA measures the Urban Heat Island Intensity (UHII) using atmospheric modeling across 182 warm-season days (2006 & 2013) at hourly timesteps. Each census tract is compared to nearby upwind rural reference points at 2 m above ground — where people experience heat. The result is expressed as DegHourDay (UHII ÷ 182): the average daily heat differential in degree-Celsius-hours. An increase of 1 °C sustained for 8 hours equals 8 °C·hr/day.",
  },
  {
    id: "cumulative-impact",
    label: "Cumulative Risk Score",
    group: "vulnerability",
    color: "#b91c1c",
    geojsonPath: "/data/cumulative-impact.geojson",
    source: {
      name: "Composite derived layer",
      organization: "This dashboard",
      url: "#",
      year: "2024",
    },
    methodology: "Weighted composite of four data layers by census tract: CalEnviroScreen 4.0 percentile (50%), Urban Heat Island intensity (20%), Wildfire hazard class (15%), and Sea Level Rise flood fraction at 1.5 ft (15%). Each component is normalised to 0–100 before weighting. Where a factor has no coverage for a tract, it is excluded and the remaining weights are renormalised. Higher scores indicate communities facing compounding structural and climate burdens.",
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

