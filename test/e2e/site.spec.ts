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
    page.getByRole("heading", { name: /Systems built to answer/ }),
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
  await expect(page.getByText(/AI representation/i).first()).toBeVisible();
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
    page.getByRole("heading", { name: /Evidence, status, provenance/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Research practice/ }),
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
