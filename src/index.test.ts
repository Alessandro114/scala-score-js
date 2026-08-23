import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ScalaScore } from "./index.js";

// Every call goes through one `fetch`. Stubbing it lets the whole SDK be
// covered without a network or an API key — including the response-shape
// fallbacks, which are the part most likely to rot silently when the API
// changes the name of a field.

interface Chiamata {
    url: string;
    init: RequestInit;
}

let chiamate: Chiamata[];

function rispondi(body: unknown, { ok = true, status = 200, text = "" } = {}) {
    vi.stubGlobal(
        "fetch",
        vi.fn(async (url: string, init: RequestInit) => {
            chiamate.push({ url, init });
            return {
                ok,
                status,
                json: async () => body,
                text: async () => text,
            } as unknown as Response;
        })
    );
}

beforeEach(() => {
    chiamate = [];
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("costruttore", () => {
    it("usa app.get-scala.com quando non gli si dice altro", async () => {
        rispondi({ total_companies: 1, countries: 1, last_updated: "2026-01-01" });
        await new ScalaScore("k").stats();
        expect(chiamate[0].url).toBe("https://app.get-scala.com/api/score/stats");
    });

    it("toglie la barra finale dal baseUrl, per non produrre un doppio slash", async () => {
        rispondi({});
        await new ScalaScore("k", "https://esempio.test/").stats();
        expect(chiamate[0].url).toBe("https://esempio.test/api/score/stats");
    });

    it("toglie una sola barra: un baseUrl con percorso resta intero", async () => {
        rispondi({});
        await new ScalaScore("k", "https://esempio.test/v2/").stats();
        expect(chiamate[0].url).toBe("https://esempio.test/v2/api/score/stats");
    });
});

describe("richiesta", () => {
    it("manda la chiave in X-API-Key e non nell'URL", async () => {
        rispondi({});
        await new ScalaScore("segreto").stats();
        const h = chiamate[0].init.headers as Record<string, string>;
        expect(h["X-API-Key"]).toBe("segreto");
        expect(h["Content-Type"]).toBe("application/json");
        expect(chiamate[0].url).not.toContain("segreto");
    });

    it("una GET non porta corpo", async () => {
        rispondi({});
        await new ScalaScore("k").stats();
        expect(chiamate[0].init.body).toBeUndefined();
        expect(chiamate[0].init.method).toBe("GET");
    });

    it("solleva un errore che riporta stato e corpo quando la risposta non e ok", async () => {
        rispondi(null, { ok: false, status: 429, text: "rate limited" });
        await expect(new ScalaScore("k").stats()).rejects.toThrow(
            "SCALA API error 429: rate limited"
        );
    });

    it("non tocca la rete una seconda volta dopo un errore", async () => {
        rispondi(null, { ok: false, status: 500, text: "boom" });
        await expect(new ScalaScore("k").stats()).rejects.toThrow();
        expect(chiamate).toHaveLength(1);
    });
});

describe("search", () => {
    it("chiede dieci risultati se non gliene chiedi un numero diverso", async () => {
        rispondi({ results: [] });
        await new ScalaScore("k").search("Ferrero");
        expect(chiamate[0].url).toContain("q=Ferrero");
        expect(chiamate[0].url).toContain("limit=10");
    });

    it("passa country, nace e status quando ci sono", async () => {
        rispondi({ results: [] });
        await new ScalaScore("k").search("x", {
            country: "IT",
            nace: "10.71",
            status: "active",
            limit: 3,
        });
        const u = chiamate[0].url;
        expect(u).toContain("country=IT");
        expect(u).toContain("nace=10.71");
        expect(u).toContain("status=active");
        expect(u).toContain("limit=3");
    });

    it("non mette in coda i parametri che non sono stati passati", async () => {
        rispondi({ results: [] });
        await new ScalaScore("k").search("x");
        expect(chiamate[0].url).not.toContain("country=");
        expect(chiamate[0].url).not.toContain("nace=");
        expect(chiamate[0].url).not.toContain("status=");
    });

    it("codifica la query invece di spezzare l'URL", async () => {
        rispondi({ results: [] });
        await new ScalaScore("k").search("Rossi & Figli S.p.A.");
        expect(chiamate[0].url).toContain("q=Rossi+%26+Figli+S.p.A.");
    });

    // L'API ha chiamato questo campo in tre modi diversi nel tempo. Il
    // fallback esiste per quello, e senza test non ci si accorge se salta.
    it.each([
        ["results", { results: [{ id: "1", name: "A", country: "IT" }] }],
        ["companies", { companies: [{ id: "1", name: "A", country: "IT" }] }],
        ["data", { data: [{ id: "1", name: "A", country: "IT" }] }],
    ])("legge le aziende da %s", async (_nome, body) => {
        rispondi(body);
        const r = await new ScalaScore("k").search("x");
        expect(r.companies).toHaveLength(1);
        expect(r.companies[0].name).toBe("A");
    });

    it("torna un elenco vuoto se la risposta non ha nessuno dei tre campi", async () => {
        rispondi({ qualcosaltro: 1 });
        const r = await new ScalaScore("k").search("x");
        expect(r.companies).toEqual([]);
        expect(r.total).toBe(0);
    });

    it("usa total quando c'e", async () => {
        rispondi({ results: [{ id: "1", name: "A", country: "IT" }], total: 4321 });
        expect((await new ScalaScore("k").search("x")).total).toBe(4321);
    });

    it("ripiega sul numero di aziende ricevute quando total manca", async () => {
        rispondi({ results: [{ id: "1", name: "A", country: "IT" }] });
        expect((await new ScalaScore("k").search("x")).total).toBe(1);
    });

    it("credits_used vale 1 quando la risposta non lo dice", async () => {
        rispondi({ results: [] });
        expect((await new ScalaScore("k").search("x")).credits_used).toBe(1);
    });

    it("ma rispetta il valore quando c'e, anche se e zero", async () => {
        rispondi({ results: [], credits_used: 0 });
        expect((await new ScalaScore("k").search("x")).credits_used).toBe(0);
    });
});

describe("lookup", () => {
    it("passa l'identificativo come parametro id", async () => {
        rispondi({ company: { id: "IT02727330014", name: "A", country: "IT" } });
        await new ScalaScore("k").lookup("IT02727330014");
        expect(chiamate[0].url).toContain("/api/score/lookup?id=IT02727330014");
    });

    it.each([
        ["company", { company: { id: "1", name: "A", country: "IT" } }],
        ["result", { result: { id: "1", name: "A", country: "IT" } }],
    ])("legge l'azienda da %s", async (_nome, body) => {
        rispondi(body);
        expect((await new ScalaScore("k").lookup("1")).name).toBe("A");
    });

    it("prende la risposta stessa quando non e incartata", async () => {
        rispondi({ id: "1", name: "A", country: "IT" });
        expect((await new ScalaScore("k").lookup("1")).name).toBe("A");
    });
});

describe("report", () => {
    it("e una POST con il corpo, non una GET", async () => {
        rispondi({ report_id: "r", company_id: "1", type: "basic", status: "queued" });
        await new ScalaScore("k").report("1");
        expect(chiamate[0].init.method).toBe("POST");
        expect(JSON.parse(chiamate[0].init.body as string)).toEqual({
            company_id: "1",
            type: "basic",
        });
    });

    it("il tipo predefinito e basic, quello da 5 crediti", async () => {
        rispondi({});
        await new ScalaScore("k").report("1");
        expect(JSON.parse(chiamate[0].init.body as string).type).toBe("basic");
    });

    it.each(["basic", "pro", "enterprise"] as const)("accetta il tipo %s", async (t) => {
        rispondi({});
        await new ScalaScore("k").report("1", t);
        expect(JSON.parse(chiamate[0].init.body as string).type).toBe(t);
    });

    it("non mette il tipo in coda all'URL", async () => {
        rispondi({});
        await new ScalaScore("k").report("1", "pro");
        expect(chiamate[0].url).toBe("https://app.get-scala.com/api/score/report");
    });
});

describe("credits e stats", () => {
    it("credits restituisce la risposta cosi com'e", async () => {
        const body = {
            plan: "pro",
            credits_remaining: 900,
            credits_used: 100,
            reset_date: "2026-09-01",
        };
        rispondi(body);
        expect(await new ScalaScore("k").credits()).toEqual(body);
    });

    it("stats restituisce la risposta cosi com'e", async () => {
        const body = { total_companies: 244_000_000, countries: 42, last_updated: "2026-08-01" };
        rispondi(body);
        expect(await new ScalaScore("k").stats()).toEqual(body);
    });
});

describe("countries", () => {
    it.each([
        ["countries", { countries: [{ country_code: "IT", country_name: "Italia", company_count: 6 }] }],
        ["data", { data: [{ country_code: "IT", country_name: "Italia", company_count: 6 }] }],
    ])("legge l'elenco da %s", async (_nome, body) => {
        rispondi(body);
        const r = await new ScalaScore("k").countries();
        expect(r[0].country_code).toBe("IT");
    });

    it("torna un elenco vuoto quando la risposta non ha nessuno dei due campi", async () => {
        rispondi({});
        expect(await new ScalaScore("k").countries()).toEqual([]);
    });
});
