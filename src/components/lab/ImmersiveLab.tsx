import { lazy, Suspense, useEffect, useState } from "react";
import "./lab.css";

const LabCanvas = lazy(() => import("./LabCanvas"));

type Project = {
  slug: string;
  title: string;
  shortTitle: string;
  summary: string;
  role: string;
  status: string;
  accent: string;
  metrics: { value: string; label: string }[];
};

type OrbState = "idle" | "listening" | "thinking" | "speaking" | "error";

const accentMap: Record<string, string> = {
  cyan: "#60e9ff",
  indigo: "#7189ff",
  orange: "#ff9f5a",
  violet: "#a58bff",
};

function supportsLab() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    return false;
  if (window.matchMedia("(max-width: 820px)").matches) return false;
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4)
    return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function EvidenceLoop({ controlled }: { controlled: boolean }) {
  const values = controlled ? [42, 55, 64, 70] : [42, 63, 82, 96];
  return (
    <div
      className={`evidence-loop ${controlled ? "is-controlled" : "is-illusory"}`}
      aria-label={
        controlled
          ? "Controlled evidence feedback animation"
          : "Illusory evidence accumulation animation"
      }
    >
      {values.map((value, index) => (
        <div className="evidence-node" key={value}>
          <span>Block {index + 1}</span>
          <strong>{value}%</strong>
          <div
            style={{ "--confidence": `${value}%` } as React.CSSProperties}
          ></div>
        </div>
      ))}
      <span className="feedback-line" aria-hidden="true">
        {controlled
          ? "regulated global signal"
          : "posterior recycled as evidence"}
      </span>
    </div>
  );
}

export default function ImmersiveLab({ projects }: { projects: Project[] }) {
  const [mode, setMode] = useState<"checking" | "armed" | "3d" | "2d">("2d");
  const [selected, setSelected] = useState(projects[0]?.slug ?? "brave");
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [controlled, setControlled] = useState(true);

  useEffect(() => {
    setMode(supportsLab() ? "armed" : "2d");
    const handle = (event: Event) => {
      const detail = (event as CustomEvent<OrbState>).detail;
      if (detail) setOrbState(detail);
    };
    window.addEventListener("digital-zerun-state", handle);
    return () => window.removeEventListener("digital-zerun-state", handle);
  }, []);

  const project =
    projects.find((item) => item.slug === selected) ?? projects[0];
  return (
    <section className="lab-shell" aria-label="Interactive research laboratory">
      <div className="lab-stage">
        <div className="lab-fallback" aria-hidden={mode === "3d"}>
          <div className={`static-orb state-${orbState}`}>
            <span>ZN</span>
          </div>
          <div className="fallback-grid"></div>
        </div>
        {mode === "3d" && (
          <Suspense fallback={null}>
            <LabCanvas state={orbState} />
          </Suspense>
        )}
        <div className="lab-status">
          <span className="status-dot"></span>
          {mode === "3d" ? (
            "Immersive lab online"
          ) : mode === "armed" ? (
            <button
              type="button"
              className="launch-3d"
              onClick={() => setMode("3d")}
            >
              Launch 3D lab
            </button>
          ) : mode === "2d" ? (
            "Efficient 2D lab"
          ) : (
            "Calibrating environment"
          )}
        </div>
        <div className="orb-label">
          <span>Digital Zerun</span>
          <strong>{orbState}</strong>
        </div>
        <div className="workstation-controls">
          {projects.map((item, index) => (
            <button
              type="button"
              className={`workstation station-${index + 1} ${selected === item.slug ? "is-active" : ""}`}
              style={
                { "--station": accentMap[item.accent] } as React.CSSProperties
              }
              onClick={() => setSelected(item.slug)}
              aria-pressed={selected === item.slug}
            >
              <span>0{index + 1}</span>
              <strong>{item.shortTitle}</strong>
              <small>{item.status.replace("-", " ")}</small>
            </button>
          ))}
        </div>
      </div>
      {project && (
        <article
          className="lab-readout"
          style={
            { "--station": accentMap[project.accent] } as React.CSSProperties
          }
        >
          <div className="readout-index">
            / {project.shortTitle.toUpperCase()}
          </div>
          <div>
            <div className="readout-meta">
              <span>{project.status.replace("-", " ")}</span>
              <span>selected workstation</span>
            </div>
            <h2>{project.title}</h2>
            <p>{project.summary}</p>
            <strong className="readout-role">{project.role}</strong>
            <div className="readout-actions">
              <a href={`/projects/${project.slug}`}>Open research case →</a>
              {project.slug === "brave" && (
                <div className="feedback-toggle" aria-label="BRAVE mechanism">
                  <button
                    className={!controlled ? "is-active" : ""}
                    onClick={() => setControlled(false)}
                  >
                    Uncontrolled
                  </button>
                  <button
                    className={controlled ? "is-active" : ""}
                    onClick={() => setControlled(true)}
                  >
                    BRAVE controlled
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="readout-evidence">
            {project.slug === "brave" ? (
              <EvidenceLoop controlled={controlled} />
            ) : (
              project.metrics.map((metric) => (
                <div className="metric" key={metric.label}>
                  <strong>{metric.value}</strong>
                  <span>{metric.label}</span>
                </div>
              ))
            )}
          </div>
        </article>
      )}
    </section>
  );
}
