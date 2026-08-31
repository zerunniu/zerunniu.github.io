import { useState } from "react";

export default function BraveMechanism() {
  const [controlled, setControlled] = useState(true);
  const confidence = controlled ? [52, 61, 66] : [52, 76, 94];
  return (
    <section
      className={`brave-mechanism ${controlled ? "controlled" : "uncontrolled"}`}
      id="brave-mechanism"
      aria-labelledby="mechanism-title"
    >
      <header>
        <div>
          <span>Interactive reconstruction · not a paper screenshot</span>
          <h2 id="mechanism-title">What changes when evidence feeds back?</h2>
        </div>
        <div className="mechanism-switch">
          <button
            className={!controlled ? "is-active" : ""}
            onClick={() => setControlled(false)}
          >
            Uncontrolled loop
          </button>
          <button
            className={controlled ? "is-active" : ""}
            onClick={() => setControlled(true)}
          >
            BRAVE
          </button>
        </div>
      </header>
      <div className="mechanism-grid">
        <div className="worker-column">
          <span>Sparse observed labels</span>
          {["A", "?", "B", "?", "A"].map((label, index) => (
            <i className={label === "?" ? "missing" : ""} key={index}>
              {label}
            </i>
          ))}
        </div>
        <div className="flow-arrow" aria-hidden="true">
          →
        </div>
        <div className="posterior-column">
          <span>Block-local posterior</span>
          {confidence.map((value, index) => (
            <div key={value}>
              <small>block {index + 1}</small>
              <b>{value}%</b>
              <em
                style={{ "--level": `${value}%` } as React.CSSProperties}
              ></em>
            </div>
          ))}
        </div>
        <div className="flow-arrow" aria-hidden="true">
          →
        </div>
        <div className="global-column">
          <span>Global posterior</span>
          <strong>{controlled ? "66%" : "94%"}</strong>
          <p>
            {controlled
              ? "A regulated global signal informs the next block without becoming a substitute for new labels."
              : "The model recycles its own posterior as if it were fresh evidence, producing confidence without support."}
          </p>
        </div>
      </div>
      <div className="feedback-path">
        <span>
          {controlled
            ? "Controlled feedback coefficient limits global influence"
            : "Illusory evidence accumulation amplifies an early belief"}
        </span>
      </div>
    </section>
  );
}
