"use client";

import { useState } from "react";
import { LAYERS, HAZ_COLOR, VULNERABILITY_COLOR, type LayerGroup } from "@/config/layers";

const SLR_LEVELS = [0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5];

interface Props {
  visible: Record<string, boolean>;
  onToggle: (id: string) => void;
  slrLevel: number;
  onSlrLevelChange: (level: number) => void;
}

const LEGENDS: Record<string, { label: string; color: string }[]> = {
  "wildfire-risk": [
    { label: "Very High", color: HAZ_COLOR["Very High"] },
    { label: "High",      color: HAZ_COLOR["High"] },
    { label: "Moderate",  color: HAZ_COLOR["Moderate"] },
  ],
  "community-vulnerability": [
    { label: "Highest",  color: VULNERABILITY_COLOR["Highest social vulnerability"] },
    { label: "High",     color: VULNERABILITY_COLOR["High social vulnerability"] },
    { label: "Moderate", color: VULNERABILITY_COLOR["Moderate social vulnerability"] },
    { label: "Low",      color: VULNERABILITY_COLOR["Low social vulnerability"] },
  ],
};

export default function LayerSidebar({ visible, onToggle, slrLevel, onSlrLevelChange }: Props) {
  const [showSources, setShowSources] = useState(false);
  const [showMethodology, setShowMethodology] = useState(false);

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-gray-200 flex flex-col z-10">
      <div className="px-4 py-3 border-b border-gray-200">
        <h1 className="text-sm font-semibold text-gray-900 tracking-wide uppercase">
          Bay Area Climate Risk
        </h1>
      </div>
      <div className="px-4 py-3 overflow-y-auto">
        {(["climate-risk", "vulnerability"] as LayerGroup[]).map((group) => (
          <div key={group} className="mb-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              {group === "climate-risk" ? "Climate Risk" : "Vulnerability"}
            </p>
        <ul className="space-y-3">
          {LAYERS.filter((l) => l.group === group).map((layer) => (
            <li key={layer.id}>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={visible[layer.id] ?? true}
                  onChange={() => onToggle(layer.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span
                  className="w-3 h-3 rounded-sm shrink-0"
                  style={{ backgroundColor: layer.color }}
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">
                  {layer.label}
                </span>
              </label>

              {layer.id === "sea-level-rise" && visible[layer.id] && (
                <div className="mt-2 ml-7">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Scenario</span>
                    <span className="font-medium text-blue-600">{slrLevel} ft</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={SLR_LEVELS.length - 1}
                    step={1}
                    value={SLR_LEVELS.indexOf(slrLevel)}
                    onChange={(e) => onSlrLevelChange(SLR_LEVELS[parseInt(e.target.value)])}
                    className="w-full accent-blue-500"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>0.5</span>
                    <span>9.5</span>
                  </div>
                </div>
              )}

              {visible[layer.id] && LEGENDS[layer.id] && (
                <ul className="mt-1.5 ml-7 space-y-1">
                  {LEGENDS[layer.id].map(({ label, color }) => (
                    <li key={label} className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-sm shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs text-gray-500">{label}</span>
                    </li>
                  ))}
                </ul>
              )}

              {visible[layer.id] && layer.id === "calenviroscreen" && (
                <div className="mt-1.5 ml-7">
                  <div
                    className="h-2 rounded-sm"
                    style={{ background: "linear-gradient(to right, #f3e8ff, #c084fc, #9333ea, #6b21a8, #3b0764)" }}
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                    <span>Low (1)</span>
                    <span>CES score</span>
                    <span>High (65)</span>
                  </div>
                </div>
              )}

              {visible[layer.id] && layer.id === "urban-heat-island" && (
                <div className="mt-1.5 ml-7">
                  <div
                    className="h-2 rounded-sm"
                    style={{ background: "linear-gradient(to right, #16a34a, #84cc16, #facc15, #f97316, #dc2626, #7f1d1d)" }}
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                    <span>0</span>
                    <span>°C·hr/day</span>
                    <span>122</span>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
          </div>
        ))}
      </div>

      <div className="mt-auto border-t border-gray-200">
        <button
          onClick={() => setShowMethodology((s) => !s)}
          className="w-full px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide hover:bg-gray-50 flex items-center justify-between"
        >
          How it&apos;s calculated
          <span>{showMethodology ? "▲" : "▼"}</span>
        </button>
        {showMethodology && (
          <ul className="px-4 pb-3 space-y-3 max-h-72 overflow-y-auto">
            {LAYERS.map(({ id, label, color, methodology }) => (
              <li key={id}>
                <p className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-sm shrink-0 inline-block" style={{ backgroundColor: color }} />
                  {label}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{methodology}</p>
              </li>
            ))}
          </ul>
        )}
        <button
          onClick={() => setShowSources((s) => !s)}
          className="w-full px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide hover:bg-gray-50 flex items-center justify-between border-t border-gray-200"
        >
          Sources
          <span>{showSources ? "▲" : "▼"}</span>
        </button>
        {showSources && (
          <ul className="px-4 pb-4 space-y-3">
            {LAYERS.map(({ id, label, source }) => (
              <li key={id}>
                <p className="text-xs font-medium text-gray-700">{label}</p>
                <p className="text-xs text-gray-500">{source.organization}, {source.year}</p>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline truncate block"
                >
                  {source.name}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
