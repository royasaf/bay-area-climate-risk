"use client";

import { useState, useRef, useEffect } from "react";

interface Suggestion {
  id: string;
  place_name: string;
  center: [number, number];
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
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json?access_token=${token}&bbox=-124.5,32.5,-114.1,42.0&types=address,place,poi&limit=5`;
      const res = await fetch(url);
      const data = await res.json();
      setSuggestions(data.features ?? []);
      setOpen(true);
    }, 300);
  }

  function handleSelect(s: Suggestion) {
    setQuery(s.place_name);
    setSuggestions([]);
    setOpen(false);
    onSelect(s.center[0], s.center[1], s.place_name);
  }

  return (
    <div ref={containerRef} className="absolute top-4 left-4 w-80 z-10">
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
            <li key={s.id}>
              <button
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 truncate"
                onClick={() => handleSelect(s)}
              >
                {s.place_name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
