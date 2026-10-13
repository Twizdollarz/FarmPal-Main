import { auth } from './firebase.ts';

let cachedAuthToken: string | null = null;
let tokenExpiryTime = 0;

if (auth && typeof auth.onIdTokenChanged === 'function') {
  auth.onIdTokenChanged((user) => {
    if (!user) {
      cachedAuthToken = null;
      tokenExpiryTime = 0;
    }
  });
}

// Global Client-Side Fetch Interceptor to attach Authorization Bearer tokens
if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
  const originalFetch = window.fetch.bind(window);

  const interceptedFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
        ? input.toString()
        : (input as Request)?.url || '';

    const isPublic =
      url.startsWith('/api/health') ||
      url.startsWith('/api/reminders/templates') ||
      url.startsWith('/api/market/benchmarks') ||
      url.startsWith('/api/whatsapp/webhook') ||
      url.startsWith('/api/weather');

    if (url.startsWith('/api') && !isPublic) {
      const headers = new Headers(init?.headers || {});
      if (!headers.has('Authorization')) {
        let token: string | null = null;
        if (auth && auth.currentUser) {
          if (cachedAuthToken && Date.now() < tokenExpiryTime) {
            token = cachedAuthToken;
          } else {
            try {
              token = await auth.currentUser.getIdToken(false);
              cachedAuthToken = token;
              tokenExpiryTime = Date.now() + 50 * 60 * 1000; // 50 mins
            } catch {
              token = null;
            }
          }
        }
        // In development only, allow test token fallback for automated test scripts and local dev
        const isDev = Boolean((import.meta as any).env?.DEV);
        if (!token && isDev && typeof localStorage !== 'undefined') {
          token =
            localStorage.getItem('farmpal_auth_token') || 'test-token-farmer-1';
        } else if (!token && isDev) {
          token = 'test-token-farmer-1';
        }

        // Only attach Authorization header if a valid token exists (never emit fake credentials in production)
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }

        // Attach developer access key if developer session is active
        if (typeof localStorage !== 'undefined' && localStorage.getItem('farmpal_dev_mode') === 'true') {
          headers.set('x-dev-key', 'farmpal-dev-2026');
        }
      }
      init = { ...init, headers };
    }
    return originalFetch(input, init);
  };

  try {
    Object.defineProperty(window, 'fetch', {
      value: interceptedFetch,
      writable: true,
      configurable: true,
    });
  } catch {
    try {
      window.fetch = interceptedFetch;
    } catch (err) {
      console.warn('Unable to override window.fetch (readonly property):', err);
    }
  }
}

