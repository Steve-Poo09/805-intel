import { useState, useEffect, useRef } from "react";

// ============================================================
// CREDENTIALS — change these before deploying
// In production set these as Vercel environment variables:
//   REACT_APP_USERNAME=yourUsername
//   REACT_APP_PASSWORD=yourPassword
// ============================================================
const VALID_USERNAME = process.env.REACT_APP_USERNAME || "ksbynews";
const VALID_PASSWORD = process.env.REACT_APP_PASSWORD || "oncallejoaquin";
const SESSION_KEY = "805intel_auth";

// ============================================================
// MOCK DATA
// ============================================================
const MOCK_INCIDENTS = [
  { id: 1, time: new Date(Date.now() - 2 * 60000), source: "SLO CAD", county: "San Luis Obispo", type: "TRAFFIC", headline: "Multi-vehicle collision on US-101 near Pismo Beach", summary: "A three-vehicle collision was reported on US-101 northbound near the Pismo Beach exit. Two units from Cal Fire SLO and SLO County Sheriff deputies are responding. The left lane is blocked. No reported injuries at this time. CHP is on scene managing traffic flow.", units: ["CAL FIRE SLO 3", "SLO SHERIFF 14", "CHP UNIT 22"], raw: "TRAFFIC COLLISION — US101 NB @ PISMO BCH EXIT — 3 VEH INVLVD — L LANE BLKD — NO INJ RPT — CALFIRE SLO3 / SLOSHERIFF14 / CHP22 RESP" },
  { id: 2, time: new Date(Date.now() - 7 * 60000), source: "SB SCANNER", county: "Santa Barbara", type: "FIRE", headline: "Vegetation fire reported near Gaviota State Park", summary: "Scanner traffic indicates a small vegetation fire near Gaviota State Park along Highway 101. Cal Fire Santa Barbara units have been dispatched. Fire is reported at approximately half an acre with moderate wind conditions. Air attack base was alerted as a precaution.", units: ["CAL FIRE SB 1", "CAL FIRE SB AIR ATTACK", "SB COUNTY FIRE 7"], raw: "VEG FIRE — HWY 101 / GAVIOTA ST PK — EST 0.5 AC — MOD WIND — CALFIRESB1 / AIRATK ALERTED / SBCF7" },
  { id: 3, time: new Date(Date.now() - 14 * 60000), source: "SLO CAD", county: "San Luis Obispo", type: "MEDICAL", headline: "Medical emergency at Cal Poly campus, Kennedy Library", summary: "A medical emergency was reported inside the Kennedy Library on the Cal Poly San Luis Obispo campus. AMR ambulance and campus police are responding. The subject is reported as conscious and breathing.", units: ["AMR 805", "CAL POLY PD 3"], raw: "MEDICAL EMRG — CAL POLY SLO KENNEDY LIB — SUBJ C/B — AMR805 / CALPOLYPD3 DISP" },
  { id: 4, time: new Date(Date.now() - 31 * 60000), source: "SB SCANNER", county: "Santa Barbara", type: "LAW", headline: "Pursuit terminated near Santa Barbara downtown", summary: "Santa Barbara PD units terminated a vehicle pursuit in downtown Santa Barbara near State Street and Haley. The suspect vehicle was abandoned. Officers are conducting a perimeter search on foot.", units: ["SBPD 7", "SBPD 12", "SBPD K9"], raw: "PURSUIT TERM — STATE ST / HALEY — DARK SEDAN ABAND — PERIM SEARCH — SBPD7 / SBPD12 / K9 ON SCENE" },
  { id: 5, time: new Date(Date.now() - 48 * 60000), source: "SLO CAD", county: "San Luis Obispo", type: "HAZMAT", headline: "Gas leak reported at Paso Robles commercial building", summary: "A natural gas leak was reported at a commercial property on Spring Street in Paso Robles. Paso Robles Fire and SoCalGas crews are on scene. A 100-foot evacuation radius has been established.", units: ["PASO ROBLES FIRE 1", "PASO ROBLES FIRE 2", "SOCALGAS CREW"], raw: "GAS LEAK — SPRING ST PASO ROBLES COMM BLDG — 100FT EVAC ESTAB — PRFIRE1/2 / SOCALGAS ON SCENE" },
  { id: 6, time: new Date(Date.now() - 73 * 60000), source: "SB SCANNER", county: "Santa Barbara", type: "MARINE", headline: "Vessel taking on water near Channel Islands Harbor", summary: "The Coast Guard was notified of a recreational vessel taking on water approximately 2 miles west of Channel Islands Harbor. Two aboard are wearing life vests and are in contact via VHF radio.", units: ["USCG SECTOR LA", "TOW VESSEL SEATOW"], raw: "VESSEL DISTRESS — 2MI W CHANNEL ISLANDS HBR — 2 POB LIFE VESTS — VHF CONTACT — USCG / SEATOW RESP" },
];

