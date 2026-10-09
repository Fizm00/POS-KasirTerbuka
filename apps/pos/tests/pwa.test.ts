import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import htmlContent from "../index.html?raw";
import viteConfig from "../vite.config.ts?raw";

describe("PWA & Offline Configuration", () => {
  it("verifies index.html has offline meta tags and no external CDN fonts or scripts", () => {
    // Must have lang="id"
    expect(htmlContent).toContain('lang="id"');

    // Must have theme-color #1F6F5C matching DESIGN.md tokens
    expect(htmlContent).toContain('name="theme-color" content="#1F6F5C"');

    // Must have apple-touch-icon
    expect(htmlContent).toContain('rel="apple-touch-icon"');

    // Must have no external CDN scripts or stylesheet links
    expect(htmlContent).not.toMatch(/https?:\/\/fonts\.googleapis\.com/i);
    expect(htmlContent).not.toMatch(/https?:\/\/cdn\./i);
    expect(htmlContent).not.toMatch(/https?:\/\/unpkg\.com/i);
    expect(htmlContent).not.toMatch(/https?:\/\/cdnjs\./i);
  });

  it("verifies vite.config.ts contains PWA manifest matching AGENTS.md and DESIGN.md", () => {
    // VitePWA plugin configured
    expect(viteConfig).toContain("VitePWA");
    expect(viteConfig).toContain('"Kasir Terbuka"');
    expect(viteConfig).toContain('"#1F6F5C"');
    expect(viteConfig).toContain('"#F7F6F2"');
    expect(viteConfig).toContain('"standalone"');
    expect(viteConfig).toContain('"landscape"');
    expect(viteConfig).toContain('"/icons/icon-192.svg"');
    expect(viteConfig).toContain('"/icons/icon-512.svg"');
    expect(viteConfig).toContain('"maskable"');
  });

  it("verifies icon and screenshot assets exist in public folder", () => {
    const publicDir = path.resolve(process.cwd(), "public");
    expect(fs.existsSync(path.join(publicDir, "favicon.svg"))).toBe(true);
    expect(fs.existsSync(path.join(publicDir, "icons/icon-192.svg"))).toBe(true);
    expect(fs.existsSync(path.join(publicDir, "icons/icon-512.svg"))).toBe(true);
    expect(fs.existsSync(path.join(publicDir, "screenshot-cashier.svg"))).toBe(true);
  });

  it("verifies Plus Jakarta Sans font is imported locally with no remote network calls", () => {
    const cssPath = path.resolve(process.cwd(), "src/index.css");
    const cssContent = fs.readFileSync(cssPath, "utf-8");
    expect(cssContent).toContain("@fontsource/plus-jakarta-sans");
    expect(cssContent).not.toMatch(/@import\s+url\(['"]https?:/);
  });
});
