"use client";

import { useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import type { GeosearchResult as SearchResult } from "@/types/Geosearch";
import type {
  UseFormRegister,
  FieldError,
  Path,
  FieldValues,
} from "react-hook-form";

interface IProps<T extends FieldValues> {
  onSelectAddress: (address: SearchResult) => void;
  name: Path<T>;
  register: UseFormRegister<T>;
  errors?: FieldError;
}

export default function LocationInput<T extends FieldValues>({
  onSelectAddress,
  register,
  errors,
  name,
}: IProps<T>) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(
    null,
  );

  const getDetailAddress = async (address: string) => {
    if (address.trim().length === 0) return;
    try {
      const response = await fetch(
        `/nominatim/search?format=jsonv2&q=${encodeURIComponent(address)}`,
      );
      if (!response.ok) {
        throw new Error(`Nominatim request failed: ${response.status}`);
      }
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error(error);
    }
  };

  const debounce = useDebouncedCallback((value) => {
    getDetailAddress(value);
  }, 1000);

  return (
    <>
      <label className="grid gap-2">
        <span className="text-xs text-white/70">Barbershop Address</span>
        <input
          type="text"
          placeholder="Barbershop Address"
          className="w-full rounded-xl bg-[#0f1218] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10"
          value={query}
          {...register(name, { required: "Address is required" })}
          onChange={(e) => {
            debounce(e.target.value);
            setQuery(e.target.value);
          }}
        />
        {errors && (
          <span className="text-xs text-red-400">
            {errors.message as string}
          </span>
        )}
      </label>
      {searchResults &&
        searchResults?.length > 0 &&
        searchResults?.map((result, index) => (
          <button
            key={index}
            className="w-full rounded-xl bg-[#0f1218] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10 mt-2"
            onClick={() => {
              setQuery(result.display_name);
              setSearchResults(null);
              onSelectAddress(result);
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
