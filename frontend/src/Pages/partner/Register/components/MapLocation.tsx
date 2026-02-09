'use client'

import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import type { Marker as LeafletMarker } from 'leaflet';



const center: [number, number] = [-7.356299369134257, 108.2293978319359];

interface DraggableMarkerProps {
  position: [number, number];
  onPositionChange?: (position: [number, number]) => void;
  updateLatLon?: (lat: number, lon: number) => void;
}

function DraggableMarker({ position, onPositionChange, updateLatLon }: DraggableMarkerProps) {
  const [draggable, setDraggable] = useState(false)
  const markerRef = useRef<LeafletMarker>(null)
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current
        if (marker != null) {
          const nextPosition = marker.getLatLng()
          onPositionChange?.([nextPosition.lat, nextPosition.lng])
          updateLatLon?.(nextPosition.lat, nextPosition.lng);
        }
      },
    }),
    [onPositionChange, updateLatLon],
  )
  const toggleDraggable = useCallback(() => {
    setDraggable((d) => !d)
  }, [])

  return (
    <Marker
      draggable={draggable}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}>
      <Popup minWidth={90}>
        <span onClick={toggleDraggable}>
          {draggable
            ? 'Marker is draggable'
            : 'Click here to make marker draggable'}
        </span>
      </Popup>
    </Marker>
  )
}

function MapUpdater({ position }: { position: [number, number] }) {
  const map = useMap()

  useEffect(() => {
    map.setView(position)
  }, [map, position])

  return null
}


interface IProps {
  lat?: number;
  lon?: number;
  updateLatLon?: (lat: number, lon: number) => void;
}


export default function MapLocation({ lat, lon, updateLatLon }: IProps) {
  const position: [number, number] = lat
    ? [lat, lon ?? center[1]]
    : center;


  return (
    <div className="container mx-auto overflow-hidden rounded-lg">
      <MapContainer
        center={position}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: "300px", width: "100%" }}
        // zoomControl={false}
      >
        <MapUpdater position={position} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <DraggableMarker position={position} updateLatLon={updateLatLon} />
      </MapContainer>
    </div>
  );
}
