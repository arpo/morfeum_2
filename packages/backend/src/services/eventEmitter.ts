/**
 * Event Emitter Service - Server-Sent Events (SSE)
 * Manages client connections and broadcasts events
 */

import { Response } from 'express';

interface Client {
  id: string;
  response: Response;
}

interface SpawnEvent {
  type: 'spawn:seed-complete' | 'spawn:image-complete' | 'spawn:analysis-complete' | 'spawn:profile-complete' | 'spawn:cancelled' | 'spawn:error' | 'spawn:sublocation-dna-complete' | 'spawn:sublocation-image-prompt-complete' | 'spawn:sublocation-image-complete' | 'spawn:sublocation-complete';
  data: any;
}

class EventEmitter {
  private clients: Map<string, Client> = new Map();

  /**
   * Add a new SSE client
   */
  addClient(clientId: string, response: Response): void {
    this.clients.set(clientId, { id: clientId, response });
    console.log(`[EventEmitter] Client connected: ${clientId} (Total: ${this.clients.size})`);
  }

  /**
   * Remove a client
   */
  removeClient(clientId: string): void {
    this.clients.delete(clientId);
    console.log(`[EventEmitter] Client disconnected: ${clientId} (Total: ${this.clients.size})`);
  }

  /**
   * Emit an event to all connected clients
   */
  emit(event: SpawnEvent): void {
    const message = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
    
    // console.log(`[EventEmitter] Broadcasting event: ${event.type}`, event.data);

    this.clients.forEach((client) => {
      try {
        client.response.write(message);
      } catch (error) {
        console.error(`[EventEmitter] Failed to send to client ${client.id}:`, error);
        this.removeClient(client.id);
      }
    });
  }

  /**
   * Get the number of connected clients
   */
  getClientCount(): number {
    return this.clients.size;
  }
}

// Export singleton instance
export const eventEmitter = new EventEmitter();
