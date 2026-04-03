const rawBaseUrl = process.env.REACT_APP_API_BASEURL || 'http://localhost:5000';

export const API_BASE_URL = rawBaseUrl.endsWith('/')
  ? rawBaseUrl
  : `${rawBaseUrl}/`;

export const buildApiUrl = (path) => `${API_BASE_URL}${path.replace(/^\/+/, '')}`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchJsonWithRetry(url, options = {}, config = {}) {
  const {
    retries = 2,
    retryDelayMs = 1500,
    retryStatuses = [502, 503, 504],
  } = config;

  let lastError = null;
  let lastResponse = null;
  let lastData = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, options);
      lastResponse = response;

      try {
        lastData = await response.json();
      } catch {
        lastData = null;
      }

      if (response.ok || !retryStatuses.includes(response.status) || attempt === retries) {
        return { response, data: lastData };
      }
    } catch (error) {
      lastError = error;
      if (attempt === retries) {
        break;
      }
    }

    if (attempt < retries) {
      await sleep(retryDelayMs * (attempt + 1));
    }
  }

  return { response: lastResponse, data: lastData, error: lastError };
}
