"use client";

import { useState } from "react";
import { LAYERS, HAZ_COLOR, VULNERABILITY_COLOR } from "@/config/layers";

interface Props {
  visible: Record<string, boolean>;
  onToggle: (id: string) => void;
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

export default function LayerSidebar({ visible, onToggle }: Props) {
  const [showSources, setShowSources] = useState(false);

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-gray-200 flex flex-col z-10">
      <div className="px-4 py-3 border-b border-gray-200">
        <h1 className="text-sm font-semibold text-gray-900 tracking-wide uppercase">
          Bay Area Climate Risk
        </h1>
      </div>
      <div className="px-4 py-3 overflow-y-auto">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
          Layers
        </p>
        <ul className="space-y-3">
          {LAYERS.map((layer) => (
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
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto border-t border-gray-200">
        <button
          onClick={() => setShowSources((s) => !s)}
          className="w-full px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide hover:bg-gray-50 flex items-center justify-between"
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
