import { useState, useEffect, useRef } from "react";

const VALID_USERNAME = "ksbynews";
const VALID_PASSWORD = "oncallejoaquin";
const SESSION_KEY = "805intel_auth";

const MOCK_INCIDENTS = [
  { id: 1, time: new Date(Date.now() - 2 * 60000), source: "SLO CAD", county: "San Luis Obispo", type: "TRAFFIC", headline: "Multi-vehicle collision on US-101 near Pismo Beach", summary: "A three-vehicle collision was reported on US-101 northbound near the Pismo Beach exit. Two units from Cal Fire SLO and SLO County Sheriff deputies are responding. The left lane is blocked. No reported injuries at this time. CHP is on scene managing traffic flow.", units: ["CAL FIRE SLO 3", "SLO SHERIFF 14", "CHP UNIT 22"], raw: "TRAFFIC COLLISION — US101 NB @ PISMO BCH EXIT — 3 VEH INVLVD — L LANE BLKD — NO INJ RPT" },
  { id: 2, time: new Date(Date.now() - 7 * 60000), source: "SB SCANNER", county: "Santa Barbara", type: "FIRE", headline: "Vegetation fire reported near Gaviota State Park", summary: "Scanner traffic indicates a small vegetation fire near Gaviota State Park along Highway 101. Cal Fire Santa Barbara units have been dispatched. Fire is reported at approximately half an acre with moderate wind conditions.", units: ["CAL FIRE SB 1", "CAL FIRE SB AIR ATTACK", "SB COUNTY FIRE 7"], raw: "VEG FIRE — HWY 101 / GAVIOTA ST PK — EST 0.5 AC — MOD WIND" },
  { id: 3, time: new Date(Date.now() - 14 * 60000), source: "SLO CAD", county: "San Luis Obispo", type: "MEDICAL", headline: "Medical emergency at Cal Poly campus, Kennedy Library", summary: "A medical emergency was reported inside the Kennedy Library on the Cal Poly San Luis Obispo campus. AMR ambulance and campus police are responding. The subject is reported as conscious and breathing.", units: ["AMR 805", "CAL POLY PD 3"], raw: "MEDICAL EMRG — CAL POLY SLO KENNEDY LIB — SUBJ C/B — AMR805 DISP" },
  { id: 4, time: new Date(Date.now() - 31 * 60000), source: "SB SCANNER", county: "Santa Barbara", type: "LAW", headline: "Pursuit terminated near Santa Barbara downtown", summary: "Santa Barbara PD units terminated a vehicle pursuit in downtown Santa Barbara near State Street and Haley. The suspect vehicle was abandoned. Officers are conducting a perimeter search on foot.", units: ["SBPD 7", "SBPD 12", "SBPD K9"], raw: "PURSUIT TERM — STATE ST / HALEY — DARK SEDAN ABAND — PERIM SEARCH" },
  { id: 5, time: new Date(Date.now() - 48 * 60000), source: "SLO CAD", county: "San Luis Obispo", type: "HAZMAT", headline: "Gas leak reported at Paso Robles commercial building", summary: "A natural gas leak was reported at a commercial property on Spring Street in Paso Robles. Paso Robles Fire and SoCalGas crews are on scene. A 100-foot evacuation radius has been established.", units: ["PASO ROBLES FIRE 1", "PASO ROBLES FIRE 2", "SOCALGAS CREW"], raw: "GAS LEAK — SPRING ST PASO ROBLES — 100FT EVAC ESTAB" },
  { id: 6, time: new Date(Date.now() - 73 * 60000), source: "SB SCANNER", county: "Santa Barbara", type: "MARINE", headline: "Vessel taking on water near Channel Islands Harbor", summary: "The Coast Guard was notified of a recreational vessel taking on water approximately 2 miles west of Channel Islands Harbor. Two aboard are wearing life vests and are in contact via VHF radio.", units: ["USCG SECTOR LA", "TOW VESSEL SEATOW"], raw: "VESSEL DISTRESS — 2MI W CHANNEL ISLANDS HBR — 2 POB LIFE VESTS" },
];

