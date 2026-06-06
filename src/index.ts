export interface Company {
  id: string;
  name: string;
  country: string;
  vat_number?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  nace_code?: string;
  nace_description?: string;
  legal_form?: string;
  status?: string;
  revenue?: number;
  employees?: number;
  health_score?: number;
  founded?: string;
  website?: string;
  phone?: string;
  email?: string;
  [key: string]: unknown;
}

export interface SearchResult {
  companies: Company[];
  total: number;
  credits_used: number;
}

export interface SearchOptions {
  country?: string;
  nace?: string;
  status?: "active" | "inactive";
  limit?: number;
}

export interface ReportResult {
  report_id: string;
  company_id: string;
  type: string;
  status: string;
  download_url?: string;
}

export class ScalaScore {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl = "https://app.get-scala.com") {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  private async request<T>(
    endpoint: string,
    options: { method?: string; params?: Record<string, string>; body?: unknown } = {}
  ): Promise<T> {
    const { method = "GET", params, body } = options;
    let url = `${this.baseUrl}${endpoint}`;

    if (params) {
      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ""))
      );
      if (qs.toString()) url += `?${qs}`;
    }

    const init: RequestInit = {
      method,
      headers: {
        "X-API-Key": this.apiKey,
        "Content-Type": "application/json",
      },
    };

    if (body) init.body = JSON.stringify(body);

    const resp = await fetch(url, init);
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`SCALA API error ${resp.status}: ${text}`);
    }
    return resp.json() as Promise<T>;
  }

  /**
   * Search companies by name, VAT, or keyword.
   *
   * @example
   * const results = await score.search("Ferrero", { country: "IT" });
   * results.companies.forEach(c => console.log(c.name, c.revenue));
   */
  async search(query: string, options: SearchOptions = {}): Promise<SearchResult> {
    const params: Record<string, string> = {
      q: query,
      limit: String(options.limit ?? 10),
    };
    if (options.country) params.country = options.country;
    if (options.nace) params.nace = options.nace;
    if (options.status) params.status = options.status;

    const data = await this.request<Record<string, unknown>>("/api/score/search", { params });
    const companies = (data.results ?? data.companies ?? data.data ?? []) as Company[];
    return {
      companies,
      total: (data.total as number) ?? companies.length,
      credits_used: (data.credits_used as number) ?? 1,
    };
  }

  /**
   * Get detailed company data by ID or VAT number.
   *
   * @example
   * const company = await score.lookup("IT02727330014");
   * console.log(company.name, company.health_score);
   */
  async lookup(companyId: string): Promise<Company> {
    const data = await this.request<Record<string, unknown>>("/api/score/lookup", {
      params: { id: companyId },
    });
    return (data.company ?? data.result ?? data) as Company;
  }

  /**
   * Generate a company health report.
   *
   * @param companyId - Company ID
   * @param type - "basic" (5 credits), "pro" (10), "enterprise" (20)
   */
  async report(companyId: string, type: "basic" | "pro" | "enterprise" = "basic"): Promise<ReportResult> {
    return this.request<ReportResult>("/api/score/report", {
      method: "POST",
      body: { company_id: companyId, type },
    });
  }

  /** Check remaining API credits. */
  async credits(): Promise<{ plan: string; credits_remaining: number; credits_used: number; reset_date: string }> {
    return this.request("/api/score/credits");
  }

  /** Get database statistics. */
  async stats(): Promise<{ total_companies: number; countries: number; last_updated: string }> {
    return this.request("/api/score/stats");
  }

  /** List available countries with company counts. */
  async countries(): Promise<Array<{ country_code: string; country_name: string; company_count: number }>> {
    const data = await this.request<Record<string, unknown>>("/api/score/countries");
    return (data.countries ?? data.data ?? []) as Array<{ country_code: string; country_name: string; company_count: number }>;
  }
}

export default ScalaScore;
