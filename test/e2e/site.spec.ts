import { expect, test } from "@playwright/test";

test("home leads with the name, title, and first-author research", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Zerun Niu" }),
  ).toBeVisible();
  await expect(page.getByText(/AI Research Engineer/).first()).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /BRAVE:/ }).first(),
  ).toBeVisible();
  await expect(page.getByText(/first author/i).first()).toBeVisible();
  await expect(
    page.getByRole("link", { name: /BRAVE:/ }).first(),
  ).toHaveAttribute("href", "/projects/brave");
});

test("primary navigation is in-page anchors", async ({ page }, testInfo) => {
  await page.goto("/");
  if (testInfo.project.name === "mobile") {
    await page.getByRole("button", { name: /menu/i }).click();
  }
  const research = page.getByRole("link", { name: "Research" });
  await expect(research).toHaveAttribute("href", "/#research");
  await research.click();
  await expect(page).toHaveURL(/#research$/);
  await expect(
    page.getByRole("heading", { name: /What I’m working on/ }),
  ).toBeVisible();
});

test("colour theme toggles and persists", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Switch to/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("Digital Zerun stays in its own section", async ({ page }) => {
  await page.goto("/#digital-zerun");
  await expect(
    page.getByRole("heading", { name: /Meet Digital Zerun/ }),
  ).toBeVisible();
  await expect(page.getByText(/an authorised AI clone of Zerun’s/i)).toBeVisible();
});

test("skills orb renders a canvas without blocking content", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#skills-orb-canvas")).toBeVisible();
  await expect(page.getByText("Focus areas")).toBeVisible();
});

test("reduced motion still reveals every section", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Zerun Niu" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Things I’ve built/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /My path through research and teaching/ }),
  ).toBeVisible();
});

test("BRAVE deep-dive page carries the write-up and the calibration demo", async ({
  page,
}) => {
  await page.goto("/projects/brave");
  await expect(
    page.getByRole("heading", { level: 1, name: /BRAVE:/ }),
  ).toBeVisible();
  await expect(page.getByText(/illusory evidence accumulation/i)).toBeVisible();
  await expect(page.getByText(/under review at TMLR/i)).toBeVisible();

  const readout = page.locator("#bc-sparsity-readout");
  const before = await readout.textContent();
  await page.locator("#bc-sparsity").fill("90");
  await expect(readout).not.toHaveText(before ?? "");
  await expect(page.locator("#bc-read")).toContainText("annotators/item");

  await page.getByRole("link", { name: /Back to Research/ }).click();
  await expect(page).toHaveURL(/#p-brave$/);
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
