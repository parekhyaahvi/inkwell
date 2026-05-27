**InkWell**

**Pre-Deployment Security Checklist**

Vercel Deployment --- InkWell Blogging Platform

Version 1.0 \| May 2026

**How to Use This Checklist**

Work through every item before promoting InkWell to production on
Vercel. Check each box as you verify it. Items marked CRITICAL must be
resolved before go-live. Others are high-priority but may be deferred to
the first patch release with documented risk acceptance.

Last reviewed: May 2026 \| Platform: Vercel (frontend) + Railway
(backend) + Supabase (database)

**1. Environment Variables & Secrets**

-   CRITICAL: No secrets committed to git. Run: git log -p \| grep -i
    \'secret\\\|password\\\|api_key\' to verify.

-   All environment variables set in Vercel dashboard (Settings →
    Environment Variables) for Production, Preview, and Development
    separately.

-   All environment variables set in Railway dashboard for backend
    service.

-   JWT_SECRET is at least 64 characters, generated with: node -e
    \"console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))\".

-   CLOUDINARY_API_SECRET, RESEND_API_KEY, DATABASE_URL are all rotated
    from any values used during development.

-   .env file is listed in .gitignore. Verify with: cat .gitignore \|
    grep .env.

-   Vercel preview deployments use separate (non-production) API keys
    and database.

**2. Authentication & Session Security**

-   CRITICAL: JWT cookie is set with httpOnly: true, secure: true,
    sameSite: \'strict\'.

-   JWT_SECRET is never sent to the client or logged anywhere.

-   JWT token expiry is set (e.g., 7d). Refresh token strategy
    documented for v1.1.

-   Password hashing uses bcrypt with cost factor \>= 12. Verify: no
    plaintext passwords in DB.

-   Registration endpoint validates email format and enforces minimum
    password length (8 chars, 1 upper, 1 number).

-   Failed login attempts are rate-limited (max 5 attempts per 10 min
    per IP via Redis).

-   Password reset OTP expires after 15 minutes. OTP is single-use
    (marked used after consumption).

-   Logout endpoint clears cookie server-side (res.clearCookie) in
    addition to client-side.

**3. Input Validation & Sanitisation**

-   CRITICAL: All user-supplied content (post body, comments, bio) is
    sanitised with DOMPurify before being saved to the database.

-   All API request bodies are validated with Zod schemas. Invalid
    requests return 400 with no stack trace.

-   File uploads validated: MIME type check (image/jpeg, image/png,
    image/webp only), max size 5 MB enforced by Multer.

-   Slug generation strips dangerous characters: only a-z, 0-9, and
    hyphens allowed.

-   SQL injection: Prisma parameterised queries used everywhere. No raw
    SQL with string interpolation.

-   Tag input: max 10 tags per post; each tag max 50 characters;
    stripped of HTML.

**4. HTTP Security Headers (via Helmet.js)**

-   helmet() is the first middleware in the Express chain.

-   Verify headers in production using: curl -I
    https://api.inkwell.app/api/health. Expected headers:

-   X-Content-Type-Options: nosniff

-   X-Frame-Options: DENY (prevents clickjacking)

-   X-XSS-Protection: 0 (modern browsers use CSP instead)

-   Strict-Transport-Security: max-age=31536000; includeSubDomains

-   Referrer-Policy: strict-origin-when-cross-origin

-   Content-Security-Policy: configured (see item below)

-   Content Security Policy (CSP) configured in Vercel → Headers config:
    default-src \'self\'; script-src \'self\'; style-src \'self\'
    \'unsafe-inline\'; img-src \'self\' res.cloudinary.com data:;
    connect-src \'self\' api.inkwell.app.

-   Vercel dashboard: Force HTTPS is enabled (Settings → Domains → HTTPS
    enforcement).

**5. CORS Configuration**

