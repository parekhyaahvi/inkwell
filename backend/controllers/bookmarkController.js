import { prisma } from '../services/db.js';

/**
 * POST toggle bookmark status on a post
 */
export const toggleBookmark = async (req, res, next) => {
  try {
    const postId = req.params.postId;
    const userId = req.user.id;

    // Check if post exists
    const postExists = await prisma.post.findUnique({ where: { id: postId } });
    if (!postExists) {
      return res.status(404).json({
        success: false,
        error: 'PostNotFound',
        message: 'This post does not exist.'
      });
    }

    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        userId_postId: { userId, postId }
      }
    });

    let bookmarked = false;

    if (existingBookmark) {
      // Delete bookmark
      await prisma.bookmark.delete({
        where: {
          userId_postId: { userId, postId }
        }
      });
    } else {
      // Create bookmark
      await prisma.bookmark.create({
        data: { userId, postId }
      });
      bookmarked = true;
    }

    return res.status(200).json({
      success: true,
      data: {
        bookmarked
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET list of bookmarked posts of authenticated user (formatted as post cards output)
 */
export const getBookmarks = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        post: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true
              }
            },
            tags: {
              include: { tag: true }
            }
          }
        }
      }
    });

    // Format output matching standard post card lists
    const formatted = bookmarks.map(b => {
      const post = b.post;
      return {
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.content.replace(/<[^>]*>/g, '').substring(0, 160) + '...',
        cover: post.cover,
        likeCount: post.likeCount,
        publishedAt: post.publishedAt,
        author: post.author,
        tags: post.tags.map(t => t.tag.name)
      };
    });

    return res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (err) {
    next(err);
  }
};
