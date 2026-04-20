/**
 * Component Linkage Engine
 *
 * Manages relationships and data flow between components.
 * Supports component-to-component communication and state synchronization.
 */

export interface IComponentLinkage {
  id: string;
  sourceComponentId: string;
  targetComponentId: string;
  sourceProperty: string;
  targetProperty: string;
  transformFn?: (value: any) => any;
  condition?: ILinkageCondition;
  enabled: boolean;
}

export interface ILinkageCondition {
  type: "simple" | "complex";
  expression?: string; // e.g., "value > 100"
  operator?: "AND" | "OR";
  conditions?: ILinkageCondition[];
}

export interface LinkageEvent {
  sourceComponentId: string;
  sourceProperty: string;
  value: any;
  timestamp: number;
}

export interface LinkageListener {
  (event: LinkageEvent): void;
}

/**
 * LinkageEngine manages component linkages and data flow
 */
export class LinkageEngine {
  private linkages = new Map<string, IComponentLinkage>();
  private listeners = new Map<string, Set<LinkageListener>>();
  private componentStates = new Map<string, Record<string, any>>();
  private linkageHistory: LinkageEvent[] = [];
  private maxHistorySize = 100;

  /**
   * Register a linkage between two components
   */
  registerLinkage(linkage: IComponentLinkage): void {
    if (this.linkages.has(linkage.id)) {
      console.warn(`Linkage ${linkage.id} already exists`);
      return;
    }

    this.linkages.set(linkage.id, linkage);
    this.initializeComponentState(linkage.sourceComponentId);
    this.initializeComponentState(linkage.targetComponentId);
  }

  /**
   * Unregister a linkage
   */
  unregisterLinkage(linkageId: string): void {
    this.linkages.delete(linkageId);
  }

  /**
   * Get all linkages for a component
   */
  getLinkagesForComponent(componentId: string): IComponentLinkage[] {
    return Array.from(this.linkages.values()).filter(
      (linkage) =>
        linkage.sourceComponentId === componentId ||
        linkage.targetComponentId === componentId
    );
  }

  /**
   * Trigger a linkage when source property changes
   */
  triggerLinkage(
    sourceComponentId: string,
    sourceProperty: string,
    value: any
  ): void {
    const event: LinkageEvent = {
      sourceComponentId,
      sourceProperty,
      value,
      timestamp: Date.now(),
    };

    // Record event in history
    this.recordEvent(event);

    // Update component state
    this.updateComponentState(sourceComponentId, sourceProperty, value);

    // Find and execute related linkages
    const relatedLinkages = Array.from(this.linkages.values()).filter(
      (linkage) =>
        linkage.sourceComponentId === sourceComponentId &&
        linkage.sourceProperty === sourceProperty &&
        linkage.enabled
    );

    for (const linkage of relatedLinkages) {
      if (this.evaluateCondition(linkage.condition, value)) {
        this.executeLinkage(linkage, value);
      }
    }

    // Notify listeners
    this.notifyListeners(sourceComponentId, event);
  }

  /**
   * Execute a linkage
   */
  private executeLinkage(linkage: IComponentLinkage, value: any): void {
    let transformedValue = value;

    // Apply transformation function if provided
    if (linkage.transformFn) {
      try {
        transformedValue = linkage.transformFn(value);
      } catch (error) {
        console.error(`Error in transform function for linkage ${linkage.id}:`, error);
        return;
      }
    }

    // Update target component state
    this.updateComponentState(
      linkage.targetComponentId,
      linkage.targetProperty,
      transformedValue
    );

    // Emit event for target component
    const targetEvent: LinkageEvent = {
      sourceComponentId: linkage.sourceComponentId,
      sourceProperty: linkage.sourceProperty,
      value: transformedValue,
      timestamp: Date.now(),
    };

    this.notifyListeners(linkage.targetComponentId, targetEvent);
  }

  /**
   * Evaluate linkage condition
   */
  private evaluateCondition(condition: ILinkageCondition | undefined, value: any): boolean {
    if (!condition) {
      return true;
    }

    if (condition.type === "simple" && condition.expression) {
      return this.evaluateExpression(condition.expression, value);
    }

    if (condition.type === "complex" && condition.conditions) {
      const operator = condition.operator || "AND";
      const results = condition.conditions.map((c) =>
        this.evaluateCondition(c, value)
      );

      if (operator === "AND") {
        return results.every((r) => r);
      } else if (operator === "OR") {
        return results.some((r) => r);
      }
    }

    return true;
  }

