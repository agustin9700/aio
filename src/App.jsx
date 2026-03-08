// src/App.jsx
import { useState, useEffect } from "react";
import EnemyViewer from "./modules/enemies/EnemyViewer";
import SkillViewer from "./modules/skills/Skillviewer";

// ── HOOKS ─────────────────────────────────────────────────────────────────────
function useWindowSize() {
  const [size, setSize] = useState({ w: typeof window !== 'undefined' ? window.innerWidth : 1200, h: typeof window !== 'undefined' ? window.innerHeight : 800 });
  useEffect(() => {
    const fn = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return size;
}

// ── MÓDULOS REGISTRADOS ───────────────────────────────────────────────────────
// Para agregar uno nuevo: { id, label, icon, component }
const MODULES = [
  {
    id: "enemies",
    label: "Enemies",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z"/>
        <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
        <path d="M9 9h.01M15 9h.01"/>
      </svg>
    ),
    component: <EnemyViewer />,
  },
  {
    id: "skills",
    label: "Skills",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    component: <SkillViewer />,
  },
  {
    id: "items",
    label: "Items",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      </svg>
    ),
    component: null,
  },
  {
    id: "pets",
    label: "Pets",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.45 2.344-2.5"/>
        <path d="M14.267 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.96-1.45-2.344-2.5"/>
        <path d="M8 14v.5A3.5 3.5 0 0 0 11.5 18h1a3.5 3.5 0 0 0 3.5-3.5V14a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2z"/>
        <path d="M9.5 10.5c0 1.5.5 2 1 2.5"/>
        <path d="M14.5 10.5c0 1.5-.5 2-1 2.5"/>
      </svg>
    ),
    component: null,
  },
  {
    id: "weapons",
    label: "Weapons",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="m14.5 17.5-8-8 2-2 8 8-2 2z"/>
        <path d="m16.5 15.5 2-2"/>
        <path d="M3 21l3-3"/>
        <path d="m10 6 2-2 6 6-2 2"/>
        <path d="m19 5-1-1"/>
        <path d="M19 9V5h-4"/>
      </svg>
    ),
    component: null,
  },
  {
    id: "backit",
    label: "Back Items",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
      </svg>
    ),
    component: null,
  },
];

// ── COMING SOON PLACEHOLDER ───────────────────────────────────────────────────
function ComingSoon({ label }) {
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 12, color: "#374151",
    }}>
      <div style={{ fontSize: 48, opacity: 0.15 }}>⚙</div>
      <div style={{ fontFamily: "'Crimson Pro', serif", fontSize: 22, color: "#1f2937" }}>
        {label}
      </div>
      <div style={{ fontSize: 13, color: "#1f2937", fontFamily: "monospace", letterSpacing: 2 }}>
        COMING SOON
      </div>
    </div>
  );
}

// ── APP ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [activeId, setActiveId] = useState("enemies");
  const activeModule = MODULES.find(m => m.id === activeId);
  
  // Responsive breakpoints
  const { w } = useWindowSize();
  const isMobile = w < 640;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { height: 100%; }
        body { background: #0a0c10; overflow: hidden; }
      `}</style>

      <div style={{
        height: "100vh",
        display: "flex",
        background: "#0a0c10",
        color: "#e5e7eb",
        fontFamily: "'Crimson Pro', serif",
        flexDirection: isMobile ? "column" : "row",
      }}>

        {/* ── SIDEBAR (hidden on mobile) ── */}
        {!isMobile && (
        <aside style={{
          width: 64,
          flexShrink: 0,
          background: "#0d1017",
          borderRight: "1px solid #1e2330",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 16,
          gap: 4,
        }}>
          {/* Logo */}
          <div style={{
            width: 36, height: 36,
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 16,
          }}>
            <span style={{
              fontFamily: "'Crimson Pro', serif",
              fontSize: 15, fontWeight: 700,
              color: "#4b5563", letterSpacing: 2,
            }}>AIO</span>
          </div>

          <div style={{ width: 24, height: 1, background: "#1e2330", marginBottom: 8 }} />

          {/* Nav items */}
          {MODULES.map(mod => {
            const isActive = mod.id === activeId;
            const isReady  = mod.component !== null;
            return (
              <button
                key={mod.id}
                onClick={() => isReady && setActiveId(mod.id)}
                title={mod.label}
                style={{
                  all: "unset",
                  cursor: isReady ? "pointer" : "default",
                  width: 44, height: 44,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: 10,
                  background: isActive ? "#1a2235" : "transparent",
                  color: isActive ? "#93c5fd" : isReady ? "#4b5563" : "#1f2937",
                  border: `1px solid ${isActive ? "#2563eb44" : "transparent"}`,
                  transition: "all 0.15s ease",
                  position: "relative",
                }}
                onMouseEnter={e => {
                  if (!isActive && isReady) {
                    e.currentTarget.style.background = "#111318";
                    e.currentTarget.style.color = "#6b7280";
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive && isReady) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = isReady ? "#4b5563" : "#1f2937";
                  }
                }}
              >
                {mod.icon}
                {/* Active indicator */}
                {isActive && (
                  <div style={{
                    position: "absolute",
                    right: -9, top: "50%", transform: "translateY(-50%)",
                    width: 3, height: 20,
                    background: "#3b82f6",
                    borderRadius: "2px 0 0 2px",
                  }} />
                )}
              </button>
            );
          })}
        </aside>
        )}

        {/* ── CONTENT ── */}
        <div style={{ 
          flex: 1, overflow: "hidden", display: "flex", flexDirection: "column",
          paddingBottom: isMobile ? 56 : 0,
        }}>
          {activeModule?.component
            ? activeModule.component
            : <ComingSoon label={activeModule?.label || ""} />
          }
        </div>

        {/* ── BOTTOM NAVIGATION (mobile only) ── */}
        {isMobile && (
          <nav style={{
            position: "fixed", bottom: 0, left: 0, right: 0,
            height: 56,
            background: "#0d1017",
            borderTop: "1px solid #1e2330",
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 8,
            zIndex: 50,
          }}>
            {MODULES.map(mod => {
              const isActive = mod.id === activeId;
              const isReady = mod.component !== null;
              return (
                <button
                  key={mod.id}
                  onClick={() => isReady && setActiveId(mod.id)}
                  title={mod.label}
                  style={{
                    all: "unset",
                    cursor: isReady ? "pointer" : "default",
                    width: 44, height: 44,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: 10,
                    background: isActive ? "#1a2235" : "transparent",
                    color: isActive ? "#93c5fd" : isReady ? "#4b5563" : "#1f2937",
                    transition: "all 0.15s ease",
                  }}
                >
                  {mod.icon}
                </button>
              );
            })}
          </nav>
        )}

      </div>
    </>
  );
}
