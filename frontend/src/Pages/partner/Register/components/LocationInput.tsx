"use client";

import { useState } from "react";
// import { OpenStreetMapProvider } from "leaflet-geosearch";
import { useDebouncedCallback } from "use-debounce";

interface SearchResult {
  addressType: string;
  boundingBox: string[];
  category: string;
  display_name: string;
  importance: number;
  lat: string;
  licence: string;
  lon: string;
  name: string;
  osm_id: number;
  osm_type: string;
  place_id: number;
  place_rank: number;
  type: string;
}

export default function LocationInput() {
  const [query, setQuery] = useState("");
  // const provider = new OpenStreetMapProvider();
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);

  const getDetailAddress = async (address: string) => {
    if (address.trim().length === 0) return;
    try {
      const response = await fetch(
        `/api/nominatim/search?format=jsonv2&q=${encodeURIComponent(address)}`,
      );
      if (!response.ok) {
        throw new Error(`Nominatim request failed: ${response.status}`);
      }
      const data = await response.json();
      console.log(data);
      setSearchResults(data);
    } catch (error) {
      console.error(error);
    }
  };

  const debounce = useDebouncedCallback(
    // function
    (value) => {
      getDetailAddress(value);
      // console.log(value);
    },
    // delay in ms
    1000,
  );

  return (
    <>
      <label className="grid gap-2">
        <span className="text-xs text-white/70">Barbershop Address</span>
        <input
          type="text"
          placeholder="Barbershop Address"
          className="w-full rounded-xl bg-[#0f1218] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10"
          value={query}
          onChange={(e) => {
            debounce(e.target.value);
            setQuery(e.target.value);
          }}
        />
      </label>
      {searchResults &&
        searchResults?.length > 0 &&
        searchResults?.map((result, index) => (
          <button
            key={index}
            className="w-full rounded-xl bg-[#0f1218] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10 mt-2"
            onClick={() => {
              alert(
                `Selected Address: ${result.display_name}\nLatitude: ${result.lat}\nLongitude: ${result.lon}`,
              );
              setQuery(result.display_name);
              setSearchResults(null);
            }}
          >
            <p className="text-sm text-white">{result.display_name}</p>
            <p className="text-xs text-gray-400">
              Lat: {result.lat}, Lon: {result.lon}
            </p>
          </button>
        ))}
    </>
  );
}
