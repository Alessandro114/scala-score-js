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
export declare class ScalaScore {
    private apiKey;
    private baseUrl;
    constructor(apiKey: string, baseUrl?: string);
    private request;
    /**
     * Search companies by name, VAT, or keyword.
     *
     * @example
     * const results = await score.search("Ferrero", { country: "IT" });
     * results.companies.forEach(c => console.log(c.name, c.revenue));
     */
    search(query: string, options?: SearchOptions): Promise<SearchResult>;
    /**
     * Get detailed company data by ID or VAT number.
     *
     * @example
     * const company = await score.lookup("IT02727330014");
     * console.log(company.name, company.health_score);
     */
    lookup(companyId: string): Promise<Company>;
    /**
     * Generate a company health report.
     *
     * @param companyId - Company ID
     * @param type - "basic" (5 credits), "pro" (10), "enterprise" (20)
     */
    report(companyId: string, type?: "basic" | "pro" | "enterprise"): Promise<ReportResult>;
    /** Check remaining API credits. */
    credits(): Promise<{
        plan: string;
        credits_remaining: number;
        credits_used: number;
        reset_date: string;
    }>;
    /** Get database statistics. */
    stats(): Promise<{
        total_companies: number;
        countries: number;
        last_updated: string;
    }>;
    /** List available countries with company counts. */
    countries(): Promise<Array<{
        country_code: string;
        country_name: string;
        company_count: number;
    }>>;
}
export default ScalaScore;
