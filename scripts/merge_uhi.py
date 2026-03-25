#!/usr/bin/env python3
"""
Merge all Bay Area UHI shapefiles into a single urban-heat-island.geojson.

Sources:
  - Existing East Bay data (urban-heat-island.geojson, already in EPSG:4326)
  - New polygon shapefiles for: Fairfield, Napa, San Rafael, Santa Rosa,
    San Francisco, Vallejo, Walnut Creek, Antioch
  - San Jose (point centroids → spatially joined to CES tract polygons)

All new shapefiles are in Lambert Conformal Heat Map projection.
UHII values are total deg-hours; divide by 182 to get degHourDay.

Deduplication: by FIPS (11-digit string, leading zero). If a tract appears in
multiple datasets, keep the one with the larger degHourDay value (more confident).
"""
import numpy as np
import geopandas as gpd
import pandas as pd
from pathlib import Path

DATA = Path(__file__).parent.parent / "public/data"
UHII_DAYS = 182  # study period warm-season days

def load_polygon_shp(path, fips_col="FIPS", uhii_col="UHII"):
    """Load a polygon UHI shapefile, reproject to WGS84, compute degHourDay."""
    gdf = gpd.read_file(path)
    gdf = gdf[[fips_col, uhii_col, "geometry"]].copy()
    gdf = gdf.rename(columns={fips_col: "fips", uhii_col: "uhii"})
    gdf = gdf.dropna(subset=["fips", "uhii"])
    gdf["fips"] = gdf["fips"].astype(str).str.strip().str.zfill(11)
    gdf["degHourDay"] = (gdf["uhii"] / UHII_DAYS).round(2)
    return gdf[["fips", "degHourDay", "geometry"]].to_crs("EPSG:4326")


# ── Bay Area polygon datasets ─────────────────────────────────────────────────
configs = [
    ("02_Fairfield/GIS_Fairfield/Fairfield_UHII.shp",       "FIPS", "UHII"),
    ("03_Napa/GIS_Napa/Napa_UHIIs.shp",                     "FIPS", "UHII"),
    ("05_San_Rafael/GIS_San_Rafael/San_Rafael_UHII.shp",     "FIPS", "UHII"),
    ("06_Santa_Rosa/GIS_Santa_Rosa/Santa_Rosa_UHII.shp",     "FIPS", "UHII"),
    ("18_San_Francisco2/GIS_San_Francisco/San_Francisco_UHII.shp", "FIPS", "UHII"),
    ("20_Vallejo/GIS_Vallejo/Vallejo_UHII.shp",              "FIPS", "UHII"),
    ("21_Walnut_Creek2/GIS_Walnut_Creek/Walnut_Creek_UHII.shp", "FIPS", "UHII"),
    ("22_Antioch/GIS_Antioch/Antioch_UHII.shp",              "FIPS", "UHII"),
]

parts = []
for relpath, fips_col, uhii_col in configs:
    path = DATA / relpath
    print(f"Loading {path.parent.parent.name}...")
    gdf = load_polygon_shp(path, fips_col, uhii_col)
    print(f"  {len(gdf)} tracts, degHourDay range: {gdf['degHourDay'].min():.1f}–{gdf['degHourDay'].max():.1f}")
    parts.append(gdf)

# ── San Jose (point centroids → join to CES tract polygons) ──────────────────
print("Loading San Jose (point centroids)...")
sj_pts = gpd.read_file(DATA / "19_SanJose/GIS_San_Jose/SanJose_UHII.shp")
sj_pts = sj_pts[["UHII", "geometry"]].dropna(subset=["UHII"])
sj_pts = sj_pts.to_crs("EPSG:4326")
sj_pts["degHourDay"] = (sj_pts["UHII"] / UHII_DAYS).round(2)

# Load CES tracts as base polygon geometry for Santa Clara County (FIPS 06085)
ces = gpd.read_file(DATA / "calenviroscreen.geojson")[["tract", "geometry"]]
ces["fips"] = ces["tract"].astype(str).str.zfill(11)
sc_tracts = ces[ces["fips"].str.startswith("06085")].copy()

# Spatial join: each point → tract polygon it falls within
sj_joined = gpd.sjoin(sj_pts, sc_tracts[["fips", "geometry"]], how="left", predicate="within")
# For points that didn't land inside a tract (edge cases), try nearest
unmatched = sj_joined[sj_joined["fips"].isna()]
if len(unmatched):
    nearest = gpd.sjoin_nearest(unmatched[["degHourDay", "geometry"]], sc_tracts[["fips", "geometry"]], how="left")
    sj_joined.loc[unmatched.index, "fips"] = nearest["fips"].values

sj_joined = sj_joined.dropna(subset=["fips"])
# Average degHourDay per tract (in case multiple points per tract)
sj_avg = sj_joined.groupby("fips")["degHourDay"].mean().reset_index()
# Re-attach polygon geometry from CES tracts
sj_poly = sc_tracts.merge(sj_avg, on="fips")[["fips", "degHourDay", "geometry"]]
print(f"  {len(sj_poly)} Santa Clara tracts, degHourDay range: {sj_poly['degHourDay'].min():.1f}–{sj_poly['degHourDay'].max():.1f}")
parts.append(sj_poly)

# ── Existing East Bay data ────────────────────────────────────────────────────
print("Loading existing East Bay data...")
eb = gpd.read_file(DATA / "urban-heat-island.geojson")[["degHourDay", "geometry"]]
# The existing file has no FIPS; assign via spatial join to CES tracts
eb_joined = gpd.sjoin(eb, ces[["fips", "geometry"]], how="left", predicate="intersects")
eb_agg = eb_joined.groupby("fips")["degHourDay"].mean().reset_index()
eb_poly = ces.merge(eb_agg, on="fips")[["fips", "degHourDay", "geometry"]]
print(f"  {len(eb_poly)} East Bay tracts")
parts.append(eb_poly)

# ── Merge & deduplicate ───────────────────────────────────────────────────────
print("\nMerging all datasets...")
merged = pd.concat([g[["fips", "degHourDay", "geometry"]] for g in parts], ignore_index=True)

# For duplicate FIPS, keep the row with the highest degHourDay (more signal)
merged = merged.sort_values("degHourDay", ascending=False)
merged = merged.drop_duplicates(subset=["fips"], keep="first")

merged_gdf = gpd.GeoDataFrame(merged, geometry="geometry", crs="EPSG:4326")

# Add uhiiRank from quartiles
q = merged_gdf["degHourDay"].quantile([0.25, 0.5, 0.75])
def rank(v):
    if v >= q[0.75]: return "Very High"
    if v >= q[0.5]:  return "High"
    if v >= q[0.25]: return "Moderate"
    return "Low"
merged_gdf["uhiiRank"] = merged_gdf["degHourDay"].apply(rank)

print(f"\nTotal tracts: {len(merged_gdf)}")
print(f"degHourDay range: {merged_gdf['degHourDay'].min():.1f}–{merged_gdf['degHourDay'].max():.1f}")
print(f"Bounds: {merged_gdf.total_bounds}")

# ── Export ────────────────────────────────────────────────────────────────────
out_path = DATA / "urban-heat-island.geojson"
merged_gdf[["degHourDay", "uhiiRank", "geometry"]].to_file(out_path, driver="GeoJSON")
print(f"\nSaved {out_path}")
print("Done.")
