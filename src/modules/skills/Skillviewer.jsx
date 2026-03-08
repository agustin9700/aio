// src/modules/skills/SkillViewer.jsx
import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import SKILLS_DATA_RAW from "../../data/skills_merged.json";

function extractNum(swfName = "") {
  const m = swfName.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 999999;
}
const SKILLS_DATA = [...SKILLS_DATA_RAW].sort(
  (a, b) => extractNum(a.swfName) - extractNum(b.swfName)
);

function useWindowSize() {
  const [size, setSize] = useState({
    w: typeof window !== "undefined" ? window.innerWidth : 1200,
    h: typeof window !== "undefined" ? window.innerHeight : 800,
  });
  useEffect(() => {
    const fn = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return size;
}

const CATEGORIES = [
  { key: "ALL",       label: "All",        icon: null  },
  { key: "lightning", label: "Lightning",  icon: "⚡",  color: "#f5c842" },
  { key: "fire",      label: "Fire",       icon: "🔥",  color: "#ff5733" },
  { key: "water",     label: "Water",      icon: "💧",  color: "#38bdf8" },
  { key: "wind",      label: "Wind",       icon: "🌀",  color: "#34d399" },
  { key: "earth",     label: "Earth",      icon: "🌍",  color: "#c8a55b" },
  { key: "taijutsu",  label: "Taijutsu",   icon: "👊",  color: "#e879f9" },
  { key: "genjutsu",  label: "Genjutsu",   icon: "👁",  color: "#a78bfa" },
  { key: "clan",      label: "Clan",       icon: "🏯",  color: "#fb923c" },
  { key: "crew",      label: "Crew",       icon: "⚓",  color: "#22d3ee" },
  { key: "coop",      label: "Co-op",      icon: "🤝",  color: "#86efac" },
  { key: "class",     label: "Class",      icon: "🎓",  color: "#fda4af" },
  { key: "unrelease", label: "Unreleased", icon: "🔒",  color: "#6b7280" },
];

const CAT_COLOR = Object.fromEntries(
  CATEGORIES.filter(c => c.color).map(c => [c.key, c.color])
);

const RARITY_LABEL = { 1:"Common",2:"Uncommon",3:"Rare",4:"Epic",5:"Legendary",6:"Mythic",7:"Ultimate" };
const RARITY_COLOR = {
  Common:"#6b7280", Uncommon:"#22c55e", Rare:"#3b82f6",
  Epic:"#a855f7", Legendary:"#f59e0b", Mythic:"#ef4444", Ultimate:"#ec4899",
};
const RARITY_GLOW = {
  Common:"none", Uncommon:"0 0 6px #22c55e77", Rare:"0 0 6px #3b82f677",
  Epic:"0 0 8px #a855f777", Legendary:"0 0 10px #f59e0b77",
  Mythic:"0 0 12px #ef444477", Ultimate:"0 0 14px #ec489977",
};

const BATCH = 40;

// ── ICON ──────────────────────────────────────────────────────────────────────
function SkillIcon({ skill, size }) {
  const [err, setErr] = useState(false);
  const src = `/assets/skills/icons/${skill.swfName}.webp`;
  const catColor = CAT_COLOR[skill.category] || CAT_COLOR[skill.type] || "#374151";
  const cat = CATEGORIES.find(c => c.key === (skill.category || skill.type));
  if (err) {
    return (
      <div style={{
        width: size, height: size,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize: size * 0.45, color: catColor + "88",
        background: catColor + "11", borderRadius: 8, userSelect:"none",
      }}>
        {cat?.icon || "?"}
      </div>
    );
  }
  return (
    <img src={src} alt={skill.name} onError={() => setErr(true)}
      style={{ width:"100%", height:"100%", objectFit:"contain", imageRendering:"pixelated" }}
    />
  );
}

// ── ANIMATION MODAL ───────────────────────────────────────────────────────────
function AnimationModal({ skill, onClose }) {
  const videoRef = useRef(null);
  const cat      = skill.category || skill.type || "";
  const catColor = CAT_COLOR[cat] || "#374151";
  const rarityLabel = RARITY_LABEL[skill.rarity] || "Common";
  const rarityColor = RARITY_COLOR[rarityLabel] || "#374151";
  const [videoErr, setVideoErr] = useState(false);
  const [loaded, setLoaded]     = useState(false);

  // Close on Escape
  useEffect(() => {
    const fn = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const videoSrc = `/assets/skills/animations/${skill.swfName}.mp4`;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 2000,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(4, 6, 12, 0.88)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        animation: "modalFadeIn 0.18s ease",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: "relative",
          display: "flex", flexDirection: "column", alignItems: "center",
          gap: 18,
          animation: "modalSlideUp 0.22s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {/* close button */}
        <button
          onClick={onClose}
          style={{
            all: "unset", cursor: "pointer",
            position: "absolute", top: -14, right: -14, zIndex: 10,
            width: 32, height: 32,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "#0d1119", border: `1px solid #2a3340`,
            borderRadius: "50%", color: "#4b5563", fontSize: 18, lineHeight: 1,
            transition: "color 0.12s, border-color 0.12s",
          }}
          onMouseEnter={e => { e.currentTarget.style.color="#e5e7eb"; e.currentTarget.style.borderColor="#4b5563"; }}
          onMouseLeave={e => { e.currentTarget.style.color="#4b5563"; e.currentTarget.style.borderColor="#2a3340"; }}
        >×</button>

        {/* video container */}
        <div style={{
          position: "relative",
          width: 420, height: 420,
          borderRadius: 16,
          overflow: "hidden",
          background: "#060810",
          border: `1px solid ${catColor}33`,
          boxShadow: `0 0 60px ${catColor}22, 0 0 0 1px ${catColor}18`,
        }}>
          {/* ambient glow behind video */}
          <div style={{
            position: "absolute", inset: 0, zIndex: 0,
            background: `radial-gradient(ellipse at 50% 50%, ${catColor}18 0%, transparent 70%)`,
          }} />

          {!videoErr ? (
            <video
              ref={videoRef}
              src={videoSrc}
              autoPlay
              loop
              muted
              playsInline
              onCanPlay={() => setLoaded(true)}
              onError={() => setVideoErr(true)}
              style={{
                position: "relative", zIndex: 1,
                width: "100%", height: "100%",
                objectFit: "contain",
                opacity: loaded ? 1 : 0,
                transition: "opacity 0.3s ease",
              }}
            />
          ) : (
            /* fallback: show icon if no video found */
            <div style={{
              position: "relative", zIndex: 1,
              width: "100%", height: "100%",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 12,
            }}>
              <div style={{ width: 120, height: 120 }}>
                <SkillIcon skill={skill} size={120} />
              </div>
              <div style={{
                fontSize: 11, fontFamily: "monospace",
                color: "#2a3a50", letterSpacing: "0.1em",
              }}>
                NO ANIMATION FOUND
              </div>
            </div>
          )}

          {/* loading pulse */}
          {!loaded && !videoErr && (
            <div style={{
              position: "absolute", inset: 0, zIndex: 2,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: "50%",
                border: `2px solid ${catColor}44`,
                borderTop: `2px solid ${catColor}`,
                animation: "spin 0.7s linear infinite",
              }} />
            </div>
          )}

          {/* corner accents */}
          {[
            { top: 0, left: 0, borderTop: `2px solid ${catColor}66`, borderLeft: `2px solid ${catColor}66` },
            { top: 0, right: 0, borderTop: `2px solid ${catColor}66`, borderRight: `2px solid ${catColor}66` },
            { bottom: 0, left: 0, borderBottom: `2px solid ${catColor}66`, borderLeft: `2px solid ${catColor}66` },
            { bottom: 0, right: 0, borderBottom: `2px solid ${catColor}66`, borderRight: `2px solid ${catColor}66` },
          ].map((s, i) => (
            <div key={i} style={{
              position: "absolute", zIndex: 3,
              width: 14, height: 14, ...s,
            }} />
          ))}
        </div>

        {/* skill info bar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "10px 18px",
          background: "#0d1119",
          border: "1px solid #1a2030",
          borderRadius: 10,
          minWidth: 260,
        }}>
          {/* small icon */}
          <div style={{ width: 36, height: 36, flexShrink: 0 }}>
            <SkillIcon skill={skill} size={36} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 14, fontWeight: 700,
              fontFamily: "'Cinzel', serif",
              color: "#e5e7eb", letterSpacing: "0.03em",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {skill.name || skill.swfName}
            </div>
            <div style={{
              fontSize: 10, fontFamily: "monospace",
              color: catColor + "66", letterSpacing: "0.1em", marginTop: 2,
            }}>
              {skill.swfName}
            </div>
          </div>

          {/* rarity dot + label */}
          <div style={{
            display: "flex", alignItems: "center", gap: 5, flexShrink: 0,
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: rarityColor,
              boxShadow: RARITY_GLOW[rarityLabel],
            }} />
            <span style={{
              fontSize: 10, fontFamily: "'Cinzel', serif",
              color: rarityColor, letterSpacing: "0.08em",
            }}>
              {rarityLabel}
            </span>
          </div>
        </div>

        {/* hint */}
        <div style={{
          fontSize: 10, color: "#1e2535",
          fontFamily: "monospace", letterSpacing: "0.12em",
        }}>
          ESC or click outside to close
        </div>
      </div>
    </div>
  );
}

// ── CARD ──────────────────────────────────────────────────────────────────────
function SkillCard({ skill, selected, onClick, onAnimationClick }) {
  const cat         = skill.category || skill.type || "";
  const catColor    = CAT_COLOR[cat] || "#374151";
  const catObj      = CATEGORIES.find(c => c.key === cat);
  const rarityLabel = RARITY_LABEL[skill.rarity] || "Common";
  const rarityColor = RARITY_COLOR[rarityLabel] || "#374151";
  const isActive    = selected?.swfName === skill.swfName;
  const [hov, setHov] = useState(false);

  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        all:"unset", cursor:"pointer", width:"100%",
        display:"flex", flexDirection:"column", alignItems:"center",
        padding:"16px 10px 12px",
        background: isActive
          ? `linear-gradient(160deg,#0f1825,#111827)`
          : hov ? "linear-gradient(160deg,#0e1520,#0f1520)"
               : "linear-gradient(160deg,#0b0f18,#0d1119)",
        border:`1px solid ${isActive ? catColor+"66" : hov ? catColor+"33" : "#1a2030"}`,
        borderRadius:12, gap:10, boxSizing:"border-box",
        transition:"all 0.15s ease", position:"relative",
        boxShadow: isActive ? `0 0 0 1px ${catColor}22, inset 0 1px 0 ${catColor}18` : hov ? "0 4px 20px #00000066" : "none",
        transform: hov && !isActive ? "translateY(-2px)" : "none",
      }}
    >
      {/* top accent line */}
      <div style={{
        position:"absolute", top:0, left:14, right:14, height:1,
        background:`linear-gradient(90deg,transparent,${catColor}${isActive?"99":hov?"44":"22"},transparent)`,
        transition:"all 0.15s",
      }} />
      {/* rarity dot */}
      <div style={{
        position:"absolute", top:9, right:9,
        width:6, height:6, borderRadius:"50%",
        background:rarityColor, boxShadow:RARITY_GLOW[rarityLabel],
      }} />
      {/* category icon */}
      <div style={{
        position:"absolute", top:7, left:8, fontSize:11,
        opacity: isActive ? 1 : 0.45, transition:"opacity 0.15s",
      }}>
        {catObj?.icon || ""}
      </div>

      {/* icon wrapper — click opens animation modal */}
      <div
        style={{ width:120, height:120, marginTop:6, flexShrink:0, position:"relative" }}
        onClick={e => {
          e.stopPropagation();
          onAnimationClick();
        }}
        title="Ver animación"
      >
        <SkillIcon skill={skill} size={120} />
        {/* play overlay on hover */}
        {hov && (
          <div style={{
            position:"absolute", inset:0,
            display:"flex", alignItems:"center", justifyContent:"center",
            background:`${catColor}18`,
            borderRadius:8,
            animation:"fadeIn 0.12s ease",
          }}>
            <div style={{
              width:32, height:32, borderRadius:"50%",
              background:`${catColor}33`,
              border:`1px solid ${catColor}66`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:13, color:catColor,
            }}>▶</div>
          </div>
        )}
      </div>

      {/* name */}
      <div style={{
        width:"100%", textAlign:"center",
        fontSize:12, fontWeight:600,
        fontFamily:"'Cinzel',serif", letterSpacing:"0.02em",
        color: isActive ? "#e5e7eb" : hov ? "#d1d5db" : "#9ca3af",
        lineHeight:1.35,
        display:"-webkit-box", WebkitLineClamp:2,
        WebkitBoxOrient:"vertical", overflow:"hidden",
        transition:"color 0.15s",
      }}>
        {skill.name}
      </div>

      {/* swf */}
      <div style={{
        fontSize:9, color: isActive ? catColor+"88" : "#252f40",
        letterSpacing:"0.1em", fontFamily:"monospace",
        transition:"color 0.15s",
      }}>
        {skill.swfName}
      </div>
    </button>
  );
}

