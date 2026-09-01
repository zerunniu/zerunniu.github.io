/**
 * Progressive-enhancement interaction layer for the single-page site:
 * scroll reveal, custom cursor, magnetic buttons, card tilt, pointer parallax,
 * and the sticky-header border. Everything degrades to a fully static page and
 * is disabled under `prefers-reduced-motion`.
 */

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const root = document.documentElement;

/* ---------- pointer position -> CSS custom properties ---------- */
const setPointerVars = (x: number, y: number) => {
  root.style.setProperty("--cursor-x", (x / window.innerWidth).toFixed(4));
  root.style.setProperty("--cursor-y", (y / window.innerHeight).toFixed(4));
};

/* ---------- sticky header border ---------- */
const header = document.querySelector(".site-header");
if (header) {
  const onScroll = () => header.classList.toggle("is-stuck", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

/* ---------- scroll reveal ---------- */
const revealables = document.querySelectorAll<HTMLElement>(".reveal");
if (reduced || !("IntersectionObserver" in window)) {
  revealables.forEach((el) => el.classList.add("is-visible"));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14, rootMargin: "0px 0px -8% 0px" },
  );
  revealables.forEach((el) => io.observe(el));
}

/* ---------- custom cursor ---------- */
if (fine && !reduced) {
  const dot = document.querySelector<HTMLElement>(".cursor-dot");
  const ring = document.querySelector<HTMLElement>(".cursor-ring");
  if (dot && ring) {
    let rx = window.innerWidth / 2;
    let ry = window.innerHeight / 2;
    let tx = rx;
    let ty = ry;
    window.addEventListener(
      "mousemove",
      (event) => {
        tx = event.clientX;
        ty = event.clientY;
        dot.style.transform = `translate(${tx}px, ${ty}px)`;
        setPointerVars(tx, ty);
        document.body.classList.add("cursor-ready");
      },
      { passive: true },
    );
    const tick = () => {
      rx += (tx - rx) * 0.18;
      ry += (ty - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      requestAnimationFrame(tick);
    };
    tick();
    const hoverTargets = document.querySelectorAll(
      "a, button, .card, [data-magnetic], input, .starter-prompts button",
    );
    hoverTargets.forEach((el) => {
      el.addEventListener("mouseenter", () => ring.classList.add("is-lg"));
      el.addEventListener("mouseleave", () => ring.classList.remove("is-lg"));
    });
  }
} else {
  window.addEventListener(
    "mousemove",
    (event) => setPointerVars(event.clientX, event.clientY),
    { passive: true },
  );
}

/* ---------- magnetic buttons ---------- */
if (fine && !reduced) {
  document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((el) => {
    const strength = 0.3;
    el.addEventListener("mousemove", (event) => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${
        (event.clientX - r.left - r.width / 2) * strength
      }px, ${(event.clientY - r.top - r.height / 2) * strength}px)`;
    });
    el.addEventListener("mouseleave", () => {
      el.style.transform = "";
    });
  });
}

/* ---------- card tilt + pointer highlight ---------- */
if (fine && !reduced) {
  document.querySelectorAll<HTMLElement>(".card").forEach((card) => {
    card.addEventListener("mousemove", (event) => {
      const r = card.getBoundingClientRect();
      const px = (event.clientX - r.left) / r.width;
      const py = (event.clientY - r.top) / r.height;
      card.style.transform = `perspective(820px) rotateX(${
        (0.5 - py) * 4.5
      }deg) rotateY(${(px - 0.5) * 5.5}deg) translateY(-2px)`;
      card.style.setProperty("--mx", `${px * 100}%`);
      card.style.setProperty("--my", `${py * 100}%`);
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });
}
