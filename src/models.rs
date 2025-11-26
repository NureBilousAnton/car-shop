use chrono::NaiveDate;
use serde::{Deserialize, Serialize};
use sqlx::types::Decimal;
use utoipa::ToSchema;

#[derive(Serialize, ToSchema)]
pub struct CarDetailResponse {
    pub car_info: CarFull,
    pub sales_history: Vec<OrderSummary>,
}

#[derive(Serialize, ToSchema)]
pub struct CarFull {
    pub id: i32,
    pub brand_country: Option<String>,
    pub brand_name: String,
    pub name: String,
    pub center_name: String,
    pub price: Decimal,
    pub quantity: i32,
    pub description: Option<String>,
}

#[derive(Serialize, ToSchema)]
pub struct OrderSummary {
    pub id: i32,
    pub check_num: i32,
    pub quantity: i32,
    pub sold_at: NaiveDate,
}

#[derive(Serialize, ToSchema)]
pub struct OrderFull {
    pub id: i32,
    pub check_num: i32,
    pub centre_name: String,
    pub car_id: i32,
    pub car_brand: String,
    pub car_name: String,
    pub price: Decimal,
    pub quantity: i32,
    pub total: Decimal,
    pub sold_at: NaiveDate,
}

#[derive(Deserialize, ToSchema)]
pub struct AddSaleRequest {
    /// Name of the car (partial case insensitive search)
    pub car_name: String,
    /// Optional check number. If not provided, it will be generated
    pub check_num: Option<i32>,
    /// Quantity to sell, defaults to 1
    pub quantity: Option<i32>,
}

#[derive(Serialize, ToSchema)]
pub struct CheapCarRow {
    pub id: i32,
    pub name: String,
    pub price: Decimal,
    pub description: Option<String>,
}

#[derive(Serialize, ToSchema)]
pub struct StatsResponse {
    pub count: i32,
}
