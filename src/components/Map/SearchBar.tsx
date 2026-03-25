"use client";

import { useState, useRef, useEffect } from "react";

interface Suggestion {
  place_id: number;
  display_name: string;
  lon: string;
  lat: string;
}

interface Props {
  onSelect: (lng: number, lat: number, label: string) => void;
}

export default function SearchBar({ onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&countrycodes=us&viewbox=-124.5,32.5,-114.1,42.0&bounded=1&format=json&limit=5`;
      const res = await fetch(url, { headers: { "Accept-Language": "en" } });
      const data = await res.json();
      setSuggestions(data ?? []);
      setOpen(true);
    }, 300);
  }

  function handleSelect(s: Suggestion) {
    setQuery(s.display_name);
    setSuggestions([]);
    setOpen(false);
    onSelect(parseFloat(s.lon), parseFloat(s.lat), s.display_name);
  }

  return (
    <div ref={containerRef} className="absolute top-4 left-4 right-4 md:right-auto md:w-80 z-10">
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Search an address in California…"
        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-md outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
      />
      {open && suggestions.length > 0 && (
        <ul className="mt-1 rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
          {suggestions.map((s) => (
            <li key={s.place_id}>
              <button
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 truncate"
                onClick={() => handleSelect(s)}
              >
                {s.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
