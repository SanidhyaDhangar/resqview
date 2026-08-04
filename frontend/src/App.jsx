import { useCallback, useMemo, useState } from "react";

import CategoryBar from "./components/CategoryBar.jsx";
import CategoryFilters from "./components/CategoryFilters.jsx";
import DetailDrawer from "./components/DetailDrawer.jsx";
import IncidentMap from "./components/IncidentMap.jsx";
import IncomingStream from "./components/IncomingStream.jsx";
import MapLegend from "./components/MapLegend.jsx";
import MissionTimeline from "./components/MissionTimeline.jsx";
import PriorityQueue from "./components/PriorityQueue.jsx";
import StatTiles from "./components/StatTiles.jsx";
import Toasts from "./components/Toasts.jsx";
import TopBar from "./components/TopBar.jsx";
import { useIncidents } from "./hooks/useIncidents.js";
import { useToasts } from "./hooks/useToasts.js";
import { CATEGORY_KEYS, CRITICAL_THRESHOLD } from "./lib/constants.js";
import { severityHex, severityLabel } from "./lib/format.js";

export default function App() {
  const [mode, setMode] = useState("scenario");
  const [activeCategories, setActiveCategories] = useState(() => new Set(CATEGORY_KEYS));
  const [selectedId, setSelectedId] = useState(null);
  const [focusRequest, setFocusRequest] = useState(null);

  const { toasts, push, clear: clearToasts } = useToasts();

  const announce = useCallback(
    (incident) => {
      push({
        icon: "⚠️",
        title: `New ${severityLabel(incident.severity).toLowerCase()} ${incident.category}`,
        detail: `sev ${incident.severity} · ${incident.incident_id}`,
        color: severityHex(incident.severity),
      });
    },
    [push],
  );

  const { data, error, isLoading, restart } = useIncidents(mode, announce);

  const incidents = data?.incidents ?? [];
  const visible = useMemo(
    () => incidents.filter((i) => activeCategories.has(i.category)),
    [incidents, activeCategories],
  );

  const selected = useMemo(
    () => visible.find((i) => i.incident_id === selectedId) ?? null,
    [visible, selectedId],
  );

  const sourceCount = useMemo(() => {
    const set = new Set();
    visible.forEach((i) => i.sources.forEach((s) => set.add(s)));
    return set.size;
  }, [visible]);

  const criticalCount = visible.filter((i) => i.severity >= CRITICAL_THRESHOLD).length;

  const toggleCategory = useCallback((category) => {
    setActiveCategories((current) => {
      const next = new Set(current);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }, []);

  const selectIncident = useCallback((id) => {
    setSelectedId(id);
    setFocusRequest({ id, zoom: 15, nonce: Date.now() });
  }, []);

  const locateIncident = useCallback((id) => {
    setFocusRequest({ id, zoom: 16, nonce: Date.now() });
  }, []);

  const closeDrawer = useCallback(() => setSelectedId(null), []);

  const changeMode = useCallback(
    (next) => {
      if (next === mode) return;
      setMode(next);
      setSelectedId(null);
      setFocusRequest(null);
      clearToasts();
    },
    [mode, clearToasts],
  );

  const handleRestart = useCallback(() => {
    setSelectedId(null);
    clearToasts();
    restart();
  }, [restart, clearToasts]);

  // An empty queue must always say *why* it is empty. "Nothing is happening" and
  // "nothing reached us" look identical on a map, and confusing them is dangerous.
  const emptyState = error ? (
    <div className="empty">
      <b>No picture available</b>
      The feed could not be reached, so nothing here is current. Check the source and retry.
    </div>
  ) : incidents.length ? (
    <div className="empty">
      <b>Everything is filtered out</b>
      {incidents.length} incident{incidents.length === 1 ? " is" : "s are"} active but hidden by the
      category filters above.
    </div>
  ) : (
    <div className="empty">
      <b>No incidents yet</b>
      Reports are arriving; incidents appear here as soon as the engine has something to rank.
    </div>
  );

  return (
    <>
      <div className="ambient" aria-hidden="true" />

      <div className="app">
        <TopBar mode={mode} onModeChange={changeMode} data={data} onRestart={handleRestart} />

        <div className="sidebar">
          <StatTiles
            rawReceived={data?.raw_received ?? 0}
            incidentCount={visible.length}
            criticalCount={criticalCount}
            sourceCount={sourceCount}
          />
          <CategoryBar incidents={visible} />

          <div className="section-h">Filter by category</div>
          <CategoryFilters active={activeCategories} onToggle={toggleCategory} />

          <div className="section-h">
            Priority Queue <span className="count">{visible.length} active</span>
          </div>

          <PriorityQueue
            incidents={visible}
            selectedId={selectedId}
            onSelect={selectIncident}
            isLoading={isLoading && !data}
            emptyState={emptyState}
          />

          <div className="legend">
            Pins sized by severity · colour by category · pulsing ring = escalating. Every incident is{" "}
            <b>decision-support only</b> and traces back to raw evidence.
          </div>
        </div>

        <main className="main">
          <IncidentMap
            incidents={visible}
            center={data?.center}
            mode={mode}
            selectedId={selectedId}
            onSelect={selectIncident}
            focusRequest={focusRequest}
          />

          <IncomingStream key={mode} feed={data?.raw_feed ?? []} />
          <MapLegend />
          <MissionTimeline data={data} />

          <DetailDrawer incident={selected} onClose={closeDrawer} onLocate={locateIncident} />

          {error ? (
            <div className="banner" role="alert">
              <span aria-hidden="true">📡</span>
              <span>Feed unavailable</span>
              <span className="sub">{error} — showing the last good picture</span>
            </div>
          ) : (
            <Toasts toasts={toasts} />
          )}
        </main>
      </div>
    </>
  );
}
