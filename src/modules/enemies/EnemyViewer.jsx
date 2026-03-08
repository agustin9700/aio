// src/modules/enemies/EnemyViewer.jsx
import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import ENEMIES_DATA_RAW from "../../data/enemies_merged.json";

// ── SORT & NORMALIZE ──────────────────────────────────────────────────────────
function extractNum(swfName = "") {
  const m = swfName.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 999999;
}

const NOT_FOUND = "Not Found";

const ENEMIES_DATA = [...ENEMIES_DATA_RAW]
  .sort((a, b) => extractNum(a.swfName) - extractNum(b.swfName))
  .map(e => {
    const out = { ...e };
    for (const k of Object.keys(out)) {
      if (k !== "assetPaths" && (out[k] === null || out[k] === undefined)) {
        out[k] = NOT_FOUND;
      }
    }
    return out;
  });

// ── HOOKS ─────────────────────────────────────────────────────────────────────
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

// ── MAPAS ─────────────────────────────────────────────────────────────────────
const TYPE_MAP = { 1: "Humanoid", 2: "Beast", 3: "Undead", 4: "Elemental", 5: "Dragon", 6: "Construct" };
const DEV_MAP  = { 0: "Common", 1: "Uncommon", 2: "Rare", 3: "Elite", 4: "Boss" };

const DEV_ACCENT = {
  Common:   "#374151",
  Uncommon: "#166534",
  Rare:     "#1d4ed8",
  Elite:    "#7c3aed",
  Boss:     "#dc2626",
};

const STATUS_COLOR = {
  active:        "#4ade80",
  missing_asset: "#fbbf24",
  orphan_asset:  "#374151",
};

const typeName = e => TYPE_MAP[e.type] || null;
const devName  = e => DEV_MAP[e.development] ?? null;

const BATCH = 40;

// ── SPRITE ────────────────────────────────────────────────────────────────────
function Sprite({ enemy, size }) {
  const [err, setErr] = useState(false);
  const src = `/assets/enemies/${enemy.swfName}.png`;

  if (err || enemy.status === "missing_asset") {
    return (
      <div style={{
        width: size, height: size,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#1f2937", fontSize: size * 0.28,
        userSelect: "none",
      }}>?</div>
    );
  }
  return (
    <img
      src={src}
      alt={enemy.name}
      onError={() => setErr(true)}
      style={{
        width: size, height: size,
        objectFit: "contain",
        imageRendering: "pixelated",
        filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))",
      }}
    />
  );
}

// ── CARD ──────────────────────────────────────────────────────────────────────
function EnemyCard({ enemy, selected, onClick }) {
  const dn     = devName(enemy);
  const accent = DEV_ACCENT[dn] || "#374151";
  const dot    = STATUS_COLOR[enemy.status] || "#374151";
  const isActive = selected?.swfName === enemy.swfName;
  const isOrphan = enemy.status === "orphan_asset";

  const displayName = (enemy.name && enemy.name !== NOT_FOUND)
    ? enemy.name
    : NOT_FOUND;

  return (
    <button
      onClick={onClick}
      style={{
        all: "unset", cursor: "pointer",
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "14px 8px 10px",
        background: isActive ? "#151d2e" : "#0f1218",
        border: `1.5px solid ${isActive ? "#3b82f6" : "#171d28"}`,
        borderTop: `1.5px solid ${isActive ? "#3b82f6" : "#171d28"}`,
        borderRadius: 10,
        gap: 8,
        transition: "border-color 0.12s, background 0.12s",
        position: "relative",
      }}
      onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "#121620"; e.currentTarget.style.borderColor = "#1e2738"; }}}
      onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "#0f1218"; e.currentTarget.style.borderColor = "#171d28"; }}}
    >
      {/* status dot */}
      <div style={{
        position: "absolute", top: 8, right: 8,
        width: 6, height: 6, borderRadius: "50%",
        background: dot,
      }} />

      {/* sprite */}
      <div style={{ width: 120, height: 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Sprite enemy={enemy} size={118} />
      </div>

      {/* name */}
      <div style={{
        width: "100%", textAlign: "center",
        fontSize: 14,
        fontFamily: "'Crimson Pro', serif",
        fontWeight: 600,
        color: displayName === NOT_FOUND ? "#2d3748" : "#9ca3af",
        fontStyle: displayName === NOT_FOUND ? "italic" : "normal",
        lineHeight: 1.3,
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      }}>
        {displayName}
      </div>

      {/* swfName */}
      <div style={{
        fontSize: 11,
        color: "#4b5563",
        letterSpacing: 1,
        fontFamily: "monospace",
        marginTop: 2,
      }}>
        {enemy.swfName}
      </div>
    </button>
  );
}

