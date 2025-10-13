// FilizAdapter - Abstraction layer for Filiz API interactions
import type { Tenant } from "@shared/schema";

export interface FilizContractData {
  id: string;
  contractNumber: string;
  status: string;
  startDate: string;
  endDate: string;
  apprentice: {
    firstName: string;
    lastName: string;
    email: string;
    dateOfBirth: string;
  };
  employer: {
    name: string;
    siret: string;
    address: string;
  };
  cfa: {
    name: string;
    uai: string;
  };
  [key: string]: any;
}

export interface FilizStudentData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  [key: string]: any;
}

export class FilizAdapter {
  private baseUrl: string;
  private apiKey: string;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTTL: number = 5 * 60 * 1000; // 5 minutes

  constructor(tenant: Tenant) {
    this.baseUrl = tenant.filizApiUrl || "https://api.filiz.example.com";
    this.apiKey = tenant.filizApiKey || "";
  }

  private getCacheKey(endpoint: string, params?: any): string {
    return `${endpoint}:${JSON.stringify(params || {})}`;
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private async fetchWithRetry(
    endpoint: string,
    options?: RequestInit,
    retries: number = 3
  ): Promise<any> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
            ...options?.headers,
          },
        });

        if (!response.ok) {
          throw new Error(`Filiz API error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        if (i === retries - 1) throw error;
        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }

  async getContract(contractId: string): Promise<FilizContractData> {
    const cacheKey = this.getCacheKey(`/contracts/${contractId}`);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const data = await this.fetchWithRetry(`/contracts/${contractId}`);
    this.setCache(cacheKey, data);
    return data;
  }

  async getContracts(filters?: { status?: string; limit?: number }): Promise<FilizContractData[]> {
    const cacheKey = this.getCacheKey("/contracts", filters);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.limit) params.append("limit", filters.limit.toString());

    const data = await this.fetchWithRetry(`/contracts?${params}`);
    this.setCache(cacheKey, data);
    return data;
  }

  async getStudent(studentId: string): Promise<FilizStudentData> {
    const cacheKey = this.getCacheKey(`/students/${studentId}`);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const data = await this.fetchWithRetry(`/students/${studentId}`);
    this.setCache(cacheKey, data);
    return data;
  }

  async searchStudents(query: string): Promise<FilizStudentData[]> {
    const cacheKey = this.getCacheKey("/students/search", { query });
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const params = new URLSearchParams({ q: query });
    const data = await this.fetchWithRetry(`/students/search?${params}`);
    this.setCache(cacheKey, data);
    return data;
  }

  async getDevis(devisId: string): Promise<any> {
    const cacheKey = this.getCacheKey(`/devis/${devisId}`);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const data = await this.fetchWithRetry(`/devis/${devisId}`);
    this.setCache(cacheKey, data);
    return data;
  }

  async getOpco(opcoId: string): Promise<any> {
    const cacheKey = this.getCacheKey(`/opco/${opcoId}`);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const data = await this.fetchWithRetry(`/opco/${opcoId}`);
    this.setCache(cacheKey, data);
    return data;
  }

  async getRac(racId: string): Promise<any> {
    const cacheKey = this.getCacheKey(`/rac/${racId}`);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const data = await this.fetchWithRetry(`/rac/${racId}`);
    this.setCache(cacheKey, data);
    return data;
  }

  clearCache(): void {
    this.cache.clear();
  }
}
