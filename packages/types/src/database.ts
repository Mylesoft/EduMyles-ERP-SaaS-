export interface DatabaseConnection {
  url: string;
  maxConnections?: number;
  ssl?: boolean;
}

export interface DatabaseMigration {
  id: string;
  name: string;
  version: string;
  up: string;
  down: string;
  runAt?: Date;
}

export * from './module';