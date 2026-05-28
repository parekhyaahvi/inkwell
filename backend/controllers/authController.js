import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../services/db.js';
import { cache } from '../services/cache.js';
import { registerSchema, loginSchema, resetPasswordSchema } from '../validators/zodSchemas.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_mode_only_not_production_hardening_64_bytes';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days rolling expiry
const SESSION_SAME_SITE = process.env.NODE_ENV === 'production' ? 'none' : 'strict';

/**
 * Helper to generate JWT token and set in secure cookie
 */
const sendSessionCookie = (res, user) => {
  const token = jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: SESSION_SAME_SITE,
    maxAge: COOKIE_MAX_AGE
  });
};

/**
 * Register User Account
 */
export const register = async (req, res, next) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const normalizedEmail = validatedData.email.trim().toLowerCase();
    const normalizedUsername = validatedData.username.trim();
    
    // Check email uniqueness
    const emailExists = await prisma.user.findFirst({
      where: { email: normalizedEmail }
    });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        error: 'EmailTaken',
        message: 'This email address is already registered.'
      });
    }

    // Check username uniqueness
    const usernameExists = await prisma.user.findFirst({
      where: { username: normalizedUsername }
    });
    if (usernameExists) {
      return res.status(400).json({
        success: false,
        error: 'UsernameTaken',
        message: 'This username is already taken.'
      });
    }

    // Hash password with bcrypt cost 12
    const passwordHash = await bcrypt.hash(validatedData.password, 12);

    // Save to database
    const newUser = await prisma.user.create({
      data: {
        username: normalizedUsername,
        email: normalizedEmail,
        passwordHash,
        displayName: validatedData.displayName,
        theme: 'dark' // default
      }
    });

    // Send JWT session
    sendSessionCookie(res, newUser);

    return res.status(201).json({
      success: true,
      data: {
        user: {
          id: newUser.id,
          username: newUser.username,
          displayName: newUser.displayName,
          theme: newUser.theme
        }
      }
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: err.errors[0].message
      });
    }
    next(err);
  }
};

/**
 * Login Controller
 */
export const login = async (req, res, next) => {
  console.log('[Auth]: Login attempt for:', req.body.email);
  try {
    const validatedData = loginSchema.parse(req.body);
    const email = validatedData.email.trim().toLowerCase();
    const password = validatedData.password;
    
    // Setup lockout tracking variables
    const lockoutKey = `lockout:${email}`;
    const failedAttemptsKey = `failed:${email}`;

    console.log('[Auth]: Checking lock status...');
    // Check lock state
    const isLocked = await cache.get(lockoutKey);
    if (isLocked) {
      console.log('[Auth]: Account locked for:', email);
      return res.status(423).json({
        success: false,
        error: 'AccountLocked',
        message: 'This account is temporarily locked due to excessive failed attempts. Please try again in 5 minutes.'
      });
    }

    console.log('[Auth]: Querying user...');
    let user = null;
    let lastDbError = null;

    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        user = await prisma.user.findFirst({ where: { email } });
        lastDbError = null;
        break;
      } catch (dbErr) {
        lastDbError = dbErr;
        console.error(`[Auth DB Error][Attempt ${attempt}]:`, dbErr.message, dbErr.code || 'no-code');

        if (attempt === 1) {
          try {
            await prisma.$disconnect();
            await prisma.$connect();
          } catch (reconnectErr) {
            console.error('[Auth DB Reconnect Error]:', reconnectErr.message);
          }
        }
      }
    }

    if (lastDbError) {
      return res.status(503).json({
        success: false,
        error: 'DatabaseUnavailable',
        message: 'The database is currently unreachable. Please try again in 30 seconds.'
      });
    }

    if (!user) {
      console.log('[Auth]: User not found:', email);
      return res.status(401).json({
        success: false,
        error: 'InvalidCredentials',
        message: 'Invalid email or password.'
      });
    }

    console.log('[Auth]: Verifying password...');
    // Verify Password
    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      console.log('[Auth]: Password mismatch for:', email);
      // Track failed logins
      const failedCount = await cache.incr(failedAttemptsKey);
      
      // Lock if failedCount hits 10
      if (failedCount >= 10) {
        await cache.set(lockoutKey, 'true', { ex: 300 }); // lock for 5 minutes (300s)
        await cache.del(failedAttemptsKey); // Reset count
        return res.status(423).json({
          success: false,
          error: 'AccountLocked',
          message: 'Account locked due to 10 failed login attempts. Try again in 5 minutes.'
        });
      }

      return res.status(401).json({
        success: false,
        error: 'InvalidCredentials',
        message: 'Invalid email or password.'
      });
    }

    console.log('[Auth]: Login success for:', email);
    // On login success, clear failed counter
    await cache.del(failedAttemptsKey);

    // Send JWT Session
    sendSessionCookie(res, user);

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          theme: user.theme
        }
      }
    });
  } catch (err) {
    console.error('[Auth Error]:', err);
    if (err.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: err.errors[0].message
      });
    }
    next(err);
  }
};

/**
 * Logout Session Clear
 */
export const logout = async (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  return res.status(200).json({
    success: true,
    message: 'Successfully logged out.'
  });
};

/**
 * Transactional Password Reset OTP Initiator
 */
export const resetPassword = async (req, res, next) => {
  try {
    const validatedData = resetPasswordSchema.parse(req.body);
    const email = validatedData.email.trim().toLowerCase();

    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) {
      // Security practice: Don't disclose that the email doesn't exist
      return res.status(200).json({
        success: true,
        message: 'If a matching account exists, a secure password reset link has been dispatched to your email.'
      });
    }

    // Generate 6-digit dynamic OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpKey = `otp:${email}`;

    // Store OTP in cache with a 15-minute expiration (900s)
    await cache.set(otpKey, otp, { ex: 900 });

    // Output dynamic code in sandbox console (mock transactional email)
    console.log(`[Resend OTP Dispatcher]: Password Reset Code for ${email} is ${otp}. Expires in 15 minutes.`);

    return res.status(200).json({
      success: true,
      message: 'If a matching account exists, a secure password reset link has been dispatched to your email.'
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: err.errors[0].message
      });
    }
    next(err);
  }
};
