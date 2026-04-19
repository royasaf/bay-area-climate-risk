import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Methodology — Bay Area Climate Risk Dashboard",
};

const HAZARD_WEIGHTS = [
  { layer: "Wildfire hazard", weight: "25%", rationale: "Significant and growing threat, particularly in WUI communities at the urban-wildland interface." },
  { layer: "Flood / sea level rise", weight: "25%", rationale: "Long-term infrastructure and displacement risk, disproportionately affecting low-lying communities." },
  { layer: "Seismic hazard", weight: "20%", rationale: "Bay Area has some of the highest seismic risk in the nation due to proximity to major active fault systems." },
  { layer: "Urban heat island", weight: "20%", rationale: "Acute public health risk during heat events, strongly correlated with surface cover and green space inequality." },
  { layer: "Air quality", weight: "10%", rationale: "Chronic health burden; captures pollution exposure not fully represented by the seismic or climate layers." },
];

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-12">

        {/* Back link */}
        <Link href="/" className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1 mb-8">
          ← Back to map
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Methodology</h1>
        <p className="text-gray-500 text-sm mb-10">Bay Area Climate Risk Dashboard</p>

        {/* Intro */}
        <p className="text-gray-700 leading-relaxed mb-10">
          This dashboard aggregates publicly available climate hazard and socioeconomic vulnerability data to produce a composite <strong>Climate Risk Index</strong> for every census tract in the nine-county Bay Area. The index is intended to highlight communities that face elevated exposure to multiple climate hazards and have the least capacity to adapt or recover.
        </p>

        {/* Data Sources */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Data Sources</h2>
          <div className="h-px bg-gray-200 mb-5" />
          <p className="text-gray-700 leading-relaxed">
            Each layer draws from authoritative state and federal datasets. Wildfire hazard zones come from CalFire&apos;s Fire Hazard Severity Zone designations. Sea level rise inundation scenarios use NOAA&apos;s Office for Coastal Management projections (0.5–9.5 ft above mean higher high water), overlaid on lidar-derived elevation models. Urban heat island intensity is measured using CalEPA&apos;s Urban Heat Island Index, which quantifies the temperature differential between urban census tracts and nearby rural reference points across 182 warm-season days. Cumulative pollution burden and socioeconomic vulnerability are drawn from CalEnviroScreen 4.0, published by the California Office of Environmental Health Hazard Assessment. Adaptive capacity is derived from the CDC Social Vulnerability Index (2022), which measures a community&apos;s ability to withstand and recover from external stressors using 16 census variables.
          </p>
          <p className="text-gray-700 leading-relaxed mt-4">
            <strong>Seismic hazard</strong> is a composite of three components scored 0–100 per census tract: (1) <em>Fault proximity</em> — tracts within 1 km of an active Quaternary fault (CGS Fault Activity Map) receive +40 points; (2) <em>Liquefaction susceptibility</em> — tracts within designated CGS Seismic Hazard Zones receive +50 points; (3) <em>Ground shaking (PGA)</em> — county-level Peak Ground Acceleration values from the USGS National Seismic Hazard Model 2018, normalized 0–10. The composite is capped at 100.
          </p>
        </section>

        {/* Composite Score */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Composite Score Construction</h2>
          <div className="h-px bg-gray-200 mb-5" />
          <p className="text-gray-700 leading-relaxed mb-6">
            The composite score follows the standard vulnerability science formula:
          </p>
          <div className="bg-gray-100 rounded-lg px-5 py-4 mb-6 font-mono text-sm text-gray-800">
            <p className="mb-1"><strong>Final Risk</strong> = Hazard × CES_Sensitivity × (1 − Adaptive Capacity)</p>
            <p className="text-gray-500 text-xs mt-2">Where CES_Sensitivity = (50 + CES percentile) / 100, ranging from 0.5 (low burden) to 1.5 (high burden)</p>
          </div>
          <p className="text-gray-700 leading-relaxed mb-4">
            All indicators are normalized to a 0–100 scale before combination. Hazard Exposure is a weighted composite of five physical hazard layers. CalEnviroScreen acts as a <em>sensitivity amplifier</em> — tracts with high cumulative pollution burden experience proportionally more climate risk. Adaptive Capacity, derived from the CDC Social Vulnerability Index, reduces final risk for communities better equipped to prepare and recover.</p>
          <p className="text-gray-700 leading-relaxed mb-4">
          On the map, vulnerability scores are displayed as <strong>percentile ranks</strong> among all Bay Area census tracts — for example, &ldquo;82nd percentile&rdquo; means the tract scores higher than 82% of tracts in the region. This makes it straightforward to compare tracts regardless of the raw score range.
          </p>

          <h3 className="text-base font-semibold text-gray-800 mb-3 mt-6">Hazard Exposure Weights</h3>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-900">Layer</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">Weight</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-900">Rationale</th>
                </tr>
              </thead>
              <tbody>
                {HAZARD_WEIGHTS.map(({ layer, weight, rationale }, i) => (
                  <tr key={layer} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap border-b border-gray-100">{layer}</td>
                    <td className="px-4 py-3 text-center font-semibold text-blue-700 border-b border-gray-100">{weight}</td>
                    <td className="px-4 py-3 text-gray-600 border-b border-gray-100">{rationale}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Limitations */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Limitations</h2>
          <div className="h-px bg-gray-200 mb-5" />
          <p className="text-gray-700 leading-relaxed mb-4">
            This index is a screening tool, not a definitive risk assessment. Weights reflect a general vulnerability framework informed by existing literature, including the CDC Social Vulnerability Index and CalEnviroScreen&apos;s own methodology, but reasonable analysts might weight these factors differently depending on their objectives. Users are encouraged to explore individual layers rather than relying solely on the composite score. All underlying datasets have their own limitations, update cycles, and geographic coverage gaps, which are documented at their respective source agencies.
          </p>
          <p className="text-gray-500 text-sm">
            Data currency varies by layer. CalEnviroScreen 4.0 was released in October 2021. CalFire FHSZ designations were last updated in 2023. Users should consult source agencies for the most recent versions.
          </p>
        </section>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-6">
          <Link href="/" className="text-sm text-blue-600 hover:underline">
            ← Back to map
          </Link>
        </div>

      </div>
    </div>
  );
}