// ── DETAIL PANEL ──────────────────────────────────────────────────────────────
function DetailPanel({ enemy, onClose, isMobile }) {
  const tn  = typeName(enemy);
  const dn  = devName(enemy);
  const dot = STATUS_COLOR[enemy.status];
  const acc = DEV_ACCENT[dn] || "#374151";
  const isOrphan  = enemy.status === "orphan_asset";
  const isMissing = enemy.status === "missing_asset";

  const val = v => (v === NOT_FOUND || v === null || v === undefined) ? "—" : v;

  const panelStyle = isMobile ? {
    position: "fixed", inset: 0,
    width: "100%", height: "100%",
    zIndex: 1000, overflowY: "auto",
    background: "#0d1017",
  } : {
    position: "absolute",
    top: 0, right: 0, bottom: 0,
    width: 280,
    background: "#0d1017",
    borderLeft: "1px solid #1e2330",
    overflowY: "auto",
    display: "flex", flexDirection: "column",
    animation: "slideIn 0.2s ease",
    zIndex: 10,
  };

  const closeBtnStyle = isMobile ? {
    position: "fixed", top: "12px", right: "16px",
    zIndex: 1001, width: 44, height: 44,
    borderRadius: "50%", background: "#1e2330",
    color: "#e5e7eb", fontSize: 20,
    border: "none", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  } : {
    all: "unset", cursor: "pointer",
    position: "absolute", top: 12, right: 14,
    width: 44, height: 44,
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#374151", fontSize: 20, lineHeight: 1,
    transition: "color 0.1s",
  };

  const backBtnStyle = isMobile ? {
    position: "fixed", top: "12px", left: "16px",
    zIndex: 1001, width: 44, height: 44,
    borderRadius: "50%", background: "#1e2330",
    color: "#e5e7eb", fontSize: 20,
    border: "none", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  } : {};

  const displayName = (enemy.name && enemy.name !== NOT_FOUND)
    ? enemy.name
    : NOT_FOUND;

  return (
    <div style={panelStyle} onClick={e => e.stopPropagation()}>
      <button onClick={onClose} style={closeBtnStyle}>×</button>
      {isMobile && <button onClick={onClose} style={backBtnStyle}>←</button>}

      {/* sprite header */}
      <div style={{
        flexShrink: 0,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        padding: "32px 24px 20px",
        background: "#0a0c10",
        borderBottom: "1px solid #1e2330",
        minHeight: 180, position: "relative",
      }}>
        {!isOrphan && !isMissing && (
          <div style={{
            position: "absolute", bottom: 0,
            width: 160, height: 60,
            background: `radial-gradient(ellipse, ${acc}22 0%, transparent 70%)`,
            filter: "blur(16px)",
          }} />
        )}
        <Sprite enemy={enemy} size={140} />
      </div>

      {/* info */}
      <div style={{ flex: 1, overflowY: "auto", padding: "18px 18px 24px" }}>

        {/* name */}
        <div style={{ marginBottom: 14 }}>
          <h2 style={{
            fontFamily: "'Crimson Pro', serif",
            fontSize: 22, fontWeight: 700,
            color: displayName === NOT_FOUND ? "#374151" : "#f3f4f6",
            fontStyle: displayName === NOT_FOUND ? "italic" : "normal",
            lineHeight: 1.15, marginBottom: 4,
          }}>
            {displayName}
          </h2>
          <div style={{
            fontSize: 11, fontFamily: "monospace",
            color: "#374151", letterSpacing: 1,
            display: "flex", gap: 8, flexWrap: "wrap",
          }}>
            <span>{enemy.swfName}</span>
            {enemy.numericId && enemy.numericId !== NOT_FOUND && (
              <span>· #{String(enemy.numericId).padStart(4, "0")}</span>
            )}
          </div>
        </div>

        {/* tags */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
          {tn && <Tag label={tn} />}
          {dn && dn !== "Common" && <Tag label={dn} color={acc} />}
          <Tag
            label={enemy.status === "active" ? "Active" : enemy.status === "missing_asset" ? "No SWF" : "Orphan"}
            color={dot}
          />
        </div>

        {/* notices */}
        {isOrphan  && <Notice text="SWF hallado en assets pero sin registro en SystemData." color="#374151" />}
        {isMissing && <Notice text="Registrado en SystemData pero SWF no encontrado." color="#d97706" />}

        {/* stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 14 }}>
          <Stat label="Level"     value={val(enemy.level)} />
          <Stat label="XP"        value={val(enemy.xp) !== "—" ? Number(val(enemy.xp)).toLocaleString() : "—"} />
          <Stat label="Gold"      value={val(enemy.gold) !== "—" ? Number(val(enemy.gold)).toLocaleString() : "—"} />
          <Stat label="Lv. Range" value={
            (enemy.minLevel && enemy.minLevel !== NOT_FOUND && enemy.maxLevel && enemy.maxLevel !== NOT_FOUND)
              ? `${enemy.minLevel}–${enemy.maxLevel}`
              : "—"
          } />
        </div>

        {/* description */}
        {enemy.description && enemy.description !== NOT_FOUND && enemy.description !== enemy.name && (
          <p style={{
            fontFamily: "'Crimson Pro', serif",
            fontStyle: "italic",
            fontSize: 14, color: "#4b5563",
            lineHeight: 1.7, marginBottom: 14,
            paddingLeft: 10,
            borderLeft: "2px solid #1e2330",
          }}>
            {enemy.description}
          </p>
        )}

        {/* future */}
        <div style={{
          padding: "10px", background: "#0a0c10",
          border: "1px dashed #1a2030",
          borderRadius: 6, textAlign: "center",
          fontSize: 11, color: "#1a2030",
          fontFamily: "monospace", letterSpacing: 2,
        }}>
          SKILLS · DROPS · QUESTS
        </div>
      </div>
    </div>
  );
}

function Tag({ label, color = "#374151" }) {
  return (
    <span style={{
      padding: "3px 9px",
      background: color + "18",
      border: `1px solid ${color}44`,
      borderRadius: 5, fontSize: 12,
      color, fontFamily: "'Crimson Pro', serif",
    }}>{label}</span>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{
      padding: "9px 12px",
      background: "#0a0c10", border: "1px solid #141920",
      borderRadius: 7,
    }}>
      <div style={{ fontSize: 9, fontFamily: "monospace", color: "#374151", letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 18, fontFamily: "'Crimson Pro', serif", fontWeight: 700, color: value === "—" ? "#1a2030" : "#d1d5db" }}>{value}</div>
    </div>
  );
}

