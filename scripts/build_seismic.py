#!/usr/bin/env python3
"""
Build seismic hazard score per census tract for the Bay Area.

Components (0–100 each, capped at 100 combined):
  1. Fault proximity  : tract intersects/is adjacent to Quaternary fault → +40
  2. Liquefaction zone: tract overlaps CGS designated liquefaction zone  → +50
  3. PGA (ground shaking): county-level USGS PGA normalised to 0–10

Sources:
  - Faults:      CGS Fault Activity Map — Quaternary Faults (public)
  - Liquefaction: CGS Seismic Hazards Program via ArcGIS FeatureServer (public)
  - PGA:         USGS NSHM 2018 median PGA at 2% in 50 yr (475-yr return)

Output: public/data/seismic-hazard.geojson  (fields: seismic_score, fault_score,
        liq_score, pga_score, in_fault_zone, in_liq_zone)
"""

import json, urllib.request
import numpy as np
import geopandas as gpd
from shapely.geometry import shape, box
from shapely.validation import make_valid
from pathlib import Path

DATA = Path(__file__).parent.parent / "public/data"

BAY_AREA_BBOX = (-123.0, 37.0, -121.0, 38.5)

# ── County-level PGA values (USGS NSHM, ~2% in 50 yr, 475-yr RP, Site Class C) ──
# Values in g; source: USGS Unified Hazard Tool, 0.2s PGA approximation
# County FIPS → (name, PGA) — 5-digit CA county FIPS prefix of census tract
COUNTY_PGA = {
    "06075": ("San Francisco", 1.50),
    "06001": ("Alameda",       1.40),
    "06085": ("Santa Clara",   1.30),
    "06013": ("Contra Costa",  1.10),
    "06081": ("San Mateo",     1.30),
    "06041": ("Marin",         1.20),
    "06097": ("Sonoma",        0.90),
    "06055": ("Napa",          0.80),
    "06095": ("Solano",        0.70),
}
PGA_MAX = 1.50  # normalise to 0–10


def fetch_geojson_paged(base_url: str, bbox: tuple, max_features: int = 5000) -> dict:
    """Fetch all features from an ArcGIS FeatureServer with offset pagination."""
    minx, miny, maxx, maxy = bbox
    geom_str = f"{minx},{miny},{maxx},{maxy}"
    all_features = []
    offset = 0
    page_size = 1000

    while True:
        url = (
            f"{base_url}/query?where=1%3D1"
            f"&outFields=*"
            f"&geometry={geom_str}"
            f"&geometryType=esriGeometryEnvelope"
            f"&inSR=4326&outSR=4326"
            f"&resultOffset={offset}&resultRecordCount={page_size}"
            f"&f=geojson"
        )
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        try:
            r = urllib.request.urlopen(req, timeout=30)
            data = json.loads(r.read())
        except Exception as e:
            print(f"  Warning: fetch failed at offset {offset} — {e}")
            break

        features = data.get("features", [])
        all_features.extend(features)
        print(f"  ... fetched {len(all_features)} features")

        if len(features) < page_size or len(all_features) >= max_features:
            break
        offset += page_size

    return {"type": "FeatureCollection", "features": all_features}


# ── Load base tract geometry (CalEnviroScreen) ───────────────────────────────
print("Loading CalEnviroScreen tracts (base geometry)...")
ces = gpd.read_file(DATA / "calenviroscreen.geojson")[["tract", "geometry"]]
# Derive county FIPS from first 5 digits of 11-digit tract FIPS
ces["county_fips"] = ces["tract"].astype(str).str.zfill(11).str[:5]
ces.geometry = ces.geometry.apply(make_valid)
ces = ces.set_index("tract")
print(f"  {len(ces)} tracts")

# ── 1. Quaternary Fault proximity ────────────────────────────────────────────
print("Fetching Quaternary Fault lines (CGS FAM)...")
FAULT_URL = "https://gis.conservation.ca.gov/server/rest/services/CGS/FAM_QFaults/MapServer/0"
fault_fc = fetch_geojson_paged(FAULT_URL, BAY_AREA_BBOX)
print(f"  {len(fault_fc['features'])} fault segments")

if fault_fc["features"]:
    fault_gdf = gpd.GeoDataFrame.from_features(fault_fc["features"], crs="EPSG:4326")
    fault_gdf.geometry = fault_gdf.geometry.apply(make_valid)

    # Save fault lines for display layer
    fault_gdf.to_file(DATA / "seismic-faults.geojson", driver="GeoJSON")
    print("  Saved seismic-faults.geojson")

    # Buffer faults by 1 km (EPSG:3310) to determine proximity
    ces_proj = ces.to_crs("EPSG:3310")
    fault_proj = fault_gdf.to_crs("EPSG:3310")
    fault_union = fault_proj.geometry.union_all()
    fault_buffered = fault_union.buffer(1000)  # 1 km buffer

    ces["in_fault_zone"] = ces_proj.geometry.intersects(fault_buffered).astype(int)
