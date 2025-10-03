# GCP Monorepo

This project is a monorepo containing a React frontend and an Express.js backend, managed using npm workspaces.

## Getting Started

### 1. Install Dependencies

Navigate to the root of the project and install all dependencies for both the frontend and backend packages:

```bash
npm install
```

### 2. Start Both Frontend and Backend (Recommended)

To start both the Express.js backend and the React frontend development servers simultaneously:

```bash
npm run dev
```

The backend will run on `http://localhost:3000` (or the port you configured), and the frontend will typically open in your browser at `http://localhost:5173` (or another available port).

### 3. Run the Backend (Separately)

If you need to run only the backend server in development mode (with live reloading):

```bash
cd packages/backend
npm run dev
```

By default, the backend runs on `http://localhost:3000`. If this port is already in use, you will need to change it in `packages/backend/src/server.ts` (e.g., to `3001`). If you change the backend port, remember to also update the proxy configuration in `packages/frontend/vite.config.ts`.

### 4. Run the Frontend (Separately)

If you need to run only the React frontend development server:

```bash
cd packages/frontend
npm run dev
```

### API Proxy

The frontend is configured to proxy API requests (e.g., requests to `/api/your-endpoint`) to the backend server. This helps avoid Cross-Origin Resource Sharing (CORS) issues during development.

## Deployment

This project includes an interactive script to deploy the application to Google Cloud Platform (GCP).

### 1. Configure Environment

Before deploying, you must provide your GCP project details.

1.  Make a copy of the example environment file:
    ```bash
    cp .env.example .env
    ```
2.  Open the new `.env` file in a text editor.
3.  Fill in the placeholder values (e.g., `your-gcp-project-id`, `your-gcp-region`, etc.) with your actual GCP configuration. This file is included in `.gitignore` and will not be committed.

### 2. Run the Deploy Script

Once your `.env` file is configured, you can start the deployment by running:

```bash
npm run deploy
```

The script will ask for confirmation before proceeding to build the Docker image and deploy it to Cloud Run.
