const API_URL = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/+$/, '');
const REQUEST_TIMEOUT_MS = 10000;

export function getApiUrl(path) {
  if (!API_URL) {
    throw new Error(
      'Backend URL is not configured. Set EXPO_PUBLIC_API_URL in frontend/.env and restart Expo.'
    );
  }

  return `${API_URL}${path}`;
}

export async function apiFetch(path, options = {}) {
  const { timeoutMs = REQUEST_TIMEOUT_MS, ...fetchOptions } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(getApiUrl(path), {
      ...fetchOptions,
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('The backend did not respond in time. Check that it is running and reachable.');
    }
    throw new Error(`Could not reach the backend: ${error.message || 'network request failed'}`);
  } finally {
    clearTimeout(timeoutId);
  }
}