-   CRITICAL: CORS origin is set to exact production URL only (e.g.,
    https://inkwell.app). Wildcard (\*) is never used in production.

-   CORS credentials: true is set to allow the auth cookie to be sent
    cross-origin.

-   Allowed methods: GET, POST, PATCH, DELETE only.

-   Allowed headers: Content-Type, Authorization only.

-   Preflight OPTIONS responses cached for 86400 s (maxAge setting).

**6. Rate Limiting & Abuse Prevention**

-   Rate limiter using express-rate-limit + Upstash Redis is applied to
    all routes.

-   Auth endpoints (/api/auth/\*): 10 requests per 15 minutes per IP.

-   Upload endpoints: 20 requests per hour per user.

-   General API: 60 requests per minute per IP.

-   Rate limit response returns 429 with Retry-After header. Body: {
    error: \'Too many requests\' } --- no stack trace.

-   Brute-force lockout: account temporarily locked (5 min) after 10
    consecutive failed login attempts.

**7. Database Security**

-   CRITICAL: Database URL uses SSL (sslmode=require in Supabase
    connection string).

-   Database is not publicly accessible; only the Railway backend
    service IP is whitelisted in Supabase firewall.

-   Principle of least privilege: database user has SELECT, INSERT,
    UPDATE, DELETE only --- not DROP or CREATE.

-   All database migrations tested in staging before running on
    production.

-   Automated daily backups enabled in Supabase (verify in Settings →
    Database → Backups).

-   No sensitive data (passwords, tokens) logged in any console.log or
    error messages.

**8. API & Business Logic Security**

-   CRITICAL: All write endpoints (POST, PATCH, DELETE) verify JWT
    cookie via authMiddleware before processing.

-   Ownership checks: PATCH /api/posts/:id and DELETE /api/posts/:id
    verify post.authorId === req.user.id.

-   Comment deletion: verify comment.authorId === req.user.id before
    allowing delete.

-   Admin actions (if any in future) gated by a role field on User ---
    never inferred from client payload.

-   Sensitive user data (passwordHash, email) never returned in
    public-facing API responses (e.g., GET /api/users/:username).

-   Error responses never include stack traces, internal file paths, or
    database query details in production (NODE_ENV=production check).

**9. Vercel-Specific Configuration**

-   vercel.json includes a headers block setting X-Frame-Options,
    X-Content-Type-Options, and CSP for all routes (/\*).

-   Vercel preview deployment access is restricted to team members only
    (Settings → Git → Deploy Hooks & Protection).

-   Production deployment requires manual promotion or a protected
    branch (main) --- no auto-deploy from feature branches to prod.

-   Vercel Web Analytics enabled to monitor for traffic spikes that may
    indicate abuse.

-   Domain configured with DNSSEC enabled at registrar level.

-   Custom domain uses Vercel-managed TLS certificate (auto-renewed).
    Certificate expiry monitored.

**10. Dependency & Supply Chain Security**

-   npm audit run with zero high/critical vulnerabilities before
    deployment: npm audit \--audit-level=high.

-   All dependencies pinned to exact versions in package.json (no \^ or
    \~ in production deps).

-   Dependabot or Renovate bot enabled in GitHub repository for
    automated dependency updates.

-   No unused dependencies in package.json (run: npx depcheck).

-   Third-party scripts (if any) loaded with integrity (SRI) hashes.

**11. File Upload Security**

-   File type validated server-side by checking magic bytes (file-type
    npm package), not just MIME type header.

-   Uploaded files are never executed or served from the application
    server; they go directly to Cloudinary CDN.

-   Cloudinary unsigned upload profile is NOT used; all uploads use
    signed upload with expiring signatures.

-   Max file size enforced at both Multer (5 MB) and Cloudinary (5 MB)
    levels.

**12. Monitoring & Incident Response**

-   Vercel log drain configured to external logging service (e.g.,
    Axiom, Logtail) for persistent logs.

-   Uptime monitoring configured (Better Uptime, UptimeRobot, or
    similar) to alert within 2 minutes of downtime.

-   Error tracking (Sentry) integrated in both frontend and backend. DSN
    set in environment variables.

-   Incident response contact (email/Slack) documented and tested with a
    test alert.

-   A basic runbook exists: what to do if the site is down / if a breach
    is suspected.

**Sign-Off**

  ---------------------------------------------------------------------------------------------------
  **Role**                **Name**                                           **Date**
  ----------------------- -------------------------------------------------- ------------------------
  Lead Developer          \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_   \_\_\_\_\_\_\_\_\_\_\_

  Security Reviewer       \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_   \_\_\_\_\_\_\_\_\_\_\_

  Product Owner           \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_   \_\_\_\_\_\_\_\_\_\_\_
  ---------------------------------------------------------------------------------------------------

All CRITICAL items must be checked and signed off before production
traffic is enabled.
