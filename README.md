# InkWell

Deployed website: https://inkwell-yaahvi.vercel.app

## Production Deployment

Frontend: deploy the static `frontend/` app to Vercel.

Backend: deploy the Express/Prisma app to Railway.

Required Railway environment variables:

- `DATABASE_URL`
- `JWT_SECRET`
- `CORS_ORIGIN` set to the Vercel frontend origin, for example `https://inkwell-yaahvi.vercel.app`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_FOLDER` optional, defaults to `inkwell`

Frontend API base URL:

- Set `window.__INKWELL_API_BASE_URL__` to the Railway backend URL in production, or store it in `localStorage` under `inkwellApiBaseUrl`.