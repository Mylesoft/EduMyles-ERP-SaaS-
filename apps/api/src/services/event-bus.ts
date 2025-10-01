import { createClient, RedisClientType } from 'redis';
import { v4 as uuidv4 } from 'uuid';
import { EventBus, EventBusEvent, EventHandler, SubscriptionOptions } from '@edumyles/types';
import { logger } from '../utils/logger';

class RedisEventBus implements EventBus {
  private client: RedisClientType | null = null;
  private subscriptions: Map<string, { handler: EventHandler; options?: SubscriptionOptions }> = new Map();

  async connect(): Promise<void> {
    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      });

      this.client.on('error', (error) => {
        logger.error('Redis client error:', error);
      });

      this.client.on('connect', () => {
        logger.info('Redis client connected');
      });

      this.client.on('disconnect', () => {
        logger.info('Redis client disconnected');
      });

      await this.client.connect();
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      if (!this.client) return false;
      await this.client.ping();
      return true;
    } catch (error) {
      logger.error('Redis health check failed:', error);
      return false;
    }
  }

  async publish(event: Omit<EventBusEvent, 'id' | 'timestamp'>): Promise<void> {
    if (!this.client) {
      throw new Error('Event bus not connected');
    }

    const eventWithMeta: EventBusEvent = {
      ...event,
      id: uuidv4(),
      timestamp: new Date(),
    };

    try {
      // Publish to specific event type channel
      await this.client.publish(`event:${event.type}`, JSON.stringify(eventWithMeta));
      
      // Publish to tenant-specific channel
      await this.client.publish(`tenant:${event.tenantId}:events`, JSON.stringify(eventWithMeta));
      
      // Store event in database for audit/replay purposes
      const { publishEvent } = await import('@edumyles/database');
      await publishEvent(eventWithMeta);

      logger.debug('Event published:', {
        id: eventWithMeta.id,
        type: event.type,
        source: event.source,
        tenantId: event.tenantId,
      });
    } catch (error) {
      logger.error('Failed to publish event:', error);
      throw error;
    }
  }

  async subscribe(
    eventType: string,
    handler: EventHandler,
    options?: SubscriptionOptions
  ): Promise<string> {
    if (!this.client) {
      throw new Error('Event bus not connected');
    }

    const subscriptionId = uuidv4();
    const subscriber = this.client.duplicate();
    
    await subscriber.connect();

    this.subscriptions.set(subscriptionId, { handler, options });

    await subscriber.subscribe(`event:${eventType}`, async (message) => {
      try {
        const event: EventBusEvent = JSON.parse(message);
        
        // Apply filter if provided
        if (options?.filter && !options.filter(event)) {
          return;
        }

        await this.handleEventWithRetry(handler, event, options?.retryPolicy);
      } catch (error) {
        logger.error('Error handling event:', error);
      }
    });

    logger.debug('Subscribed to event:', {
      subscriptionId,
      eventType,
      priority: options?.priority || 0,
    });

    return subscriptionId;
  }

  async unsubscribe(subscriptionId: string): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      throw new Error(`Subscription ${subscriptionId} not found`);
    }

    this.subscriptions.delete(subscriptionId);

    logger.debug('Unsubscribed from event:', { subscriptionId });
  }

  async getSubscriptions(moduleId: string) {
    const { getEventSubscriptions } = await import('@edumyles/database');
    return getEventSubscriptions(moduleId);
  }

  private async handleEventWithRetry(
    handler: EventHandler,
    event: EventBusEvent,
    retryPolicy?: SubscriptionOptions['retryPolicy']
  ): Promise<void> {
    let attempt = 0;
    const maxRetries = retryPolicy?.maxRetries || 0;

    while (attempt <= maxRetries) {
      try {
        await handler(event);
        return; // Success, exit retry loop
      } catch (error) {
        attempt++;
        
        if (attempt > maxRetries) {
          logger.error('Event handler failed after all retries:', {
            eventId: event.id,
            attempt,
            error,
          });
          throw error;
        }

        const delay = this.calculateBackoffDelay(attempt, retryPolicy);
        logger.warn('Event handler failed, retrying:', {
          eventId: event.id,
          attempt,
          delay,
          error: error instanceof Error ? error.message : error,
        });

        await this.delay(delay);
      }
    }
  }

  private calculateBackoffDelay(
    attempt: number,
    retryPolicy?: SubscriptionOptions['retryPolicy']
  ): number {
    if (!retryPolicy) return 1000; // Default 1 second

    const baseDelay = 1000;
    const multiplier = retryPolicy.backoffMultiplier || 2;
    const maxDelay = retryPolicy.maxBackoffDelay || 30000;

    const delay = baseDelay * Math.pow(multiplier, attempt - 1);
    return Math.min(delay, maxDelay);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const eventBus = new RedisEventBus();