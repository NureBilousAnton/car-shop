use axum::Json;
use axum::extract::State;
use chrono::NaiveDate;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, Pool, Postgres};
use utoipa::ToSchema;
use utoipa_axum::{router::OpenApiRouter, routes};

use crate::{Result, SALES_TAG};

pub fn router() -> OpenApiRouter<Pool<Postgres>> {
    OpenApiRouter::new().routes(routes!(get_sales, add_sale))
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

/// Get detailed info about sales
#[utoipa::path(get, path = "", responses((status = OK, body = Vec<OrderFull>)), tag = SALES_TAG)]
pub async fn get_sales(State(pool): State<PgPool>) -> Result<Json<Vec<OrderFull>>> {
    let orders = sqlx::query_as!(
        OrderFull,
        r#"SELECT
            o.id,
            o.car_id,
            o.check_num,
            o.quantity,
            o.sold_at,
            c.price,
            c.name as car_name,
            b.name as car_brand,
            cc.name as centre_name,
            o.quantity * c.price as "total!"
        FROM orders o
        JOIN cars c ON o.car_id = c.id
        JOIN brand b ON c.brand_id = b.id
        JOIN carcentres cc ON c.car_centre_id = cc.id"#
    )
    .fetch_all(&pool)
    .await?;

    Ok(Json(orders))
}

#[derive(Deserialize, ToSchema)]
pub struct AddSaleRequest {
    /// Name of the car (partial case insensitive search)
    pub car_name: String,
    /// Optional check number. If not provided, will be autoincremented
    pub check_num: Option<i32>,
    /// Quantity to sell, defaults to 1
    pub quantity: Option<i32>,
}

/// Find a car by name and add a car sale with it
#[utoipa::path(post, path = "", request_body = AddSaleRequest, tag = SALES_TAG,
    responses(
        (status = OK, description = "Sale registered successfully"),
        (status = BAD_REQUEST, description = "Business Logic Error")
    )
)]
pub async fn add_sale(
    State(pool): State<PgPool>,
    Json(payload): Json<AddSaleRequest>,
) -> Result<Json<String>> {
    sqlx::query!(
        "CALL add_car_sale($1, $2, $3)",
        payload.car_name,
        payload.check_num,
        payload.quantity.unwrap_or(1)
    )
    .execute(&pool)
    .await?;

    Ok(Json("Sale processed successfully".to_string()))
}
