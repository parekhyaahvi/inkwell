import jwt from 'jsonwebtoken';

/**
 * Authentication Middleware
 * Validates the JWT inside httpOnly cookies, injecting req.user
 */
export const authMiddleware = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Authentication is required to access this resource.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_dev_mode_only_not_production_hardening_64_bytes');
    req.user = decoded; // Contains { id, username, email }
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'InvalidToken',
      message: 'Your session has expired or is invalid. Please log in again.'
    });
  }
};
