import type {
  FRMEndpoint,
  FRMDataMap,
  FactoryBuilding,
  PowerCircuit,
  StorageContainer,
  Extractor,
  Generator,
  WorldInventoryItem,
} from '@/types/frm'

const DEFAULT_BASE_URL = 'http://80.190.78.17:8080'

export function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('frm-base-url') || DEFAULT_BASE_URL
  }
  return DEFAULT_BASE_URL
}

export function setBaseUrl(url: string): void {
  localStorage.setItem('frm-base-url', url)
}

/**
 * Generic fetch function for FRM endpoints.
 * Returns typed data based on the endpoint name.
 */
export async function fetchFRM<T extends FRMEndpoint>(
  endpoint: T,
  baseUrl?: string
): Promise<FRMDataMap[T]> {
  const url = `${baseUrl || getBaseUrl()}/${endpoint}`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5000)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`FRM API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data as FRMDataMap[T]
  } finally {
    clearTimeout(timeoutId)
  }
}

// --- Typed convenience functions ---

export async function fetchFactory(baseUrl?: string): Promise<FactoryBuilding[]> {
  return fetchFRM('getFactory', baseUrl)
}

export async function fetchPower(baseUrl?: string): Promise<PowerCircuit[]> {
  return fetchFRM('getPower', baseUrl)
}

export async function fetchStorageInv(baseUrl?: string): Promise<StorageContainer[]> {
  return fetchFRM('getStorageInv', baseUrl)
}

export async function fetchExtractors(baseUrl?: string): Promise<Extractor[]> {
  return fetchFRM('getExtractor', baseUrl)
}

export async function fetchGenerators(baseUrl?: string): Promise<Generator[]> {
  return fetchFRM('getGenerators', baseUrl)
}

export async function fetchWorldInv(baseUrl?: string): Promise<WorldInventoryItem[]> {
  return fetchFRM('getWorldInv', baseUrl)
}

/**
 * Fetch all dashboard data in parallel.
 * Returns an object with all endpoint results.
 */
export async function fetchAllDashboardData(baseUrl?: string) {
  const [factory, power, storage, extractors, generators] = await Promise.allSettled([
    fetchFactory(baseUrl),
    fetchPower(baseUrl),
    fetchStorageInv(baseUrl),
    fetchExtractors(baseUrl),
    fetchGenerators(baseUrl),
  ])

  return {
    factory: factory.status === 'fulfilled' ? factory.value : [],
    power: power.status === 'fulfilled' ? power.value : [],
    storage: storage.status === 'fulfilled' ? storage.value : [],
    extractors: extractors.status === 'fulfilled' ? extractors.value : [],
    generators: generators.status === 'fulfilled' ? generators.value : [],
  }
}

export type DashboardData = Awaited<ReturnType<typeof fetchAllDashboardData>>
