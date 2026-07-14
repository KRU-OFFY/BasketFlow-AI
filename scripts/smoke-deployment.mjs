const rawBaseUrl = process.env.BASKETFLOW_BASE_URL;

function resolveBaseUrl(value) {
  if (!value) {
    throw new Error('Set BASKETFLOW_BASE_URL to the Vercel preview or production URL.');
  }

  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('BASKETFLOW_BASE_URL must use http or https.');
  }
  if (url.username || url.password) {
    throw new Error('BASKETFLOW_BASE_URL must not contain credentials.');
  }

  url.pathname = url.pathname.replace(/\/$/, '');
  url.search = '';
  url.hash = '';
  return url;
}

async function fetchWithTimeout(url, init = {}) {
  const signal = AbortSignal.timeout(15_000);
  return fetch(url, { ...init, redirect: 'follow', signal });
}

async function run() {
  const baseUrl = resolveBaseUrl(rawBaseUrl);
  const healthUrl = new URL('/api/health', baseUrl);
  const loginUrl = new URL('/login', baseUrl);

  const healthResponse = await fetchWithTimeout(healthUrl, {
    headers: { Accept: 'application/json' },
  });
  const health = await healthResponse.json().catch(() => null);

  if (!healthResponse.ok || health?.status !== 'ok' || health?.service !== 'basketflow-ai') {
    throw new Error(
      `Health check failed: HTTP ${healthResponse.status}, status=${health?.status ?? 'unknown'}, service=${health?.service ?? 'unknown'}`,
    );
  }

  const loginResponse = await fetchWithTimeout(loginUrl, {
    headers: { Accept: 'text/html' },
  });
  const loginHtml = await loginResponse.text();

  if (!loginResponse.ok) {
    throw new Error(`Login page failed: HTTP ${loginResponse.status}`);
  }
  if (!loginHtml.includes('BasketFlow AI')) {
    throw new Error('Login page does not contain the BasketFlow AI product name.');
  }

  console.log(`Smoke test passed: ${baseUrl.origin}`);
  console.log(`Health version: ${health.version}`);
  console.log(`Environment: ${health.environment}`);
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
