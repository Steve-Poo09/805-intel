import { useState, useEffect, useRef } from "react";

const VALID_USERNAME = "ksbynews";
const VALID_PASSWORD = "oncallejoaquin";
const SESSION_KEY = "805intel_auth";

const MOCK_INCIDENTS = [
  { id: 1, time: new Date(Date.now() - 2 * 60000), source: "SLO CAD", county: "San Luis Obispo", type: "TRAFFIC", headline: "Multi-vehicle collision on US-101 near Pismo Beach", summary: "A three-vehicle collision was reported on US-101 northbound near the Pismo Beach exit. Two units from Cal Fire SLO and SLO County Sheriff deputies are responding. The left lane is blocked. No reported injuries at this time. CHP is on scene managing traffic flow.", units: ["CAL FIRE SLO 3", "SLO SHERIFF 14", "CHP UNIT 22"], raw: "TRAFFIC COLLISION — US101 NB @ PISMO BCH EXIT — 3 VEH INVLVD — L LANE BLKD — NO INJ RPT" },
  { id: 2, time: new Date(Date.now() - 7 * 60000), source: "SB SCANNER", county: "Santa Barbara", type: "FIRE", headline: "Vegetation fire reported near Gaviota State Park", summary: "Scanner traffic indicates a small vegetation fire near Gaviota State Park along Highway 101. Cal Fire Santa Barbara units have been dispatched. Fire is reported at approximately half an acre with moderate wind conditions.", units: ["CAL FIRE SB 1", "CAL FIRE SB AIR ATTACK", "SB COUNTY FIRE 7"], raw: "VEG FIRE — HWY 101 / GAVIOTA ST PK — EST 0.5 AC — MOD WIND — CALFIRESB1 RESP" },
  { id: 3, time: new Date(Date.now() - 14 * 60000), source: "SLO CAD", county: "San Luis Obispo", type: "MEDICAL", headline: "Medical emergency at Cal Poly campus, Kennedy Library", summary: "A medical emergency was reported inside the Kennedy Library on the Cal Poly San Luis Obispo campus. AMR ambulance and campus police are responding. The subject is reported as conscious and breathing.", units: ["AMR 805", "CAL POLY PD 3"], raw: "MEDICAL EMRG — CAL POLY SLO KENNEDY LIB — SUBJ C/B — AMR805 / CALPOLYPD3 DISP" },
  { id: 4, time: new Date(Date.now() - 31 * 60000), source: "SB SCANNER", county: "Santa Barbara", type: "LAW", headline: "Pursuit terminated near Santa Barbara downtown", summary: "Santa Barbara PD units terminated a vehicle pursuit in downtown Santa Barbara near State Street and Haley. The suspect vehicle was abandoned. Officers are conducting a perimeter search on foot.", units: ["SBPD 7", "SBPD 12", "SBPD K9"], raw: "PURSUIT TERM — STATE ST / HALEY — DARK SEDAN ABAND — PERIM SEARCH — SBPD7 / SBPD12 / K9" },
  { id: 5, time: new Date(Date.now() - 48 * 60000), source: "SLO CAD", county: "San Luis Obispo", type: "HAZMAT", headline: "Gas leak reported at Paso Robles commercial building", summary: "A natural gas leak was reported at a commercial property on Spring Street in Paso Robles. Paso Robles Fire and SoCalGas crews are on scene. A 100-foot evacuation radius has been established.", units: ["PASO ROBLES FIRE 1", "PASO ROBLES FIRE 2", "SOCALGAS CREW"], raw: "GAS LEAK — SPRING ST PASO ROBLES — 100FT EVAC ESTAB — PRFIRE1/2 / SOCALGAS ON SCENE" },
  { id: 6, time: new Date(Date.now() - 73 * 60000), source: "SB SCANNER", county: "Santa Barbara", type: "MARINE", headline: "Vessel taking on water near Channel Islands Harbor", summary: "The Coast Guard was notified of a recreational vessel taking on water approximately 2 miles west of Channel Islands Harbor. Two aboard are wearing life vests and are in VHF contact.", units: ["USCG SECTOR LA", "TOW VESSEL SEATOW"], raw: "VESSEL DISTRESS — 2MI W CHANNEL ISLANDS HBR — 2 POB LIFE VESTS — VHF CONTACT — USCG RESP" },
];

