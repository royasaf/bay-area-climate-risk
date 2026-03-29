import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Methodology — Bay Area Climate Risk Dashboard",
};

const WEIGHTS = [
  { layer: "CalEnviroScreen 4.0", weight: "35%", rationale: "Integrates 21 pollution and vulnerability indicators; socioeconomic vulnerability is the strongest predictor of recovery capacity." },
  { layer: "Wildfire hazard", weight: "20%", rationale: "Significant and growing threat across the region, particularly in WUI communities." },
  { layer: "Flood / sea level rise", weight: "20%", rationale: "Long-term infrastructure and displacement risk, disproportionately affecting low-lying communities." },
  { layer: "Urban heat island", weight: "15%", rationale: "Acute public health risk during heat events, strongly correlated with surface cover and green space inequality." },
  { layer: "Air quality", weight: "10%", rationale: "Chronic health burden, partially captured within CalEnviroScreen but included separately for transparency." },
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
            Each layer draws from authoritative state and federal datasets. Wildfire hazard zones come from CalFire&apos;s Fire Hazard Severity Zone designations. Flood exposure is derived from FEMA&apos;s National Flood Hazard Layer. Sea level rise inundation scenarios use projections from NOAA and the Bay Conservation and Development Commission. Urban heat island intensity is measured using CalEPA&apos;s Urban Heat Island Index, which quantifies the temperature differential between urban census tracts and nearby rural reference points across 182 warm-season days. Cumulative pollution burden and socioeconomic vulnerability are drawn from CalEnviroScreen 4.0, published by the California Office of Environmental Health Hazard Assessment, which aggregates 21 indicators of pollution exposure, environmental conditions, and population vulnerability.
          </p>
        </section>

        {/* Composite Score */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Composite Score Construction</h2>
          <div className="h-px bg-gray-200 mb-5" />
          <p className="text-gray-700 leading-relaxed mb-6">
            All indicators are normalized to a 0–100 percentile scale relative to Bay Area census tracts before combination, so that no single layer dominates due to differences in units or magnitude. The composite Climate Risk Index is calculated as a weighted sum of the normalized component scores:
          </p>

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
                {WEIGHTS.map(({ layer, weight, rationale }, i) => (
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
