// Axe check for the six P9 rules at 1280px and 320px, plus page-level horizontal
// overflow. Usage: node scripts/check-axe-p9.cjs <baseUrl> /path1 /path2 ...
const { chromium } = require("playwright");
const fs = require("fs");
const AXE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const RULES = ["color-contrast", "select-name", "heading-order", "landmark-no-duplicate-main", "link-in-text-block", "empty-table-header"];
(async () => {
  const [base, ...paths] = process.argv.slice(2);
  const b = await chromium.launch();
  let total = 0, overflow = 0;
  for (const w of [1280, 320]) {
    const p = await b.newPage({ viewport: { width: w, height: 900 } });
    for (const path of paths) {
      await p.goto(base + path, { waitUntil: "networkidle" });
      await p.addScriptTag({ content: AXE });
      const v = await p.evaluate(async (rules) => (await axe.run(document, { runOnly: { type: "rule", values: rules } })).violations.map((x) => ({ id: x.id, n: x.nodes.length })), RULES);
      const sw = await p.evaluate(() => document.documentElement.scrollWidth);
      total += v.reduce((a, x) => a + x.n, 0);
      if (sw > w) overflow++;
      console.log(`${w}px ${path}: ${v.length ? JSON.stringify(v) : "clean"} | scrollWidth ${sw}`);
    }
  }
  console.log(`TOTAL violation nodes: ${total}; pages wider than viewport: ${overflow}`);
  await b.close();
  process.exit(total || overflow ? 1 : 0);
})();
