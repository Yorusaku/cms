/**
 * Data Binding Engine
 *
 * Manages data sources and bindings between components and data.
 * Supports API data, static data, and computed data.
 */

export type DataSourceType = "api" | "static" | "computed";

export interface IDataSource {
  id: string;
  name: string;
  type: DataSourceType;
  // API source
  url?: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  params?: Record<string, any>;
  // Static source
  data?: any;
  // Computed source
  computeFn?: (context: any) => any;
  // Common
  cacheEnabled?: boolean;
  cacheDuration?: number; // milliseconds
  refreshInterval?: number; // milliseconds
  transformFn?: (data: any) => any;
  errorHandler?: (error: any) => any;
}

export interface IDataBinding {
  id: string;
  componentId: string;
  dataSourceId: string;
  targetProperty: string;
  enabled: boolean;
}

export interface DataSourceCache {
  data: any;
  timestamp: number;
}

export interface DataBindingEvent {
  dataSourceId: string;
  data: any;
  timestamp: number;
  error?: Error;
}

export interface DataBindingListener {
  (event: DataBindingEvent): void;
}

/**
 * DataBindingEngine manages data sources and bindings
 */
export class DataBindingEngine {
  private dataSources = new Map<string, IDataSource>();
  private bindings = new Map<string, IDataBinding>();
  private cache = new Map<string, DataSourceCache>();
  private listeners = new Map<string, Set<DataBindingListener>>();
  private refreshTimers = new Map<string, NodeJS.Timeout>();
  private componentData = new Map<string, Record<string, any>>();

  /**
   * Register a data source
   */
  registerDataSource(source: IDataSource): void {
    if (this.dataSources.has(source.id)) {
      console.warn(`Data source ${source.id} already exists`);
      return;
    }

    this.dataSources.set(source.id, source);

    // Start refresh interval if configured
    if (source.refreshInterval && source.refreshInterval > 0) {
      this.startRefreshInterval(source.id);
    }
  }

  /**
   * Unregister a data source
   */
  unregisterDataSource(sourceId: string): void {
    this.dataSources.delete(sourceId);
    this.cache.delete(sourceId);
    this.stopRefreshInterval(sourceId);
  }

  /**
   * Register a data binding
   */
  registerBinding(binding: IDataBinding): void {
    if (this.bindings.has(binding.id)) {
      console.warn(`Binding ${binding.id} already exists`);
      return;
    }

    this.bindings.set(binding.id, binding);
    this.initializeComponentData(binding.componentId);
  }

  /**
   * Unregister a binding
   */
  unregisterBinding(bindingId: string): void {
    this.bindings.delete(bindingId);
  }

  /**
   * Fetch data from a data source
   */
  async fetchData(sourceId: string): Promise<any> {
    const source = this.dataSources.get(sourceId);
    if (!source) {
      throw new Error(`Data source ${sourceId} not found`);
    }

    // Check cache
    if (source.cacheEnabled) {
      const cached = this.cache.get(sourceId);
      if (cached && Date.now() - cached.timestamp < (source.cacheDuration || 0)) {
        return cached.data;
      }
    }

    let data: any;

    try {
      switch (source.type) {
        case "api":
          data = await this.fetchFromAPI(source);
          break;
        case "static":
          data = source.data;
          break;
        case "computed":
          data = await this.computeData(source);
          break;
        default:
          throw new Error(`Unknown data source type: ${source.type}`);
      }

      // Apply transformation
      if (source.transformFn) {
        data = source.transformFn(data);
      }

      // Cache the data
      if (source.cacheEnabled) {
        this.cache.set(sourceId, {
          data,
          timestamp: Date.now(),
        });
      }

      // Notify listeners
      this.notifyListeners(sourceId, {
        dataSourceId: sourceId,
        data,
        timestamp: Date.now(),
      });

      return data;
    } catch (error) {
      // Handle error
      if (source.errorHandler) {
        try {
          return source.errorHandler(error);
        } catch (handlerError) {
          console.error(`Error in error handler for ${sourceId}:`, handlerError);
        }
      }

      // Notify listeners of error
      this.notifyListeners(sourceId, {
        dataSourceId: sourceId,
        data: null,
        timestamp: Date.now(),
        error: error as Error,
      });

      throw error;
    }
  }

  /**
   * Fetch data from API
   */
  private async fetchFromAPI(source: IDataSource): Promise<any> {
    const url = new URL(source.url || "");

    // Add query parameters
    if (source.params) {
      Object.entries(source.params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    const response = await fetch(url.toString(), {
      method: source.method || "GET",
      headers: source.headers,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Compute data
   */
  private async computeData(source: IDataSource): Promise<any> {
    if (!source.computeFn) {
      throw new Error("Compute function not provided");
    }

    return source.computeFn({});
  }

  /**
   * Apply data binding
   */
  async applyDataBinding(bindingId: string): Promise<void> {
    const binding = this.bindings.get(bindingId);
    if (!binding || !binding.enabled) {
      return;
    }

    try {
      const data = await this.fetchData(binding.dataSourceId);
      this.updateComponentData(binding.componentId, binding.targetProperty, data);
    } catch (error) {
      console.error(`Error applying binding ${bindingId}:`, error);
    }
  }

  /**
   * Apply all bindings for a component
   */
  async applyBindingsForComponent(componentId: string): Promise<void> {
    const componentBindings = Array.from(this.bindings.values()).filter(
      (b) => b.componentId === componentId && b.enabled
    );

    await Promise.all(
      componentBindings.map((binding) => this.applyDataBinding(binding.id))
    );
  }

  /**
   * Subscribe to data source changes
   */
  subscribe(sourceId: string, listener: DataBindingListener): () => void {
    if (!this.listeners.has(sourceId)) {
      this.listeners.set(sourceId, new Set());
    }

    this.listeners.get(sourceId)!.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.get(sourceId)?.delete(listener);
    };
  }

  /**
   * Notify listeners
   */
  private notifyListeners(sourceId: string, event: DataBindingEvent): void {
    const listeners = this.listeners.get(sourceId);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(event);
        } catch (error) {
          console.error(`Error in data binding listener for ${sourceId}:`, error);
        }
      });
    }
  }