const TYPE_CONFIG = {
  FIRE:    { color: "#ff4d1c", bg: "rgba(255,77,28,0.12)",   label: "FIRE"    },
  TRAFFIC: { color: "#f5a623", bg: "rgba(245,166,35,0.12)",  label: "TRAFFIC" },
  MEDICAL: { color: "#e040fb", bg: "rgba(224,64,251,0.12)",  label: "MEDICAL" },
  LAW:     { color: "#00e5ff", bg: "rgba(0,229,255,0.12)",   label: "LAW"     },
  HAZMAT:  { color: "#76ff03", bg: "rgba(118,255,3,0.12)",   label: "HAZMAT"  },
  MARINE:  { color: "#448aff", bg: "rgba(68,138,255,0.12)",  label: "MARINE"  },
};

const COUNTY_COLOR = {
  "San Luis Obispo": "#00e5ff",
  "Santa Barbara":   "#ff4081",
};

function formatTime(date) {
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}
function timeAgo(date) {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
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

// ============================================================
// SHARED UI
// ============================================================
function ScanLine() {
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", zIndex: 9999,
      background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
    }} />
  );
}
function PulsingDot({ color }) {
  return (
    <span style={{ position: "relative", display: "inline-block", width: 10, height: 10 }}>
      <span style={{ display: "block", width: 10, height: 10, borderRadius: "50%", background: color, position: "absolute", boxShadow: `0 0 6px ${color}`, animation: "pulse 1.4s ease-in-out infinite" }} />
    </span>
  );
}
function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  return <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 13, color: "#00e5ff", letterSpacing: 2 }}>{time.toLocaleTimeString("en-US", { hour12: false })}</span>;
}
function StatBadge({ label, value, color }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 20px", borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
      <span style={{ fontSize: 22, fontWeight: 700, color, fontFamily: "'Share Tech Mono', monospace", lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: 2, marginTop: 4, textTransform: "uppercase" }}>{label}</span>
    </div>
  );
}

