/** A particle field that reveals research themes and a personal signature. */
import {
  atPath,
  reliableScene,
  fedeqScene,
  wasecomScene,
  sampleScene,
  type Point,
} from "./research-scenes";
type Form = "reasoning" | "connections" | "communication" | "signature";
type Phase = "idle" | "gathering" | "formed";
type Particle = { current: Point; from: Point; seed: number; size: number };
type RGB = [number, number, number];

const FORMS: Form[] = [
  "reasoning",
  "connections",
  "communication",
  "signature",
];
const SIGNATURE_INDEX = FORMS.indexOf("signature");
const DIAGRAMS = [reliableScene(), fedeqScene(), wasecomScene()];
const COPY: Record<Form, { title: string; description: string }> = {
  reasoning: {
    title: "Reliable AI",
    description: "Label aggregation · uncertainty",
  },
  connections: {
    title: "Edge AI",
    description: "Shared representation · local heads",
  },
  communication: {
    title: "Semantic Communication",
    description: "Meaning over bits · robust transmission",
  },
  signature: {
    title: "ZN",
    description: "Zerun Niu, written in a field of points.",
  },
};
const COUNT = 1000;
const GATHER_MS = 1700;
const TAU = Math.PI * 2;
const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => t * t * (3 - 2 * t);
const random = (seed: number) => {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
};
const rgb = (value: string): RGB => {
  const hex = value.trim().replace("#", "");
  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((c) => c + c)
          .join("")
      : hex;
  const n = Number.parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const blend = (a: RGB, b: RGB, t: number): RGB => [
  Math.round(mix(a[0], b[0], t)),
  Math.round(mix(a[1], b[1], t)),
  Math.round(mix(a[2], b[2], t)),
];
const ink = (color: RGB, alpha: number) => `rgba(${color.join(",")},${alpha})`;

const scatter = (i: number): Point => {
  const angle = random(i + 11) * TAU;
  const radius = Math.sqrt(random(i + 29)) * 1.35;
  return {
    x: Math.cos(angle) * radius * 1.2,
    y: Math.sin(angle) * radius * 0.85,
    z: (random(i + 53) - 0.5) * 0.7,
  };
};

const signature = (): Point[] => {
  // Sample the site's own display face, so the signature keeps its serif shape.
  const plate = document.createElement("canvas");
  plate.width = 440;
  plate.height = 270;
  const context = plate.getContext("2d");
  if (!context) return Array.from({ length: COUNT }, (_, i) => scatter(i));
  context.font = '500 246px "Newsreader", Georgia, serif';
  context.textAlign = "center";
  context.textBaseline = "alphabetic";
  const metrics = context.measureText("ZN");
  const baseline =
    137 +
    (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2;
  context.fillText("ZN", 220, baseline);
  const pixels = context.getImageData(0, 0, 440, 270).data;
  const points: Point[] = [];
  for (let y = 15; y < 255; y += 2) {
    for (let x = 12; x < 428; x += 2) {
      if (pixels[(y * 440 + x) * 4 + 3] > 120) {
        points.push({ x: (x - 220) / 145, y: (y - 137) / 145, z: 0 });
      }
    }
  }
  return Array.from({ length: COUNT }, (_, i) => {
    const point = points[Math.floor(random(i + 41) * points.length)];
    return { ...point, z: (random(i + 31) - 0.5) * 0.05 };
  });
};

const initField = (root: HTMLElement) => {
  const canvas = root.querySelector<HTMLCanvasElement>("canvas");
  const ctx = canvas?.getContext("2d");
  const trigger = root.querySelector<HTMLButtonElement>(
    "[data-generate-trigger]",
  );
  if (!canvas || !ctx || !trigger) return;
  const hint = root.querySelector<HTMLElement>("[data-generate-hint]");
  const title = root.querySelector<HTMLElement>("[data-generate-title]");
  const description = root.querySelector<HTMLElement>(
    "[data-generate-description]",
  );
  const contexts = root.querySelectorAll<HTMLElement>(
    "[data-generate-context]",
  );
  const cycleLabel = root.querySelector<HTMLElement>("[data-generate-cycle]");
  const buttons = root.querySelectorAll<HTMLButtonElement>(
    "[data-generate-form]",
  );
  const reset = root.querySelector<HTMLButtonElement>("[data-generate-reset]");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const systemTheme = matchMedia("(prefers-color-scheme: dark)");
  let reduced = motion.matches;
  let phase: Phase = "idle";
  let frame = 0;
  let began = performance.now();
  let sceneAt = began;
  let raf = 0;
  let lastDraw = 0;
  let inView = false;
  let pausedAt: number | null = null;
  let width = 0;
  let height = 0;
  let colors: RGB[] = [];
  let accent: RGB = [0, 0, 0];
  let violet: RGB = [0, 0, 0];
  let textColor: RGB = [0, 0, 0];
  let mutedColor: RGB = [0, 0, 0];
  let background: RGB = [0, 0, 0];
  let pointer = { x: 0, y: 0, inside: false, strength: 0 };
  const particles: Particle[] = Array.from({ length: COUNT }, (_, i) => ({
    current: scatter(i),
    from: scatter(i),
    seed: random(i + 23),
    size: 0.55 + random(i + 19) * 0.9,
  }));
  const forms: Point[][] = [
    ...DIAGRAMS.map((scene) => sampleScene(scene, COUNT)),
    signature(),
  ];

  const readPalette = () => {
    const style = getComputedStyle(root);
    accent = rgb(style.getPropertyValue("--cyan"));
    violet = rgb(style.getPropertyValue("--violet"));
    textColor = rgb(style.getPropertyValue("--text"));
    mutedColor = rgb(style.getPropertyValue("--muted"));
    background = rgb(style.getPropertyValue("--bg"));
    colors = Array.from({ length: 32 }, (_, i) =>
      blend(accent, violet, i / 31),
    );
    // A little ink keeps the fine points legible in both themes.
    colors = colors.map((color) => blend(color, textColor, 0.12));
  };

  const update = () => {
    root.dataset.phase = phase;
    root.dataset.frame = FORMS[frame];
    trigger.disabled = false;
    trigger.setAttribute(
      "aria-label",
      phase === "idle"
        ? "Generate a particle form"
        : "Generate the next particle form",
    );
    if (hint) hint.hidden = phase !== "idle";
    if (title)
      title.textContent =
        phase === "idle" ? "Research, taking shape." : COPY[FORMS[frame]].title;
    if (description)
      description.textContent = reduced
        ? "Reduced motion. Choose a still form below."
        : phase === "idle"
          ? "Tap to explore my research themes."
          : phase === "gathering"
            ? "Bringing the theme into view…"
            : COPY[FORMS[frame]].description;
    buttons.forEach((button) => {
      button.disabled = false;
      button.setAttribute(
        "aria-pressed",
        String(
          phase !== "idle" && button.dataset.generateForm === FORMS[frame],
        ),
      );
    });
    contexts.forEach((context) => {
      context.hidden =
        phase === "idle" || context.dataset.generateContext !== FORMS[frame];
    });
    if (cycleLabel)
      cycleLabel.hidden = phase === "idle" || frame === SIGNATURE_INDEX;
    if (reset) reset.disabled = false;
  };

  const resize = () => {
    const box = canvas.getBoundingClientRect();
    width = box.width;
    height = box.height;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const draw = (now: number) => {
    if (width === 0 || height === 0 || colors.length === 0) return;
    ctx.clearRect(0, 0, width, height);
    const elapsed = reduced ? 0 : (now - sceneAt) / 1000;
    const progress = reduced ? 1 : clamp((now - began) / GATHER_MS);
    if (phase === "gathering" && progress === 1) {
      phase = "formed";
      update();
    }
    const scale = Math.min(
      width * (frame === SIGNATURE_INDEX ? 0.35 : 0.28),
      height * 0.38,
    );
    const cx = width / 2;
    const cy = height * 0.49;
    const isIdle = phase === "idle";
    const fog = ctx.createRadialGradient(cx, cy, 5, cx, cy, scale * 1.3);
    fog.addColorStop(0, ink(accent, isIdle ? 0.035 : 0.055));
    fog.addColorStop(0.65, ink(violet, isIdle ? 0.018 : 0.025));
    fog.addColorStop(1, ink(violet, 0));
    ctx.fillStyle = fog;
    ctx.fillRect(0, 0, width, height);
    pointer.strength = reduced
      ? 0
      : mix(pointer.strength, pointer.inside ? 1 : 0, 0.1);

    const positions: { x: number; y: number; depth: number; alpha: number }[] =
      [];
    for (let i = 0; i < COUNT; i++) {
      const particle = particles[i];
      let target: Point;
      if (isIdle) {
        const point = scatter(i);
        const angle = elapsed * (0.025 + particle.seed * 0.02);
        target = {
          x: point.x * Math.cos(angle) - point.y * Math.sin(angle),
          y: point.x * Math.sin(angle) + point.y * Math.cos(angle),
          z: point.z,
        };
      } else {
        target = forms[frame][i];
      }
      const t =
        phase === "gathering"
          ? smooth(clamp((progress - particle.seed * 0.22) / 0.78))
          : 1;
      const curl = reduced ? 0 : Math.sin(Math.PI * t) * 0.22;
      const angle = particle.seed * TAU + progress * 4;
      particle.current = {
        x: mix(particle.from.x, target.x, t) + Math.cos(angle) * curl,
        y: mix(particle.from.y, target.y, t) + Math.sin(angle) * curl,
        z: mix(particle.from.z, target.z, t),
      };
      const depth = 3.5 / (3.5 + particle.current.z);
      let x = cx + particle.current.x * scale * depth;
      let y = cy + particle.current.y * scale * depth;
      const dx = x - pointer.x;
      const dy = y - pointer.y;
      const distance = Math.hypot(dx, dy);
      const presence =
        (isIdle || frame === SIGNATURE_INDEX ? clamp(1 - distance / 72) : 0) *
        pointer.strength;
      if (distance > 0.1) {
        x += (dx / distance) * presence * 10;
        y += (dy / distance) * presence * 10;
      }
      const alpha = isIdle
        ? 0.12 + particle.seed * 0.22
        : clamp(0.36 + depth * 0.25 + particle.seed * 0.27);
      positions.push({ x, y, depth, alpha });
    }

    const scene = !isIdle ? DIAGRAMS[frame] : null;
    const reveal =
      phase === "gathering" ? smooth(clamp((progress - 0.5) / 0.5)) : 1;
    const projectPoint = (point: Point) => ({
      x: cx + point.x * scale,
      y: cy + point.y * scale,
    });
    if (scene) {
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = ink(accent, 0.21 * reveal);
      scene.paths.forEach((path) => {
        ctx.beginPath();
        path.points.forEach((point, i) => {
          const p = projectPoint(point);
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
        // Direction remains readable when animation is reduced or between pulses.
        if (path.flow) {
          const end = projectPoint(atPath(path.points, 1));
          const near = projectPoint(atPath(path.points, 0.95));
          const angle = Math.atan2(end.y - near.y, end.x - near.x);
          ctx.beginPath();
          ctx.moveTo(
            end.x - Math.cos(angle - 0.45) * 4,
            end.y - Math.sin(angle - 0.45) * 4,
          );
          ctx.lineTo(end.x, end.y);
          ctx.lineTo(
            end.x - Math.cos(angle + 0.45) * 4,
            end.y - Math.sin(angle + 0.45) * 4,
          );
          ctx.stroke();
        }
      });
    }

    for (let i = 0; i < COUNT; i++) {
      const point = positions[i];
      const particle = particles[i];
      const color = colors[Math.floor(particle.seed * 31)];
      const pulse =
        reduced || isIdle
          ? 1
          : 0.9 + 0.1 * Math.sin(elapsed * 1.3 + particle.seed * TAU);
      const size = particle.size * point.depth * (isIdle ? 0.8 : 1) * pulse;
      if (!isIdle && i % 13 === 0) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, size * 3.6, 0, TAU);
        ctx.fillStyle = ink(color, 0.045);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(point.x, point.y, size, 0, TAU);
      ctx.fillStyle = ink(color, point.alpha);
      ctx.fill();
    }
    if (scene) {
      const round = reduced
        ? 0
        : ((((elapsed - GATHER_MS / 1000) / 6.5) % 1) + 1) % 1;
      const stepLabel = reduced
        ? "Conceptual mechanism"
        : (scene.steps.find((step) => round < step.until)?.label ?? "");
      if (cycleLabel && cycleLabel.textContent !== stepLabel)
        cycleLabel.textContent = stepLabel;
      if (phase === "formed" && !reduced) {
        scene.paths.forEach((path) => {
          if (!path.flow || round < path.flow[0] || round > path.flow[1])
            return;
          const t = (round - path.flow[0]) / (path.flow[1] - path.flow[0]);
          for (let k = 0; k < 8; k++) {
            const u = t - k * 0.022;
            if (u < 0) continue;
            const point = projectPoint(atPath(path.points, u));
            ctx.beginPath();
            ctx.arc(point.x, point.y, k === 0 ? 2.3 : 1.2, 0, TAU);
            ctx.fillStyle = ink(accent, (1 - k / 8) * 0.95);
            ctx.fill();
          }
        });
      }
      // Sharp labels sit inside the particle diagram and never rotate away.
      const fontSize = clamp(width / 43, 9.5, 11);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      scene.labels.forEach((label) => {
        const point = projectPoint({ x: label.x, y: label.y, z: 0 });
        ctx.font = `${label.emphasis ? 500 : 400} ${label.emphasis ? fontSize : fontSize * 0.9}px "Geist Mono Variable", monospace`;
        const labelWidth = ctx.measureText(label.text).width;
        ctx.fillStyle = ink(background, 0.88 * reveal);
        ctx.fillRect(
          point.x - labelWidth / 2 - 2,
          point.y - fontSize * 0.6,
          labelWidth + 4,
          fontSize * 1.2,
        );
        ctx.fillStyle = ink(label.emphasis ? textColor : mutedColor, reveal);
        ctx.fillText(label.text, point.x, point.y);
      });
    }
  };

  const loop = (now: number) => {
    if (now - lastDraw >= 1000 / 30) {
      draw(now);
      lastDraw = now;
    }
    raf = requestAnimationFrame(loop);
  };
  const start = () => {
    cancelAnimationFrame(raf);
    const now = performance.now();
    if (!inView || document.hidden) {
      if (pausedAt === null) pausedAt = now;
      return;
    }
    if (pausedAt !== null) {
      began += now - pausedAt;
      sceneAt += now - pausedAt;
      pausedAt = null;
    }
    draw(now);
    if (!reduced) raf = requestAnimationFrame(loop);
  };
  const choose = (index: number) => {
    particles.forEach((particle) => {
      particle.from = { ...particle.current };
    });
    frame = index;
    phase = reduced ? "formed" : "gathering";
    began = sceneAt = performance.now();
    update();
    draw(began);
  };
  trigger.addEventListener("click", () =>
    choose(phase === "idle" ? 0 : (frame + 1) % FORMS.length),
  );
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const index = FORMS.indexOf(button.dataset.generateForm as Form);
      if (index >= 0) choose(index);
    });
  });
  reset?.addEventListener("click", () => {
    if (reduced) {
      choose(SIGNATURE_INDEX);
      return;
    }
    phase = "idle";
    began = sceneAt = performance.now();
    update();
    draw(began);
  });
  trigger.addEventListener("pointermove", (event) => {
    const box = canvas.getBoundingClientRect();
    pointer.x = event.clientX - box.left;
    pointer.y = event.clientY - box.top;
    pointer.inside = true;
  });
  trigger.addEventListener("pointerleave", () => {
    pointer.inside = false;
  });
  trigger.addEventListener("pointerup", (event) => {
    if (event.pointerType !== "mouse") pointer.inside = false;
  });

  readPalette();
  resize();
  const pin = new URLSearchParams(location.search).get("form");
  if (pin && FORMS.includes(pin as Form)) {
    frame = FORMS.indexOf(pin as Form);
    phase = "formed";
  } else if (reduced) {
    frame = SIGNATURE_INDEX;
    phase = "formed";
  }
  root.dataset.initialized = "true";
  update();
  draw(performance.now());
  new ResizeObserver(() => {
    resize();
    draw(performance.now());
  }).observe(canvas);
  new IntersectionObserver(
    ([entry]) => {
      inView = entry.isIntersecting;
      start();
    },
    { rootMargin: "60px" },
  ).observe(root);
  document.addEventListener("visibilitychange", start);
  const refreshPalette = () => {
    readPalette();
    draw(performance.now());
  };
  new MutationObserver(refreshPalette).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  systemTheme.addEventListener("change", refreshPalette);
  motion.addEventListener("change", () => {
    reduced = motion.matches;
    pointer.strength = 0;
    if (reduced) {
      frame = SIGNATURE_INDEX;
      phase = "formed";
    } else phase = "idle";
    began = sceneAt = performance.now();
    update();
    start();
  });
  document.fonts?.ready.then(() => {
    forms[SIGNATURE_INDEX] = signature();
    draw(performance.now());
  });
};

document
  .querySelectorAll<HTMLElement>("[data-generative-hero]")
  .forEach(initField);