// ── TAG / STAT ─────────────────────────────────────────────────────────────────
function Tag({ label, color="#374151" }) {
  return (
    <span style={{
      padding:"3px 10px",
      background:color+"15", border:`1px solid ${color}33`,
      borderRadius:20, fontSize:11,
      color, fontFamily:"'Cinzel',serif", letterSpacing:"0.04em",
    }}>{label}</span>
  );
}

function Stat({ label, value, color="#374151" }) {
  const empty = value === "—";
  return (
    <div style={{
      padding:"10px 12px", background:"#0d1119",
      border:"1px solid #1a2030", borderRadius:8,
      position:"relative", overflow:"hidden",
    }}>
      {!empty && (
        <div style={{
          position:"absolute", bottom:0, left:0, right:0, height:1,
          background:`linear-gradient(90deg,${color}44,transparent)`,
        }} />
      )}
      <div style={{
        fontSize:9, fontFamily:"monospace", color:"#374151",
        letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4,
      }}>{label}</div>
      <div style={{
        fontSize:18, fontFamily:"'Cinzel',serif", fontWeight:700,
        color: empty ? "#1e2535" : color,
      }}>{value}</div>
    </div>
  );
}

// ── DETAIL PANEL ──────────────────────────────────────────────────────────────
function DetailPanel({ skill, onClose, isMobile, onPlayAnimation }) {
  const cat         = skill.category || skill.type || "";
  const catColor    = CAT_COLOR[cat] || "#374151";
  const catObj      = CATEGORIES.find(c => c.key === cat);
  const rarityLabel = RARITY_LABEL[skill.rarity] || "Common";
  const rarityColor = RARITY_COLOR[rarityLabel] || "#374151";
  const typeObj     = CATEGORIES.find(c => c.key === skill.type);
  const hasDesc     = skill.description && skill.description.trim() !== "";
  const fmt = v => (v == null || v === "" || v === "Not Found" || v === 0) ? "—" : String(v);

  const panelStyle = isMobile ? {
    position:"fixed", inset:0, zIndex:1000, overflowY:"auto", background:"#080b12",
  } : {
    position:"absolute", top:0, right:0, bottom:0, width:300,
    background:"#080b12", borderLeft:"1px solid #1a2030",
    overflowY:"auto", display:"flex", flexDirection:"column",
    animation:"slideIn 0.18s ease", zIndex:10,
  };

  return (
    <div style={panelStyle} onClick={e => e.stopPropagation()}>
      <button onClick={onClose} style={{
        all:"unset", cursor:"pointer",
        position:"absolute", top:12, right:14, zIndex:2,
        width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center",
        color:"#4b5563", fontSize:22, lineHeight:1,
        borderRadius:"50%", background:"#0d1119", border:"1px solid #1a2030",
        transition:"color 0.12s, border-color 0.12s",
      }}
        onMouseEnter={e => { e.currentTarget.style.color="#e5e7eb"; e.currentTarget.style.borderColor="#374151"; }}
        onMouseLeave={e => { e.currentTarget.style.color="#4b5563"; e.currentTarget.style.borderColor="#1a2030"; }}
      >×</button>

      {/* icon header — clickable to open animation */}
      <div
        onClick={onPlayAnimation}
        style={{
          position:"relative", flexShrink:0, cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center",
          padding:"44px 24px 28px",
          background:`radial-gradient(ellipse at 50% 110%,${catColor}18 0%,#080b12 70%)`,
          borderBottom:`1px solid ${catColor}22`,
          transition:"background 0.15s",
        }}
        title="Ver animación"
        onMouseEnter={e => e.currentTarget.style.background=`radial-gradient(ellipse at 50% 110%,${catColor}28 0%,#080b12 70%)`}
        onMouseLeave={e => e.currentTarget.style.background=`radial-gradient(ellipse at 50% 110%,${catColor}18 0%,#080b12 70%)`}
      >
        <div style={{
          position:"absolute", width:140, height:140, borderRadius:"50%",
          background:`radial-gradient(circle,${catColor}20 0%,transparent 70%)`,
          filter:"blur(20px)",
        }} />
        <div style={{ width:130, height:130, position:"relative", zIndex:1 }}>
          <SkillIcon skill={skill} size={130} />
        </div>
        {/* play button overlay */}
        <div style={{
          position:"absolute", bottom:14, right:14, zIndex:2,
          width:28, height:28, borderRadius:"50%",
          background:`${catColor}22`,
          border:`1px solid ${catColor}55`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:11, color:catColor,
        }}>▶</div>
      </div>

      {/* body */}
      <div style={{ padding:"20px 18px", display:"flex", flexDirection:"column", gap:14 }}>
        <div>
          <div style={{
            fontSize:18, fontWeight:700, fontFamily:"'Cinzel',serif",
            color:"#e5e7eb", lineHeight:1.25, letterSpacing:"0.02em",
          }}>
            {skill.name || skill.swfName}
          </div>
          <div style={{ fontSize:10, color:catColor+"77", fontFamily:"monospace", letterSpacing:"0.1em", marginTop:4 }}>
            {skill.swfName}
          </div>
        </div>

        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
          {catObj && <Tag label={`${catObj.icon} ${catObj.label}`} color={catColor} />}
          {typeObj && typeObj.key !== cat && <Tag label={`${typeObj.icon} ${typeObj.label}`} color={CAT_COLOR[skill.type]} />}
          <Tag label={rarityLabel} color={rarityColor} />
        </div>

        {hasDesc && (
          <div style={{
            fontSize:13, color:"#9ca3af", lineHeight:1.6,
            fontFamily:"'Crimson Pro',serif",
            padding:"12px 14px",
            background:"#0d1119",
            border:`1px solid ${catColor}22`,
            borderLeft:`2px solid ${catColor}66`,
            borderRadius:"0 8px 8px 0",
          }}>
            {skill.description}
          </div>
        )}

        <div style={{ height:1, background:`linear-gradient(90deg,${catColor}33,transparent)` }} />

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
          <Stat label="Chakra"   value={fmt(skill.cp)}       color={catColor} />
          <Stat label="Cooldown" value={fmt(skill.cooldown) !== "—" ? `${fmt(skill.cooldown)}t` : "—"} color={catColor} />
          <Stat label="Damage"   value={fmt(skill.damage)}   color={catColor} />
          <Stat label="Level"    value={fmt(skill.level)}    color={catColor} />
        </div>

        {(skill.gold > 0 || skill.crystal > 0 || skill.prestige > 0 || skill.premium > 0) && (
          <>
            <div style={{ height:1, background:`linear-gradient(90deg,${catColor}22,transparent)` }} />
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {skill.gold     > 0 && <Stat label="Gold"     value={fmt(skill.gold)}     color="#f5c842" />}
              {skill.crystal  > 0 && <Stat label="Crystal"  value={fmt(skill.crystal)}  color="#38bdf8" />}
              {skill.prestige > 0 && <Stat label="Prestige" value={fmt(skill.prestige)} color="#a78bfa" />}
              {skill.premium  > 0 && <Stat label="Premium"  value={fmt(skill.premium)}  color="#ec4899" />}
            </div>
          </>
        )}

        {/* play animation button */}
        <button
          onClick={onPlayAnimation}
          style={{
            all:"unset", cursor:"pointer", marginTop:4,
            display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            padding:"10px 16px",
            background:`${catColor}11`,
            border:`1px solid ${catColor}33`,
            borderRadius:8,
            fontSize:12, fontFamily:"'Cinzel',serif",
            letterSpacing:"0.08em", color:catColor,
            transition:"all 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background=`${catColor}22`; e.currentTarget.style.borderColor=`${catColor}66`; }}
          onMouseLeave={e => { e.currentTarget.style.background=`${catColor}11`; e.currentTarget.style.borderColor=`${catColor}33`; }}
        >
          <span style={{ fontSize:14 }}>▶</span>
          PLAY ANIMATION
        </button>
      </div>
    </div>
  );
}

// ── FILTER BAR ────────────────────────────────────────────────────────────────
function FilterBar({ catFilter, setCatFilter, counts }) {
  return (
    <div style={{ position:"relative" }}>
      <div style={{
        position:"absolute", left:0, top:0, bottom:0, width:24, zIndex:1,
        background:"linear-gradient(90deg,#0d1017,transparent)", pointerEvents:"none",
      }} />
      <div style={{
        position:"absolute", right:0, top:0, bottom:0, width:24, zIndex:1,
        background:"linear-gradient(270deg,#0d1017,transparent)", pointerEvents:"none",
      }} />
      <div style={{
        display:"flex", gap:2, overflowX:"auto", padding:"0 2px",
        scrollbarWidth:"none", msOverflowStyle:"none",
      }}>
        {CATEGORIES.map(({ key, label, icon, color }) => {
          const active = catFilter === key;
          const c = color || "#9ca3af";
          return (
            <button key={key} onClick={() => setCatFilter(key)}
              style={{
                all:"unset", cursor:"pointer", flexShrink:0,
                display:"flex", alignItems:"center", gap:5,
                padding:"6px 13px",
                borderRadius:"6px 6px 0 0",
                background: active ? "#080b12" : "transparent",
                borderTop:`1px solid ${active ? "#1a2030" : "transparent"}`,
                borderLeft:`1px solid ${active ? "#1a2030" : "transparent"}`,
                borderRight:`1px solid ${active ? "#1a2030" : "transparent"}`,
                borderBottom:`2px solid ${active ? c : "transparent"}`,
                color: active ? c : "#3a4a5c",
                fontSize:11.5, fontFamily:"'Cinzel',serif", letterSpacing:"0.05em",
                whiteSpace:"nowrap", transition:"all 0.12s", position:"relative",
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.color=c; e.currentTarget.style.borderBottomColor=c+"55"; }}}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.color="#3a4a5c"; e.currentTarget.style.borderBottomColor="transparent"; }}}
            >
              {icon && <span style={{ fontSize:12 }}>{icon}</span>}
              {label}
              <span style={{ fontSize:9, opacity:0.45, fontFamily:"monospace", letterSpacing:"0.05em" }}>
                {counts[key] ?? ""}
              </span>
            </button>
          );
        })}
      </div>
      <div style={{ height:1, background:"#1a2030", marginTop:-1 }} />
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function SkillViewer() {
  const [selected,      setSelected]      = useState(null);
  const [animSkill,     setAnimSkill]     = useState(null); // skill whose animation is playing
  const [search,        setSearch]        = useState("");
  const [catFilter,     setCatFilter]     = useState("ALL");
  const [visible,       setVisible]       = useState(BATCH);
  const gridRef = useRef(null);
  const { w } = useWindowSize();
  const isMobile = w < 640;

  useEffect(() => {
    if (isMobile && selected && !animSkill) document.body.style.overflow = "hidden";
    else if (!animSkill) document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [selected, isMobile, animSkill]);

  useEffect(() => { setVisible(BATCH); }, [search, catFilter]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return SKILLS_DATA.filter(s => {
      const ms = !q || (s.name||"").toLowerCase().includes(q) || (s.swfName||"").toLowerCase().includes(q);
      const mc = catFilter === "ALL" || (s.category || s.type) === catFilter;
      return ms && mc;
    });
  }, [search, catFilter]);

  const counts = useMemo(() => {
    const c = { ALL: SKILLS_DATA.length };
    for (const s of SKILLS_DATA) {
      const k = s.category || s.type || "unknown";
      c[k] = (c[k] || 0) + 1;
    }
    return c;
  }, []);

  const handleScroll = useCallback(() => {
    const el = gridRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200)
      setVisible(v => Math.min(v + BATCH, filtered.length));
  }, [filtered.length]);

  const items = filtered.slice(0, visible);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Pro:ital,wght@0,400;0,600;1,400&display=swap');
        ::-webkit-scrollbar { width:3px; height:3px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#1e2535; border-radius:2px; }
        @keyframes slideIn    { from{transform:translateX(16px);opacity:0}   to{transform:translateX(0);opacity:1} }
        @keyframes fadeUp     { from{transform:translateY(8px);opacity:0}    to{transform:translateY(0);opacity:1} }
        @keyframes fadeIn     { from{opacity:0} to{opacity:1} }
        @keyframes modalFadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes modalSlideUp  { from{transform:translateY(16px) scale(0.97);opacity:0} to{transform:translateY(0) scale(1);opacity:1} }
        @keyframes spin       { to{transform:rotate(360deg)} }
      `}</style>

      <div style={{
        flex:1, display:"flex", flexDirection:"column", overflow:"hidden",
        background:"#080b12", fontFamily:"'Crimson Pro',serif",
      }}>
        {/* TOPBAR */}
        <div style={{ flexShrink:0, background:"#0d1017" }}>
          <div style={{
            display:"flex", alignItems:"center", gap:14,
            padding: isMobile ? "10px 12px 8px" : "10px 20px 8px",
          }}>
            {!isMobile && <>
              <span style={{
                fontSize:12, fontWeight:700, letterSpacing:"0.15em",
                color:"#374151", fontFamily:"'Cinzel',serif",
                textTransform:"uppercase", flexShrink:0,
              }}>Skills</span>
              <div style={{ width:1, height:16, background:"#1a2030" }} />
            </>}

            <div style={{ position:"relative", flex:1, maxWidth:320 }}>
              <span style={{
                position:"absolute", left:11, top:"50%", transform:"translateY(-50%)",
                color:"#2a3a50", fontSize:15, pointerEvents:"none",
              }}>⌕</span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search skills..."
                style={{
                  width:"100%", boxSizing:"border-box",
                  background:"#080b12", border:"1px solid #1a2030",
                  borderRadius:8, padding:"7px 32px 7px 32px",
                  color:"#e5e7eb", fontSize:13,
                  fontFamily:"'Crimson Pro',serif", outline:"none",
                  transition:"border-color 0.12s",
                }}
                onFocus={e => e.target.style.borderColor="#2a3a50"}
                onBlur={e  => e.target.style.borderColor="#1a2030"}
              />
              {search && (
                <button onClick={() => setSearch("")} style={{
                  all:"unset", cursor:"pointer",
                  position:"absolute", right:10, top:"50%", transform:"translateY(-50%)",
                  color:"#374151", fontSize:18, lineHeight:1,
                }}>×</button>
              )}
            </div>

            <span style={{
              marginLeft:"auto", fontSize:11, color:"#2a3a4a",
              fontFamily:"monospace", letterSpacing:"0.05em", flexShrink:0,
            }}>
              <span style={{ color:"#4b5563" }}>{filtered.length}</span>
              {" / "}
              {SKILLS_DATA.length}
            </span>
          </div>

          <div style={{ padding: isMobile ? "0 8px 0" : "0 16px 0" }}>
            <FilterBar catFilter={catFilter} setCatFilter={setCatFilter} counts={counts} />
          </div>
        </div>

        {/* GRID */}
        <div style={{ flex:1, overflow:"hidden", position:"relative" }}
          onClick={() => setSelected(null)}>
          <div ref={gridRef} onScroll={handleScroll} key={`${search}-${catFilter}`}
            style={{ height:"100%", overflowY:"auto", padding:"18px 18px" }}>
            {items.length === 0 ? (
              <div style={{
                display:"flex", flexDirection:"column",
                alignItems:"center", justifyContent:"center",
                height:200, gap:12,
                color:"#1e2535", fontSize:13,
                fontFamily:"'Cinzel',serif", letterSpacing:"0.12em",
              }}>
                <span style={{ fontSize:30 }}>⛩</span>
                NO SKILLS FOUND
              </div>
            ) : (
              <>
                <div style={{
                  display:"grid",
                  gridTemplateColumns:"repeat(auto-fill,minmax(165px,1fr))",
                  gap:8,
                }}>
                  {items.map((s, i) => (
                    <div key={s.swfName}
                      style={{ animation: i < BATCH ? `fadeUp 0.2s ease ${Math.min(i*0.012,0.3)}s both` : "none" }}>
                      <SkillCard
                        skill={s}
                        selected={selected}
                        onClick={ev => {
                          ev.stopPropagation();
                          setSelected(prev => prev?.swfName === s.swfName ? null : s);
                        }}
                        onAnimationClick={() => setAnimSkill(s)}
                      />
                    </div>
                  ))}
                </div>
                {visible < filtered.length && (
                  <div style={{
                    textAlign:"center", padding:"24px 0",
                    color:"#1e2535", fontSize:10,
                    fontFamily:"monospace", letterSpacing:"0.2em",
                  }}>
                    · · · {filtered.length - visible} MORE · · ·
                  </div>
                )}
              </>
            )}
          </div>

          {selected && (
            <DetailPanel
              key={selected.swfName}
              skill={selected}
              onClose={() => setSelected(null)}
              isMobile={isMobile}
              onPlayAnimation={() => setAnimSkill(selected)}
            />
          )}
        </div>
      </div>

      {/* ANIMATION MODAL — rendered outside main flow to avoid z-index issues */}
      {animSkill && (
        <AnimationModal
          skill={animSkill}
          onClose={() => setAnimSkill(null)}
        />
      )}
    </>
  );
}