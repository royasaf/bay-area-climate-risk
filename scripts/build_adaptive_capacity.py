#!/usr/bin/env python3
"""
Build adaptive capacity layer from CDC Social Vulnerability Index (2022).

Adaptive Capacity = 1 - RPL_THEMES  (SVI overall percentile, 0–1 scale)
  - RPL_THEMES = 0 → least vulnerable → highest adaptive capacity (score=100)
  - RPL_THEMES = 1 → most vulnerable  → lowest adaptive capacity  (score=0)

Output field: ac_score (0–100), svi_score (0–100, raw SVI × 100)
Output: public/data/adaptive-capacity.geojson
"""
import warnings; warnings.filterwarnings("ignore")
import urllib.request
import pandas as pd
import geopandas as gpd
from pathlib import Path

DATA = Path(__file__).parent.parent / "public/data"
SVI_URL = "https://svi.cdc.gov/Documents/Data/2022/CSV/States/California.csv"

# ── Download SVI ──────────────────────────────────────────────────────────────
print("Downloading CDC SVI 2022 (California)...")
req = urllib.request.Request(SVI_URL, headers={"User-Agent": "Mozilla/5.0"})
svi = pd.read_csv(urllib.request.urlopen(req, timeout=60))
print(f"  {len(svi)} tracts")

# Keep only valid rows (RPL_THEMES = -999 means no data)
svi = svi[svi["RPL_THEMES"] >= 0].copy()
svi["tract"] = svi["FIPS"].astype(int)
svi["svi_score"] = (svi["RPL_THEMES"] * 100).round(1)        # 0–100, high = vulnerable
svi["ac_score"]  = ((1 - svi["RPL_THEMES"]) * 100).round(1)  # 0–100, high = resilient
print(f"  {len(svi)} tracts with valid SVI data")
print(f"  SVI range: {svi['svi_score'].min()}–{svi['svi_score'].max()}")

# ── Join to CES tract polygons ────────────────────────────────────────────────
print("Joining to census tract geometries...")
ces = gpd.read_file(DATA / "calenviroscreen.geojson")[["tract", "geometry"]]

out = ces.merge(svi[["tract", "svi_score", "ac_score"]], on="tract", how="left")
matched = out["ac_score"].notna().sum()
print(f"  Matched {matched}/{len(out)} tracts")

# ── Export ────────────────────────────────────────────────────────────────────
print("Exporting adaptive-capacity.geojson...")
out.to_file(DATA / "adaptive-capacity.geojson", driver="GeoJSON")
print(f"  Saved {DATA / 'adaptive-capacity.geojson'}")
print("Done.")
