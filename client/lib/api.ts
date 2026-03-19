const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export async function fetchApi<T = any>(endpoint: string, options: RequestInit = {}): Promise<{ success: boolean; data: T }> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    // Adding lightweight Next.js cache bypass during phase 1 development
    cache: 'no-store' 
  });
  
  if (!res.ok) {
    throw new Error(`API error: ${res.statusText}`);
  }
  
  return res.json();
}
