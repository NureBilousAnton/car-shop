export const API_BASE_URL = 'http://127.0.0.1:3000/api';

export const CURRENCY_FORMAT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
});