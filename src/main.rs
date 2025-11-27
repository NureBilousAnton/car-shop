#![allow(clippy::needless_for_each)] // OpenApi macro

use axum::http::HeaderValue;
use listenfd::ListenFd;
use sqlx::postgres::PgPoolOptions;
use tokio::net::TcpListener;
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use utoipa::OpenApi;
use utoipa_axum::router::OpenApiRouter;
use utoipa_swagger_ui::SwaggerUi;

use std::time::Duration;

mod cars;
mod error;
mod sales;

pub type Result<T, E = error::Error> = std::result::Result<T, E>;

const CAR_TAG: &str = "Cars";
const SALES_TAG: &str = "Sales";

#[derive(OpenApi)]
#[openapi(tags(
    (name = CAR_TAG, description = "Car API Endpoints"),
    (name = SALES_TAG, description = "Sale API Endpoints"),
))]
pub struct ApiDoc;

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

    // OpenAPI and Router
    let (router, api) = OpenApiRouter::with_openapi(ApiDoc::openapi())
        .nest("/api/cars", cars::router())
        .nest("/api/sales", sales::router())
        .with_state(pool)
        .layer(
            CorsLayer::new()
                .allow_origin("http://localhost:3002".parse::<HeaderValue>().unwrap())
                .allow_methods(Any)
                .allow_headers(Any),
        )
        .split_for_parts();
    let router = router.merge(SwaggerUi::new("/swagger-ui").url("/apidoc/openapi.json", api));

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

    axum::serve(listener, router).await.unwrap();
}
