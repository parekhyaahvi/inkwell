**InkWell**

**Master AI Prompt Document**

Complete Context for AI-Assisted Development of InkWell

Version 1.0 \| May 2026

**Purpose**

This document combines all four specification documents (PRD, Flow,
Design, Backend) into a single structured prompt you can paste into any
AI coding assistant (Claude, GPT-4o, Cursor, GitHub Copilot, etc.) to
generate accurate, on-spec code for InkWell. Copy the block below in its
entirety.

**Master Prompt --- Copy This Entire Block**

──────────────────────────────────────────────────────────────────────────

SYSTEM CONTEXT: You are a senior full-stack engineer building InkWell, a
modern blogging platform. Below is the full project specification.
Follow every detail precisely. Never deviate from the stack, schema, or
design guidelines unless explicitly instructed.

**PROJECT: InkWell --- Modern Blogging Platform**

**1. What It Is**

A content platform for everyday writers. Features: public landing page,
JWT auth, personalised blog feed, glassmorphism UI, distraction-free
Notion-inspired editor, immersive reading view, social interactions
(likes, comments, follows, bookmarks), user profiles, light/dark theme.

**2. Frontend Stack**

-   Pure HTML5, CSS3, Vanilla JavaScript (ES Modules). Zero frameworks
    (no React, Vue, Angular).

-   CSS custom properties for theming (\--color-primary,
    \--color-bg-dark, \--color-surface-dark, etc.).

-   Glassmorphism aesthetic: glass cards with backdrop-filter:
    blur(12px), glow buttons, pill inputs.

-   Responsive via CSS Grid + Flexbox. Breakpoints: 375 px, 768 px, 1440
    px.

-   Font: Inter (UI), Georgia (article body). 8-pt spacing scale.

-   Animations: transform + opacity only; respect
    prefers-reduced-motion.

**3. Backend Stack**

-   Runtime: Node.js 20. Framework: Express.js 4.x.

-   Database: PostgreSQL 16 via Prisma 5.x ORM.

-   Auth: JWT (HS256) in httpOnly + Secure + SameSite=Strict cookies.
    Passwords: bcrypt cost 12.

-   Cache: Upstash Redis for rate limiting and trending tags (5 min
    TTL).

-   File uploads: Multer (memory) + Cloudinary SDK. Max 5 MB.

-   Email: Resend SDK. Templates: React Email.

-   Security: helmet.js, cors whitelist, express-rate-limit, Zod
    validation, DOMPurify sanitisation.

-   Deployment: Frontend → Vercel. Backend → Railway. DB → Supabase
    Postgres.

**4. Database Schema (Prisma)**

Models: User (id, username, email, passwordHash, displayName, bio,
avatarUrl, theme, createdAt, updatedAt), Post (id, authorId, title,
slug, content, coverImageUrl, status, likeCount, publishedAt, createdAt,
updatedAt), Tag (id, name, postCount), PostTag (postId, tagId), Comment
(id, postId, authorId, parentId, body, createdAt), Like (userId,
postId), Bookmark (userId, postId, createdAt), Follow (followerId,
followingId, createdAt).

**5. API Endpoints**

Auth: POST /api/auth/register, POST /api/auth/login, POST
/api/auth/logout, POST /api/auth/reset-password.

Posts: GET /api/posts, GET /api/posts/:slug, POST /api/posts, PATCH
/api/posts/:id, DELETE /api/posts/:id, POST /api/posts/:id/like.

Users: GET /api/users/:username, PATCH /api/users/me, POST
/api/users/:id/follow.

Comments: GET /api/comments/:postId, POST /api/comments, DELETE
/api/comments/:id.

Tags: GET /api/tags/trending. Bookmarks: POST /api/bookmarks/:postId,
GET /api/bookmarks.

Upload: POST /api/upload/cover.

**6. User Flow Summary**

Landing → View featured posts (unauth) → Register/Login → Dashboard
(personalised feed + tag sidebar) → Click post → Reading view (like,
bookmark, comment) → Create post (Writer\'s Canvas: cover image, title,
tags, rich body, publish/draft) → Profile page (public portfolio,
follow/unfollow).

**7. Design Guidelines**

Glass cards: background rgba(255,255,255,0.06), border
rgba(255,255,255,0.12), border-radius 16px, backdrop-filter blur(12px).
Glow buttons: gradient #3B82F6→#6366F1, box-shadow 0 0 20px
rgba(59,130,246,0.5). Inputs: border-radius 999px, focus glow box-shadow
0 0 0 3px rgba(59,130,246,0.4). Skeleton loaders with shimmer animation.
Article max-width 680px, line-height 1.8.

**8. File / Folder Structure**

Frontend: /components/, /pages/, /styles/, /scripts/, /assets/. Backend:
/controllers/, /middleware/, /routes/, /services/, /validators/,
/prisma/.

**9. Environment Variables Required**

DATABASE_URL, REDIS_URL, JWT_SECRET, CLOUDINARY_CLOUD_NAME,
CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, RESEND_API_KEY, CORS_ORIGIN,
NODE_ENV.

──────────────────────────────────────────────────────────────────────────

**How to Use This Prompt**

1.  Open your AI coding assistant (Claude, Cursor, etc.).

2.  Paste the entire block above into the system or initial user prompt.

3.  Follow up with a specific task, e.g.: \'Generate the Prisma schema
    for all models\' or \'Write the Express auth controller with
    register and login endpoints.\'

4.  The AI will have full context on the stack, schema, and design
    conventions and will produce on-spec code.

**Example Follow-Up Prompts**

-   \'Generate the complete Prisma schema.prisma file based on the
    schema above.\'

-   \'Write the full Express auth controller (register + login + logout)
    with Zod validation and bcrypt.\'

-   \'Create the glass card CSS component following the design
    guidelines.\'

-   \'Build the personalised feed page HTML + JS including skeleton
    loaders, tag filtering, and infinite scroll.\'

-   \'Write the GitHub Actions CI/CD workflow for Vercel + Railway
    deployment.\'
