// Schema definitions based on OpenAPI spec

export interface CarSale {
  id: number;
  check_num: number;
  quantity: number;
  sold_at: string;
}

export interface CarFull {
  id: number;
  brand: string;
  name: string;
  center: string;
  country: string | null;
  description: string | null;
  price: string;
  quantity: number;
}

export interface CarFullSales extends CarFull {
  sales?: CarSale[]; // the list endpoint might not return it
}

export interface CheapCarRow {
  id: number;
  name: string;
  price: string;
  description: string | null;
}

export interface OrderFull {
  id: number;
  check_num: number;
  centre_name: string;
  car_id: number;
  car_brand: string;
  car_name: string;
  price: string;
  quantity: number;
  total: string;
  sold_at: string;
}

export interface StatsResponse {
  count: number;
}

export interface AddSaleRequest {
  car_name: string;
  check_num?: number | null;
  quantity?: number | null;
}

export interface ApiError {
  error: string;
  message?: string;
}
