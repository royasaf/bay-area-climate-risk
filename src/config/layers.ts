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
    id: "seismic-hazard",
    label: "Seismic Hazard",
    group: "climate-risk",
    color: "#b45309",
    geojsonPath: "/data/seismic-hazard.geojson",
    source: {
      name: "Fault Activity Map & Seismic Hazard Zones",
      organization: "CGS / USGS",
      url: "https://www.conservation.ca.gov/cgs/geologic-hazards",
      year: "2023",
    },
    methodology: "Composite seismic score per census tract combining three components: fault proximity (Quaternary faults from CGS Fault Activity Map, +40 if within 1 km), liquefaction hazard zone (CGS Seismic Hazards Program, +50 if in designated zone), and county-level Peak Ground Acceleration from USGS NSHM 2018 (0–10 pts). Scores are capped at 100. Fault lines shown as overlay.",
  },
  {
    id: "adaptive-capacity",
    label: "Adaptive Capacity (SVI)",
    group: "vulnerability",
    color: "#16a34a",
    geojsonPath: "/data/adaptive-capacity.geojson",
    source: {
      name: "Social Vulnerability Index 2022",
      organization: "CDC / ATSDR",
      url: "https://www.atsdr.cdc.gov/placeandhealth/svi/index.html",
      year: "2022",
    },
    methodology: "The CDC Social Vulnerability Index (SVI) measures a community's ability to withstand and recover from external stressors using 16 census variables across four themes: socioeconomic status, household characteristics, racial & ethnic minority status, and housing type & transportation. Adaptive Capacity is displayed here as the inverse of SVI — green tracts have high capacity to prepare and recover; red tracts have low capacity.",
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
    methodology: "Applies the vulnerability science formula: Final Risk = Hazard × CES Sensitivity × (1 − Adaptive Capacity). Hazard is a weighted composite of five physical layers (Wildfire 25%, Flood/SLR 25%, Seismic 20%, Urban Heat Island 20%, Air Quality 10%), each normalised 0–100. CES Sensitivity uses CalEnviroScreen percentile as an environmental burden amplifier. Adaptive Capacity is derived from the CDC Social Vulnerability Index (1 − SVI percentile).",
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

