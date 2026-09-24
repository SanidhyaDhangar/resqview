import L from "leaflet";
import { useCallback, useEffect, useRef } from "react";

import { CRITICAL_THRESHOLD, categoryHex } from "../lib/constants.js";

// Esri's dark canvas: keyless, no registration, no referer gate. CARTO's free dark_all
// started serving "API key required" tiles, which is fatal on a map you demo live.
// Esri splits base and labels into two layers, so both go on — place names are the point.
const TILE_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}";
const LABEL_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}";
const TILE_ATTRIBUTION = "© Esri · © OpenStreetMap contributors";
const FIT_OPTIONS = { padding: [90, 90], maxZoom: 14, animate: false };

/**
 * Builds a severity-sized, category-coloured pin.
 *
 * Rendered as a divIcon rather than a Leaflet circleMarker so the pulse animation is CSS
 * and stays on the compositor — a control-room display can carry a hundred of these
 * without the map going to sleep.
 */
function buildIcon(incident, isSelected) {
  const size = Math.round(16 + incident.severity * 2);
  const classes = [
    "pin",
    incident.severity >= CRITICAL_THRESHOLD ? "crit" : "",
    incident.escalating ? "esc" : "",
    isSelected ? "sel" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return L.divIcon({
    className: "",
    html: `<div class="${classes}" style="--sz:${size}px;--cc:${categoryHex(incident.category)}">
             <span class="ring"></span><span class="dot"></span><span class="core"></span>
           </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/** Only rebuild a marker's icon when something it depends on actually changed. */
function iconSignature(incident, isSelected) {
  return `${incident.severity}|${incident.escalating}|${incident.category}|${isSelected}`;
}

export default function IncidentMap({ incidents, center, mode, selectedId, onSelect, focusRequest }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());

  // Once the operator moves the map themselves, it is theirs — auto-framing stops.
  const userControlsCameraRef = useRef(false);
  // Set while we move the map ourselves, so our own moves are not mistaken for theirs.
  const programmaticRef = useRef(false);

  // Latest values, readable from Leaflet callbacks without re-binding listeners.
  const incidentsRef = useRef(incidents);
  incidentsRef.current = incidents;
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;

  /** Move the camera without that move counting as the operator taking control. */
  const moveProgrammatically = useCallback((fn) => {
    programmaticRef.current = true;
    fn();
    requestAnimationFrame(() => {
      programmaticRef.current = false;
    });
  }, []);

  /**
   * Frame every incident currently on the map.
   *
   * Always re-measures first. Leaflet projects markers against the container size it
   * last recorded, so fitting a stale size leaves pins bunched in a corner of a
   * correctly-tiled map — the failure looks like missing data rather than bad layout,
   * which is the worst way for a situational-awareness tool to break.
   */
  const frameAll = useCallback(() => {
    const map = mapRef.current;
    if (!map || userControlsCameraRef.current) return;
    const points = incidentsRef.current.map((i) => [i.lat, i.lon]);
    if (!points.length) return;

    map.invalidateSize({ animate: false, pan: false });
    moveProgrammatically(() => map.fitBounds(L.latLngBounds(points), FIT_OPTIONS));
  }, [moveProgrammatically]);

  // Create the map once, then keep it for the life of the component.
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: true, attributionControl: true }).setView(
      center ?? [19.05, 72.88],
      13,
    );
    L.tileLayer(TILE_URL, { maxZoom: 16, attribution: TILE_ATTRIBUTION }).addTo(map);
    L.tileLayer(LABEL_URL, { maxZoom: 16 }).addTo(map);
    mapRef.current = map;

    // The container's real height only exists once the grid row has resolved, which is
    // after Leaflet has already measured. Re-frame whenever the box actually changes.
    const observer = new ResizeObserver(() => {
      map.invalidateSize({ animate: false, pan: false });
      frameAll();
    });
    observer.observe(containerRef.current);

    const claimCamera = () => {
      if (!programmaticRef.current) userControlsCameraRef.current = true;
    };
    map.on("dragstart", claimCamera);
    map.on("zoomstart", claimCamera);

    return () => {
      map.off("dragstart", claimCamera);
      map.off("zoomstart", claimCamera);
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- created once, updated below

  // Switching feed switches city: recentre immediately and hand the camera back to the map.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !center) return;
    userControlsCameraRef.current = false;
    moveProgrammatically(() => map.setView(center, mode === "live" ? 11 : 13, { animate: false }));
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps -- centre follows the mode

  // Reconcile markers against the current incident list.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const present = new Set();

    for (const incident of incidents) {
      const id = incident.incident_id;
      present.add(id);

      const isSelected = id === selectedId;
      const signature = iconSignature(incident, isSelected);
      const tooltip = `<b style="color:${categoryHex(incident.category)}">${incident.severity}</b> · ${incident.category}`;
      const existing = markersRef.current.get(id);

      if (!existing) {
        const marker = L.marker([incident.lat, incident.lon], {
          icon: buildIcon(incident, isSelected),
          riseOnHover: true,
          riseOffset: 400,
        })
          .addTo(map)
          .bindTooltip(tooltip, { className: "tip", direction: "top", offset: [0, -6], opacity: 1 })
          .on("click", () => selectRef.current(id));
        markersRef.current.set(id, { marker, signature });
        continue;
      }

      const { lat, lng } = existing.marker.getLatLng();
      if (Math.abs(lat - incident.lat) > 1e-6 || Math.abs(lng - incident.lon) > 1e-6) {
        existing.marker.setLatLng([incident.lat, incident.lon]);
      }
      if (existing.signature !== signature) {
        existing.marker.setIcon(buildIcon(incident, isSelected));
        existing.signature = signature;
      }
      existing.marker.setTooltipContent(tooltip);
    }

    for (const [id, entry] of markersRef.current) {
      if (!present.has(id)) {
        map.removeLayer(entry.marker);
        markersRef.current.delete(id);
      }
    }

    // Keep the whole picture framed as the disaster spreads — a first-hour map that stays
    // zoomed on the first report hides everything that came after it.
    frameAll();
  }, [incidents, selectedId, frameAll]);

  // Explicit focus requests (selecting a card, or "Locate on map").
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusRequest) return;
    const target = incidentsRef.current.find((i) => i.incident_id === focusRequest.id);
    if (!target) return;
    // Drilling into an incident is the operator choosing where to look, so the camera
    // becomes theirs — auto-framing must not yank them back out a second later.
    userControlsCameraRef.current = true;
    map.flyTo([target.lat, target.lon], Math.max(focusRequest.zoom ?? 15, map.getZoom()), {
      duration: 0.8,
      easeLinearity: 0.25,
    });
  }, [focusRequest]);

  return <div className="map" ref={containerRef} />;
}
