import express, { Request, Response } from 'express';
import path from 'path';

const app = express();
const port = process.env.PORT || 3000;

let frontendBuildPath: string;

if (process.env.NODE_ENV === 'production') {
  frontendBuildPath = '/app/packages/frontend/dist';
} else {
  frontendBuildPath = path.resolve(__dirname, '..', '..', 'frontend', 'dist');
}

// Define API routes BEFORE serving static files
app.get('/api', (req: Request, res: Response) => {
  res.send('Hello from the backend API!');
});

app.get('/health', (req: Request, res: Response) => {
  res.status(200).send('OK');
});

// Serve static files from the frontend build directory
app.use(express.static(frontendBuildPath));

// Catch-all to serve index.html for client-side routing
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(frontendBuildPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Backend server is running at http://localhost:${port}`);
});
