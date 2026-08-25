# S.C.A.L.A. Score — JavaScript/TypeScript SDK

[![CI](https://github.com/Alessandro114/scala-score-js/actions/workflows/ci.yml/badge.svg)](https://github.com/Alessandro114/scala-score-js/actions/workflows/ci.yml) [![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)](https://github.com/Alessandro114/scala-score-js/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/scala-score)](https://www.npmjs.com/package/scala-score)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Companies](https://img.shields.io/badge/companies-244M%2B-green)](https://get-scala.com/score)

Search **244M+ companies** across **40+ countries** from government registries. Zero scraping, just official public data normalized into a single API.

## Install

```bash
npm install scala-score
```

## Quick Start

```typescript
import ScalaScore from "scala-score";

const score = new ScalaScore("your-api-key");

// Search companies
const results = await score.search("restaurant", { country: "DE", nace: "56.10", limit: 20 });
console.log(`Found ${results.total} companies`);

// Lookup by ID or VAT
const company = await score.lookup("IT02727330014");
console.log(company.name, company.health_score);

// Generate report
const report = await score.report("IT02727330014", "basic");

// Check credits
const credits = await score.credits();
console.log(`${credits.credits_remaining} credits left`);
```

## API Methods

| Method | Description | Credits |
|--------|-------------|---------|
| `search(query, options?)` | Search by name/VAT/keyword with country, NACE, status filters | 1 |
| `lookup(companyId)` | Full company profile by ID or VAT | 1 |
| `report(companyId, type?)` | Generate health report (basic/pro/enterprise) | 5/10/20 |
| `credits()` | Check remaining API credits | 0 |
| `stats()` | Database statistics (total companies, countries) | 0 |
| `countries()` | List countries with company counts | 0 |

## Search Options

```typescript
const results = await score.search("ferrero", {
  country: "IT",       // ISO 2-letter country code
  nace: "10.82",       // NACE industry code
  status: "active",    // "active" | "inactive"
  limit: 25,           // max results (default: 10)
});
```

## Company Fields

Each company includes (when available): `name`, `country`, `vat_number`, `address`, `city`, `postal_code`, `nace_code`, `nace_description`, `legal_form`, `status`, `revenue`, `employees`, `health_score`, `founded`, `website`, `phone`, `email`.

## Get API Key

1. Sign up at [app.get-scala.com](https://app.get-scala.com)
2. Go to **Score > API**
3. Generate your key

## Pricing

| Plan | Price | Lookups/mo |
|------|-------|-----------|
| Starter | €19/mo | 500 |
| Growth | €49/mo | 5,000 |
| Enterprise | €149/mo | 50,000 |

Compare: Dun & Bradstreet charges €2-5 per lookup. ZoomInfo starts at $15K/year.

## Links

- [Python SDK](https://github.com/Alessandro114/scala-score-python)
- [MCP Server](https://github.com/Alessandro114/scala-mcp-server) — AI agents search companies
- [n8n node](https://github.com/Alessandro114/n8n-nodes-scala) — Workflow automation
- [S.C.A.L.A. AI OS](https://get-scala.com) — Full platform

## License

MIT