const TYPE_CONFIG = {
  FIRE:    { color: "#ff6b35", glow: "rgba(255,107,53,0.4)",  bg: "rgba(255,107,53,0.15)",  border: "rgba(255,107,53,0.3)"  },
  TRAFFIC: { color: "#ffc947", glow: "rgba(255,201,71,0.4)",  bg: "rgba(255,201,71,0.15)",  border: "rgba(255,201,71,0.3)"  },
  MEDICAL: { color: "#e879f9", glow: "rgba(232,121,249,0.4)", bg: "rgba(232,121,249,0.15)", border: "rgba(232,121,249,0.3)" },
  LAW:     { color: "#38bdf8", glow: "rgba(56,189,248,0.4)",  bg: "rgba(56,189,248,0.15)",  border: "rgba(56,189,248,0.3)"  },
  HAZMAT:  { color: "#a3e635", glow: "rgba(163,230,53,0.4)",  bg: "rgba(163,230,53,0.15)",  border: "rgba(163,230,53,0.3)"  },
  MARINE:  { color: "#818cf8", glow: "rgba(129,140,248,0.4)", bg: "rgba(129,140,248,0.15)", border: "rgba(129,140,248,0.3)" },
};

const COUNTY_COLOR = { "San Luis Obispo": "#38bdf8", "Santa Barbara": "#f472b6" };

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
    FIRE: [`Structure fire in ${county}`, `Brush fire in ${county} foothills`],
    TRAFFIC: [`Injury collision on Hwy 101 in ${county}`, `Road closure in ${county}`],
    MEDICAL: [`Medical emergency in ${county}`, `Multi-casualty incident in ${county}`],
    LAW: [`Suspect at large in ${county}`, `Armed robbery in ${county}`],
    HAZMAT: [`Chemical spill in ${county}`, `Hazmat response in ${county}`],
    MARINE: [`Vessel in distress near ${county}`, `Swimmer rescue in ${county}`],
  };
  const opts = h[type] || [`Incident in ${county}`];
  return opts[Math.floor(Math.random() * opts.length)];
}

function LiveClock() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const i = setInterval(() => setT(new Date()), 1000); return () => clearInterval(i); }, []);
  return (
    <div style={{ textAlign: "right" }}>
      <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: "white", letterSpacing: 2, lineHeight: 1 }}>
        {t.toLocaleTimeString("en-US", { hour12: false })}
      </div>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: 2, marginTop: 3, textTransform: "uppercase" }}>
        {t.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
      </div>
    </div>
  );
}

function StatPill({ label, value, color }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.07)", backdropFilter: "blur(12px)",
      border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12,
      padding: "10px 18px", display: "flex", flexDirection: "column", alignItems: "center", minWidth: 64,
    }}>
      <span style={{ fontSize: 22, fontWeight: 800, color, fontFamily: "'DM Mono', monospace", lineHeight: 1, textShadow: `0 0 20px ${color}` }}>{value}</span>
      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: 2, marginTop: 4, textTransform: "uppercase" }}>{label}</span>
    </div>
  );
}

