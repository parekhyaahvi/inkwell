# InkWell: Technical Features Report

This report outlines the technical features and capabilities of the InkWell platform based on its source code, architecture, and database schema.

## 1. System Architecture
- **Backend Framework**: Node.js with Express.js.
- **Database**: MongoDB, interfaced through Prisma ORM for schema definition and queries.
- **Frontend**: Static HTML, CSS, and vanilla JavaScript interacting with the backend via REST API.
- **Deployment**: Configured for Railway, with a unified deployment where the Node server serves both the API and the static frontend assets.

## 2. Core Features

### Authentication and User Management
- **Registration and Login**: Secure password handling using `bcrypt` and session management via HTTP-only JWT cookies (`cookie-parser`, `jsonwebtoken`).
- **Profiles**: Users have customizable profiles including a unique username, display name, biography, and an avatar.
- **Preferences**: Native support for light and dark theme toggling.

### Content Creation and Publishing (Blogging)
- **Post Lifecycle**: Articles can be saved as drafts or published. Each post includes a title, slug, content body, and an optional cover image.
- **Rich Content Security**: Content is sanitized server-side using `dompurify` and `jsdom` to prevent XSS attacks before storage.
- **Tagging System**: A many-to-many relationship system allows posts to be categorized with multiple tags. Tag usage counts are tracked.

### Social and Community Engagement
- **Follow System**: Users can follow other authors, establishing a directional follower/following graph.
- **Comments**: Supports a threaded commenting system allowing users to leave top-level comments and nested replies on posts.
- **Likes**: Users can like posts, with total like counts aggregated and cached.
- **Bookmarks**: Users can save posts to their personal bookmarks for later reading.

### File and Asset Management
- **Image Uploads**: File uploads (avatars, post covers) are handled securely using `multer` for multipart form data, validated via `file-type`, and stored externally.
- **External Storage Integration**: Configured to upload and serve media assets through Cloudinary.

## 3. Security and Reliability Enhancements
- **Data Validation**: Request bodies and parameters are strictly validated using `zod` schemas.
- **Protection Measures**:
  - `helmet` is implemented for setting secure HTTP headers.
  - `express-rate-limit` prevents brute-force attacks and limits API abuse.
  - `cors` is configured to restrict cross-origin requests to trusted origins.
- **Health Checks**: A lightweight `GET /api/health` endpoint is available for uptime monitoring.

## 4. Email Integration
- The presence of the `resend` SDK indicates capabilities for transactional emails, which can be utilized for welcome emails, password resets, or notifications.

## 5. Performance
- **Caching**: A dedicated `Cache` collection in MongoDB exists for storing temporary key/value pairs with expiration dates, likely used to reduce database load for frequent or intensive queries.
