#!/usr/bin/env python3
"""
Build cumulative climate vulnerability score by census tract.

Formula (vulnerability science):
  Final Risk = Hazard_Exposure × CES_Sensitivity × (1 - Adaptive_Capacity)

Hazard Exposure = weighted composite (normalised 0–100):
  - Wildfire risk:              25%
  - Sea level rise / flood:     25%
  - Seismic hazard:             20%
  - Urban Heat Island:          20%
  - Air quality:                10%

CES Sensitivity Modifier = (50 + CES_percentile) / 100
  Ranges from 0.5 (CES=0) to 1.5 (CES=100), centred at 1.0 for average tracts.
  Captures cumulative environmental burden as a sensitivity amplifier.

Adaptive Capacity = (1 - CDC SVI percentile), normalised 0–1.
  Tracts with no SVI data use AC = 0.5 (neutral).

Final composite is re-scaled 0–100.
Output: public/data/cumulative-impact.geojson
"""
import numpy as np
import geopandas as gpd
from shapely.validation import make_valid
from pathlib import Path

DATA = Path(__file__).parent.parent / "public/data"

def fix_geoms(gdf):
    gdf = gdf.copy()
    gdf.geometry = gdf.geometry.apply(make_valid)
    return gdf

def area_weighted_join(base, overlay_gdf, value_col):
    """
    For each feature in base, compute area-weighted average of value_col
    from overlay_gdf polygons.
    Returns a Series indexed like base.
    """
    base_proj = base.to_crs("EPSG:3310")
    ov_proj = overlay_gdf[["geometry", value_col]].to_crs("EPSG:3310")

    idx_col = base.index.name or "index"
    base_reset = base_proj.reset_index()  # moves index to column named idx_col
    base_reset["_id"] = range(len(base_reset))

    intersected = gpd.overlay(
        base_reset[["_id", "geometry"]],
        ov_proj,
        how="intersection",
        keep_geom_type=False,
    )
    intersected["_area"] = intersected.geometry.area

    def wavg(g):
        w = g["_area"]
        if w.sum() == 0:
            return 0.0
        return float(np.average(g[value_col], weights=w))

    result = intersected.groupby("_id").apply(wavg, include_groups=False)
    # Map _id (integer) back to original index values (e.g. tract FIPS)
    id_to_idx = dict(zip(base_reset["_id"], base_reset[idx_col]))
    result.index = result.index.map(id_to_idx)
    return result.reindex(base.index)  # NaN for tracts with no coverage


print("Loading CalEnviroScreen tracts (base geometry)...")
ces = fix_geoms(gpd.read_file(DATA / "calenviroscreen.geojson"))
ces = ces.set_index("tract")
print(f"  {len(ces)} tracts")

# ── 1. CES percentile score (0–100) — used as sensitivity modifier ────────
ces["score_ces"] = ces["CIscoreP"].fillna(0)

# ── 2. Air quality sub-score: average of ozone, PM2.5, diesel, traffic ──
AQ_COLS = ["ozoneP", "pmP", "dieselP", "trafficP"]
ces["score_aq"] = ces[AQ_COLS].mean(axis=1)  # already 0–100 percentiles; NaN if all missing
print(f"  AQ mean={ces['score_aq'].mean():.1f} max={ces['score_aq'].max():.1f}")

# ── 3. Urban Heat Island ──────────────────────────────────────────────────
print("Joining Urban Heat Island...")
uhi = fix_geoms(gpd.read_file(DATA / "urban-heat-island.geojson"))
UHI_MAX = 122.3

uhi_raw = area_weighted_join(ces, uhi, "degHourDay")
ces["score_uhi"] = (uhi_raw / UHI_MAX * 100).clip(0, 100)  # NaN stays NaN
print(f"  UHI mean={ces['score_uhi'].mean():.1f} max={ces['score_uhi'].max():.1f}")

# ── 4. Wildfire Risk ──────────────────────────────────────────────────────
print("Joining Wildfire risk...")
wui = fix_geoms(gpd.read_file(DATA / "wildfire-risk.geojson"))
HAZ_SCORE = {"Very High": 100.0, "High": 67.0, "Moderate": 33.0}
wui["haz_score"] = wui["HAZ_DESC"].map(HAZ_SCORE).fillna(0.0)

ces["score_wui"] = area_weighted_join(ces, wui, "haz_score")  # NaN if no intersection
print(f"  Wildfire mean={ces['score_wui'].mean():.1f} max={ces['score_wui'].max():.1f}")

