import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { prisma } from '../services/db.js';
import { commentCreateSchema } from '../validators/zodSchemas.js';

// Setup DOMPurify on Server
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

/**
 * GET threaded comments for a post ordered chronologically
 */
export const getComments = async (req, res, next) => {
  try {
    const { postId } = req.params;

    // Validate ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(postId)) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    const comments = await prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        }
      }
    });

    // Structure flat comment array into threaded nested response trees
    const commentMap = new Map();
    const roots = [];

    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    comments.forEach(comment => {
      const mapped = commentMap.get(comment.id);
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          parent.replies.push(mapped);
        } else {
          // If parent not found (e.g. parent comment deleted but replies remained)
          roots.push(mapped);
        }
      } else {
        roots.push(mapped);
      }
    });

    return res.status(200).json({
      success: true,
      data: roots
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST create comment or reply
 */
export const createComment = async (req, res, next) => {
  try {
    const validatedData = commentCreateSchema.parse(req.body);
    const { postId, parentId, body } = validatedData;

    // Validate ObjectId format
    const isValidId = /^[0-9a-fA-F]{24}$/.test(postId);
    if (!isValidId) {
      return res.status(400).json({
        success: false,
        error: 'InvalidID',
        message: 'The post ID provided is invalid.'
      });
    }

    // Check if post exists
    const postExists = await prisma.post.findUnique({ where: { id: postId } });
    if (!postExists) {
      return res.status(404).json({
        success: false,
        error: 'PostNotFound',
        message: 'The post you are trying to comment on does not exist.'
      });
    }

    // Check parent comment if parentId is supplied
    if (parentId) {
      const isValidParentId = /^[0-9a-fA-F]{24}$/.test(parentId);
      if (!isValidParentId) {
        return res.status(400).json({
          success: false,
          error: 'InvalidID',
          message: 'The parent comment ID provide is invalid.'
        });
      }

      const parentExists = await prisma.comment.findUnique({ where: { id: parentId } });
      if (!parentExists) {
        return res.status(404).json({
          success: false,
          error: 'CommentNotFound',
          message: 'The comment thread parent does not exist.'
        });
      }
    }

    // Server-side HTML Sanitization using DOMPurify
    const cleanBody = DOMPurify.sanitize(body);

    const newComment = await prisma.comment.create({
      data: {
        postId,
        parentId: parentId || null,
        authorId: req.user.id,
        body: cleanBody
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        }
      }
    });

    return res.status(201).json({
      success: true,
      data: newComment
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
 * DELETE delete comment (owner only)
 */
export const deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const comment = await prisma.comment.findUnique({ where: { id } });

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'CommentNotFound',
        message: 'This comment does not exist.'
      });
    }

    // Ownership check
    if (comment.authorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You are not authorized to delete this comment.'
      });
    }

    await prisma.comment.delete({ where: { id } });

    return res.status(200).json({
      success: true,
      message: 'Comment successfully deleted.'
    });
  } catch (err) {
    next(err);
  }
};
