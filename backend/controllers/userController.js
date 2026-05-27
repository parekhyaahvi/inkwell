import { prisma } from '../services/db.js';
import { userUpdateSchema } from '../validators/zodSchemas.js';

/**
 * Retrieve a public user profile by username
 */
export const getProfile = async (req, res, next) => {
  try {
    const { username } = req.params;

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        theme: true,
        createdAt: true,
        _count: {
          select: {
            posts: {
              where: { status: 'published' }
            },
            followers: true,
            following: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'UserNotFound',
        message: 'This user profile does not exist.'
      });
    }

    // Format count payload matching specification
    const responseData = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      theme: user.theme,
      createdAt: user.createdAt,
      postCount: user._count.posts,
      followersCount: user._count.followers,
      followingCount: user._count.following
    };

    return res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update authenticated user's own profile and configuration
 */
export const updateMe = async (req, res, next) => {
  try {
    const validatedData = userUpdateSchema.parse(req.body);
    
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: validatedData,
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        theme: true
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        user: updatedUser
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
 * Toggle follow/unfollow mapping state
 */
export const toggleFollow = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const followerId = req.user.id;

    if (targetUserId === followerId) {
      return res.status(400).json({
        success: false,
        error: 'InvalidAction',
        message: 'You cannot follow your own profile.'
      });
    }

    const targetExists = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetExists) {
      return res.status(404).json({
        success: false,
        error: 'UserNotFound',
        message: 'The profile you are trying to follow does not exist.'
      });
    }

    // Check relationship state
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: targetUserId
        }
      }
    });

    let isFollowing = false;

    if (existingFollow) {
      // Unfollow
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId,
            followingId: targetUserId
          }
        }
      });
    } else {
      // Follow
      await prisma.follow.create({
        data: {
          followerId,
          followingId: targetUserId
        }
      });
      isFollowing = true;
    }

    return res.status(200).json({
      success: true,
      data: {
        following: isFollowing
      }
    });
  } catch (err) {
    next(err);
  }
};