  /**
   * Get component data
   */
  getComponentData(componentId: string): Record<string, any> {
    return this.componentData.get(componentId) || {};
  }

  /**
   * Update component data
   */
  private updateComponentData(
    componentId: string,
    property: string,
    value: any
  ): void {
    if (!this.componentData.has(componentId)) {
      this.componentData.set(componentId, {});
    }

    const data = this.componentData.get(componentId)!;
    data[property] = value;
  }

  /**
   * Initialize component data
   */
  private initializeComponentData(componentId: string): void {
    if (!this.componentData.has(componentId)) {
      this.componentData.set(componentId, {});
    }
  }

  /**
   * Start refresh interval for a data source
   */
  private startRefreshInterval(sourceId: string): void {
    const source = this.dataSources.get(sourceId);
    if (!source || !source.refreshInterval) {
      return;
    }

    const timerId = setInterval(() => {
      this.fetchData(sourceId).catch((error) => {
        console.error(`Error refreshing data source ${sourceId}:`, error);
      });
    }, source.refreshInterval);

    this.refreshTimers.set(sourceId, timerId);
  }

  /**
   * Stop refresh interval for a data source
   */
  private stopRefreshInterval(sourceId: string): void {
    const timerId = this.refreshTimers.get(sourceId);
    if (timerId) {
      clearInterval(timerId);
      this.refreshTimers.delete(sourceId);
    }
  }

  /**
   * Clear cache for a data source
   */
  clearCache(sourceId: string): void {
    this.cache.delete(sourceId);
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.cache.clear();
  }

  /**
   * Get all data sources
   */
  getAllDataSources(): IDataSource[] {
    return Array.from(this.dataSources.values());
  }

  /**
   * Get all bindings
   */
  getAllBindings(): IDataBinding[] {
    return Array.from(this.bindings.values());
  }

  /**
   * Get bindings for a component
   */
  getBindingsForComponent(componentId: string): IDataBinding[] {
    return Array.from(this.bindings.values()).filter(
      (b) => b.componentId === componentId
    );
  }

  /**
   * Enable/disable a binding
   */
  setBindingEnabled(bindingId: string, enabled: boolean): void {
    const binding = this.bindings.get(bindingId);
    if (binding) {
      binding.enabled = enabled;
    }
  }

  /**
   * Destroy the engine
   */
  destroy(): void {
    // Stop all refresh intervals
    this.refreshTimers.forEach((timerId) => clearInterval(timerId));
    this.refreshTimers.clear();

    // Clear all data
    this.dataSources.clear();
    this.bindings.clear();
    this.cache.clear();
    this.listeners.clear();
    this.componentData.clear();
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      totalDataSources: this.dataSources.size,
      apiSources: Array.from(this.dataSources.values()).filter(
        (s) => s.type === "api"
      ).length,
      staticSources: Array.from(this.dataSources.values()).filter(
        (s) => s.type === "static"
      ).length,
      computedSources: Array.from(this.dataSources.values()).filter(
        (s) => s.type === "computed"
      ).length,
      totalBindings: this.bindings.size,
      enabledBindings: Array.from(this.bindings.values()).filter((b) => b.enabled)
        .length,
      cachedSources: this.cache.size,
      activeRefreshIntervals: this.refreshTimers.size,
    };
  }
}

/**
 * Create a singleton instance of DataBindingEngine
 */
let instance: DataBindingEngine | null = null;

export function getDataBindingEngine(): DataBindingEngine {
  if (!instance) {
    instance = new DataBindingEngine();
  }
  return instance;
}

export function createDataBindingEngine(): DataBindingEngine {
  return new DataBindingEngine();
}

/**
 * Helper function to create API data source
 */
export function createAPIDataSource(
  id: string,
  name: string,
  url: string,
  options?: Partial<IDataSource>
): IDataSource {
  return {
    id,
    name,
    type: "api",
    url,
    method: "GET",
    cacheEnabled: true,
    cacheDuration: 5000,
    ...options,
  };
}

/**
 * Helper function to create static data source
 */
export function createStaticDataSource(
  id: string,
  name: string,
  data: any,
  options?: Partial<IDataSource>
): IDataSource {
  return {
    id,
    name,
    type: "static",
    data,
    ...options,
  };
}

/**
 * Helper function to create computed data source
 */
export function createComputedDataSource(
  id: string,
  name: string,
  computeFn: (context: any) => any,
  options?: Partial<IDataSource>
): IDataSource {
  return {
    id,
    name,
    type: "computed",
    computeFn,
    ...options,
  };
}
