import { Response } from 'express';

type SSEConnection = {
  id: string;
  res: Response;
};

class SSEService {
  private connections: Map<string, SSEConnection> = new Map();

  /**
   * Add a new SSE connection for a specific spawn ID
   */
  addConnection(spawnId: string, res: Response) {
    // Set headers for SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no' // Disable Nginx buffering if behind Nginx
    });

    // Send initial retry instruction
    res.write('retry: 10000\n\n');

    const connection = { id: spawnId, res };
    this.connections.set(spawnId, connection);

    // Remove connection on close
    res.on('close', () => {
      this.connections.delete(spawnId);
    });

    console.log(`[SSEService] Client connected for spawn: ${spawnId}`);
  }

  /**
   * Send an event to a specific spawn ID client
   */
  sendEvent(spawnId: string, event: string, data: any) {
    const connection = this.connections.get(spawnId);
    if (connection) {
      connection.res.write(`event: ${event}\n`);
      connection.res.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  }

  /**
   * Close a specific connection
   */
  closeConnection(spawnId: string) {
    const connection = this.connections.get(spawnId);
    if (connection) {
      connection.res.end();
      this.connections.delete(spawnId);
      console.log(`[SSEService] Connection closed for spawn: ${spawnId}`);
    }
  }
}

export const sseService = new SSEService();