const TYPE_CONFIG = {
  FIRE:    { color: "#ff6b35", glow: "rgba(255,107,53,0.4)",   bg: "rgba(255,107,53,0.15)",  border: "rgba(255,107,53,0.3)"  },
  TRAFFIC: { color: "#ffd166", glow: "rgba(255,209,102,0.4)",  bg: "rgba(255,209,102,0.15)", border: "rgba(255,209,102,0.3)" },
  MEDICAL: { color: "#c77dff", glow: "rgba(199,125,255,0.4)",  bg: "rgba(199,125,255,0.15)", border: "rgba(199,125,255,0.3)" },
  LAW:     { color: "#48cae4", glow: "rgba(72,202,228,0.4)",   bg: "rgba(72,202,228,0.15)",  border: "rgba(72,202,228,0.3)"  },
  HAZMAT:  { color: "#80ffdb", glow: "rgba(128,255,219,0.4)",  bg: "rgba(128,255,219,0.15)", border: "rgba(128,255,219,0.3)" },
  MARINE:  { color: "#4895ef", glow: "rgba(72,149,239,0.4)",   bg: "rgba(72,149,239,0.15)",  border: "rgba(72,149,239,0.3)"  },
};

const COUNTY_CONFIG = {
  "San Luis Obispo": { color: "#48cae4", short: "SLO" },
  "Santa Barbara":   { color: "#f72585", short: "SB"  },
};

function formatTime(d) {
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}
function timeAgo(d) {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}
function getSampleHeadline(type, county) {
  const h = {
    FIRE:    [`Structure fire in ${county}`, `Brush fire in ${county} foothills`],
    TRAFFIC: [`Injury collision on Hwy 101 in ${county}`, `Road closure in ${county}`],
    MEDICAL: [`Medical emergency in ${county}`, `Multi-casualty incident in ${county}`],
    LAW:     [`Suspect at large in ${county}`, `Armed robbery in ${county}`],
    HAZMAT:  [`Chemical spill in ${county}`, `Hazmat response in ${county}`],
    MARINE:  [`Vessel in distress near ${county}`, `Swimmer rescue in ${county}`],
  };
  const opts = h[type] || [`Incident in ${county}`];
  return opts[Math.floor(Math.random() * opts.length)];
}

function LoginScreen({ onLogin, error, loading }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [showP, setShowP] = useState(false);

  const inputStyle = {
    width: "100%",
    background: "rgba(255,255,255,0.06)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12,
    color: "#ffffff",
    WebkitTextFillColor: "#ffffff",
    fontSize: 14,
    padding: "13px 16px",
    fontFamily: "'DM Sans', sans-serif",
    outline: "none",
    transition: "all 0.2s",
    boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #0d0221 0%, #0a0e27 40%, #06141b 100%)", fontFamily: "'DM Sans', sans-serif", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "fixed", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(72,202,228,0.08) 0%, transparent 70%)", top: "-100px", right: "-100px", pointerEvents: "none" }} />
      <div style={{ position: "fixed", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(247,37,133,0.06) 0%, transparent 70%)", bottom: "-150px", left: "-150px", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 420, padding: "0 24px", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, margin: "0 auto 20px", background: "linear-gradient(135deg, rgba(255,107,53,0.3), rgba(247,37,133,0.2))", backdropFilter: "blur(20px)", border: "1px solid rgba(255,107,53,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, boxShadow: "0 0 40px rgba(255,107,53,0.2), inset 0 1px 0 rgba(255,255,255,0.1)" }}>📡</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 38, letterSpacing: 6, color: "white", lineHeight: 1 }}>805 INTEL</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: 4, textTransform: "uppercase", marginTop: 8 }}>Newsroom Intelligence Feed</div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(40px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: 32, boxShadow: "0 32px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: 3, textTransform: "uppercase", marginBottom: 24, display: "flex", alignItems: "center", gap: 8, fontFamily: "'DM Mono', monospace" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ff6b35", display: "inline-block", boxShadow: "0 0 8px #ff6b35" }} />
            Staff Access Only
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8, fontFamily: "'DM Mono', monospace" }}>Username</label>
            <input
              type="text"
              value={u}
              onChange={e => setU(e.target.value)}
              placeholder="Enter username"
              onKeyDown={e => e.key === "Enter" && onLogin(u, p)}
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = "rgba(72,202,228,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(72,202,228,0.1)"; }}
              onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8, fontFamily: "'DM Mono', monospace" }}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showP ? "text" : "password"}
                value={p}
                onChange={e => setP(e.target.value)}
                placeholder="Enter password"
                onKeyDown={e => e.key === "Enter" && onLogin(u, p)}
                style={{ ...inputStyle, paddingRight: 48 }}
                onFocus={e => { e.target.style.borderColor = "rgba(72,202,228,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(72,202,228,0.1)"; }}
                onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }}
              />
              <button onClick={() => setShowP(!showP)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", fontSize: 16, padding: 0 }}>
                {showP ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ marginBottom: 16, padding: "10px 14px", background: "rgba(255,107,53,0.1)", border: "1px solid rgba(255,107,53,0.25)", borderRadius: 10, fontSize: 12, color: "#ff6b35", fontFamily: "'DM Mono', monospace", letterSpacing: 1 }}>
              ⚠ {error}
            </div>
          )}

          <button onClick={() => onLogin(u, p)} disabled={loading} style={{ width: "100%", padding: 14, background: loading ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, rgba(255,107,53,0.8), rgba(247,37,133,0.7))", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, color: "white", fontSize: 12, fontFamily: "'DM Mono', monospace", letterSpacing: 3, textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer", boxShadow: loading ? "none" : "0 8px 32px rgba(255,107,53,0.25)", transition: "all 0.2s" }}>
            {loading ? "Authenticating..." : "Access Feed →"}
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 10, color: "rgba(255,255,255,0.12)", fontFamily: "'DM Mono', monospace", letterSpacing: 2 }}>
          SCOUTLABS · 805 INTEL · AUTHORIZED PERSONNEL ONLY
        </div>
      </div>
    </div>
  );
}

