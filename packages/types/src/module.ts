export interface EduMylesModule {
  // Metadata
  id: string;
  name: string;
  version: string;
  description: string;
  icon?: string;
  category: ModuleCategory;
  author: string;
  homepage?: string;
  repository?: string;

  // Technical Specifications
  dependencies: string[]; // Other modules it depends on
  permissions: Permission[]; // Permissions it requires
  databaseSchema?: DatabaseSchema; // DB changes it needs
  apiEndpoints: APIEndpoint[]; // APIs it exposes

  // UI Components
  dashboardWidgets?: Widget[];
  navigationItems?: NavigationItem[];
  settingsPanel?: SettingsPanel;

  // Lifecycle Hooks
  onInstall: () => Promise<void>;
  onUninstall: () => Promise<void>;
  onEnable?: () => Promise<void>;
  onDisable?: () => Promise<void>;

  // Configuration
  config?: ModuleConfig;
  pricing?: ModulePricing;

  // Integration Points
  eventSubscriptions?: EventSubscription[];
  dataExports?: DataExport[];
  dataImports?: DataImport[];
}

export interface ModuleManifest {
  module: EduMylesModule;
  screenshots?: string[];
  documentation?: string;
  changelog?: string;
  supportEmail?: string;
}

export interface ModuleConfig {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect';
    default?: any;
    required?: boolean;
    description?: string;
    options?: string[]; // for select/multiselect
  };
}

export interface ModulePricing {
  type: 'free' | 'subscription' | 'one-time' | 'usage-based';
  price?: number;
  currency?: string;
  billingCycle?: 'monthly' | 'yearly';
  usageUnit?: string; // e.g., 'per student', 'per SMS'
  freeTrialDays?: number;
}

export interface ModuleCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

export interface Widget {
  id: string;
  title: string;
  component: string;
  size: 'small' | 'medium' | 'large';
  permissions?: string[];
  refreshInterval?: number;
}

export interface NavigationItem {
  id: string;
  title: string;
  path: string;
  icon?: string;
  permissions?: string[];
  children?: NavigationItem[];
}

export interface SettingsPanel {
  title: string;
  component: string;
  permissions?: string[];
}

export interface EventSubscription {
  eventType: string;
  handler: string; // Function name to call
  priority?: number;
}

export interface DataExport {
  id: string;
  name: string;
  description: string;
  schema: any; // JSON schema
}

export interface DataImport {
  id: string;
  name: string;
  description: string;
  schema: any; // JSON schema
  handler: string; // Function name to call
}

export interface APIEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  handler: string;
  permissions?: string[];
  middleware?: string[];
  documentation?: {
    summary: string;
    description?: string;
    parameters?: APIParameter[];
    responses?: APIResponse[];
  };
}

export interface APIParameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'body';
  type: string;
  required?: boolean;
  description?: string;
}

export interface APIResponse {
  status: number;
  description: string;
  schema?: any;
}

export interface DatabaseSchema {
  tables?: TableSchema[];
  migrations?: Migration[];
}

export interface TableSchema {
  name: string;
  columns: ColumnSchema[];
  indexes?: IndexSchema[];
  constraints?: ConstraintSchema[];
}

export interface ColumnSchema {
  name: string;
  type: string;
  nullable?: boolean;
  default?: any;
  primaryKey?: boolean;
  unique?: boolean;
}

export interface IndexSchema {
  name: string;
  columns: string[];
  unique?: boolean;
}

export interface ConstraintSchema {
  name: string;
  type: 'foreign_key' | 'check' | 'unique';
  columns: string[];
  references?: {
    table: string;
    columns: string[];
  };
}

export interface Migration {
  version: string;
  description: string;
  up: string; // SQL or function
  down: string; // SQL or function
}

// Module Installation and Management
export interface ModuleInstallation {
  id: string;
  tenantId: string;
  moduleId: string;
  version: string;
  status: 'installing' | 'installed' | 'uninstalling' | 'error';
  config: Record<string, any>;
  installedAt: Date;
  updatedAt: Date;
  error?: string;
}

export interface ModuleRegistry {
  modules: Record<string, EduMylesModule>;
  categories: ModuleCategory[];
}

// Module Store
export interface ModuleStoreItem {
  module: EduMylesModule;
  installed: boolean;
  version: string;
  latestVersion: string;
  hasUpdate: boolean;
  rating: number;
  reviewCount: number;
  downloadCount: number;
  lastUpdated: Date;
}