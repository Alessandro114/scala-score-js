#!/usr/bin/env node
import { ScalaScore } from "./index.js";

const args = process.argv.slice(2);
const command = args[0];

const apiKey = process.env.SCALA_API_KEY || "demo";
const score = new ScalaScore(apiKey);

function usage() {
  console.log(`
  scala-score CLI — Search 244M+ companies worldwide

  Usage:
    npx scala-score search <query> [--country XX] [--limit N]
    npx scala-score lookup <id-or-vat>
    npx scala-score stats
    npx scala-score countries

  Environment:
    SCALA_API_KEY   Your API key (get one at get-scala.com/score)

  Examples:
    npx scala-score search "Ferrero" --country IT
    npx scala-score search "renewable energy" --country DE --limit 20
    npx scala-score lookup IT02727330014
    npx scala-score stats
  `);
}

function parseFlags(args: string[]): Record<string, string> {
  const flags: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--") && i + 1 < args.length) {
      flags[args[i].slice(2)] = args[i + 1];
      i++;
    }
  }
  return flags;
}

function formatTable(rows: Record<string, unknown>[], keys: string[]) {
  if (!rows.length) return console.log("  No results.");
  const widths = keys.map(k =>
    Math.max(k.length, ...rows.map(r => String(r[k] ?? "").length))
  );
  const header = keys.map((k, i) => k.padEnd(widths[i])).join(" | ");
  console.log(`  ${header}`);
  console.log(`  ${widths.map(w => "-".repeat(w)).join("-+-")}`);
  rows.forEach(r => {
    const line = keys.map((k, i) => String(r[k] ?? "").padEnd(widths[i])).join(" | ");
    console.log(`  ${line}`);
  });
}

async function main() {
  if (!command || command === "--help" || command === "-h") return usage();

  try {
    if (command === "search") {
      const query = args.slice(1).filter(a => !a.startsWith("--")).join(" ");
      if (!query) { console.error("  Error: provide a search query"); return; }
      const flags = parseFlags(args.slice(1));
      const result = await score.search(query, {
        country: flags.country,
        limit: flags.limit ? parseInt(flags.limit) : 10,
      });
      console.log(`\n  Found ${result.total} companies (showing ${result.companies.length}):\n`);
      formatTable(result.companies, ["name", "country", "city", "employees", "revenue", "status"]);
      console.log(`\n  Credits used: ${result.credits_used}`);
    }
    else if (command === "lookup") {
      const id = args[1];
      if (!id) { console.error("  Error: provide a company ID or VAT"); return; }
      const company = await score.lookup(id);
      console.log(`\n  Company Details:\n`);
      Object.entries(company).forEach(([k, v]) => {
        if (v !== null && v !== undefined && v !== "") console.log(`  ${k}: ${v}`);
      });
    }
    else if (command === "stats") {
      const stats = await score.stats();
      console.log(`\n  S.C.A.L.A. Score Database Stats:`);
      console.log(`  Total companies: ${stats.total_companies?.toLocaleString()}`);
      console.log(`  Countries: ${stats.countries}`);
      console.log(`  Last updated: ${stats.last_updated}\n`);
    }
    else if (command === "countries") {
      const countries = await score.countries();
      console.log(`\n  Available countries:\n`);
      formatTable(countries, ["country_code", "country_name", "company_count"]);
    }
    else {
      console.error(`  Unknown command: ${command}`);
      usage();
    }
  } catch (err) {
    console.error(`  Error: ${err instanceof Error ? err.message : err}`);
  }
}

main();