function LiveDot({ color }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 12, height: 12 }}>
      <span style={{ position: "absolute", width: 20, height: 20, borderRadius: "50%", background: color, opacity: 0.3, animation: "ripple 1.5s ease-out infinite" }} />
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}`, flexShrink: 0 }} />
    </span>
  );
}

function IncidentRow({ incident, isNew }) {
  const [expanded, setExpanded] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const cfg = TYPE_CONFIG[incident.type] || TYPE_CONFIG.LAW;

  return (
    <div onClick={() => setExpanded(!expanded)} style={{
      background: expanded ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
      backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
      border: `1px solid ${expanded ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.08)"}`,
      borderLeft: `3px solid ${cfg.color}`,
      borderRadius: 12, marginBottom: 8, cursor: "pointer",
      transition: "all 0.25s ease",
      animation: isNew ? "slideDown 0.4s cubic-bezier(0.16,1,0.3,1) forwards" : "none",
      overflow: "hidden",
      boxShadow: expanded ? `0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)` : `0 2px 8px rgba(0,0,0,0.2)`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 18px" }}>
        <div style={{ minWidth: 72, textAlign: "center" }}>
          <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: cfg.color, letterSpacing: 1 }}>{formatTime(incident.time)}</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{timeAgo(incident.time)}</div>
        </div>
        <span style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color, fontSize: 9, fontWeight: 700, letterSpacing: 1.5, padding: "3px 9px", borderRadius: 6, fontFamily: "'DM Mono', monospace", textShadow: `0 0 8px ${cfg.glow}`, whiteSpace: "nowrap" }}>{incident.type}</span>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: COUNTY_COLOR[incident.county] || "#fff", textTransform: "uppercase", minWidth: 28, opacity: 0.85, textShadow: `0 0 10px ${COUNTY_COLOR[incident.county]}` }}>
          {incident.county === "San Luis Obispo" ? "SLO" : "SB"}
        </div>
        <div style={{ flex: 1, fontSize: 13, color: "rgba(255,255,255,0.88)", fontWeight: 500, lineHeight: 1.4, fontFamily: "'DM Sans', sans-serif" }}>{incident.headline}</div>
        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: "'DM Mono', monospace", letterSpacing: 1, minWidth: 76, textAlign: "right" }}>{incident.source}</div>
        <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "rgba(255,255,255,0.4)", transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s ease", flexShrink: 0 }}>▾</div>
      </div>
      {expanded && (
        <div style={{ padding: "0 18px 18px", borderTop: "1px solid rgba(255,255,255,0.07)", animation: "fadeIn 0.2s ease" }}>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.75, margin: "14px 0 14px", fontFamily: "'DM Sans', sans-serif" }}>{incident.summary}</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            {incident.units.map(u => (
              <span key={u} style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, padding: "3px 10px", borderRadius: 8, letterSpacing: 0.5 }}>{u}</span>
            ))}
          </div>
          <button onClick={e => { e.stopPropagation(); setShowRaw(!showRaw); }} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.4)", fontSize: 10, letterSpacing: 1.5, padding: "5px 12px", borderRadius: 8, cursor: "pointer", fontFamily: "'DM Mono', monospace", textTransform: "uppercase" }}>
            {showRaw ? "HIDE RAW" : "RAW FEED"}
          </button>
          {showRaw && (
            <div style={{ marginTop: 10, padding: "12px 14px", background: "rgba(0,0,0,0.35)", backdropFilter: "blur(8px)", borderRadius: 10, fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#a3e635", letterSpacing: 0.8, lineHeight: 1.7, border: "1px solid rgba(163,230,53,0.2)", animation: "fadeIn 0.2s ease" }}>{incident.raw}</div>
          )}
        </div>
      )}
    </div>
  );
}

