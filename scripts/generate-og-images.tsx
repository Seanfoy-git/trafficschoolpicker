/**
 * Generates 1200×630 branded card PNGs:
 *   public/images/schools/<slug>.png  — per school (Product.image + review og:image)
 *   public/images/states/<slug>.png   — per state (state-page og:image)
 *
 * Static files (committed) — cheaper to serve/cache than a runtime route, and a
 * guaranteed 200. Re-run when schools, ratings, prices, or the state list change:
 *   npx tsx scripts/generate-og-images.tsx
 *
 * Rendering: next/og (satori) with its BUNDLED default font — keep text plain
 * ASCII (special glyphs like ★ trigger a dynamic Google-font fetch that fails
 * offline). Stars are drawn as SVG, not font characters.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { ImageResponse } from "next/og";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { STATE_LIST } from "../lib/state-utils";
import type { School } from "../lib/types";

// Package 5: card art carries NO burned-in rating and NO burned-in price. One image
// per school is reused across every state, so any number burned in is wrong somewhere
// and goes stale everywhere. Cards show name + "Online traffic school review" only.

const SHELL = {
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "space-between" as const,
  background: "linear-gradient(135deg, #085041 0%, #0a3d33 100%)",
  padding: "72px 84px",
  color: "white",
};

function Wordmark() {
  return (
    <div style={{ display: "flex", fontSize: 36, fontWeight: 600, letterSpacing: 1 }}>
      <span style={{ color: "white" }}>trafficschool</span>
      <span style={{ color: "#34d399" }}>picker</span>
    </div>
  );
}

function SchoolCard({ school }: { school: School }) {
  return (
    <div style={SHELL}>
      <Wordmark />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: 84, fontWeight: 700, lineHeight: 1.05 }}>{school.name}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ display: "flex", fontSize: 36, color: "#cbd5e1" }}>Online traffic school review</div>
      </div>
    </div>
  );
}

function StateCard({ name, year }: { name: string; year: number }) {
  return (
    <div style={SHELL}>
      <Wordmark />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: 40, fontWeight: 600, color: "#34d399", letterSpacing: 1 }}>
          BEST ONLINE TRAFFIC SCHOOLS
        </div>
        <div style={{ display: "flex", fontSize: 92, fontWeight: 700, lineHeight: 1.02, marginTop: 12 }}>{name}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", fontSize: 34, color: "#cbd5e1" }}>Online traffic school options compared</div>
        <div style={{ display: "flex", background: "#1D9E75", fontSize: 40, fontWeight: 700, padding: "14px 34px", borderRadius: 16 }}>
          {year}
        </div>
      </div>
    </div>
  );
}

async function render(node: React.ReactElement, path: string, label: string) {
  const img = new ImageResponse(node, { width: 1200, height: 630 });
  writeFileSync(path, Buffer.from(await img.arrayBuffer()));
  console.log(`wrote ${label}`);
}

async function main() {
  const { getAllSchools } = await import("../lib/notion");
  const schools = await getAllSchools();
  const year = 2026;

  const schoolsDir = join(process.cwd(), "public", "images", "schools");
  const statesDir = join(process.cwd(), "public", "images", "states");
  mkdirSync(schoolsDir, { recursive: true });
  mkdirSync(statesDir, { recursive: true });

  for (const school of schools) {
    await render(<SchoolCard school={school} />, join(schoolsDir, `${school.slug}.png`), `schools/${school.slug}.png`);
  }
  for (const s of STATE_LIST) {
    await render(<StateCard name={s.name} year={year} />, join(statesDir, `${s.slug}.png`), `states/${s.slug}.png`);
  }
  console.log(`Done — ${schools.length} school + ${STATE_LIST.length} state card images.`);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
