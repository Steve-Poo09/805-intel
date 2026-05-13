import { useState, useEffect, useRef } from "react";

const API_URL = "https://aim-molecules-constitutional-respective.trycloudflare.com";

const TYPE_CONFIG = {
  FIRE:    { color: "#c0390e", bg: "#fdf0ec", border: "#f5c4b3", badge: "#993c1d" },
  TRAFFIC: { color: "#85500b", bg: "#fdf3e3", border: "#fac775", badge: "#633806" },
  MEDICAL: { color: "#533ab7", bg: "#eeedfe", border: "#afa9ec", badge: "#3c3489" },
  LAW:     { color: "#185fa5", bg: "#e6f1fb", border: "#85b7eb", badge: "#0c447c" },
  HAZMAT:  { color: "#3b6d11", bg: "#eaf3de", border: "#c0dd97", badge: "#27500a" },
  MARINE:  { color: "#0f6e56", bg: "#e1f5ee", border: "#5dcaa5", badge: "#085041" },
};

const COUNTY_CONFIG = {
  "San Luis Obispo": { color: "#185fa5", bg: "#e6f1fb", short: "SLO" },
  "Santa Barbara":   { color: "#993556", bg: "#fbeaf0", short: "SB"  },
};

function formatTime(str) {
  try {
    return new Date(str).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  } catch { return str; }
}

