use axum::Json;
use axum::extract::{Path, State};
use chrono::NaiveDate;
use rust_decimal::Decimal;
use serde::Serialize;
use sqlx::{PgPool, Pool, Postgres};
use utoipa::ToSchema;
use utoipa_axum::{router::OpenApiRouter, routes};

use crate::{CAR_TAG, Result, error::Error};

pub fn router() -> OpenApiRouter<Pool<Postgres>> {
    OpenApiRouter::new()
        .routes(routes!(get_cars))
        .routes(routes!(get_car_details))
        .routes(routes!(get_cars_cheaper_than))
        .routes(routes!(get_cars_cheaper_than_avg))
}

#[derive(Serialize, ToSchema)]
pub struct CarFull {
    pub id: i32,
    pub country: Option<String>,
    pub brand: String,
    pub name: String,
    pub center: String,
    pub price: Decimal,
    pub quantity: i32,
    pub description: Option<String>,
}

/// List information of all cars
#[utoipa::path(get, path = "", responses((status = OK, body = Vec<CarFullSales>)), tag = CAR_TAG)]
pub async fn get_cars(State(pool): State<PgPool>) -> Result<Json<Vec<CarFull>>> {
    let cars = sqlx::query_as!(
        CarFull,
        "SELECT
            c.id, c.name,
            b.name as brand,
            b.country_code as country,
            cc.name as center,
            c.price, c.quantity, c.description
        FROM cars c
        JOIN brand b ON c.brand_id = b.id
        JOIN carcentres cc ON c.car_centre_id = cc.id"
    )
    .fetch_all(&pool)
    .await?;

    Ok(Json(cars))
}

#[derive(Serialize, ToSchema)]
pub struct CarFullSales {
    #[serde(flatten)]
    pub car_full: CarFull,
    pub sales: Vec<CarSale>,
}
#[derive(Serialize, ToSchema)]
pub struct CarSale {
    pub id: i32,
    pub check_num: i32,
    pub quantity: i32,
    pub sold_at: NaiveDate,
}

/// Get detailed info about a car and it's sales history
#[utoipa::path(get, path = "/{id}", params(("id" = i32, Path, description = "Car ID")),
    responses(
        (status = OK, description = "Car details found", body = CarFullSales),
        (status = NOT_FOUND, description = "Car not found")
    ),
    tag = CAR_TAG
)]
pub async fn get_car_details(
    State(pool): State<PgPool>,
    Path(id): Path<i32>,
) -> Result<Json<CarFullSales>> {
    let car_full = sqlx::query_as!(
        CarFull,
        "SELECT
            c.id, c.name,
            b.name as brand,
            b.country_code as country,
            cc.name as center,
            c.price, c.quantity, c.description
        FROM cars c
        JOIN brand b ON c.brand_id = b.id
        JOIN carcentres cc ON c.car_centre_id = cc.id
        WHERE c.id = $1",
        id
    )
    .fetch_optional(&pool)
    .await?
    .ok_or_else(|| Error::NotFound(format!("Car with id {id} not found")))?;

    let sales = sqlx::query_as!(
        CarSale,
        "SELECT id, check_num, quantity, sold_at
        FROM orders
        WHERE car_id = $1
        ORDER BY sold_at DESC",
        id
    )
    .fetch_all(&pool)
    .await?;

    Ok(Json(CarFullSales { car_full, sales }))
}

#[derive(Serialize, ToSchema)]
pub struct CheapCarRow {
    pub id: i32,
    pub name: String,
    pub price: Decimal,
    pub description: Option<String>,
}

/// List cars cheaper than price
#[utoipa::path(get, path = "/cheaper-than/{price}",
    params(("price" = f64, Path, description = "Price threshold")),
    responses((status = OK, body = Vec<CheapCarRow>)),
    tag = CAR_TAG
)]
pub async fn get_cars_cheaper_than(
    State(pool): State<PgPool>,
    Path(price): Path<Decimal>,
) -> Result<Json<Vec<CheapCarRow>>> {
    let cars = sqlx::query_as!(
        CheapCarRow,
        r#"SELECT
            id as "id!",
            name as "name!",
            price as "price!",
            description
        FROM get_cars_cheaper_than_price($1)"#,
        price
    )
    .fetch_all(&pool)
    .await?;

    Ok(Json(cars))
}

#[derive(Serialize, ToSchema)]
pub struct StatsResponse {
    pub count: i32,
}

/// Count cars cheaper than average car price
#[utoipa::path(get, path = "/cheaper-than-avg", responses((status = 200, body = StatsResponse)), tag = CAR_TAG)]
pub async fn get_cars_cheaper_than_avg(State(pool): State<PgPool>) -> Result<Json<StatsResponse>> {
    let count: i32 = sqlx::query_scalar!(r#"SELECT count_cars_cheaper_than_average() as "c!""#)
        .fetch_one(&pool)
        .await?;

    Ok(Json(StatsResponse { count }))
}
