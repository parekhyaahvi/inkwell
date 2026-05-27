**InkWell**

**Backend Document**

Tech Stack, Database Schema & API Design

Version 1.0 \| May 2026

**Section 1: Tech Stack**

**1.1 Runtime & Server**

  --------------------------------------------------------------------------
  **Layer**           **Technology**   **Rationale**
  ------------------- ---------------- -------------------------------------
  Runtime             Node.js 20 LTS   Non-blocking I/O ideal for a content
                                       API; strong ecosystem

  Server Framework    Express.js 4.x   Minimal, well-documented; no magic;
                                       easy to unit test

  Language            JavaScript       Matches frontend language; reduces
                      (ES2022)         context switching

  Validation          Zod              Schema-first request validation;
                                       TypeScript-ready
  --------------------------------------------------------------------------

**1.2 Database & ORM**

  --------------------------------------------------------------------------
  **Layer**           **Technology**   **Rationale**
  ------------------- ---------------- -------------------------------------
  Primary Database    PostgreSQL 16    ACID-compliant, JSON support,
                                       powerful full-text search

  ORM                 Prisma 5.x       Type-safe queries, auto-generated
                                       client, readable schema

  Cache               Redis 7          Rate limiting, session store, tag
                      (Upstash)        trending cache (5 min TTL)

  Full-text search    pg_trgm +        Built-in Postgres FTS; no extra
                      tsvector         search service in v1
  --------------------------------------------------------------------------

**1.3 Authentication & Security**

  --------------------------------------------------------------------------------
  **Concern**         **Technology**         **Notes**
  ------------------- ---------------------- -------------------------------------
  Password hashing    bcrypt (cost 12)       Never store plaintext; salt rounds =
                                             12

  Session tokens      JWT (jsonwebtoken)     Signed HS256; stored in httpOnly
                                             cookie

  Cookie config       cookie-parser          httpOnly, Secure, SameSite=Strict, 7d
                                             expiry

  Rate limiting       express-rate-limit +   10 req/min on /auth/\*; 60 req/min on
                      Redis                  other endpoints

  CORS                cors (npm)             Whitelist production domain +
                                             localhost:3000 in dev

  Input sanitisation  DOMPurify              Sanitise HTML content before Prisma
                      (server-side)          write

  Helmet              helmet.js              Sets 11 security HTTP headers
                                             automatically
  --------------------------------------------------------------------------------

**1.4 File & Media Storage**

  ---------------------------------------------------------------------------
  **Concern**         **Technology**    **Notes**
  ------------------- ----------------- -------------------------------------
  Cover image upload  Cloudinary SDK    Auto-resize to 1200×630; WebP
                                        conversion; signed uploads

  Avatar upload       Cloudinary SDK    Resize to 200×200 circle crop

  Upload middleware   Multer            File validated before upload; max 5
                      (memoryStorage)   MB
  ---------------------------------------------------------------------------

**1.5 Email**

  --------------------------------------------------------------------------
  **Concern**         **Technology**   **Notes**
  ------------------- ---------------- -------------------------------------
  Transactional email Resend           Password reset OTP; welcome email on
                                       register

  Template engine     React Email      HTML email templates as React
                                       components
  --------------------------------------------------------------------------

**1.6 Deployment & Infrastructure**

  --------------------------------------------------------------------------
  **Concern**         **Technology**   **Notes**
  ------------------- ---------------- -------------------------------------
  Frontend hosting    Vercel           Edge CDN; serverless functions;
                                       preview deployments on PR

  Backend hosting     Railway.app      Docker-based Node.js service;
                                       Postgres add-on

  Database hosting    Supabase         Managed Postgres; connection pooling
                      (Postgres)       via PgBouncer

  Cache hosting       Upstash Redis    Serverless Redis; HTTP-based; no idle
                                       charges

  CI/CD               GitHub Actions   Lint → Test → Build → Deploy on push
                                       to main

  Environment secrets Vercel / Railway Never committed to git; rotated on
                      env vars         breach
  --------------------------------------------------------------------------

**Section 2: Backend Structure**

**2.1 Database Schema (Prisma)**

**Table: User**

  ----------------------------------------------------------------------------
  **Column**      **Type**        **Constraint**   **Description**
  --------------- --------------- ---------------- ---------------------------
  id              UUID            PK, default      Unique user identifier
                                  uuid()           

  username        VARCHAR(50)     UNIQUE, NOT NULL Public handle (@username)

  email           VARCHAR(255)    UNIQUE, NOT NULL Login email

  passwordHash    VARCHAR(255)    NOT NULL         bcrypt hash

  displayName     VARCHAR(100)    NOT NULL         Public display name

  bio             TEXT            NULLABLE         Profile bio

  avatarUrl       TEXT            NULLABLE         Cloudinary URL

  theme           ENUM            DEFAULT \'dark\' Preferred theme

  createdAt       TIMESTAMPTZ     DEFAULT now()    Account created

  updatedAt       TIMESTAMPTZ     Auto-updated     Last profile change
  ----------------------------------------------------------------------------

