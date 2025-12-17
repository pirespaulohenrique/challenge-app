const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

export async function fetchClient(
  endpoint: string,
  options: FetchOptions = {}
) {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('sessionId') : null;

  // FIX: Explicitly type the headers as Record<string, string>
  // This tells TypeScript: "This object will contain string keys and string values"
  // allowing us to dynamically add the 'Authorization' header later.
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  // Parse JSON if possible
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'An error occurred during the request');
  }

  return data;
}
