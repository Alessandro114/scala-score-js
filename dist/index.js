export class ScalaScore {
    constructor(apiKey, baseUrl = "https://app.get-scala.com") {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl.replace(/\/$/, "");
    }
    async request(endpoint, options = {}) {
        const { method = "GET", params, body } = options;
        let url = `${this.baseUrl}${endpoint}`;
        if (params) {
            const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== "")));
            if (qs.toString())
                url += `?${qs}`;
        }
        const init = {
            method,
            headers: {
                "X-API-Key": this.apiKey,
                "Content-Type": "application/json",
            },
        };
        if (body)
            init.body = JSON.stringify(body);
        const resp = await fetch(url, init);
        if (!resp.ok) {
            const text = await resp.text();
            throw new Error(`SCALA API error ${resp.status}: ${text}`);
        }
        return resp.json();
    }
    /**
     * Search companies by name, VAT, or keyword.
     *
     * @example
     * const results = await score.search("Ferrero", { country: "IT" });
     * results.companies.forEach(c => console.log(c.name, c.revenue));
     */
    async search(query, options = {}) {
        const params = {
            q: query,
            limit: String(options.limit ?? 10),
        };
        if (options.country)
            params.country = options.country;
        if (options.nace)
            params.nace = options.nace;
        if (options.status)
            params.status = options.status;
        const data = await this.request("/api/score/search", { params });
        const companies = (data.results ?? data.companies ?? data.data ?? []);
        return {
            companies,
            total: data.total ?? companies.length,
            credits_used: data.credits_used ?? 1,
        };
    }
    /**
     * Get detailed company data by ID or VAT number.
     *
     * @example
     * const company = await score.lookup("IT02727330014");
     * console.log(company.name, company.health_score);
     */
    async lookup(companyId) {
        const data = await this.request("/api/score/lookup", {
            params: { id: companyId },
        });
        return (data.company ?? data.result ?? data);
    }
    /**
     * Generate a company health report.
     *
     * @param companyId - Company ID
     * @param type - "basic" (5 credits), "pro" (10), "enterprise" (20)
     */
    async report(companyId, type = "basic") {
        return this.request("/api/score/report", {
            method: "POST",
            body: { company_id: companyId, type },
        });
    }
    /** Check remaining API credits. */
    async credits() {
        return this.request("/api/score/credits");
    }
    /** Get database statistics. */
    async stats() {
        return this.request("/api/score/stats");
    }
    /** List available countries with company counts. */
    async countries() {
        const data = await this.request("/api/score/countries");
        return (data.countries ?? data.data ?? []);
    }
}
export default ScalaScore;
