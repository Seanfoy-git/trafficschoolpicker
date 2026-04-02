import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const CLICKS_FILE = path.join(process.cwd(), "data", "clicks.json");

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const click = {
      school: body.school,
      state: body.state,
      source: body.source,
      timestamp: body.timestamp || new Date().toISOString(),
    };

    // Ensure data directory exists
    const dir = path.dirname(CLICKS_FILE);
    await fs.mkdir(dir, { recursive: true });

    // Read existing clicks
    let clicks: unknown[] = [];
    try {
      const data = await fs.readFile(CLICKS_FILE, "utf-8");
      clicks = JSON.parse(data);
    } catch {
      // File doesn't exist yet
    }

    clicks.push(click);

    // Keep only last 10000 clicks
    if (clicks.length > 10000) {
      clicks = clicks.slice(-10000);
    }

    await fs.writeFile(CLICKS_FILE, JSON.stringify(clicks, null, 2));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