// ============================================================
// LOGIN SCREEN
// ============================================================
function LoginScreen({ onLogin, error, loading }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const inputStyle = {
    width: "100%", background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6,
    color: "white", fontSize: 13, padding: "12px 14px",
    fontFamily: "'DM Sans', sans-serif", outline: "none",
    transition: "border-color 0.2s", letterSpacing: 0.5,
  };
  const labelStyle = {
    display: "block", fontSize: 10, color: "rgba(255,255,255,0.35)",
    letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6,
    fontFamily: "'Share Tech Mono', monospace",
  };

  const handleSubmit = () => onLogin(username, password);

  return (
    <div style={{ minHeight: "100vh", background: "#080c10", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <ScanLine />
      {/* Ambient glow */}
      <div style={{ position: "fixed", top: "35%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,77,28,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 400, padding: "0 24px", animation: "fadeIn 0.5s ease" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ width: 60, height: 60, borderRadius: 14, margin: "0 auto 18px", background: "linear-gradient(135deg, #ff4d1c, #ff1744)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, boxShadow: "0 0 40px rgba(255,77,28,0.35)" }}>📡</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 34, letterSpacing: 5, color: "white", lineHeight: 1 }}>805 INTEL</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: 3, textTransform: "uppercase", marginTop: 7 }}>Newsroom Intelligence Feed</div>
        </div>

        {/* Login card */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 28 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 22, fontFamily: "'Share Tech Mono', monospace", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 12 }}>
            🔒 STAFF ACCESS ONLY
          </div>

          {/* Username */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter username"
              style={inputStyle}
              autoComplete="username"
              onFocus={e => e.target.style.borderColor = "rgba(0,229,255,0.5)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 20, position: "relative" }}>
            <label style={labelStyle}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                style={{ ...inputStyle, paddingRight: 44 }}
                autoComplete="current-password"
                onFocus={e => e.target.style.borderColor = "rgba(0,229,255,0.5)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
              />
              <button
                onClick={() => setShowPw(!showPw)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.25)", fontSize: 14, padding: 0 }}
              >{showPw ? "🙈" : "👁"}</button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ fontSize: 11, color: "#ff4d1c", fontFamily: "'Share Tech Mono', monospace", letterSpacing: 1, marginBottom: 14, padding: "8px 12px", background: "rgba(255,77,28,0.08)", borderRadius: 4, border: "1px solid rgba(255,77,28,0.2)" }}>
              ⚠ {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: "100%", padding: 13,
              background: loading ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #ff4d1c, #ff1744)",
              border: "none", borderRadius: 6, color: "white",
              fontSize: 11, fontFamily: "'Share Tech Mono', monospace",
              letterSpacing: 2, textTransform: "uppercase",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 0 24px rgba(255,77,28,0.3)",
              transition: "all 0.2s",
            }}
          >
            {loading ? "VERIFYING..." : "ACCESS FEED →"}
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: 18, fontSize: 10, color: "rgba(255,255,255,0.12)", fontFamily: "'Share Tech Mono', monospace", letterSpacing: 1 }}>
          SCOUTLABS · 805 INTEL · AUTHORIZED PERSONNEL ONLY
        </div>
      </div>
    </div>
  );
}

// ============================================================
// INCIDENT ROW
// ============================================================
function IncidentRow({ incident, isNew }) {
  const [expanded, setExpanded] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const cfg = TYPE_CONFIG[incident.type] || TYPE_CONFIG.LAW;
  return (
    <div onClick={() => setExpanded(!expanded)} style={{
      background: expanded ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
      border: `1px solid ${expanded ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)"}`,
      borderLeft: `3px solid ${cfg.color}`,
      borderRadius: 6, marginBottom: 6, cursor: "pointer",
      transition: "all 0.2s ease",
      animation: isNew ? "slideIn 0.4s ease forwards" : "none",
      overflow: "hidden",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
        <div style={{ minWidth: 70, textAlign: "center" }}>
          <div style={{ fontSize: 11, fontFamily: "'Share Tech Mono', monospace", color: cfg.color }}>{formatTime(incident.time)}</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{timeAgo(incident.time)}</div>
        </div>
        <div style={{ background: cfg.bg, border: `1px solid ${cfg.color}33`, color: cfg.color, fontSize: 9, fontWeight: 700, letterSpacing: 2, padding: "3px 8px", borderRadius: 3, minWidth: 58, textAlign: "center", fontFamily: "'Share Tech Mono', monospace" }}>{cfg.label}</div>
        <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: 1.5, color: COUNTY_COLOR[incident.county] || "#fff", textTransform: "uppercase", minWidth: 30, opacity: 0.7 }}>
          {incident.county === "San Luis Obispo" ? "SLO" : "SB"}
        </div>
        <div style={{ flex: 1, fontSize: 13, color: "rgba(255,255,255,0.85)", fontFamily: "'DM Sans', sans-serif", fontWeight: 500, lineHeight: 1.3 }}>{incident.headline}</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "'Share Tech Mono', monospace", letterSpacing: 1, minWidth: 80, textAlign: "right" }}>{incident.source}</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", marginLeft: 4 }}>▼</div>
      </div>
      {expanded && (
        <div style={{ padding: "0 16px 16px 16px", borderTop: "1px solid rgba(255,255,255,0.05)", animation: "fadeIn 0.2s ease" }}>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.7, margin: "14px 0 12px", fontFamily: "'DM Sans', sans-serif" }}>{incident.summary}</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            {incident.units.map(u => (
              <span key={u} style={{ fontSize: 10, fontFamily: "'Share Tech Mono', monospace", color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}33`, padding: "2px 8px", borderRadius: 3, letterSpacing: 1 }}>{u}</span>
            ))}
          </div>
          <button onClick={e => { e.stopPropagation(); setShowRaw(!showRaw); }} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.35)", fontSize: 10, letterSpacing: 1.5, padding: "4px 10px", borderRadius: 3, cursor: "pointer", fontFamily: "'Share Tech Mono', monospace", textTransform: "uppercase" }}>
            {showRaw ? "HIDE RAW" : "VIEW RAW FEED"}
          </button>
          {showRaw && (
            <div style={{ marginTop: 10, padding: "10px 14px", background: "rgba(0,0,0,0.4)", borderRadius: 4, fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: "#76ff03", letterSpacing: 1, lineHeight: 1.6, border: "1px solid rgba(118,255,3,0.15)" }}>
              {incident.raw}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// DASHBOARD
// ============================================================
function Dashboard({ onSignOut }) {
  const [incidents, setIncidents] = useState(MOCK_INCIDENTS);
  const [newIds, setNewIds] = useState(new Set());
  const [filter, setFilter] = useState("ALL");
  const [countyFilter, setCountyFilter] = useState("ALL");
  const nextId = useRef(100);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.3) {
        const types = Object.keys(TYPE_CONFIG);
        const counties = ["San Luis Obispo", "Santa Barbara"];
        const sources = { "San Luis Obispo": "SLO CAD", "Santa Barbara": "SB SCANNER" };
        const county = counties[Math.floor(Math.random() * counties.length)];
        const type = types[Math.floor(Math.random() * types.length)];
        const id = nextId.current++;
        const inc = { id, time: new Date(), source: sources[county], county, type, headline: getSampleHeadline(type, county), summary: "New incident detected. Units are being dispatched. Details are being confirmed by responding officers. Further updates will follow.", units: ["UNIT 1", "UNIT 2"], raw: `${type} — LOCATION TBD — UNITS DISPATCHED — DETAILS PENDING` };
        setIncidents(prev => [inc, ...prev].slice(0, 50));
        setNewIds(prev => new Set([...prev, id]));
        setTimeout(() => setNewIds(prev => { const n = new Set(prev); n.delete(id); return n; }), 3000);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const filtered = incidents.filter(i => (filter === "ALL" || i.type === filter) && (countyFilter === "ALL" || i.county === countyFilter));
  const counts = Object.keys(TYPE_CONFIG).reduce((a, t) => { a[t] = incidents.filter(i => i.type === t).length; return a; }, {});

  return (
    <div style={{ minHeight: "100vh", background: "#080c10", fontFamily: "'DM Sans', sans-serif", color: "white" }}>
      <ScanLine />

      {/* Header */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 100, padding: "0 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 0" }}>
            <div style={{ width: 36, height: 36, borderRadius: 6, background: "linear-gradient(135deg, #ff4d1c, #ff1744)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, boxShadow: "0 0 20px rgba(255,77,28,0.4)" }}>📡</div>
            <div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 3, color: "white", lineHeight: 1 }}>805 INTEL</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: 3, textTransform: "uppercase" }}>Newsroom Intelligence Feed</div>
            </div>
          </div>
          <div style={{ display: "flex" }}>
            <StatBadge label="Active" value={incidents.length} color="#00e5ff" />
            <StatBadge label="SLO" value={incidents.filter(i => i.county === "San Luis Obispo").length} color="#00e5ff" />
            <StatBadge label="SB" value={incidents.filter(i => i.county === "Santa Barbara").length} color="#ff4081" />
            <StatBadge label="Fire" value={counts.FIRE || 0} color="#ff4d1c" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <PulsingDot color="#00e5ff" />
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: 2, textTransform: "uppercase" }}>LIVE</span>
            </div>
            <LiveClock />
            <button onClick={onSignOut} style={{ marginLeft: 8, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.3)", fontSize: 9, letterSpacing: 1.5, padding: "5px 12px", borderRadius: 3, cursor: "pointer", fontFamily: "'Share Tech Mono', monospace", textTransform: "uppercase" }}>
              SIGN OUT
            </button>
          </div>
        </div>
      </div>

      {/* Ticker */}
      <div style={{ background: "#ff1744", padding: "5px 0", overflow: "hidden", whiteSpace: "nowrap" }}>
        <div style={{ display: "inline-block", animation: "ticker 30s linear infinite", fontSize: 11, fontFamily: "'Share Tech Mono', monospace", letterSpacing: 2, color: "white" }}>
          {incidents.slice(0, 5).map(i => `  ◆  ${i.type} — ${i.headline}`).join("      ")}
        </div>
        <style>{`@keyframes ticker { from { transform: translateX(100vw); } to { transform: translateX(-100%); } }`}</style>
      </div>

      {/* Main */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 24px" }}>
        {/* Filters */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: 2, textTransform: "uppercase", marginRight: 4, fontFamily: "'Share Tech Mono', monospace" }}>FILTER</span>
          {["ALL", ...Object.keys(TYPE_CONFIG)].map(t => {
            const cfg = TYPE_CONFIG[t]; const active = filter === t;
            return <button key={t} onClick={() => setFilter(t)} style={{ background: active ? (cfg?.bg || "rgba(255,255,255,0.1)") : "transparent", border: `1px solid ${active ? (cfg?.color || "rgba(255,255,255,0.4)") : "rgba(255,255,255,0.1)"}`, color: active ? (cfg?.color || "white") : "rgba(255,255,255,0.35)", fontSize: 10, fontFamily: "'Share Tech Mono', monospace", letterSpacing: 1.5, padding: "5px 12px", borderRadius: 3, cursor: "pointer", transition: "all 0.15s", textTransform: "uppercase" }}>{t}</button>;
          })}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            {["ALL", "San Luis Obispo", "Santa Barbara"].map(c => {
              const active = countyFilter === c;
              const color = c === "San Luis Obispo" ? "#00e5ff" : c === "Santa Barbara" ? "#ff4081" : "white";
              return <button key={c} onClick={() => setCountyFilter(c)} style={{ background: active ? `${color}18` : "transparent", border: `1px solid ${active ? color : "rgba(255,255,255,0.1)"}`, color: active ? color : "rgba(255,255,255,0.35)", fontSize: 10, fontFamily: "'Share Tech Mono', monospace", letterSpacing: 1.5, padding: "5px 12px", borderRadius: 3, cursor: "pointer", transition: "all 0.15s" }}>
                {c === "San Luis Obispo" ? "SLO CO" : c === "Santa Barbara" ? "SB CO" : "ALL COUNTIES"}
              </button>;
            })}
          </div>
        </div>

        {/* Column headers */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 16px", marginBottom: 8, fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: 2, textTransform: "uppercase", fontFamily: "'Share Tech Mono', monospace", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <span style={{ minWidth: 70 }}>TIME</span>
          <span style={{ minWidth: 58 }}>TYPE</span>
          <span style={{ minWidth: 30 }}>CO</span>
          <span style={{ flex: 1 }}>INCIDENT</span>
          <span style={{ minWidth: 80, textAlign: "right" }}>SOURCE</span>
          <span style={{ minWidth: 16 }} />
        </div>

        {/* List */}
        <div>
          {filtered.length === 0
            ? <div style={{ textAlign: "center", padding: "60px 20px", color: "rgba(255,255,255,0.2)", fontFamily: "'Share Tech Mono', monospace", fontSize: 12, letterSpacing: 2 }}>NO INCIDENTS MATCHING FILTER</div>
            : filtered.map(inc => <IncidentRow key={inc.id} incident={inc} isNew={newIds.has(inc.id)} />)
          }
        </div>

        {/* Footer */}
        <div style={{ marginTop: 30, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: "'Share Tech Mono', monospace", letterSpacing: 1 }}>SCOUTLABS / 805 INTEL v1.0 — SLO + SB COUNTY COVERAGE</span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: "'Share Tech Mono', monospace", letterSpacing: 1 }}>AUTO-REFRESH: 60s · {filtered.length} INCIDENTS SHOWN</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// APP ROOT
// ============================================================
export default function App() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === "true");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (username, password) => {
    setError("");
    if (!username || !password) { setError("USERNAME AND PASSWORD REQUIRED"); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "true");
      setAuthed(true);
    } else {
      setError("INVALID USERNAME OR PASSWORD");
    }
    setLoading(false);
  };

  const handleSignOut = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthed(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=DM+Sans:wght@400;500;600;700&family=Bebas+Neue&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080c10; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.85)} }
        @keyframes slideIn { from{opacity:0;transform:translateY(-12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
      `}</style>
      {authed
        ? <Dashboard onSignOut={handleSignOut} />
        : <LoginScreen onLogin={handleLogin} error={error} loading={loading} />
      }
    </>
  );
}
