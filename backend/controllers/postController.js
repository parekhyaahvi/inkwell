import crypto from 'crypto';
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { prisma } from '../services/db.js';
import { uploadImage } from '../services/cloudinary.js';
import { postCreateSchema, postUpdateSchema } from '../validators/zodSchemas.js';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

/**
 * Generate a unique URL-safe slug from a title
 */
const generateSlug = (title) => {
  const clean = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  
  const randomSuffix = crypto.randomBytes(3).toString('hex'); // 6 hex characters
  return `${clean || 'untitled'}-${randomSuffix}`;
};

/**
 * GET list of published posts with tag, author, personalization, and cursor-based pagination
 */
export const getPosts = async (req, res, next) => {
  try {
    const { tag, author, feed, cursor, limit = 10 } = req.query;
    const parsedLimit = parseInt(limit, 10);

    const whereClause = { status: 'published' };

    // Filter by tag
    if (tag) {
      whereClause.tags = {
        some: {
          tag: { name: { equals: tag, mode: 'insensitive' } }
        }
      };
    }

    // Filter by author username
    if (author) {
      whereClause.author = { username: author };
    }

    // Personalised feed: Posts from writers the authenticated user follows
    if (feed === 'personalised' && req.user) {
      const followedUsers = await prisma.follow.findMany({
        where: { followerId: req.user.id },
        select: { followingId: true }
      });
      
      const followedIds = followedUsers.map(f => f.followingId);

      if (followedIds.length > 0) {
        whereClause.authorId = { in: followedIds };
      }
    }

    // Cursor-based pagination settings
    const queryOptions = {
      where: whereClause,
      take: parsedLimit + 1, // Fetch one extra to get the next cursor
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        cover: true,
        likeCount: true,
        publishedAt: true,
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        },
        tags: {
          select: {
            tag: {
              select: { name: true }
            }
          }
        }
      }
    };

    if (cursor) {
      queryOptions.cursor = { id: cursor };
      queryOptions.skip = 1; // Skip the cursor element itself
    }

    const posts = await prisma.post.findMany(queryOptions);

    // Check if next page exists
    let nextCursor = null;
    if (posts.length > parsedLimit) {
      const nextItem = posts.pop(); // Remove extra item
      nextCursor = nextItem.id;
    }

    // Format posts return objects
    const formattedPosts = posts.map(post => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.content.replace(/<[^>]*>/g, '').substring(0, 160) + '...',
      cover: post.cover,
      likeCount: post.likeCount,
      publishedAt: post.publishedAt,
      author: post.author,
      tags: post.tags.map(t => t.tag.name)
    }));

    return res.status(200).json({
      success: true,
      data: formattedPosts,
      meta: {
        nextCursor
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET single post by unique slug
 */
export const getPostBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    // Check if it's a valid MongoDB ObjectId
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(slug);

    const post = await prisma.post.findFirst({
      where: {
        OR: [
          { slug: slug },
          ...(isObjectId ? [{ id: slug }] : [])
        ]
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            bio: true
          }
        },
        tags: {
          include: { tag: true }
        }
      }
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'PostNotFound',
        message: 'This post could not be found.'
      });
    }

    // Format return payload
    const formattedPost = {
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: post.content,
      cover: post.cover,
      status: post.status,
      likeCount: post.likeCount,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      author: post.author,
      tags: post.tags.map(t => t.tag.name)
    };

    return res.status(200).json({
      success: true,
      data: formattedPost
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST create post (draft or published)
 */
export const createPost = async (req, res, next) => {
  try {
    const validatedData = postCreateSchema.parse(req.body);
    const { title, content, status, tags = [] } = validatedData;
    let { cover } = validatedData;

    // Handle uploaded cover image if present
    if (req.file) {
      cover = await uploadImage(req.file.buffer, req.file.originalname);
    }

    const cleanContent = DOMPurify.sanitize(content);
    const slug = generateSlug(title);
    const publishedAt = status === 'published' ? new Date() : null;

    // Prisma Transaction block to create post and tags safely
    const newPost = await prisma.$transaction(async (tx) => {
      // 1. Create Post
      const post = await tx.post.create({
        data: {
          authorId: req.user.id,
          title,
          slug,
          content: cleanContent,
          cover,
          status,
          publishedAt
        }
      });

      // 2. Link tags
      if (tags.length > 0) {
        for (const tagName of tags) {
          const tagClean = tagName.trim().toLowerCase();
          
          // Upsert Tag
          const tag = await tx.tag.upsert({
            where: { name: tagClean },
            update: { postCount: { increment: status === 'published' ? 1 : 0 } },
            create: { name: tagClean, postCount: status === 'published' ? 1 : 0 }
          });

          // Link in junction table
          await tx.postTag.create({
            data: {
              postId: post.id,
              tagId: tag.id
            }
          });
        }
      }

      return post;
    });

    return res.status(201).json({
      success: true,
      data: newPost
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
 * PATCH update post content, tags, and status
 */
export const updatePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = postUpdateSchema.parse(req.body);

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'PostNotFound',
        message: 'This post does not exist.'
      });
    }

    // Ownership check
    if (post.authorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You are not authorized to edit this post.'
      });
    }

    const { title, content, status, tags } = validatedData;
    let { cover } = validatedData;

    // Handle uploaded cover image if present
    if (req.file) {
      cover = await uploadImage(req.file.buffer, req.file.originalname);
    }

    const cleanContent = content !== undefined ? DOMPurify.sanitize(content) : undefined;
    const publishedAt = status === 'published' && post.status !== 'published' ? new Date() : post.publishedAt;

    // Prisma Transaction block handling updates
    const updatedPost = await prisma.$transaction(async (tx) => {
      // 1. Resolve tags adjustments if provided
      if (tags !== undefined) {
        // Query current post tags
        const currentPostTags = await tx.postTag.findMany({
          where: { postId: id },
          include: { tag: true }
        });

        const currentTagNames = currentPostTags.map(pt => pt.tag.name);
        const nextTagNames = tags.map(t => t.trim().toLowerCase());

        // Tags to delete linkage
        const toDelete = currentPostTags.filter(pt => !nextTagNames.includes(pt.tag.name));
        for (const pt of toDelete) {
          await tx.postTag.delete({
            where: {
              postId_tagId: { postId: id, tagId: pt.tagId }
            }
          });
          // Decrement count
          await tx.tag.update({
            where: { id: pt.tagId },
            data: { postCount: { decrement: post.status === 'published' ? 1 : 0 } }
          });
        }

        // Tags to add linkage
        const toAdd = nextTagNames.filter(t => !currentTagNames.includes(t));
        for (const tagName of toAdd) {
          const tag = await tx.tag.upsert({
            where: { name: tagName },
            update: { postCount: { increment: status === 'published' || post.status === 'published' ? 1 : 0 } },
            create: { name: tagName, postCount: status === 'published' || post.status === 'published' ? 1 : 0 }
          });

          await tx.postTag.create({
            data: { postId: id, tagId: tag.id }
          });
        }
      }

      // 2. Perform Database updates
      const updated = await tx.post.update({
        where: { id },
        data: {
          title,
          content: cleanContent,
          cover,
          status,
          publishedAt,
          slug: title ? generateSlug(title) : undefined
        }
      });

      return updated;
    });

    return res.status(200).json({
      success: true,
      data: updatedPost
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
 * DELETE soft-delete/hard-delete post
 */
export const deletePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'PostNotFound',
        message: 'This post does not exist.'
      });
    }

    // Ownership check
    if (post.authorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You are not authorized to delete this post.'
      });
    }

    // Prisma Transaction block to adjust tag count before delete
    await prisma.$transaction(async (tx) => {
      const currentTags = await tx.postTag.findMany({
        where: { postId: id }
      });

      for (const pt of currentTags) {
        await tx.tag.update({
          where: { id: pt.tagId },
          data: { postCount: { decrement: post.status === 'published' ? 1 : 0 } }
        });
      }

      await tx.post.delete({ where: { id } });
    });

    return res.status(200).json({
      success: true,
      message: 'Post successfully deleted.'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST Toggle heart like on post
 */
export const toggleLike = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'PostNotFound',
        message: 'This post does not exist.'
      });
    }

    // Check relationship state
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: { userId, postId }
      }
    });

    let liked = false;

    // Prisma Transaction block to atomically toggle like state and adjust denormalized counts
    const result = await prisma.$transaction(async (tx) => {
      if (existingLike) {
        // Dislike
        await tx.like.delete({
          where: {
            userId_postId: { userId, postId }
          }
        });
        const updated = await tx.post.update({
          where: { id: postId },
          data: { likeCount: { decrement: 1 } },
          select: { likeCount: true }
        });
        return { liked: false, likeCount: updated.likeCount };
      } else {
        // Like
        await tx.like.create({
          data: { userId, postId }
        });
        const updated = await tx.post.update({
          where: { id: postId },
          data: { likeCount: { increment: 1 } },
          select: { likeCount: true }
        });
        return { liked: true, likeCount: updated.likeCount };
      }
    });

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
};