  /**
   * Evaluate a simple expression
   */
  private evaluateExpression(expression: string, value: any): boolean {
    try {
      // Create a safe evaluation context
      const context = { value };
      const func = new Function("value", `return ${expression}`);
      return func(value);
    } catch (error) {
      console.error(`Error evaluating expression "${expression}":`, error);
      return false;
    }
  }

  /**
   * Subscribe to linkage events for a component
   */
  subscribe(componentId: string, listener: LinkageListener): () => void {
    if (!this.listeners.has(componentId)) {
      this.listeners.set(componentId, new Set());
    }

    this.listeners.get(componentId)!.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.get(componentId)?.delete(listener);
    };
  }

  /**
   * Notify listeners of an event
   */
  private notifyListeners(componentId: string, event: LinkageEvent): void {
    const listeners = this.listeners.get(componentId);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(event);
        } catch (error) {
          console.error(`Error in linkage listener for ${componentId}:`, error);
        }
      });
    }
  }

  /**
   * Get component state
   */
  getComponentState(componentId: string): Record<string, any> {
    return this.componentStates.get(componentId) || {};
  }

  /**
   * Update component state
   */
  private updateComponentState(
    componentId: string,
    property: string,
    value: any
  ): void {
    if (!this.componentStates.has(componentId)) {
      this.componentStates.set(componentId, {});
    }

    const state = this.componentStates.get(componentId)!;
    state[property] = value;
  }

  /**
   * Initialize component state
   */
  private initializeComponentState(componentId: string): void {
    if (!this.componentStates.has(componentId)) {
      this.componentStates.set(componentId, {});
    }
  }

  /**
   * Record event in history
   */
  private recordEvent(event: LinkageEvent): void {
    this.linkageHistory.push(event);

    // Keep history size under control
    if (this.linkageHistory.length > this.maxHistorySize) {
      this.linkageHistory.shift();
    }
  }

  /**
   * Get linkage history
   */
  getHistory(): LinkageEvent[] {
    return [...this.linkageHistory];
  }

  /**
   * Clear linkage history
   */
  clearHistory(): void {
    this.linkageHistory = [];
  }

  /**
   * Enable/disable a linkage
   */
  setLinkageEnabled(linkageId: string, enabled: boolean): void {
    const linkage = this.linkages.get(linkageId);
    if (linkage) {
      linkage.enabled = enabled;
    }
  }

  /**
   * Get all linkages
   */
  getAllLinkages(): IComponentLinkage[] {
    return Array.from(this.linkages.values());
  }

  /**
   * Clear all linkages
   */
  clearAllLinkages(): void {
    this.linkages.clear();
    this.listeners.clear();
    this.componentStates.clear();
    this.linkageHistory = [];
  }

  /**
   * Get linkage statistics
   */
  getStatistics() {
    return {
      totalLinkages: this.linkages.size,
      enabledLinkages: Array.from(this.linkages.values()).filter((l) => l.enabled)
        .length,
      totalComponents: this.componentStates.size,
      historySize: this.linkageHistory.length,
    };
  }
}

/**
 * Create a singleton instance of LinkageEngine
 */
let instance: LinkageEngine | null = null;

export function getLinkageEngine(): LinkageEngine {
  if (!instance) {
    instance = new LinkageEngine();
  }
  return instance;
}

export function createLinkageEngine(): LinkageEngine {
  return new LinkageEngine();
}

/**
 * Common transformation functions
 */
export const LinkageTransforms = {
  // Convert to uppercase
  uppercase: (value: any) => String(value).toUpperCase(),

  // Convert to lowercase
  lowercase: (value: any) => String(value).toLowerCase(),

  // Multiply by a factor
  multiply: (factor: number) => (value: any) => Number(value) * factor,

  // Add a value
  add: (amount: number) => (value: any) => Number(value) + amount,

  // Format as currency
  currency: (value: any) => `$${Number(value).toFixed(2)}`,

  // Format as percentage
  percentage: (value: any) => `${Number(value).toFixed(2)}%`,

  // Invert boolean
  invert: (value: any) => !value,

  // Clamp value between min and max
  clamp: (min: number, max: number) => (value: any) => {
    const num = Number(value);
    return Math.max(min, Math.min(max, num));
  },

  // Map value from one range to another
  map: (fromMin: number, fromMax: number, toMin: number, toMax: number) =>
    (value: any) => {
      const num = Number(value);
      const ratio = (num - fromMin) / (fromMax - fromMin);
      return toMin + ratio * (toMax - toMin);
    },

  // Debounce value changes
  debounce: (delay: number) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    return (value: any) => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      return new Promise((resolve) => {
        timeoutId = setTimeout(() => {
          resolve(value);
          timeoutId = null;
        }, delay);
      });
    };
  },
};
