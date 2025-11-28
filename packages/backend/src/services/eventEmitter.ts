/**
 * Simple Event Emitter
 * 
 * Provides a basic event emission system for internal pipeline events.
 * Events are logged but not currently consumed - this allows for future
 * event-based integrations without breaking the build.
 */

export interface PipelineEvent {
  type: string;
  data: any;
}

type EventHandler = (event: PipelineEvent) => void;

class EventEmitter {
  private handlers: Map<string, EventHandler[]> = new Map();

  /**
   * Emit an event
   */
  emit(event: PipelineEvent): void {
    // Get handlers for this event type
    const handlers = this.handlers.get(event.type) || [];
    
    // Call each handler
    for (const handler of handlers) {
      try {
        handler(event);
      } catch (error) {
        console.error(`[EventEmitter] Handler error for ${event.type}:`, error);
      }
    }
  }

  /**
   * Register a handler for an event type
   */
  on(eventType: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType) || [];
    handlers.push(handler);
    this.handlers.set(eventType, handlers);
  }

  /**
   * Remove a handler for an event type
   */
  off(eventType: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType) || [];
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
      this.handlers.set(eventType, handlers);
    }
  }

  /**
   * Remove all handlers for an event type
   */
  clear(eventType?: string): void {
    if (eventType) {
      this.handlers.delete(eventType);
    } else {
      this.handlers.clear();
    }
  }
}

export const eventEmitter = new EventEmitter();
