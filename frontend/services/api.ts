import { API_BASE_URL } from '../constants';
import { AddSaleRequest, CarFullSales, CheapCarRow, OrderFull, StatsResponse } from '../types';

class AppError extends Error {
  constructor(public message: string, public originalError?: unknown) {
    super(message);
    this.name = 'AppError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      try {
        const json = JSON.parse(text);
        throw new AppError(json.message || json.error || `Server Error: ${response.status}`);
      } catch (e) {
        if (text && !text.startsWith('{')) {
          throw new AppError(text);
        }
        throw new AppError(`HTTP Error ${response.status}: ${response.statusText}`);
      }
    }

    const text = await response.text();
    return text ? JSON.parse(text) : {} as T;

  } catch (error: any) {
    if (error instanceof TypeError && (error.message === 'Failed to fetch' || error.message.includes('NetworkError'))) {
      console.error(`Network Error calling ${url}.`);
      throw new AppError(
        "Could not connect to the server."
      );
    }
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(error.message || "An unexpected error occurred");
  }
}

export const carService = {
  getAllCars: async (): Promise<CarFullSales[]> => {
    return request<CarFullSales[]>('/cars');
  },

  getCheapCarsCount: async (): Promise<StatsResponse> => {
    return request<StatsResponse>('/cars/cheaper-than-avg');
  },

  getCarsCheaperThan: async (price: number): Promise<CheapCarRow[]> => {
    return request<CheapCarRow[]>(`/cars/cheaper-than/${price}`);
  },

  getCarDetails: async (id: number): Promise<CarFullSales> => {
    return request<CarFullSales>(`/cars/${id}`);
  },
};

export const salesService = {
  getAllSales: async (): Promise<OrderFull[]> => {
    return request<OrderFull[]>('/sales');
  },

  addSale: async (data: AddSaleRequest): Promise<void> => {
    return request<void>('/sales', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  },
};
