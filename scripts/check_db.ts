import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const CONVEX_URL = process.env.VITE_CONVEX_URL;
if (!CONVEX_URL) {
  throw new Error(
    "Missing VITE_CONVEX_URL. Configure the Convex deployment before running this script.",
  );
}
const client = new ConvexHttpClient(CONVEX_URL);

async function main() {
  const studies = await client.query(api.caseStudies.list, {});
  console.log(`Total studies in Convex: ${studies.length}`);
  studies.forEach((s: any) => {
    const sampleCount = s.implementation?.samples?.length ?? (s.implementation?.code ? 1 : 0);
    console.log(
      `[${s.index}] ${s.slug} - tier: ${s.tier} (rcCost: ${s.rcCost}) [samples: ${sampleCount}]`,
    );
  });
}

main().catch(console.error);
