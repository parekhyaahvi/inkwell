import { z } from 'zod';

// Authentication Endpoints Validators
export const registerSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters long')
    .max(20, 'Username cannot exceed 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain alphanumeric characters and underscores'),
  email: z.string().email('Invalid email address format').max(255),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  displayName: z.string().min(1, 'Display name is required').max(100)
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required')
});

// Reset Password Initiator
export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address format')
});

// Post Create/Edit Validators
export const postCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters'),
  content: z.string().min(1, 'Article body content is required'),
  status: z.enum(['draft', 'published']).default('draft'),
  tags: z.preprocess(
    (a) => (typeof a === 'string' ? JSON.parse(a) : a),
    z.array(z.string().min(1).max(50)).max(10, 'A post can have at most 10 tags').optional()
  ),
  cover: z.string().nullable().optional()
});

export const postUpdateSchema = postCreateSchema.partial();

// Comment Creation
export const commentCreateSchema = z.object({
  postId: z.string().min(1, 'Post ID is required'),
  parentId: z.string().nullable().optional(),
  body: z.string().min(1, 'Comment body content is required')
});

// Profile Editing
export const userUpdateSchema = z.object({
  displayName: z.string().min(1, 'Display name cannot be empty').max(100).optional(),
  bio: z.string().max(500, 'Bio must be within 500 characters').nullable().optional(),
  avatarUrl: z.string().url('Avatar URL must be a valid link').nullable().optional(),
  theme: z.enum(['light', 'dark']).optional()
});
