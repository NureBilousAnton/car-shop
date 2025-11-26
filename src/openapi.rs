use utoipa::OpenApi;

use crate::handlers;

#[derive(OpenApi)]
#[openapi(
    paths(
        handlers::get_cars,
        handlers::get_sales,
        handlers::get_car_details,
        handlers::add_sale,
        handlers::get_stats_cheaper_than_avg,
        handlers::get_cars_cheaper_than,
    ),
    tags(
        (name = "Car Shop", description = "Car Shop API for Laboratory 3")
    )
)]
pub struct ApiDoc;
