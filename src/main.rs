mod error;
mod handlers;
mod models;
mod openapi;

use axum::{
    Router,
    routing::{get, post},
};
use listenfd::ListenFd;
use sqlx::postgres::PgPoolOptions;
use tokio::net::TcpListener;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;

use std::time::Duration;

use crate::openapi::ApiDoc;

#[tokio::main]
async fn main() {
    // Logging
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Database
    let db_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://postgres:password@localhost:5432/car_shop".into());

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .acquire_timeout(Duration::from_secs(3))
        .connect(&db_url)
        .await
        .expect("Failed to connect to database");

    tracing::info!("Connected to database at {}", db_url);

    // Router
    let app = Router::new()
        .route("/cars", get(handlers::get_cars))
        .route("/sales", get(handlers::get_sales))
        .route("/cars/{id}/details", get(handlers::get_car_details))
        .route("/sales", post(handlers::add_sale))
        .route(
            "/stats/cheaper-than-avg",
            get(handlers::get_stats_cheaper_than_avg),
        )
        .route(
            "/cars/cheaper-than/{price}",
            get(handlers::get_cars_cheaper_than),
        )
        .merge(SwaggerUi::new("/swagger-ui").url("/api-docs/openapi.json", ApiDoc::openapi()))
        .with_state(pool);

    // Run Server with support for systemfd/cargo-watch
    let mut listenfd = ListenFd::from_env();
    let listener = match listenfd.take_tcp_listener(0).unwrap() {
        Some(listener) => {
            listener.set_nonblocking(true).unwrap();
            TcpListener::from_std(listener).unwrap()
        }
        None => TcpListener::bind("127.0.0.1:3000").await.unwrap(),
    };

    let addr = listener.local_addr().unwrap();
    tracing::info!("Listening on {addr}");
    tracing::info!("Swagger UI available at http://{addr}/swagger-ui");

    axum::serve(listener, app).await.unwrap();
}
