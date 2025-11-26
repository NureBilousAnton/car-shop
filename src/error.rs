use axum::{
    Json,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use serde_json::json;

/// Custom application error type
pub enum AppError {
    /// Standard database error
    Sqlx(sqlx::Error),
    /// Resource not found (for manual trigger)
    NotFound(String),
}

// Allow converting sqlx errors directly into AppError
impl From<sqlx::Error> for AppError {
    fn from(inner: sqlx::Error) -> Self {
        Self::Sqlx(inner)
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            Self::Sqlx(err) => {
                match err {
                    sqlx::Error::Database(db_err) => {
                        let msg = db_err.message().to_string();
                        (StatusCode::BAD_REQUEST, msg)
                    }
                    sqlx::Error::RowNotFound => {
                        (StatusCode::NOT_FOUND, "Record not found".to_string())
                    }
                    _ => {
                        // Log the internal error for admin, don't show details to user
                        tracing::error!("Internal SQL error: {:?}", err);
                        (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            "Internal server error".to_string(),
                        )
                    }
                }
            }
            Self::NotFound(msg) => (StatusCode::NOT_FOUND, msg),
        };

        let body = Json(json!({
            "error": error_message
        }));

        (status, body).into_response()
    }
}
