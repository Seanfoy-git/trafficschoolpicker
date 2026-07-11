import { config } from "dotenv"; config({ path: ".env.local" });
import { makeNotionClient } from "./lib/notion-client";
const notion = makeNotionClient();
const APPLY = process.argv.includes("--apply");
/* eslint-disable @typescript-eslint/no-explicit-any */
function T(p:any){ if(!p)return""; if(p.type==="title")return p.title.map((t:any)=>t.plain_text).join(""); if(p.type==="rich_text")return p.rich_text.map((t:any)=>t.plain_text).join(""); if(p.type==="select")return p.select?.name??""; return ""; }
async function all(db:string){ let c:string|undefined; const o:any[]=[]; do{ const r:any=await notion.databases.query({database_id:db,start_cursor:c,page_size:100}); o.push(...r.results); c=r.has_more?r.next_cursor:undefined;}while(c); return o;}
async function main(){
  const schools=await all(process.env.NOTION_SCHOOLS_DB!);
  const ace=schools.find(s=>T(s.properties["School Name"])==="Aceable" && T(s.properties["Status"])==="Active" && s.properties["Show On Site"]?.checkbox);
  const id2name=new Map(schools.map(s=>[s.id,T(s.properties["School Name"])]));
  const pricing=await all(process.env.NOTION_PRICING_DB!);
  const prow=(st:string)=>pricing.find(r=>id2name.get((r.properties["School"]?.relation??[])[0]?.id)==="Aceable" && (r.properties["State Code"]?.rich_text?.[0]?.plain_text)===st);
  // variants DB (priceOverride is TOP of the render waterfall)
  let variants:any[]=[]; try{ variants=await all(process.env.NOTION_SCHOOL_VARIANTS_DB!);}catch{}
  const vrow=(st:string)=>variants.find(v=>{ const nm=T(v.properties["School Name"])||T(v.properties["School"]); const sc=T(v.properties["State Code"])||T(v.properties["State"]); return (nm.includes("ceable")|| id2name.get((v.properties["School"]?.relation??[])[0]?.id)==="Aceable") && sc===st; });

  console.log("=== Aceable card-facing layers (top→bottom precedence) ===");
  for(const st of ["CA","TX","FL"]){
    const col=ace?.properties[`Price ${st}`]?.number ?? null;
    const pr=prow(st); const pp=pr?.properties["Price"]?.number??null; const app=pr?.properties["Approved"]?.checkbox; const stt=T(pr?.properties["Price Scrape Status"]);
    const v=vrow(st); const vo=v?.properties["Price Override"]?.number ?? null;
    const effective = vo ?? col ?? (app? pp: null); // variantOverride → schoolsCol → approved pricing
    console.log(`  ${st}: variantOverride=${vo ?? "—"} | SchoolsCol=${col ?? "—"} | Pricing=${pp ?? "—"}(appr:${app},${stt}) → CARD≈${effective ?? "generic"}`);
  }

  // Apply aceable-FL $34.95 to Pricing (guarded: assert prior null)
  const fl=prow("FL");
  console.log("\n=== aceable-FL apply ===");
  if(!fl){ console.log("  FL pricing row not found"); return; }
  const cur=fl.properties["Price"]?.number ?? null;
  const flCol=ace?.properties["Price FL"]?.number ?? null;
  console.log(`  current Pricing FL=${cur} (expect null); Schools col FL=${flCol ?? "—"} ${flCol!==null?"⚠ MASKED":"(unmasked → reaches card)"}`);
  if(cur!==null){ console.log("  SKIP — prior not null (drift)"); return; }
  if(APPLY){
    await notion.pages.update({page_id:fl.id, properties:{ Price:{number:34.95}, Approved:{checkbox:true}, "Price Scrape Status":{select:{name:"OK"}}, "Last Scraped":{date:{start:new Date().toISOString().split("T")[0]}} }});
    const back:any=await notion.pages.retrieve({page_id:fl.id});
    if(back.properties["Price"]?.number!==34.95 || back.properties["Approved"]?.checkbox!==true) throw new Error("verify failed");
    console.log("  WROTE FL=$34.95 Approved=true OK — verified ✅");
  } else console.log("  would write FL=$34.95 (run with --apply)");
}
main().catch(e=>{console.error(e);process.exit(1);});