function timeAgo(str) {
  try {
    const s = Math.floor((Date.now() - new Date(str).getTime()) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    return `${Math.floor(s / 3600)}h ago`;
  } catch { return ""; }
}

function IncidentRow({ incident, isNew }) {
  const [expanded, setExpanded] = useState(false);
  const [showRaw, setShowRaw]   = useState(false);
  const cfg    = TYPE_CONFIG[incident.type]   || TYPE_CONFIG.LAW;
  const county = COUNTY_CONFIG[incident.county] || { color: "#222", bg: "#f5f5f5", short: "??" };

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      style={{
        background: expanded ? "#fff" : "#fafafa",
        border: `1px solid ${expanded ? "#d0d0d0" : "#e8e8e8"}`,
        borderLeft: `3px solid ${cfg.color}`,
        borderRadius: 10,
        marginBottom: 6,
        cursor: "pointer",
        transition: "all 0.2s ease",
        animation: isNew ? "slideIn 0.4s ease forwards" : "none",
        overflow: "hidden",
        boxShadow: expanded ? "0 2px 12px rgba(0,0,0,0.08)" : "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
        {/* Time */}
        <div style={{ minWidth: 72, textAlign: "center" }}>
          <div style={{ fontSize: 11, fontFamily: "monospace", color: cfg.color, fontWeight: 600 }}>{formatTime(incident.time)}</div>
          <div style={{ fontSize: 10, color: "#666", marginTop: 2 }}>{timeAgo(incident.time)}</div>
        </div>

        {/* Type badge */}
        <div style={{
          background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.badge,
          fontSize: 9, fontWeight: 700, letterSpacing: 1.5, padding: "3px 8px",
          borderRadius: 6, minWidth: 58, textAlign: "center", fontFamily: "monospace",
        }}>{incident.type}</div>

        {/* County badge */}
        <div style={{
          background: county.bg, color: county.color,
          fontSize: 9, fontWeight: 700, letterSpacing: 1, padding: "3px 7px",
          borderRadius: 6, fontFamily: "monospace",
        }}>{county.short}</div>

        {/* Headline */}
        <div style={{ flex: 1, fontSize: 13, color: "#0a0a0a", fontWeight: 500, lineHeight: 1.4 }}>
          {incident.headline}
        </div>

        {/* Source */}
        <div style={{ fontSize: 10, color: "#777", fontFamily: "monospace", letterSpacing: 0.5, minWidth: 80, textAlign: "right" }}>
          {incident.source}
        </div>

        {/* Chevron */}
        <div style={{ fontSize: 11, color: "#888", transform: expanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>▼</div>
      </div>

      {expanded && (
        <div style={{ padding: "0 16px 16px 16px", borderTop: "1px solid #f0f0f0" }}>
          <p style={{ fontSize: 13, color: "#222", lineHeight: 1.75, margin: "12px 0" }}>{incident.summary}</p>
          {incident.units && incident.units.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
              {incident.units.map(u => (
                <span key={u} style={{ fontSize: 10, fontFamily: "monospace", color: cfg.badge, background: cfg.bg, border: `1px solid ${cfg.border}`, padding: "2px 8px", borderRadius: 5, letterSpacing: 0.5 }}>{u}</span>
              ))}
            </div>
          )}
          <button
            onClick={e => { e.stopPropagation(); setShowRaw(!showRaw); }}
            style={{ background: "#f5f5f5", border: "1px solid #e0e0e0", color: "#555", fontSize: 10, letterSpacing: 1, padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontFamily: "monospace" }}
          >
            {showRaw ? "HIDE RAW" : "VIEW RAW FEED"}
          </button>
          {showRaw && (
            <div style={{ marginTop: 10, padding: "10px 14px", background: "#f8f8f8", borderRadius: 6, fontFamily: "monospace", fontSize: 11, color: "#333", lineHeight: 1.7, border: "1px solid #e8e8e8" }}>
              {incident.raw}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [incidents, setIncidents]         = useState([]);
  const [newIds, setNewIds]               = useState(new Set());
  const [filter, setFilter]               = useState("ALL");
  const [countyFilter, setCountyFilter]   = useState("ALL");
  const [time, setTime]                   = useState(new Date());
  const [status, setStatus]               = useState("connecting");
  const [lastUpdate, setLastUpdate]       = useState(null);
  const prevIds = useRef(new Set());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const fetch805 = async () => {
      try {
        const resp = await fetch(`${API_URL}/incidents`);
        if (!resp.ok) throw new Error();
        const data = await resp.json();
        const incoming = new Set(data.map(i => i.id));
        const brandNew = [...incoming].filter(id => !prevIds.current.has(id));
        prevIds.current = incoming;
        if (brandNew.length > 0) {
          setNewIds(new Set(brandNew));
          setTimeout(() => setNewIds(new Set()), 4000);
        }
        setIncidents(data);
        setStatus("live");
        setLastUpdate(new Date());
      } catch {
        setStatus("error");
      }
    };
    fetch805();
    const iv = setInterval(fetch805, 30000);
    return () => clearInterval(iv);
  }, []);

  const filtered = incidents.filter(i =>
    (filter === "ALL" || i.type === filter) &&
    (countyFilter === "ALL" || i.county === countyFilter)
  );
  const counts = Object.keys(TYPE_CONFIG).reduce((a, t) => {
    a[t] = incidents.filter(i => i.type === t).length;
    return a;
  }, {});

  const statusDot = status === "live" ? "#22c55e" : status === "error" ? "#ef4444" : "#f59e0b";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Bebas+Neue&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f4f4f0; font-family: 'DM Sans', sans-serif; }
        @keyframes slideIn { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes ticker { from{transform:translateX(100vw)} to{transform:translateX(-100%)} }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #ddd; border-radius: 2px; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#f4f4f0" }}>

        {/* Header */}
        <div style={{ background: "#fff", borderBottom: "1px solid #e8e8e8", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", gap: 20 }}>

            {/* Brand */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 0", marginRight: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "#c0390e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📡</div>
              <div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 3, color: "#0a0a0a", lineHeight: 1 }}>805 INTEL</div>
                <div style={{ fontSize: 9, color: "#666", letterSpacing: 2, textTransform: "uppercase" }}>Public Safety Intelligence</div>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: "flex", gap: 6, flex: 1 }}>
              {[
                { label: "Active",  value: incidents.length,                                             color: "#185fa5", bg: "#e6f1fb" },
                { label: "SLO",     value: incidents.filter(i => i.county === "San Luis Obispo").length, color: "#185fa5", bg: "#e6f1fb" },
                { label: "SB",      value: incidents.filter(i => i.county === "Santa Barbara").length,   color: "#993556", bg: "#fbeaf0" },
                { label: "Fire",    value: counts.FIRE    || 0,                                          color: "#993c1d", bg: "#fdf0ec" },
                { label: "Medical", value: counts.MEDICAL || 0,                                          color: "#3c3489", bg: "#eeedfe" },
                { label: "Law",     value: counts.LAW     || 0,                                          color: "#0c447c", bg: "#e6f1fb" },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, borderRadius: 8, padding: "6px 12px", display: "flex", flexDirection: "column", alignItems: "center", minWidth: 52 }}>
                  <span style={{ fontSize: 18, fontWeight: 600, color: s.color, lineHeight: 1 }}>{s.value}</span>
                  <span style={{ fontSize: 9, color: s.color, letterSpacing: 1, textTransform: "uppercase", marginTop: 2, opacity: 0.7 }}>{s.label}</span>
                </div>
              ))}
            </div>

            {/* Right */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: statusDot, animation: "pulse 2s ease-in-out infinite" }} />
                <span style={{ fontSize: 10, color: "#666", letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "monospace" }}>
                  {status === "live" ? "LIVE" : status === "error" ? "OFFLINE" : "CONNECTING"}
                </span>
              </div>
              <span style={{ fontFamily: "monospace", fontSize: 13, color: "#333", letterSpacing: 1 }}>
                {time.toLocaleTimeString("en-US", { hour12: false })}
              </span>
            </div>
          </div>

          {/* Ticker */}
          {incidents.length > 0 && (
            <div style={{ background: "#c0390e", padding: "4px 0", overflow: "hidden", whiteSpace: "nowrap" }}>
              <div style={{ display: "inline-block", animation: "ticker 40s linear infinite", fontSize: 11, fontFamily: "monospace", letterSpacing: 1.5, color: "#fff" }}>
                {incidents.slice(0, 6).map(i => `  ◆  ${i.type} — ${i.headline}`).join("          ")}
              </div>
            </div>
          )}
        </div>

        {/* Main */}
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 24px" }}>

          {/* Ad slot top */}
          <div style={{ background: "#fff", border: "1px dashed #ddd", borderRadius: 10, padding: "12px 20px", marginBottom: 16, textAlign: "center", fontSize: 11, color: "#888", fontFamily: "monospace", letterSpacing: 2 }}>
            ADVERTISEMENT
          </div>

          {/* Last updated */}
          {lastUpdate && (
            <div style={{ fontSize: 11, color: "#777", fontFamily: "monospace", marginBottom: 10, textAlign: "right" }}>
              Updated {lastUpdate.toLocaleTimeString("en-US", { hour12: false })} · auto-refresh 30s
            </div>
          )}

          {/* Filters */}
          <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 10, padding: "12px 16px", marginBottom: 14, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <span style={{ fontSize: 10, color: "#777", letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "monospace", marginRight: 4 }}>TYPE</span>
            {["ALL", ...Object.keys(TYPE_CONFIG)].map(t => {
              const cfg = TYPE_CONFIG[t]; const active = filter === t;
              return (
                <button key={t} onClick={() => setFilter(t)} style={{
                  background: active ? (cfg?.bg || "#f0f0f0") : "#fafafa",
                  border: `1px solid ${active ? (cfg?.border || "#ccc") : "#e8e8e8"}`,
                  color: active ? (cfg?.badge || "#333") : "#888",
                  fontSize: 10, fontFamily: "monospace", letterSpacing: 1, padding: "4px 10px",
                  borderRadius: 6, cursor: "pointer", transition: "all 0.15s", textTransform: "uppercase",
                  fontWeight: active ? 700 : 400,
                }}>{t}</button>
              );
            })}
            <div style={{ width: 1, height: 18, background: "#e8e8e8", margin: "0 4px" }} />
            <span style={{ fontSize: 10, color: "#777", letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "monospace", marginRight: 4 }}>COUNTY</span>
            {[
              { key: "ALL", label: "All",  color: "#333",   bg: "#f0f0f0",  border: "#ddd" },
              { key: "San Luis Obispo", label: "SLO", color: "#0c447c", bg: "#e6f1fb", border: "#85b7eb" },
              { key: "Santa Barbara",  label: "SB",  color: "#72243e", bg: "#fbeaf0", border: "#f4c0d1" },
            ].map(c => {
              const active = countyFilter === c.key;
              return (
                <button key={c.key} onClick={() => setCountyFilter(c.key)} style={{
                  background: active ? c.bg : "#fafafa",
                  border: `1px solid ${active ? c.border : "#e8e8e8"}`,
                  color: active ? c.color : "#888",
                  fontSize: 10, fontFamily: "monospace", letterSpacing: 1, padding: "4px 10px",
                  borderRadius: 6, cursor: "pointer", transition: "all 0.15s",
                  fontWeight: active ? 700 : 400,
                }}>{c.label}</button>
              );
            })}
            <div style={{ marginLeft: "auto", fontSize: 10, color: "#888", fontFamily: "monospace" }}>{filtered.length} incidents</div>
          </div>

          {/* Column headers */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "4px 16px", marginBottom: 6, fontSize: 9, color: "#888", letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "monospace" }}>
            <span style={{ minWidth: 72 }}>Time</span>
            <span style={{ minWidth: 58 }}>Type</span>
            <span style={{ minWidth: 36 }}>Co</span>
            <span style={{ flex: 1 }}>Incident</span>
            <span style={{ minWidth: 80, textAlign: "right" }}>Source</span>
            <span style={{ minWidth: 18 }} />
          </div>

          {/* Incident list */}
          {status === "connecting" && incidents.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#888", fontFamily: "monospace", fontSize: 12, letterSpacing: 2 }}>CONNECTING TO FEED...</div>
          ) : status === "error" && incidents.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#e55", fontFamily: "monospace", fontSize: 12, letterSpacing: 2 }}>⚠ FEED TEMPORARILY OFFLINE</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#888", fontFamily: "monospace", fontSize: 12, letterSpacing: 2 }}>NO INCIDENTS MATCHING FILTER</div>
          ) : (
            filtered.map(inc => <IncidentRow key={inc.id} incident={inc} isNew={newIds.has(inc.id)} />)
          )}

          {/* Ad slot bottom */}
          <div style={{ background: "#fff", border: "1px dashed #ddd", borderRadius: 10, padding: "12px 20px", marginTop: 20, textAlign: "center", fontSize: 11, color: "#888", fontFamily: "monospace", letterSpacing: 2 }}>
            ADVERTISEMENT
          </div>

          {/* Footer */}
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #e8e8e8", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 10, color: "#888", fontFamily: "monospace", letterSpacing: 1 }}>© 2026 805INTEL.COM — SAN LUIS OBISPO + SANTA BARBARA COUNTIES</span>
            <span style={{ fontSize: 10, color: "#888", fontFamily: "monospace", letterSpacing: 1 }}>DATA: CHP CAD + SCANNER</span>
          </div>
        </div>
      </div>
    </>
  );
}