# ── 5. Sea Level Rise (≤1.5 ft scenario) ─────────────────────────────────
# Score = fraction of tract area inundated × 100 (0–100)
print("Joining Sea Level Rise...")
slr = fix_geoms(gpd.read_file(DATA / "sea-level-rise.geojson"))
slr_15 = slr[slr["level"] <= 1.5].copy()

ces_proj = ces.to_crs("EPSG:3310")
slr_proj = slr_15.to_crs("EPSG:3310")
slr_union = slr_proj.geometry.union_all()

def slr_fraction(geom):
    if geom is None or geom.is_empty or geom.area == 0:
        return 0.0
    inter = geom.intersection(slr_union)
    return inter.area / geom.area

print("  Computing SLR coverage fraction per tract...")
ces["score_slr"] = (ces_proj.geometry.apply(slr_fraction) * 100).clip(0, 100)
print(f"  SLR mean={ces['score_slr'].mean():.1f} max={ces['score_slr'].max():.1f} nonzero={( ces['score_slr'] > 0).sum()}")

# ── 6. Seismic Hazard ─────────────────────────────────────────────────────
print("Joining Seismic Hazard...")
seismic = fix_geoms(gpd.read_file(DATA / "seismic-hazard.geojson"))
seismic_scores = seismic.set_index("tract")["seismic_score"]
ces["score_seismic"] = ces.index.map(seismic_scores)
print(f"  Seismic mean={ces['score_seismic'].mean():.1f} max={ces['score_seismic'].max():.1f}")

# ── 7. Composite hazard score (re-normalise weights when data missing) ────
# New weights: Wildfire 25%, Flood 25%, Seismic 20%, UHI 20%, AQ 10%
WEIGHTS = {
    "score_wui":     0.25,
    "score_slr":     0.25,
    "score_seismic": 0.20,
    "score_uhi":     0.20,
    "score_aq":      0.10,
}

def compute_hazard(row):
    total_w = 0.0
    total_v = 0.0
    for col, w in WEIGHTS.items():
        v = row[col]
        if not np.isnan(v):
            total_w += w
            total_v += w * v
    if total_w == 0:
        return np.nan
    return round(total_v / total_w, 1)

ces["hazard"] = ces[list(WEIGHTS.keys())].apply(compute_hazard, axis=1)

# ── 8. Adaptive Capacity from CDC SVI ────────────────────────────────────
print("Loading CDC SVI adaptive capacity...")
ac_gdf = gpd.read_file(DATA / "adaptive-capacity.geojson")[["tract", "ac_score"]]
ac_gdf["tract"] = ac_gdf["tract"].astype(str).str.strip()
ces_idx = ces.index.astype(str).str.strip()

ac_map = ac_gdf.set_index("tract")["ac_score"]
ces["ac_score"] = ces_idx.map(ac_map)
# Tracts with no SVI data → neutral AC (50)
ces["ac_score"] = ces["ac_score"].fillna(50.0)
print(f"  AC mean={ces['ac_score'].mean():.1f}  missing filled with 50")

# ── 9. CES sensitivity modifier ──────────────────────────────────────────
# (50 + CES_percentile) / 100 → range 0.5–1.5, centred at 1.0 for average tracts
ces_sensitivity = (50 + ces["score_ces"]) / 100.0

# ── 10. Final: Hazard × CES_sensitivity × (1 - AC) ───────────────────────
hazard_01 = ces["hazard"].fillna(0) / 100.0
ac_01      = ces["ac_score"] / 100.0
raw = hazard_01 * ces_sensitivity * (1.0 - ac_01) * 100.0

# Rescale to 0–100 (theoretical max ~150 when hazard=100, CES=100, AC=0)
MAX_THEORETICAL = 150.0
ces["composite"] = (raw / MAX_THEORETICAL * 100).clip(0, 100).round(1)

print(f"\nComposite score distribution:")
print(ces["composite"].describe().round(1))

# ── 11. Export ────────────────────────────────────────────────────────────
print("\nExporting cumulative-impact.geojson...")
out_cols = ["geometry", "composite", "hazard", "ac_score",
            "score_wui", "score_slr", "score_seismic", "score_uhi",
            "score_aq", "score_ces", "CIscore", "CIscoreP"]
out = ces[out_cols].reset_index()
out = out.to_crs("EPSG:4326")
out.to_file(DATA / "cumulative-impact.geojson", driver="GeoJSON")

q = ces["composite"].quantile([0.25, 0.50, 0.75, 0.90, 0.95])
print("\nPercentile breaks for colour scale:")
for p, v in q.items():
    print(f"  p{int(p*100):3d}: {v:.1f}")
print("Done.")
