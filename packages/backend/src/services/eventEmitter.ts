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
  type: 'spawn:seed-complete' | 'spawn:image-complete' | 'spawn:analysis-complete' | 'spawn:profile-complete' | 'spawn:cancelled' | 'spawn:error' | 'hierarchy:classification-complete' | 'hierarchy:host-dna-complete' | 'hierarchy:region-dna-complete' | 'hierarchy:location-dna-complete' | 'hierarchy:niche-dna-complete' | 'hierarchy:detail-dna-complete' | 'hierarchy:image-prompt-generated' | 'hierarchy:all-image-prompts-complete' | 'hierarchy:image-generation-started' | 'hierarchy:image-complete' | 'hierarchy:visual-analysis-complete' | 'hierarchy:complete' | 'hierarchy:error';
  data: any;
}

class EventEmitter {
  private clients: Map<string, Client> = new Map();

  /**
   * Add a new SSE client
   */
  addClient(clientId: string, response: Response): void {
    this.clients.set(clientId, { id: clientId, response });
  }

  /**
   * Remove a client
   */
  removeClient(clientId: string): void {
    this.clients.delete(clientId);
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