function Notice({ text, color }) {
  return (
    <div style={{
      padding: "8px 12px", marginBottom: 14,
      background: color + "0f",
      border: `1px solid ${color}33`,
      borderRadius: 6, fontSize: 13,
      color, fontFamily: "'Crimson Pro', serif",
    }}>{text}</div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function EnemyViewer() {
  const [selected, setSelected] = useState(null);
  const [search,   setSearch]   = useState("");
  const [visible,  setVisible]  = useState(BATCH);
  const gridRef = useRef(null);
  const gridKey = search;

  const { w } = useWindowSize();
  const isMobile = w < 640;

  useEffect(() => {
    if (isMobile && selected) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [selected, isMobile]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return ENEMIES_DATA;
    return ENEMIES_DATA.filter(e =>
      (e.name  || "").toLowerCase().includes(q) ||
      (e.swfName || "").toLowerCase().includes(q)
    );
  }, [search]);

  const handleScroll = useCallback(() => {
    const el = gridRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) {
      setVisible(v => Math.min(v + BATCH, filtered.length));
    }
  }, [filtered.length]);

  // Reset visible when search changes
  useEffect(() => { setVisible(BATCH); }, [search]);

  const items = filtered.slice(0, visible);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;0,700;1,400&display=swap');
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e2330; border-radius: 2px; }
        @keyframes slideIn {
          from { transform: translateX(20px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>

      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        overflow: "hidden", background: "#0a0c10",
        fontFamily: "'Crimson Pro', serif",
      }}>

        {/* ── TOPBAR ── */}
        <div style={{
          flexShrink: 0, height: isMobile ? "auto" : 52,
          padding: isMobile ? "8px 12px" : "0 24px",
          display: "flex", alignItems: "center",
          gap: isMobile ? 8 : 16,
          borderBottom: "1px solid #1e2330",
          background: "#0d1017",
          flexDirection: isMobile ? "column" : "row",
        }}>
          {!isMobile && (
            <>
              <span style={{ fontSize: 16, fontWeight: 600, color: "#6b7280", flexShrink: 0 }}>
                Enemies
              </span>
              <div style={{ width: 1, height: 18, background: "#1e2330" }} />
            </>
          )}

          {/* search */}
          <div style={{ position: "relative", flex: 1, width: isMobile ? "100%" : "auto", maxWidth: isMobile ? "100%" : 320 }}>
            <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#374151", fontSize: 16, pointerEvents: "none" }}>⌕</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              style={{
                width: "100%", background: "#0a0c10",
                border: "1px solid #1e2330", borderRadius: 8,
                padding: "7px 32px 7px 32px",
                color: "#e5e7eb", fontSize: 14,
                fontFamily: "'Crimson Pro', serif", outline: "none",
              }}
              onFocus={e => e.target.style.borderColor = "#374151"}
              onBlur={e  => e.target.style.borderColor = "#1e2330"}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{
                all: "unset", cursor: "pointer",
                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                color: "#374151", fontSize: 18, lineHeight: 1,
              }}>×</button>
            )}
          </div>

          {/* counter */}
          <span style={{ fontSize: 13, color: "#374151", fontFamily: "monospace", flexShrink: 0 }}>
            {filtered.length} / {ENEMIES_DATA.length}
          </span>
        </div>

        {/* ── GRID AREA ── */}
        <div style={{ flex: 1, overflow: "hidden", position: "relative" }} onClick={() => setSelected(null)}>
          <div
            ref={gridRef}
            onScroll={handleScroll}
            key={gridKey}
            style={{ height: "100%", overflowY: "auto", padding: "20px 24px" }}
          >
            {items.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "#374151", fontSize: 16 }}>
                No enemies found
              </div>
            ) : (
              <>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                  gap: 8,
                }}>
                  {items.map(e => (
                    <EnemyCard
                      key={e.swfName}
                      enemy={e}
                      selected={selected}
                      onClick={ev => {
                        ev.stopPropagation();
                        setSelected(prev => prev?.swfName === e.swfName ? null : e);
                      }}
                    />
                  ))}
                </div>

                {visible < filtered.length && (
                  <div style={{ textAlign: "center", padding: "20px 0", color: "#1e2330", fontSize: 13, fontFamily: "monospace" }}>
                    {filtered.length - visible} more...
                  </div>
                )}
              </>
            )}
          </div>

          {selected && (
            <DetailPanel
              key={selected.swfName}
              enemy={selected}
              onClose={() => setSelected(null)}
              isMobile={isMobile}
            />
          )}
        </div>

      </div>
    </>
  );
}