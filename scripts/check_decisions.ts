import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const client = new ConvexHttpClient(process.env.VITE_CONVEX_URL!);

async function main() {
  const studies = (await client.query(api.caseStudies.getAllInternal as any, {})) as any[];
  for (let i = 12; i <= 21; i++) {
    const s = studies.find((c: any) => Number(c.index) === i);
    if (s) {
      console.log(`\n=== [${s.index}] ${s.slug} ===`);
      console.log("decisions:", JSON.stringify(s.decisions, null, 2));
      console.log("tradeOffs:", JSON.stringify(s.tradeOffs, null, 2));
    }
  }
}

main().catch(console.error);