function LoginScreen({ onLogin, error, loading }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const inputStyle = { width: "100%", background: "rgba(255,255,255,0.07)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, color: "white", fontSize: 14, padding: "13px 16px", fontFamily: "'DM Sans', sans-serif", outline: "none", transition: "all 0.2s", boxSizing: "border-box" };
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f0c29 0%, #1a1a3e 40%, #0d1b2a 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "fixed", top: "15%", left: "20%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)", pointerEvents: "none", filter: "blur(40px)" }} />
      <div style={{ position: "fixed", bottom: "20%", right: "15%", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)", pointerEvents: "none", filter: "blur(40px)" }} />
      <div style={{ width: "100%", maxWidth: 420, padding: "0 24px", position: "relative", zIndex: 1, animation: "fadeIn 0.6s ease" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, margin: "0 auto 20px", background: "linear-gradient(135deg, rgba(255,107,53,0.9), rgba(236,72,153,0.9))", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, boxShadow: "0 0 60px rgba(255,107,53,0.3), inset 0 1px 0 rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.15)" }}>📡</div>
          <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 38, letterSpacing: 6, color: "white", lineHeight: 1, textShadow: "0 0 40px rgba(255,255,255,0.2)" }}>805 INTEL</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: 4, textTransform: "uppercase", marginTop: 8 }}>Newsroom Intelligence Feed</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 24, padding: 32, boxShadow: "0 24px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)" }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: 3, textTransform: "uppercase", marginBottom: 24, fontFamily: "'DM Mono', monospace" }}>🔒 Staff Access Only</div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8, fontFamily: "'DM Mono', monospace" }}>Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username" style={inputStyle}
              onFocus={e => { e.target.style.borderColor = "rgba(56,189,248,0.5)"; e.target.style.background = "rgba(255,255,255,0.1)"; }}
              onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.12)"; e.target.style.background = "rgba(255,255,255,0.07)"; }}
              onKeyDown={e => e.key === "Enter" && onLogin(username, password)} />
          </div>
          <div style={{ marginBottom: 22 }}>
            <label style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8, fontFamily: "'DM Mono', monospace" }}>Password</label>
            <div style={{ position: "relative" }}>
              <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" style={{ ...inputStyle, paddingRight: 48 }}
                onFocus={e => { e.target.style.borderColor = "rgba(56,189,248,0.5)"; e.target.style.background = "rgba(255,255,255,0.1)"; }}
                onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.12)"; e.target.style.background = "rgba(255,255,255,0.07)"; }}
                onKeyDown={e => e.key === "Enter" && onLogin(username, password)} />
              <button onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", fontSize: 16, padding: 0 }}>{showPw ? "🙈" : "👁"}</button>
            </div>
          </div>
          {error && <div style={{ fontSize: 11, color: "#ff6b35", fontFamily: "'DM Mono', monospace", letterSpacing: 1, marginBottom: 16, padding: "10px 14px", background: "rgba(255,107,53,0.1)", borderRadius: 10, border: "1px solid rgba(255,107,53,0.25)" }}>⚠ {error}</div>}
          <button onClick={() => onLogin(username, password)} disabled={loading} style={{ width: "100%", padding: 14, background: loading ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, rgba(255,107,53,0.9), rgba(236,72,153,0.9))", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, color: "white", fontSize: 12, fontFamily: "'DM Mono', monospace", letterSpacing: 2, textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer", boxShadow: loading ? "none" : "0 0 30px rgba(255,107,53,0.3)", transition: "all 0.2s" }}>
            {loading ? "VERIFYING..." : "ACCESS FEED →"}
          </button>
        </div>
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 10, color: "rgba(255,255,255,0.15)", fontFamily: "'DM Mono', monospace", letterSpacing: 1 }}>SCOUTLABS · 805 INTEL · AUTHORIZED PERSONNEL ONLY</div>
      </div>
    </div>
  );
}

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
        const inc = { id, time: new Date(), source: sources[county], county, type, headline: getSampleHeadline(type, county), summary: "New incident detected. Units are being dispatched. Details are being confirmed. Further updates will follow.", units: ["UNIT 1", "UNIT 2"], raw: `${type} — LOCATION TBD — UNITS DISPATCHED — DETAILS PENDING` };
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
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f0c29 0%, #1a1a3e 40%, #0d1b2a 100%)", fontFamily: "'DM Sans', sans-serif", color: "white", position: "relative" }}>
      <div style={{ position: "fixed", top: "10%", right: "10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)", pointerEvents: "none", filter: "blur(60px)" }} />
      <div style={{ position: "fixed", bottom: "10%", left: "5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)", pointerEvents: "none", filter: "blur(60px)" }} />

      {/* Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(15,12,41,0.7)", backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "0 28px", boxShadow: "0 4px 30px rgba(0,0,0,0.3)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, rgba(255,107,53,0.9), rgba(236,72,153,0.9))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, boxShadow: "0 0 24px rgba(255,107,53,0.35), inset 0 1px 0 rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.15)" }}>📡</div>
            <div>
              <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 24, letterSpacing: 4, color: "white", lineHeight: 1 }}>805 INTEL</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: 3, textTransform: "uppercase", marginTop: 2 }}>Newsroom Intelligence Feed</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <StatPill label="Total" value={incidents.length} color="#e2e8f0" />
            <StatPill label="SLO" value={incidents.filter(i => i.county === "San Luis Obispo").length} color="#38bdf8" />
            <StatPill label="SB" value={incidents.filter(i => i.county === "Santa Barbara").length} color="#f472b6" />
            <StatPill label="Fire" value={counts.FIRE || 0} color="#ff6b35" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <LiveDot color="#38bdf8" />
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: 2, textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>LIVE</span>
            </div>
            <LiveClock />
            <button onClick={onSignOut} style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.4)", fontSize: 10, letterSpacing: 1.5, padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontFamily: "'DM Mono', monospace", textTransform: "uppercase" }}>SIGN OUT</button>
          </div>
        </div>
      </div>

      {/* Ticker */}
      <div style={{ background: "linear-gradient(90deg, rgba(255,107,53,0.8), rgba(236,72,153,0.8))", backdropFilter: "blur(10px)", padding: "6px 0", overflow: "hidden", whiteSpace: "nowrap", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ display: "inline-block", animation: "ticker 35s linear infinite", fontSize: 11, fontFamily: "'DM Mono', monospace", letterSpacing: 2, color: "white" }}>
          {incidents.slice(0, 6).map(i => `  ◆  ${i.type} — ${i.headline}`).join("        ")}
        </div>
        <style>{`@keyframes ticker { from { transform: translateX(100vw); } to { transform: translateX(-100%); } }`}</style>
      </div>

      {/* Main */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 28px" }}>
        {/* Filters */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: 2, textTransform: "uppercase", marginRight: 6, fontFamily: "'DM Mono', monospace" }}>FILTER</span>
          {["ALL", ...Object.keys(TYPE_CONFIG)].map(t => {
            const cfg = TYPE_CONFIG[t]; const active = filter === t;
            return <button key={t} onClick={() => setFilter(t)} style={{ background: active ? (cfg ? cfg.bg : "rgba(255,255,255,0.12)") : "rgba(255,255,255,0.04)", backdropFilter: "blur(10px)", border: `1px solid ${active ? (cfg ? cfg.border : "rgba(255,255,255,0.3)") : "rgba(255,255,255,0.08)"}`, color: active ? (cfg ? cfg.color : "white") : "rgba(255,255,255,0.35)", fontSize: 10, fontFamily: "'DM Mono', monospace", letterSpacing: 1.5, padding: "6px 14px", borderRadius: 8, cursor: "pointer", transition: "all 0.15s", textTransform: "uppercase", boxShadow: active && cfg ? `0 0 16px ${cfg.glow}` : "none" }}>{t}</button>;
          })}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            {["ALL", "San Luis Obispo", "Santa Barbara"].map(c => {
              const active = countyFilter === c;
              const color = c === "San Luis Obispo" ? "#38bdf8" : c === "Santa Barbara" ? "#f472b6" : "white";
              return <button key={c} onClick={() => setCountyFilter(c)} style={{ background: active ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)", backdropFilter: "blur(10px)", border: `1px solid ${active ? color + "55" : "rgba(255,255,255,0.08)"}`, color: active ? color : "rgba(255,255,255,0.35)", fontSize: 10, fontFamily: "'DM Mono', monospace", letterSpacing: 1.5, padding: "6px 14px", borderRadius: 8, cursor: "pointer", transition: "all 0.15s", boxShadow: active ? `0 0 16px ${color}33` : "none" }}>
                {c === "San Luis Obispo" ? "SLO CO" : c === "Santa Barbara" ? "SB CO" : "ALL"}
              </button>;
            })}
          </div>
        </div>

        {/* Column headers */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "6px 18px", marginBottom: 10, fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: 2, textTransform: "uppercase", fontFamily: "'DM Mono', monospace", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <span style={{ minWidth: 72 }}>TIME</span>
          <span style={{ minWidth: 60 }}>TYPE</span>
          <span style={{ minWidth: 28 }}>CO</span>
          <span style={{ flex: 1 }}>INCIDENT</span>
          <span style={{ minWidth: 76, textAlign: "right" }}>SOURCE</span>
          <span style={{ minWidth: 20 }} />
        </div>

        <div>
          {filtered.length === 0
            ? <div style={{ textAlign: "center", padding: "80px 20px", color: "rgba(255,255,255,0.15)", fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 2 }}>NO INCIDENTS MATCHING FILTER</div>
            : filtered.map(inc => <IncidentRow key={inc.id} incident={inc} isNew={newIds.has(inc.id)} />)
          }
        </div>

        <div style={{ marginTop: 32, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.15)", fontFamily: "'DM Mono', monospace", letterSpacing: 1 }}>SCOUTLABS / 805 INTEL v1.0 — SLO + SB COVERAGE</span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.15)", fontFamily: "'DM Mono', monospace", letterSpacing: 1 }}>AUTO-REFRESH · {filtered.length} INCIDENTS</span>
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
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0f0c29; }
        @keyframes ripple { 0%{transform:scale(1);opacity:0.4} 100%{transform:scale(2.5);opacity:0} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        input::placeholder { color: rgba(255,255,255,0.2); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>
      {authed ? <Dashboard onSignOut={handleSignOut} /> : <LoginScreen onLogin={handleLogin} error={error} loading={loading} />}
    </>
  );
}
