# Healthcare Portal Deployment Guide

This project is configured for deployment on **Render**.

## Deployment Steps

1. **Connect Repository**: Connect your GitHub repository to Render.
2. **Select Web Service**: Choose "Web Service" as the service type.
3. **Configure Settings**:
   - **Runtime**: `Node`
   - **Root Directory**: `.` (Make sure this matches the folder containing `package.json`)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. **Environment Variables**:
   - `GEMINI_API_KEY`: Your Google Gemini API Key.
   - `NODE_ENV`: `production` (Automatically set in `render.yaml`)
   - `PORT`: `3000` (Automatically set in `render.yaml`)

## Blueprints (Recommended)

You can use the included `render.yaml` to deploy using Render Blueprints. This automatically configures all the settings above.

1. Go to "Blueprints" in the Render dashboard.
2. Connect your repository.
3. Render will use the `render.yaml` file to set up your service.

## Troubleshooting "ENOENT: no such file or directory, open package.json"

If you see this error, it means Render is looking for `package.json` in the wrong place.
- Check your **Root Directory** setting in Render. It should be the path from the root of your Git repository to the folder containing `package.json`.
- If your code is in a subfolder like `client` or `server`, set the Root Directory to that folder.
