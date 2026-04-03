const rawBaseUrl = process.env.REACT_APP_API_BASEURL || 'http://localhost:5000';

export const API_BASE_URL = rawBaseUrl.endsWith('/')
  ? rawBaseUrl
  : `${rawBaseUrl}/`;

export const buildApiUrl = (path) => `${API_BASE_URL}${path.replace(/^\/+/, '')}`;
