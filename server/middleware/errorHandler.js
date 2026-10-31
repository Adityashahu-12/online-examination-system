/**
 * Centralized Application and PostgreSQL Error Handler Middleware
 */

function errorHandler(err, req, res, next) {
  console.error('[Application Error]:', err);

  // PostgreSQL Error Code 23P01: Exclusion Constraint Violation (Time slot overlap)
  if (err.code === '23P01') {
    return res.status(409).json({
      success: false,
      error: 'Scheduling Conflict: The selected Examination Center is already booked for another examination during this time window. Please select an alternate time slot or center.',
      code: 'EXCLUSION_CONFLICT',
      detail: err.detail
    });
  }

  // PostgreSQL Error Code 23505: Unique Constraint Violation
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      error: 'Conflict: A record with this unique identifier or details already exists.',
      code: 'UNIQUE_VIOLATION',
      detail: err.detail
    });
  }

  // PostgreSQL Error Code 23503: Foreign Key Constraint Violation
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      error: 'Referential Integrity Error: Referenced entity (Department, Subject, Center, or Exam) does not exist.',
      code: 'FOREIGN_KEY_VIOLATION',
      detail: err.detail
    });
  }

  // PostgreSQL Error Code 23514: Check Constraint Violation
  if (err.code === '23514') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error: Check constraint violated (e.g. End Time must be strictly after Start Time).',
      code: 'CHECK_VIOLATION',
      detail: err.detail
    });
  }

  // Generic unhandled error
  const statusCode = err.status || err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    error: err.message || 'An internal server error occurred. Please try again later.',
    code: err.code || 'INTERNAL_ERROR'
  });
}

module.exports = errorHandler;
