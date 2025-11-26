use axum::{
    Json,
    extract::{Path, State},
};
use sqlx::PgPool;
use sqlx::types::Decimal;

use crate::{
    error::AppError,
    models::{
        AddSaleRequest, CarDetailResponse, CarFull, CheapCarRow, OrderFull, OrderSummary,
        StatsResponse,
    },
};

// 1. Output info from tables

/// List all cars
#[utoipa::path(
    get,
    path = "/cars",
    responses(
        (status = 200, description = "Cars info found", body = Vec<CarDetailResponse>),
    )
)]
pub async fn get_cars(State(pool): State<PgPool>) -> Result<Json<Vec<CarFull>>, AppError> {
    let cars = sqlx::query_as!(
        CarFull,
        "SELECT
            c.id, c.name,
            b.name as brand_name,
            b.country_code as brand_country,
            cc.name as center_name,
            c.price, c.quantity, c.description
        FROM cars c
        JOIN brand b ON c.brand_id = b.id
        JOIN carcentres cc ON c.car_centre_id = cc.id"
    )
    .fetch_all(&pool)
    .await?;

    Ok(Json(cars))
}

/// Get detailed info about sales
#[utoipa::path(
    get,
    path = "/sales",
    responses(
        (status = 200, description = "Sales info found", body = Vec<OrderFull>),
    )
)]
pub async fn get_sales(State(pool): State<PgPool>) -> Result<Json<Vec<OrderFull>>, AppError> {
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

/// Get detailed info about a car and it's sales history
#[utoipa::path(
    get,
    path = "/cars/{id}/details",
    params(
        ("id" = i32, Path, description = "Car ID")
    ),
    responses(
        (status = 200, description = "Car details found", body = CarDetailResponse),
        (status = 404, description = "Car not found")
    )
)]
pub async fn get_car_details(
    State(pool): State<PgPool>,
    Path(id): Path<i32>,
) -> Result<Json<CarDetailResponse>, AppError> {
    let car_info = sqlx::query_as!(
        CarFull,
        "SELECT
            c.id, c.name,
            b.name as brand_name,
            b.country_code as brand_country,
            cc.name as center_name,
            c.price, c.quantity, c.description
        FROM cars c
        JOIN brand b ON c.brand_id = b.id
        JOIN carcentres cc ON c.car_centre_id = cc.id
        WHERE c.id = $1",
        id
    )
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Car with id {id} not found")))?;

    let sales_history = sqlx::query_as!(
        OrderSummary,
        "SELECT id, check_num, quantity, sold_at
        FROM orders
        WHERE car_id = $1
        ORDER BY sold_at DESC",
        id
    )
    .fetch_all(&pool)
    .await?;

    Ok(Json(CarDetailResponse {
        car_info,
        sales_history,
    }))
}

// 2. Execute Stored Procedure

/// Find a car by name and add a car sale with it
#[utoipa::path(
    post,
    path = "/sales",
    request_body = AddSaleRequest,
    responses(
        (status = 200, description = "Sale registered successfully"),
        (status = 400, description = "Business Logic Error (e.g. Car not found)")
    )
)]
pub async fn add_sale(
    State(pool): State<PgPool>,
    Json(payload): Json<AddSaleRequest>,
) -> Result<Json<String>, AppError> {
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

// 3. Scalar and Table Functions

/// Count cars that are cheaper than average
#[utoipa::path(
    get,
    path = "/stats/cheaper-than-avg",
    responses(
        (status = 200, description = "Count retrieved", body = StatsResponse)
    )
)]
pub async fn get_stats_cheaper_than_avg(
    State(pool): State<PgPool>,
) -> Result<Json<StatsResponse>, AppError> {
    // Calling a scalar function via SELECT
    let count: i32 = sqlx::query_scalar!(r#"SELECT count_cars_cheaper_than_average() as "c!""#)
        .fetch_one(&pool)
        .await?;

    Ok(Json(StatsResponse { count }))
}

/// List cars cheaper than price
#[utoipa::path(
    get,
    path = "/cars/cheaper-than/{price}",
    params(
        ("price" = f64, Path, description = "Price threshold")
    ),
    responses(
        (status = 200, description = "List of cheap cars", body = Vec<CheapCarRow>)
    )
)]
pub async fn get_cars_cheaper_than(
    State(pool): State<PgPool>,
    Path(price): Path<Decimal>,
) -> Result<Json<Vec<CheapCarRow>>, AppError> {
    let cars = sqlx::query_as!(
        CheapCarRow,
        r#"SELECT
            id          AS "id!",
            model       AS "name!",
            price       AS "price!",
            description
        FROM get_cars_cheaper_than_price($1)"#,
        price
    )
    .fetch_all(&pool)
    .await?;

    Ok(Json(cars))
}
