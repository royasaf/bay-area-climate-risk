"use client";

import { useState } from "react";
import { LAYERS, HAZ_COLOR, VULNERABILITY_COLOR } from "@/config/layers";

const SLR_LEVELS = [0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5];

interface Props {
  visible: Record<string, boolean>;
  onToggle: (id: string) => void;
  slrLevel: number;
  onSlrLevelChange: (level: number) => void;
  layerOrder: string[];
  onReorder: (id: string, direction: "up" | "down") => void;
  isMobile?: boolean;
}

// Layers too large to load on mobile
const MOBILE_DISABLED = new Set(["sea-level-rise"]);

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


export default function LayerSidebar({
  visible, onToggle, slrLevel, onSlrLevelChange, layerOrder, onReorder, isMobile = false,
}: Props) {
  const [showSources, setShowSources] = useState(false);
  const [showMethodology, setShowMethodology] = useState(false);

  // Render layers in sidebar order; inject group header when group changes
  const orderedLayers = layerOrder.map((id) => LAYERS.find((l) => l.id === id)!);

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-gray-200 flex flex-col z-10" style={{ height: "100%" }}>
      <div className="px-4 py-3 border-b border-gray-200">
        <h1 className="text-sm font-semibold text-gray-900 tracking-wide uppercase">
          Bay Area Climate Risk
        </h1>
      </div>

      <div className="px-4 py-3 overflow-y-auto flex-1">
        <p className="text-xs text-gray-400 mb-3 leading-snug">
          Use ↑↓ to reorder layers. Top = rendered on top.
        </p>
        <ul className="space-y-0">
          {orderedLayers.map((layer, idx) => {
            const disabledOnMobile = isMobile && MOBILE_DISABLED.has(layer.id);
            return (
              <li key={layer.id}>
                <div className="mb-3">
                  <div className="flex items-start gap-1">
                    <div className="flex flex-col shrink-0 mt-0.5">
                      <button
                        onClick={() => onReorder(layer.id, "up")}
                        disabled={idx === 0}
                        className="text-gray-300 hover:text-gray-600 disabled:opacity-20 disabled:cursor-default leading-none p-0 text-xs"
                        aria-label="Move layer up"
                      >▲</button>
                      <button
                        onClick={() => onReorder(layer.id, "down")}
                        disabled={idx === orderedLayers.length - 1}
                        className="text-gray-300 hover:text-gray-600 disabled:opacity-20 disabled:cursor-default leading-none p-0 text-xs"
                        aria-label="Move layer down"
                      >▼</button>
                    </div>
                  <label className={`flex items-center gap-2 flex-1 ${disabledOnMobile ? "opacity-40 cursor-not-allowed" : "cursor-pointer group"}`}>
                    <input
                      type="checkbox"
                      checked={visible[layer.id] ?? false}
                      onChange={() => !disabledOnMobile && onToggle(layer.id)}
                      disabled={disabledOnMobile}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span
                      className="w-3 h-3 rounded-sm shrink-0"
                      style={{ backgroundColor: layer.color }}
                    />
                    <span className="text-sm text-gray-700 leading-tight">
                      {layer.label}
                      {disabledOnMobile && <span className="text-xs text-gray-400 block">Desktop only</span>}
                    </span>
                  </label>
                  </div>

                  {layer.id === "sea-level-rise" && visible[layer.id] && (
                    <div className="mt-2 ml-8">
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
                    <ul className="mt-1.5 ml-8 space-y-1">
                      {LEGENDS[layer.id].map(({ label, color }) => (
                        <li key={label} className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: color }} />
                          <span className="text-xs text-gray-500">{label}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {visible[layer.id] && layer.id === "adaptive-capacity" && (
                    <div className="mt-1.5 ml-8">
                      <div className="h-2 rounded-sm" style={{ background: "linear-gradient(to right, #dc2626, #f97316, #facc15, #84cc16, #16a34a)" }} />
                      <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                        <span>Low</span>
                        <span>Capacity</span>
                        <span>High</span>
                      </div>
                    </div>
                  )}

                  {visible[layer.id] && layer.id === "cumulative-impact" && (
                    <div className="mt-1.5 ml-8">
                      <div className="h-2 rounded-sm" style={{ background: "linear-gradient(to right, #fef9c3, #fde047, #f97316, #dc2626, #450a0a)" }} />
                      <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                        <span>Low</span>
                        <span>Vulnerability</span>
                        <span>High</span>
                      </div>
                    </div>
                  )}

                  {visible[layer.id] && layer.id === "calenviroscreen" && (
                    <div className="mt-1.5 ml-8">
                      <div className="h-2 rounded-sm" style={{ background: "linear-gradient(to right, #f3e8ff, #c084fc, #9333ea, #6b21a8, #3b0764)" }} />
                      <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                        <span>Low (1)</span>
                        <span>CES score</span>
                        <span>High (65)</span>
                      </div>
                    </div>
                  )}

                  {visible[layer.id] && layer.id === "urban-heat-island" && (
                    <div className="mt-1.5 ml-8">
                      <div className="h-2 rounded-sm" style={{ background: "linear-gradient(to right, #16a34a, #84cc16, #facc15, #f97316, #dc2626, #7f1d1d)" }} />
                      <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                        <span>0</span>
                        <span>°C·hr/day</span>
                        <span>122</span>
                      </div>
                    </div>
                  )}
                </div>
              </li>

            );
          })}
        </ul>
      </div>

      <div className="border-t border-gray-200">
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
            <li>
              <a
                href="/methodology"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                Full methodology ↗
              </a>
            </li>
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
