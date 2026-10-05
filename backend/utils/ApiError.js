// Error class carrying an HTTP status code; its message is safe to expose to clients.
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = ApiError;