else:
    print("  WARNING: No fault data fetched — setting fault score to 0")
    ces["in_fault_zone"] = 0

fault_count = ces["in_fault_zone"].sum()
print(f"  {fault_count} tracts within 1 km of Quaternary fault")

# ── 2. CGS Liquefaction Hazard Zones ────────────────────────────────────────
print("Fetching CGS Liquefaction Zones...")
LIQ_URL = "https://services2.arcgis.com/zr3KAIbsRSUyARHG/arcgis/rest/services/CGS_Liquefaction_Zones/FeatureServer/0"
liq_fc = fetch_geojson_paged(LIQ_URL, BAY_AREA_BBOX, max_features=10000)
print(f"  {len(liq_fc['features'])} liquefaction zone polygons")

if liq_fc["features"]:
    liq_gdf = gpd.GeoDataFrame.from_features(liq_fc["features"], crs="EPSG:4326")
    liq_gdf = liq_gdf[liq_gdf.geometry.notna()].copy()
    liq_gdf.geometry = liq_gdf.geometry.apply(make_valid)

    # Save liquefaction zones for display layer
    liq_gdf[["geometry", "QUAD_NAME", "RELEASED"]].to_file(
        DATA / "seismic-liquefaction.geojson", driver="GeoJSON"
    )
    print("  Saved seismic-liquefaction.geojson")

    # Area-weighted intersection: fraction of tract covered by liquefaction zone
    ces_proj = ces.to_crs("EPSG:3310")
    liq_proj = liq_gdf.to_crs("EPSG:3310")

    liq_union = liq_proj.geometry.union_all()

    def liq_fraction(geom):
        inter = geom.intersection(liq_union)
        if geom.area == 0:
            return 0.0
        return inter.area / geom.area

    print("  Computing liquefaction overlap per tract...")
    ces["liq_fraction"] = ces_proj.geometry.apply(liq_fraction)
    ces["in_liq_zone"] = (ces["liq_fraction"] > 0.05).astype(int)  # >5% overlap
else:
    print("  WARNING: No liquefaction data fetched — setting liq score to 0")
    ces["liq_fraction"] = 0.0
    ces["in_liq_zone"] = 0

liq_count = ces["in_liq_zone"].sum()
print(f"  {liq_count} tracts with significant liquefaction zone overlap")

# ── 3. County PGA score ──────────────────────────────────────────────────────
# Normalise PGA to 0–10 range
def pga_score(fips):
    entry = COUNTY_PGA.get(str(fips).zfill(5))
    if entry:
        return round((entry[1] / PGA_MAX) * 10, 1)
    return 5.0  # neutral default

ces["pga_score"] = ces["county_fips"].apply(pga_score)
print(f"  PGA scores: mean={ces['pga_score'].mean():.1f}, min={ces['pga_score'].min()}, max={ces['pga_score'].max()}")

# ── 4. Composite seismic score ───────────────────────────────────────────────
# fault_score: 0 or 40 (in fault zone proximity)
# liq_score:   0 or 50 (in CGS liquefaction zone)
# pga_score:   0–10
# Combined, capped at 100

ces["fault_score"] = ces["in_fault_zone"] * 40
ces["liq_score"]   = ces["in_liq_zone"] * 50
ces["seismic_score"] = (ces["fault_score"] + ces["liq_score"] + ces["pga_score"]).clip(0, 100).round(1)

print(f"\nSeismic score distribution:")
print(ces["seismic_score"].describe().round(1))

# ── 5. Export ────────────────────────────────────────────────────────────────
print("\nExporting seismic-hazard.geojson...")
out_cols = ["geometry", "seismic_score", "fault_score", "liq_score", "pga_score",
            "in_fault_zone", "in_liq_zone"]
out = ces[out_cols].reset_index()
out = out.to_crs("EPSG:4326")
out.to_file(DATA / "seismic-hazard.geojson", driver="GeoJSON")
print(f"  Saved {len(out)} tracts to seismic-hazard.geojson")

q = ces["seismic_score"].quantile([0.25, 0.50, 0.75, 0.90, 0.95])
print("\nPercentile breaks:")
for p, v in q.items():
    print(f"  p{int(p*100):3d}: {v:.1f}")
print("Done.")