**Table: Post**

  ----------------------------------------------------------------------------
  **Column**      **Type**        **Constraint**   **Description**
  --------------- --------------- ---------------- ---------------------------
  id              UUID            PK               Post identifier

  authorId        UUID            FK → User.id     Post author

  title           VARCHAR(200)    NOT NULL         Post title

  slug            VARCHAR(220)    UNIQUE, NOT NULL URL-safe identifier

  content         TEXT            NOT NULL         Sanitised HTML body

  coverImageUrl   TEXT            NULLABLE         Cloudinary URL

  status          ENUM            DEFAULT          \'draft\' \| \'published\'
                                  \'draft\'        

  likeCount       INTEGER         DEFAULT 0        Denormalised like count

  publishedAt     TIMESTAMPTZ     NULLABLE         Set when published

  createdAt       TIMESTAMPTZ     DEFAULT now()    Draft created

  updatedAt       TIMESTAMPTZ     Auto-updated     Last edited
  ----------------------------------------------------------------------------

**Table: Tag, PostTag (junction), Comment, Like, Bookmark, Follow**

  ------------------- ---------------------------------------------------
  **Tag**             id (PK), name VARCHAR(50) UNIQUE, postCount INTEGER

  **PostTag**         postId FK, tagId FK --- composite PK

  **Comment**         id, postId FK, authorId FK, parentId FK (nullable),
                      body TEXT, createdAt

  **Like**            userId FK, postId FK --- composite PK

  **Bookmark**        userId FK, postId FK --- composite PK, createdAt

  **Follow**          followerId FK, followingId FK --- composite PK,
                      createdAt
  ------------------- ---------------------------------------------------

**2.2 API Endpoint Reference**

**Authentication**

  ---------------------------------------------------------------------------------
  **Method**   **Endpoint**               **Auth Required**   **Description**
  ------------ -------------------------- ------------------- ---------------------
  POST         /api/auth/register         No                  Create account + set
                                                              JWT cookie

  POST         /api/auth/login            No                  Validate
                                                              credentials + set JWT
                                                              cookie

  POST         /api/auth/logout           Yes                 Clear JWT cookie

  POST         /api/auth/reset-password   No                  Send OTP to email
  ---------------------------------------------------------------------------------

**Posts**

  ------------------------------------------------------------------------------
  **Method**   **Endpoint**            **Auth Required**   **Description**
  ------------ ----------------------- ------------------- ---------------------
  GET          /api/posts              No (public)         List published posts;
                                                           ?tag=&page=&limit=

  GET          /api/posts/:slug        No                  Get single post by
                                                           slug

  POST         /api/posts              Yes                 Create new post
                                                           (draft or published)

  PATCH        /api/posts/:id          Yes (owner)         Update post content,
                                                           tags, status

  DELETE       /api/posts/:id          Yes (owner)         Soft-delete post

  POST         /api/posts/:id/like     Yes                 Toggle like on post
  ------------------------------------------------------------------------------

**Users, Comments, Tags, Bookmarks**

  -------------------------------------------------------------------------------
  **Method**   **Endpoint**             **Auth Required**   **Description**
  ------------ ------------------------ ------------------- ---------------------
  GET          /api/users/:username     No                  Public profile

  PATCH        /api/users/me            Yes                 Update own profile /
                                                            theme

  POST         /api/users/:id/follow    Yes                 Toggle follow

  GET          /api/comments/:postId    No                  Get comments for post

  POST         /api/comments            Yes                 Create comment or
                                                            reply

  DELETE       /api/comments/:id        Yes (owner)         Delete own comment

  GET          /api/tags/trending       No                  Top 20 tags by post
                                                            count (cached)

  POST         /api/bookmarks/:postId   Yes                 Toggle bookmark

  GET          /api/bookmarks           Yes                 Get own bookmarks

  POST         /api/upload/cover        Yes                 Upload cover image to
                                                            Cloudinary
  -------------------------------------------------------------------------------

**2.3 Middleware Stack (Express)**

1.  helmet() --- security headers

2.  cors(corsOptions) --- origin whitelist

3.  express.json({ limit: \'2mb\' }) --- body parser

4.  cookieParser(JWT_SECRET) --- cookie parsing

5.  generalRateLimiter --- 60 req/min

6.  authMiddleware (JWT verify) --- applied to protected routes

7.  errorHandler --- global async error boundary, returns JSON { error,
    message }

**2.4 Server Folder Structure**

-   /server

    -   /controllers/ --- authController, postController,
        userController, commentController

    -   /middleware/ --- auth.js, rateLimiter.js, upload.js,
        errorHandler.js

    -   /routes/ --- auth.js, posts.js, users.js, comments.js, tags.js,
        bookmarks.js

    -   /services/ --- cloudinary.js, email.js, cache.js

    -   /validators/ --- Zod schemas for each endpoint body

    -   /prisma/ --- schema.prisma, migrations/

    -   app.js --- Express setup + middleware chain

    -   server.js --- HTTP server boot, port binding