function IncidentRow({ incident, isNew }) {
  const [expanded, setExpanded] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const cfg = TYPE_CONFIG[incident.type] || TYPE_CONFIG.LAW;
  const county = COUNTY_CONFIG[incident.county] || { color: "#fff", short: "??" };

  return (
    <div onClick={() => setExpanded(!expanded)} style={{ background: expanded ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)", backdropFilter: "blur(20px)", border: `1px solid ${expanded ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)"}`, borderLeft: `2px solid ${cfg.color}`, borderRadius: 16, marginBottom: 8, cursor: "pointer", transition: "all 0.25s ease", animation: isNew ? "slideIn 0.4s ease forwards" : "none", overflow: "hidden", boxShadow: expanded ? "0 8px 32px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.2)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px" }}>
        <div style={{ minWidth: 72, textAlign: "center" }}>
          <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: cfg.color, letterSpacing: 1 }}>{formatTime(incident.time)}</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>{timeAgo(incident.time)}</div>
        </div>
        <div style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color, fontSize: 9, fontWeight: 700, letterSpacing: 2, padding: "4px 10px", borderRadius: 8, minWidth: 60, textAlign: "center", fontFamily: "'DM Mono', monospace", boxShadow: `0 0 12px ${cfg.glow}` }}>{incident.type}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 36 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: county.color, boxShadow: `0 0 6px ${county.color}`, flexShrink: 0 }} />
          <span style={{ fontSize: 9, color: county.color, fontFamily: "'DM Mono', monospace", letterSpacing: 1 }}>{county.short}</span>
        </div>
        <div style={{ flex: 1, fontSize: 13, color: "rgba(255,255,255,0.88)", fontWeight: 500, lineHeight: 1.4 }}>{incident.headline}</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "'DM Mono', monospace", letterSpacing: 1, minWidth: 82, textAlign: "right" }}>{incident.source}</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", transform: expanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.25s", marginLeft: 2 }}>▼</div>
      </div>
      {expanded && (
        <div style={{ padding: "4px 18px 18px 18px", borderTop: "1px solid rgba(255,255,255,0.06)", animation: "fadeIn 0.2s ease" }}>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.75, margin: "14px 0 14px" }}>{incident.summary}</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            {incident.units.map(u => (
              <span key={u} style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, padding: "3px 10px", borderRadius: 6, letterSpacing: 1 }}>{u}</span>
            ))}
          </div>
          <button onClick={e => { e.stopPropagation(); setShowRaw(!showRaw); }} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.3)", fontSize: 10, letterSpacing: 2, padding: "5px 12px", borderRadius: 8, cursor: "pointer", fontFamily: "'DM Mono', monospace", textTransform: "uppercase" }}>
            {showRaw ? "Hide Raw" : "View Raw Feed"}
          </button>
          {showRaw && (
            <div style={{ marginTop: 10, padding: "12px 16px", background: "rgba(128,255,219,0.04)", borderRadius: 10, fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#80ffdb", letterSpacing: 1, lineHeight: 1.7, border: "1px solid rgba(128,255,219,0.12)" }}>
              {incident.raw}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Dashboard({ onSignOut }) {
  const [incidents, setIncidents] = useState(MOCK_INCIDENTS);
  const [newIds, setNewIds] = useState(new Set());
  const [filter, setFilter] = useState("ALL");
  const [countyFilter, setCountyFilter] = useState("ALL");
  const [time, setTime] = useState(new Date());
  const nextId = useRef(100);

  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);

  useEffect(() => {
    const iv = setInterval(() => {
      if (Math.random() < 0.3) {
        const types = Object.keys(TYPE_CONFIG);
        const counties = ["San Luis Obispo", "Santa Barbara"];
        const sources = { "San Luis Obispo": "SLO CAD", "Santa Barbara": "SB SCANNER" };
        const county = counties[Math.floor(Math.random() * counties.length)];
        const type = types[Math.floor(Math.random() * types.length)];
        const id = nextId.current++;
        const inc = { id, time: new Date(), source: sources[county], county, type, headline: getSampleHeadline(type, county), summary: "New incident detected. Units are being dispatched. Details are being confirmed by responding officers. Further updates will follow.", units: ["UNIT 1", "UNIT 2"], raw: `${type} — LOCATION TBD — UNITS DISPATCHED` };
        setIncidents(prev => [inc, ...prev].slice(0, 50));
        setNewIds(prev => new Set([...prev, id]));
        setTimeout(() => setNewIds(prev => { const n = new Set(prev); n.delete(id); return n; }), 3000);
      }
    }, 10000);
    return () => clearInterval(iv);
  }, []);

  const filtered = incidents.filter(i => (filter === "ALL" || i.type === filter) && (countyFilter === "ALL" || i.county === countyFilter));
  const counts = Object.keys(TYPE_CONFIG).reduce((a, t) => { a[t] = incidents.filter(i => i.type === t).length; return a; }, {});

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0d0221 0%, #0a0e27 40%, #06141b 100%)", fontFamily: "'DM Sans', sans-serif", color: "white", position: "relative" }}>
      <div style={{ position: "fixed", width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(circle, rgba(72,202,228,0.05) 0%, transparent 70%)", top: "-200px", right: "-200px", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(247,37,133,0.04) 0%, transparent 70%)", bottom: "-100px", left: "-100px", pointerEvents: "none", zIndex: 0 }} />

      <div style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(13,2,33,0.7)", backdropFilter: "blur(40px)", borderBottom: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 4px 30px rgba(0,0,0,0.3)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 0", marginRight: 8 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg, rgba(255,107,53,0.4), rgba(247,37,133,0.3))", backdropFilter: "blur(10px)", border: "1px solid rgba(255,107,53,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, boxShadow: "0 0 20px rgba(255,107,53,0.2)" }}>📡</div>
            <div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 4, lineHeight: 1 }}>805 INTEL</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: 3, textTransform: "uppercase" }}>Intelligence Feed</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flex: 1 }}>
            {[
              { label: "Active", value: incidents.length, color: "#48cae4" },
              { label: "SLO", value: incidents.filter(i => i.county === "San Luis Obispo").length, color: "#48cae4" },
              { label: "SB", value: incidents.filter(i => i.county === "Santa Barbara").length, color: "#f72585" },
              { label: "Fire", value: counts.FIRE || 0, color: "#ff6b35" },
              { label: "Medical", value: counts.MEDICAL || 0, color: "#c77dff" },
              { label: "Law", value: counts.LAW || 0, color: "#48cae4" },
            ].map(s => (
              <div key={s.label} style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "6px 14px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: s.color, fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{s.value}</span>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: 1.5, textTransform: "uppercase", marginTop: 2 }}>{s.label}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#48cae4", boxShadow: "0 0 8px #48cae4", animation: "livePulse 2s ease-in-out infinite" }} />
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: 2, fontFamily: "'DM Mono', monospace" }}>LIVE</span>
            </div>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#48cae4", letterSpacing: 2 }}>{time.toLocaleTimeString("en-US", { hour12: false })}</span>
            <button onClick={onSignOut} style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "rgba(255,255,255,0.3)", fontSize: 10, letterSpacing: 2, padding: "6px 14px", cursor: "pointer", fontFamily: "'DM Mono', monospace", textTransform: "uppercase" }}>Sign Out</button>
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,107,53,0.06)", padding: "5px 0", overflow: "hidden", whiteSpace: "nowrap" }}>
          <div style={{ display: "inline-block", animation: "ticker 40s linear infinite", fontSize: 11, fontFamily: "'DM Mono', monospace", letterSpacing: 1.5, color: "rgba(255,107,53,0.7)" }}>
            {incidents.slice(0, 6).map(i => `  ◆  ${i.type} — ${i.headline}`).join("          ")}
          </div>
          <style>{`@keyframes ticker{from{transform:translateX(100vw)}to{transform:translateX(-100%)}}`}</style>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px", position: "relative", zIndex: 1 }}>
        <div style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "14px 18px", marginBottom: 18, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", letterSpacing: 2, textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginRight: 4 }}>Type</span>
          {["ALL", ...Object.keys(TYPE_CONFIG)].map(t => {
            const cfg = TYPE_CONFIG[t]; const active = filter === t;
            return <button key={t} onClick={() => setFilter(t)} style={{ background: active ? (cfg?.bg || "rgba(255,255,255,0.1)") : "rgba(255,255,255,0.03)", backdropFilter: "blur(10px)", border: `1px solid ${active ? (cfg?.border || "rgba(255,255,255,0.3)") : "rgba(255,255,255,0.06)"}`, color: active ? (cfg?.color || "white") : "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "'DM Mono', monospace", letterSpacing: 1.5, padding: "5px 14px", borderRadius: 8, cursor: "pointer", transition: "all 0.15s", textTransform: "uppercase", boxShadow: active && cfg ? `0 0 12px ${cfg.glow}` : "none" }}>{t}</button>;
          })}
          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)", margin: "0 4px" }} />
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", letterSpacing: 2, textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginRight: 4 }}>County</span>
          {[{ key: "ALL", label: "All", color: "white" }, { key: "San Luis Obispo", label: "SLO", color: "#48cae4" }, { key: "Santa Barbara", label: "SB", color: "#f72585" }].map(c => {
            const active = countyFilter === c.key;
            return <button key={c.key} onClick={() => setCountyFilter(c.key)} style={{ background: active ? `${c.color}18` : "rgba(255,255,255,0.03)", backdropFilter: "blur(10px)", border: `1px solid ${active ? c.color + "44" : "rgba(255,255,255,0.06)"}`, color: active ? c.color : "rgba(255,255,255,0.3)", fontSize: 10, fontFamily: "'DM Mono', monospace", letterSpacing: 1.5, padding: "5px 14px", borderRadius: 8, cursor: "pointer", transition: "all 0.15s", boxShadow: active ? `0 0 12px ${c.color}33` : "none" }}>{c.label}</button>;
          })}
          <div style={{ marginLeft: "auto", fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: "'DM Mono', monospace", letterSpacing: 1 }}>{filtered.length} incidents</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "4px 18px", marginBottom: 6, fontSize: 9, color: "rgba(255,255,255,0.18)", letterSpacing: 2, textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
          <span style={{ minWidth: 72 }}>Time</span>
          <span style={{ minWidth: 60 }}>Type</span>
          <span style={{ minWidth: 36 }}>Co</span>
          <span style={{ flex: 1 }}>Incident</span>
          <span style={{ minWidth: 82, textAlign: "right" }}>Source</span>
          <span style={{ minWidth: 18 }} />
        </div>

        {filtered.length === 0
          ? <div style={{ textAlign: "center", padding: "80px 20px", color: "rgba(255,255,255,0.15)", fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 3 }}>NO INCIDENTS MATCHING FILTER</div>
          : filtered.map(inc => <IncidentRow key={inc.id} incident={inc} isNew={newIds.has(inc.id)} />)
        }

        <div style={{ marginTop: 32, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.15)", fontFamily: "'DM Mono', monospace", letterSpacing: 1 }}>SCOUTLABS / 805 INTEL v1.0 — SLO + SB COUNTY</span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.15)", fontFamily: "'DM Mono', monospace", letterSpacing: 1 }}>AUTO-REFRESH 60s</span>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === "true");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (username, password) => {
    setError("");
    if (!username || !password) { setError("USERNAME AND PASSWORD REQUIRED"); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    if (username.trim() === VALID_USERNAME && password.trim() === VALID_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "true");
      setAuthed(true);
    } else {
      setError("INVALID USERNAME OR PASSWORD");
    }
    setLoading(false);
  };

  const handleSignOut = () => { sessionStorage.removeItem(SESSION_KEY); setAuthed(false); };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&family=Bebas+Neue&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0d0221; }
        input, input:focus, input:active { color: #ffffff !important; -webkit-text-fill-color: #ffffff !important; }
        input::placeholder { color: rgba(255,255,255,0.25) !important; -webkit-text-fill-color: rgba(255,255,255,0.25) !important; }
        input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus { -webkit-text-fill-color: #ffffff !important; -webkit-box-shadow: 0 0 0px 1000px rgba(255,255,255,0.06) inset !important; transition: background-color 5000s ease-in-out 0s; }
        @keyframes slideIn { from{opacity:0;transform:translateY(-14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes livePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.8)} }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
      `}</style>
      {authed ? <Dashboard onSignOut={handleSignOut} /> : <LoginScreen onLogin={handleLogin} error={error} loading={loading} />}
    </>
  );
}
