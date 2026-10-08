import { expect, test } from "@playwright/test";

const home = "/";

test("each tap gathers the next particle form", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(home);
  const hero = page.locator("[data-generative-hero]");
  const stage = page.locator("[data-generate-trigger]");
  await expect(hero).toHaveAttribute("data-phase", "idle");
  await expect(page.locator("[data-generate-hint]")).toBeVisible();
  for (const form of [
    "reasoning",
    "connections",
    "communication",
    "signature",
    "reasoning",
  ]) {
    await stage.click();
    await expect(hero).toHaveAttribute("data-frame", form);
    await expect(hero).toHaveAttribute("data-phase", "formed");
  }
  await page.getByRole("button", { name: "Scatter the particles" }).click();
  await expect(hero).toHaveAttribute("data-phase", "idle");
  expect(errors).toEqual([]);
});

test("individual frames, keyboard activation, and reset work", async ({
  page,
}) => {
  await page.goto(home);
  const hero = page.locator("[data-generative-hero]");
  const stage = page.locator("[data-generate-trigger]");
  await expect(stage).toBeEnabled();
  await stage.focus();
  await stage.press("Enter");
  await expect(hero).toHaveAttribute("data-phase", "formed");
  await stage.press("Space");
  await expect(hero).toHaveAttribute("data-phase", "gathering");
  const signature = page.getByRole("button", {
    name: "Signature",
    exact: true,
  });
  await signature.click();
  await expect(hero).toHaveAttribute("data-frame", "signature");
  await expect(signature).toHaveAttribute("aria-pressed", "true");
  await expect(hero).toHaveAttribute("data-phase", "formed");
  await expect(page.locator("[data-generate-title]")).toHaveText("ZN");
  await page.getByRole("button", { name: "Scatter the particles" }).click();
  await expect(hero).toHaveAttribute("data-phase", "idle");
  await expect(signature).toHaveAttribute("aria-pressed", "false");
});

test("focus areas can be opened below research without overflow", async ({
  page,
}) => {
  await page.goto(home);
  const section = page.getByRole("region", {
    name: "Focus areas",
    exact: true,
  });
  await expect(section.locator("details")).not.toHaveAttribute("open");
  await expect(page.locator("#skills-orb-canvas")).not.toBeVisible();
  await section.locator("summary").click();
  await expect(page.locator("#skills-orb-canvas")).toBeVisible();
  const size = await page
    .locator("#skills-orb-canvas")
    .evaluate((canvas: HTMLCanvasElement) => [canvas.width, canvas.height]);
  expect(size[0]).toBeGreaterThan(100);
  expect(size[1]).toBeGreaterThan(100);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    ),
  ).toBeLessThanOrEqual(1);
});

test("reduced motion shows still artwork and allows choosing another frame", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(home);
  const hero = page.locator("[data-generative-hero]");
  await expect(hero).toHaveAttribute("data-frame", "signature");
  await expect(hero).toHaveAttribute("data-phase", "formed");
  await expect(
    page.getByText("Reduced motion. Choose a still form below."),
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const canvas = hero.locator("canvas");
  const before = await canvas.evaluate((el: HTMLCanvasElement) =>
    el.toDataURL(),
  );
  await page.waitForTimeout(150);
  expect(await canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL())).toBe(
    before,
  );
  await page.getByRole("button", { name: "Reliable AI", exact: true }).click();
  await expect(hero).toHaveAttribute("data-frame", "reasoning");
  await expect(hero).toHaveAttribute("data-phase", "formed");
  await page
    .getByRole("button", { name: "Semantic Communication", exact: true })
    .click();
  await expect(hero).toHaveAttribute("data-frame", "communication");
  await expect(hero).toHaveAttribute("data-phase", "formed");
  const communication = await canvas.evaluate((el: HTMLCanvasElement) =>
    el.toDataURL(),
  );
  await page.waitForTimeout(150);
  expect(await canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL())).toBe(
    communication,
  );
  await page.getByRole("button", { name: "Scatter the particles" }).click();
  await expect(hero).toHaveAttribute("data-frame", "signature");
  await expect(page.locator("[data-generate-cycle]")).not.toBeVisible();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(hero).toHaveAttribute("data-phase", "idle");
});

test("research fields keep links to the actual project write-ups", async ({
  page,
}) => {
  await page.goto(`${home}?form=communication`);
  const communication = page.getByRole("button", {
    name: "Semantic Communication",
    exact: true,
  });
  await expect(communication).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-generate-title]")).toHaveText(
    "Semantic Communication",
  );
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    ),
  ).toBeLessThanOrEqual(1);
  await page.getByRole("button", { name: "Reliable AI", exact: true }).click();
  await expect(page.locator("[data-generate-title]")).toHaveText("Reliable AI");
  await expect(page.locator("[data-generate-description]")).toHaveText(
    "Label aggregation · uncertainty",
  );
  await expect(
    page.getByRole("link", { name: "Explore BRAVE ↗", exact: true }),
  ).toHaveAttribute("href", "/projects/brave");
  await expect(
    page.getByRole("link", { name: "Explore FeDEQ ↗", exact: true }),
  ).not.toBeVisible();
  await page.getByRole("button", { name: "Edge AI", exact: true }).click();
  await expect(page.locator("[data-generate-title]")).toHaveText("Edge AI");
  await expect(page.locator("[data-generate-description]")).toHaveText(
    "Shared representation · local heads",
  );
  await expect(
    page.getByRole("link", { name: "Explore FeDEQ ↗", exact: true }),
  ).toHaveAttribute("href", "/#p-fedeq");
  await expect(
    page.getByRole("link", { name: "Explore BRAVE ↗", exact: true }),
  ).not.toBeVisible();
  await communication.click();
  await expect(page.locator("[data-generate-description]")).toHaveText(
    "Meaning over bits · robust transmission",
  );
  const project = page.getByRole("link", {
    name: "Explore WaSeCom ↗",
    exact: true,
  });
  await expect(project).toHaveAttribute("href", "/#p-wasecom");
  await expect(
    page.getByRole("link", { name: "Explore FeDEQ ↗", exact: true }),
  ).not.toBeVisible();
  await project.click();
  await expect(page).toHaveURL(/\/#p-wasecom$/);
  await expect(page.locator("#p-wasecom")).toBeVisible();
});

test("home keeps its static fallback and preview alone is marked noindex", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(home);
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  await expect(
    page.getByRole("complementary", { name: "Homepage preview" }),
  ).toHaveCount(0);
  await expect(page.locator(".generative-hero__fallback")).toBeVisible();
  await expect(page.locator(".generative-hero__fallback")).toHaveText("ZN");
  await page.goto("/demo/generate/");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex, nofollow",
  );
  await expect(page.locator(".generative-hero__fallback")).toBeVisible();
  await expect(page.locator(".generative-hero__fallback")).toHaveText("ZN");
  await expect(
    page.getByRole("heading", { name: "Zerun Niu", exact: true }),
  ).toBeVisible();
  await context.close();
});
