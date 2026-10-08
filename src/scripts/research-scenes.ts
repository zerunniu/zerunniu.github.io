/** Illustrative research themes, with related projects linked from the hero. */
export type Point = { x: number; y: number; z: number };
export type Path = {
  points: Point[];
  weight: number;
  flow?: [number, number];
};
export type Label = {
  x: number;
  y: number;
  text: string;
  emphasis?: boolean;
};
export type Scene = {
  paths: Path[];
  labels: Label[];
  steps: { until: number; label: string }[];
};
const TAU = Math.PI * 2;
const point = (x: number, y: number): Point => ({ x, y, z: 0 });

const circle = (x: number, y: number, radius: number, arc = TAU) =>
  Array.from({ length: 65 }, (_, i) => {
    const angle = -Math.PI / 2 + (i / 64) * arc;
    return point(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
  });
const box = (cx: number, cy: number, width: number, height: number) => {
  const r = Math.min(0.07, height / 3);
  const corners = [
    [cx + width / 2 - r, cy + height / 2 - r, 0],
    [cx - width / 2 + r, cy + height / 2 - r, Math.PI / 2],
    [cx - width / 2 + r, cy - height / 2 + r, Math.PI],
    [cx + width / 2 - r, cy - height / 2 + r, Math.PI * 1.5],
  ];
  const points = corners.flatMap(([x, y, start]) =>
    Array.from({ length: 9 }, (_, i) => {
      const a = start + ((i / 8) * Math.PI) / 2;
      return point(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }),
  );
  return [...points, points[0]];
};
const curve = (a: Point, b: Point, c: Point, d: Point) =>
  Array.from({ length: 65 }, (_, i) => {
    const t = i / 64;
    const s = 1 - t;
    return point(
      s ** 3 * a.x + 3 * s * s * t * b.x + 3 * s * t * t * c.x + t ** 3 * d.x,
      s ** 3 * a.y + 3 * s * s * t * b.y + 3 * s * t * t * c.y + t ** 3 * d.y,
    );
  });

// Resample by distance so long straight edges and short curved corners have
// the same particle density and a pulse moves at a steady speed.
const pathMetrics = new WeakMap<
  Point[],
  { lengths: number[]; total: number }
>();
export const atPath = (points: Point[], t: number): Point => {
  let metrics = pathMetrics.get(points);
  if (!metrics) {
    const lengths = points
      .slice(1)
      .map((p, i) => Math.hypot(p.x - points[i].x, p.y - points[i].y));
    metrics = { lengths, total: lengths.reduce((sum, n) => sum + n, 0) };
    pathMetrics.set(points, metrics);
  }
  const { lengths, total } = metrics;
  const distance = total * Math.max(0, Math.min(1, t));
  let walked = 0;
  for (let i = 0; i < lengths.length; i++) {
    if (walked + lengths[i] >= distance && lengths[i] > 0) {
      const u = (distance - walked) / lengths[i];
      return point(
        points[i].x + (points[i + 1].x - points[i].x) * u,
        points[i].y + (points[i + 1].y - points[i].y) * u,
      );
    }
    walked += lengths[i];
  }
  return points[points.length - 1];
};

export const reliableScene = (): Scene => {
  const paths: Path[] = [];
  const labels: Label[] = [
    { x: 0, y: -1.04, text: "noisy annotations" },
    { x: 0, y: 0.08, text: "label aggregation", emphasis: true },
    { x: 0, y: 0.72, text: "estimate", emphasis: true },
    { x: 0, y: 1.25, text: "uncertainty" },
  ];
  [-0.78, 0, 0.78].forEach((x, i) => {
    paths.push({ points: circle(x, -0.58, 0.16), weight: 0.8 });
    labels.push({ x, y: -0.58, text: ["A", "B", "A"][i], emphasis: true });
    paths.push({
      points: curve(
        point(x, -0.42),
        point(x, -0.28),
        point(x * 0.6, -0.25),
        point(x * 0.6, -0.11),
      ),
      weight: 0.65,
      flow: [0.02 + i * 0.035, 0.24 + i * 0.035],
    });
  });
  paths.push({ points: box(0, 0.08, 1.6, 0.38), weight: 1.9 });
  paths.push({ points: box(0, 0.72, 0.8, 0.32), weight: 1.2 });
  paths.push({
    points: [point(0, 0.27), point(0, 0.56)],
    weight: 0.5,
    flow: [0.42, 0.62],
  });
  paths.push({
    points: [point(0, 0.88), point(0, 1.05)],
    weight: 0.3,
    flow: [0.68, 0.83],
  });
  // An abstract uncertainty interval, with no claimed numerical result.
  paths.push({
    points: [point(-0.65, 1.05), point(0.65, 1.05)],
    weight: 1,
  });
  [-0.65, 0.65].forEach((x) =>
    paths.push({ points: [point(x, 1), point(x, 1.1)], weight: 0.15 }),
  );
  return {
    paths,
    labels,
    steps: [
      { until: 0.36, label: "Combine annotations" },
      { until: 0.65, label: "Estimate the label" },
      { until: 1, label: "Represent uncertainty" },
    ],
  };
};

export const fedeqScene = (): Scene => {
  const paths: Path[] = [{ points: box(0, -0.69, 1.1, 0.34), weight: 1.6 }];
  const labels: Label[] = [
    { x: 0, y: -0.69, text: "shared θ", emphasis: true },
    { x: 0, y: -1.06, text: "ADMM consensus" },
    { x: 0, y: 1.1, text: "non-IID local data" },
    { x: 0, y: 1.3, text: "local heads stay local" },
  ];
  [-0.97, 0, 0.97].forEach((x, i) => {
    const width = [0.48, 0.58, 0.68][i];
    const height = [0.58, 0.62, 0.66][i];
    const top = 0.4 - height / 2;
    paths.push({ points: box(x, 0.4, width, height), weight: 1.1 + i * 0.15 });
    labels.push({ x, y: 0.29, text: "z*", emphasis: true });
    labels.push({ x, y: 0.56, text: `w${i + 1}`, emphasis: true });
    labels.push({ x: x + 0.21, y: -0.12, text: `θ${i + 1}` });
    labels.push({ x, y: 0.83, text: `Edge ${i + 1}` });
    paths.push({
      points: circle(x, 0.29, 0.12, TAU * 0.82),
      weight: 0.6,
      flow: [0.37, 0.52],
    });
    paths.push({ points: box(x, 0.56, 0.34, 0.12), weight: 0.3 });
    paths.push({
      points: [point(x, 0.41), point(x, 0.5)],
      weight: 0.15,
      flow: [0.54, 0.6],
    });
    [-0.11, 0, 0.11].forEach((dx, j) => {
      paths.push({
        points: circle(x + dx, 0.98, 0.018 + ((i + j) % 3) * 0.006),
        weight: 0.1,
      });
    });
    paths.push({
      points: curve(
        point(x * 0.18 - 0.045, -0.52),
        point(x * 0.7 - 0.08, -0.4),
        point(x - 0.12, -0.1),
        point(x - 0.075, top),
      ),
      weight: 1,
      flow: [0.02 + i * 0.035, 0.25 + i * 0.035],
    });
    paths.push({
      points: curve(
        point(x + 0.075, top),
        point(x + 0.15, -0.1),
        point(x * 0.7 + 0.1, -0.4),
        point(x * 0.18 + 0.045, -0.52),
      ),
      weight: 1,
      flow: [0.65 + i * 0.035, 0.9 + i * 0.035],
    });
  });
  return {
    paths,
    labels,
    steps: [
      { until: 0.34, label: "Distribute shared θ" },
      { until: 0.52, label: "RCAA: solve z* locally" },
      { until: 0.65, label: "Local training + dual update" },
      { until: 1, label: "Upload θi → average" },
    ],
  };
};

/**
 * Conceptual transmission path from WaSeCom, arXiv:2506.03167v2, §III-A/B.
 * WDRO is a training objective for semantic and channel uncertainty, not an
 * extra inference-time denoising stage or a promise of exact reconstruction.
 */
export const wasecomScene = (): Scene => {
  const paths: Path[] = [];
  const labels: Label[] = [
    { x: -0.98, y: -1.3, text: "text / image" },
    { x: 0.98, y: -1.3, text: "reconstruction" },
    { x: -0.98, y: -1, text: "x", emphasis: true },
    { x: 0.98, y: -1, text: "x̂", emphasis: true },
    { x: 0, y: -0.04, text: "wireless" },
    { x: 0, y: 0.63, text: "channel noise" },
    { x: 0, y: 1.05, text: "semantic shifts + channel noise" },
    { x: 0, y: 1.3, text: "Wasserstein DRO training", emphasis: true },
  ];
  [-0.98, 0.98].forEach((x, i) => {
    const encode = i === 0;
    paths.push({ points: box(x, -1, 0.56, 0.22), weight: 0.7 });
    [-0.51, 0.25].forEach((y, j) => {
      paths.push({ points: box(x, y, 0.76, 0.38), weight: 1.3 });
      labels.push({ x, y: y - 0.075, text: j === 0 ? "semantic" : "channel" });
      labels.push({
        x,
        y: y + 0.075,
        text: encode ? "encoder" : "decoder",
        emphasis: true,
      });
    });
    paths.push({
      points: encode
        ? [point(x, -0.89), point(x, -0.7)]
        : [point(x, -0.7), point(x, -0.89)],
      weight: 0.35,
      flow: encode ? [0.02, 0.12] : [0.85, 0.97],
    });
    paths.push({
      points: encode
        ? [point(x, -0.32), point(x, 0.06)]
        : [point(x, 0.06), point(x, -0.32)],
      weight: 0.6,
      flow: encode ? [0.15, 0.32] : [0.67, 0.82],
    });
  });
  paths.push({
    points: Array.from({ length: 97 }, (_, i) => {
      const t = i / 96;
      return point(
        -0.6 + t * 1.2,
        0.25 + Math.sin(t * TAU * 2) * Math.sin(t * Math.PI) * 0.13,
      );
    }),
    weight: 2.1,
    flow: [0.34, 0.65],
  });
  return {
    paths,
    labels,
    steps: [
      { until: 0.33, label: "Encode semantic features" },
      { until: 0.66, label: "Transmit through a noisy channel" },
      { until: 0.83, label: "Decode the representation" },
      { until: 1, label: "Reconstruct meaning" },
    ],
  };
};

export const sampleScene = (scene: Scene, count: number): Point[] => {
  const total = scene.paths.reduce((sum, path) => sum + path.weight, 0);
  const points: Point[] = [];
  let weight = 0;
  for (const path of scene.paths) {
    weight += path.weight;
    const end = Math.round((weight / total) * count);
    const size = end - points.length;
    for (let j = 0; j < size; j++)
      points.push(atPath(path.points, j / Math.max(1, size - 1)));
  }
  return points;
};
