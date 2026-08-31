import { expect, test } from "@playwright/test";

async function waitForIsland(
  page: import("@playwright/test").Page,
  component: string,
) {
  await expect(
    page.locator(`astro-island[component-url*="${component}"]`),
  ).not.toHaveAttribute("ssr", "", { timeout: 15_000 });
}

test("home explains identity and research without waiting for 3D", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Reliable AI/ }),
  ).toBeVisible();
  await expect(
    page.getByText("MPhil in Computer Science · USyd"),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /BRAVE: Block-wise/ }).first(),
  ).toBeVisible();
  await expect(page.getByText(/first author/).first()).toBeVisible();
});

test("command menu is keyboard accessible", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press(
    process.platform === "darwin" ? "Meta+K" : "Control+K",
  );
  const dialog = page.getByRole("dialog", { name: "Site navigation" });
  await expect(dialog).toBeVisible();
  await dialog.getByPlaceholder(/Search research/).fill("BRAVE");
  await expect(
    dialog.getByRole("link", { name: "Open BRAVE First-author work" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Site navigation" }),
  ).toBeHidden();
});

test("light theme persists", async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem("zerun-theme"))
      localStorage.setItem("zerun-theme", "dark");
  });
  await page.goto("/");
  await page.getByRole("button", { name: /Switch to light theme/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("BRAVE page states contribution, metrics, and review status", async ({
  page,
}) => {
  await page.goto("/projects/brave");
  await expect(
    page.getByText(/Zerun Niu — first author/).first(),
  ).toBeVisible();
  await expect(page.getByText("5/14").first()).toBeVisible();
  await expect(page.getByText("9/14").first()).toBeVisible();
  await expect(page.getByText(/under review at TMLR/i)).toBeVisible();
  await waitForIsland(page, "BraveMechanism");
  await page.getByRole("button", { name: "Uncontrolled loop" }).click();
  await expect(page.getByText(/recycles its own posterior/)).toBeVisible();
});

test("reduced motion uses the efficient 2D lab", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByText("Efficient 2D lab")).toBeVisible();
  await expect(page.locator(".static-orb")).toBeVisible();
});

test("desktop 3D lab loads only after explicit activation", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  // GitHub-hosted runners may report only two CPU cores even though Chromium
  // can render the software WebGL path. Model a capable desktop explicitly so
  // this test exercises the opt-in 3D branch instead of the intended 2D
  // low-performance fallback.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "hardwareConcurrency", {
      configurable: true,
      get: () => 8,
    });
  });
  await page.goto("/");
  const launch = page.getByRole("button", { name: "Launch 3D lab" });
  await expect(launch).toBeVisible();
  await launch.click();
  await expect(page.getByText("Immersive lab online")).toBeVisible();
  await expect(page.locator(".lab-stage canvas")).toBeVisible();
});

test("no WebGL falls back without losing project access", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      type: string,
      ...args: unknown[]
    ) {
      if (type === "webgl" || type === "webgl2") return null;
      return original.call(this, type as "2d", ...(args as [])) as never;
    };
  });
  await page.goto("/");
  await expect(page.getByText("Efficient 2D lab")).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Open research case/ }),
  ).toBeVisible();
});

test("mobile renders primary content without horizontal overflow", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile");
  await page.goto("/");
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
  await expect(
    page.getByRole("heading", { name: /Meet Digital Zerun/ }),
  ).toBeVisible();
});
