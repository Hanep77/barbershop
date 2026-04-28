import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DragEndEvent, Map as LeafletMap } from "leaflet";

type FindLocationProps = {
  latitude: number;
  longitude: number;
  onChange?: (latitude: number, longitude: number) => void;
};

export default function FindLocation({
  latitude,
  longitude,
  onChange,
}: FindLocationProps) {
  const mapRef = useRef<LeafletMap | null>(null);
  const [position, setPosition] = useState<[number, number]>([
    latitude,
    longitude,
  ]);

  useEffect(() => {
    let isMounted = true;

    const updateLocation = () => {
      try {
        const nextPosition: [number, number] = [latitude, longitude];
        if (isMounted) {
          setPosition(nextPosition);
          if (mapRef.current) {
            mapRef.current.setView(nextPosition);
          }
        }
      } catch (err) {
        console.error("Error in updateLocation:", err);
      }
    };

    updateLocation();

    return () => {
      isMounted = false;
    };
  }, [latitude, longitude]);

  const markerEvents = useMemo(
    () => ({
      dragend(event: DragEndEvent) {
        const { lat, lng } = event.target.getLatLng();
        const nextPosition: [number, number] = [lat, lng];
        setPosition(nextPosition);
        onChange?.(lat, lng);
      },
    }),
    [onChange],
  );

  return (
    <MapContainer
      center={position}
      zoom={13}
      ref={mapRef}
      style={{ height: "500px", width: "100%", zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker draggable position={position} eventHandlers={markerEvents}>
        <Popup>
          Geser marker untuk memilih lokasi.
          <br />
          {position[0].toFixed(6)}, {position[1].toFixed(6)}
        </Popup>
      </Marker>
    </MapContainer>
  );
}
