# InkWell

Deployed website: https://inkwell-yaahvi.up.railway.app/

InkWell is a modern blogging platform built for long-form writing, community discovery, and lightweight social publishing. It combines a polished editorial experience with author profiles, comments, tags, bookmarks, likes, and follow relationships so writers can publish and readers can engage in one place.

## Overview

The app is structured as a full-stack Express and Prisma backend with a static frontend served from the same deployment. The experience is designed around a clean public landing page, an authentication flow, a writer-friendly dashboard, post detail pages, and public profile pages. Content is stored in MongoDB through Prisma, while images are handled through Cloudinary in production.

## Key Features

- Account registration, login, logout, and session cookies
- Author profiles with display names, bios, avatars, followers, and following lists
- Post creation, editing, publishing, drafts, and slugs
- Tagging, likes, bookmarks, and threaded comments
- Image uploads for post covers and profile assets
- Personalized feeds and profile-based public discovery
- Theme support and a glassmorphism-inspired UI
- Security controls including Zod validation, Helmet headers, rate limiting, and sanitised content

## Site Areas

- Landing page: introduces the product and links to sign in or start writing
- Auth page: handles sign up and log in with inline validation
- Dashboard: writer workspace for creating and managing posts
- Post page: public reading view for a single article
- Profile page: public author profile with activity and social actions
- Settings page: personal preferences and account configuration

## Production Deployment

Frontend: served by the Railway app at the deployed website URL above.

Backend: deploy the Express/Prisma app to Railway.

Required Railway environment variables:

- `DATABASE_URL`
- `JWT_SECRET`
- `CORS_ORIGIN` set to the deployed frontend origin, for example `https://inkwell-yaahvi.up.railway.app`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_FOLDER` optional, defaults to `inkwell`

Frontend API base URL:

- Set `window.__INKWELL_API_BASE_URL__` to the Railway backend URL in production, or store it in `localStorage` under `inkwellApiBaseUrl`.

## Tech Stack

- Backend: Node.js, Express, Prisma, MongoDB
- Auth: JWT cookies, bcrypt
- Validation: Zod
- Uploads: Multer, file-type, Cloudinary
- Frontend: HTML, CSS, vanilla JavaScript

## Development Notes

- The backend exposes `GET /api/health` for a lightweight health check.
- API requests from the frontend go through a shared helper so the production backend base URL can be configured centrally.
- Production CORS is configured to allow the deployed frontend origin and same-host requests when needed.

## Project Structure

- `backend/` contains the Express app, controllers, routes, middleware, services, validators, and Prisma schema.
- `frontend/` contains static pages, scripts, styles, and assets.
- `reference/` contains product and security documentation used while building the app.

## Running Locally

Install dependencies and start the app with the usual Node workflow:

```bash
npm install
npm run dev
```

Set the required environment variables before starting production or development if you want to use external services such as MongoDB Atlas and Cloudinary.
