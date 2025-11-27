use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
};

/// Custom application error type
pub enum Error {
    /// Standard database error
    Sqlx(sqlx::Error),
    /// Resource not found
    NotFound(String),
}

impl From<sqlx::Error> for Error {
    fn from(err: sqlx::Error) -> Self {
        if let sqlx::Error::Database(db_err) = &err
            && let Some(code) = db_err.code()
            && code.as_ref() == "P0002"
        {
            Self::NotFound(db_err.message().to_string())
        } else {
            Self::Sqlx(err)
        }
    }
}

impl IntoResponse for Error {
    fn into_response(self) -> Response {
        match self {
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
        }
        .into_response()
    }
}
