import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { usePageStore } from '@/store/usePageStore';
import type { IComponentLinkage } from '@cms/types';

describe('usePageStore - Linkage Operations', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('addLinkage', () => {
    it('adds a new linkage to the store', () => {
      const store = usePageStore();

      const linkage: IComponentLinkage = {
        id: 'linkage-1',
        sourceComponentId: 'comp-1',
        sourceProperty: 'price',
        targetComponentId: 'comp-2',
        targetProperty: 'totalPrice',
        enabled: true,
      };

      store.addLinkage(linkage);

      expect(store.linkages).toHaveLength(1);
      expect(store.linkages[0]).toEqual(linkage);
    });

    it('registers linkage with linkage engine', () => {
      const store = usePageStore();

      const linkage: IComponentLinkage = {
        id: 'linkage-1',
        sourceComponentId: 'comp-1',
        sourceProperty: 'price',
        targetComponentId: 'comp-2',
        targetProperty: 'totalPrice',
        enabled: true,
      };

      store.addLinkage(linkage);

      const registeredLinkages = store.linkageEngine.getAllLinkages();
      expect(registeredLinkages).toHaveLength(1);
      expect(registeredLinkages[0].id).toBe('linkage-1');
    });

    it('adds multiple linkages', () => {
      const store = usePageStore();

      const linkage1: IComponentLinkage = {
        id: 'linkage-1',
        sourceComponentId: 'comp-1',
        sourceProperty: 'price',
        targetComponentId: 'comp-2',
        targetProperty: 'totalPrice',
        enabled: true,
      };

      const linkage2: IComponentLinkage = {
        id: 'linkage-2',
        sourceComponentId: 'comp-2',
        sourceProperty: 'quantity',
        targetComponentId: 'comp-3',
        targetProperty: 'count',
        enabled: true,
      };

      store.addLinkage(linkage1);
      store.addLinkage(linkage2);

      expect(store.linkages).toHaveLength(2);
      expect(store.linkageEngine.getAllLinkages()).toHaveLength(2);
    });
  });

  describe('updateLinkage', () => {
    it('updates an existing linkage', () => {
      const store = usePageStore();

      const linkage: IComponentLinkage = {
        id: 'linkage-1',
        sourceComponentId: 'comp-1',
        sourceProperty: 'price',
        targetComponentId: 'comp-2',
        targetProperty: 'totalPrice',
        enabled: true,
      };

      store.addLinkage(linkage);

      store.updateLinkage('linkage-1', {
        sourceProperty: 'newPrice',
        enabled: false,
      });

      expect(store.linkages[0].sourceProperty).toBe('newPrice');
      expect(store.linkages[0].enabled).toBe(false);
    });

    it('updates linkage in engine', () => {
      const store = usePageStore();

      const linkage: IComponentLinkage = {
        id: 'linkage-1',
        sourceComponentId: 'comp-1',
        sourceProperty: 'price',
        targetComponentId: 'comp-2',
        targetProperty: 'totalPrice',
        enabled: true,
      };

      store.addLinkage(linkage);
      store.updateLinkage('linkage-1', { enabled: false });

      const engineLinkages = store.linkageEngine.getAllLinkages();
      expect(engineLinkages[0].enabled).toBe(false);
    });

    it('does nothing if linkage not found', () => {
      const store = usePageStore();

      const linkage: IComponentLinkage = {
        id: 'linkage-1',
        sourceComponentId: 'comp-1',
        sourceProperty: 'price',
        targetComponentId: 'comp-2',
        targetProperty: 'totalPrice',
        enabled: true,
      };

      store.addLinkage(linkage);

      store.updateLinkage('non-existent', { enabled: false });

      expect(store.linkages[0].enabled).toBe(true);
    });
  });

  describe('deleteLinkage', () => {
    it('deletes a linkage from store', () => {
      const store = usePageStore();

      const linkage: IComponentLinkage = {
        id: 'linkage-1',
        sourceComponentId: 'comp-1',
        sourceProperty: 'price',
        targetComponentId: 'comp-2',
        targetProperty: 'totalPrice',
        enabled: true,
      };

      store.addLinkage(linkage);
      expect(store.linkages).toHaveLength(1);

      store.deleteLinkage('linkage-1');
      expect(store.linkages).toHaveLength(0);
    });

    it('unregisters linkage from engine', () => {
      const store = usePageStore();

      const linkage: IComponentLinkage = {
        id: 'linkage-1',
        sourceComponentId: 'comp-1',
        sourceProperty: 'price',
        targetComponentId: 'comp-2',
        targetProperty: 'totalPrice',
        enabled: true,
      };

      store.addLinkage(linkage);
      expect(store.linkageEngine.getAllLinkages()).toHaveLength(1);

      store.deleteLinkage('linkage-1');
      expect(store.linkageEngine.getAllLinkages()).toHaveLength(0);
    });

    it('deletes correct linkage when multiple exist', () => {
      const store = usePageStore();

      const linkage1: IComponentLinkage = {
        id: 'linkage-1',
        sourceComponentId: 'comp-1',
        sourceProperty: 'price',
        targetComponentId: 'comp-2',
        targetProperty: 'totalPrice',
        enabled: true,
      };

      const linkage2: IComponentLinkage = {
        id: 'linkage-2',
        sourceComponentId: 'comp-2',
        sourceProperty: 'quantity',
        targetComponentId: 'comp-3',
        targetProperty: 'count',
        enabled: true,
      };

      store.addLinkage(linkage1);
      store.addLinkage(linkage2);

      store.deleteLinkage('linkage-1');

      expect(store.linkages).toHaveLength(1);
      expect(store.linkages[0].id).toBe('linkage-2');
    });
  });

  describe('toggleLinkage', () => {
    it('toggles linkage enabled state', () => {
      const store = usePageStore();

      const linkage: IComponentLinkage = {
        id: 'linkage-1',
        sourceComponentId: 'comp-1',
        sourceProperty: 'price',
        targetComponentId: 'comp-2',
        targetProperty: 'totalPrice',
        enabled: true,
      };

      store.addLinkage(linkage);
      expect(store.linkages[0].enabled).toBe(true);

      store.toggleLinkage('linkage-1');
      expect(store.linkages[0].enabled).toBe(false);

      store.toggleLinkage('linkage-1');
      expect(store.linkages[0].enabled).toBe(true);
    });

    it('updates engine linkage state', () => {
      const store = usePageStore();

      const linkage: IComponentLinkage = {
        id: 'linkage-1',
        sourceComponentId: 'comp-1',
        sourceProperty: 'price',
        targetComponentId: 'comp-2',
        targetProperty: 'totalPrice',
        enabled: true,
      };

      store.addLinkage(linkage);

      store.toggleLinkage('linkage-1');

      const engineLinkages = store.linkageEngine.getAllLinkages();
      expect(engineLinkages[0].enabled).toBe(false);
    });
  });

  describe('getLinkagesForComponent', () => {
    it('returns linkages for a specific component', () => {
      const store = usePageStore();

      const linkage1: IComponentLinkage = {
        id: 'linkage-1',
        sourceComponentId: 'comp-1',
        sourceProperty: 'price',
        targetComponentId: 'comp-2',
        targetProperty: 'totalPrice',
        enabled: true,
      };

      const linkage2: IComponentLinkage = {
        id: 'linkage-2',
        sourceComponentId: 'comp-2',
        sourceProperty: 'quantity',
        targetComponentId: 'comp-3',
        targetProperty: 'count',
        enabled: true,
      };

      store.addLinkage(linkage1);
      store.addLinkage(linkage2);

      const comp1Linkages = store.getLinkagesForComponent('comp-1');
      expect(comp1Linkages).toHaveLength(1);
      expect(comp1Linkages[0].id).toBe('linkage-1');

      const comp2Linkages = store.getLinkagesForComponent('comp-2');
      expect(comp2Linkages).toHaveLength(2);
    });

    it('returns empty array for component with no linkages', () => {
      const store = usePageStore();

      const linkages = store.getLinkagesForComponent('comp-999');
      expect(linkages).toHaveLength(0);
    });
  });

  describe('exportPageSchema', () => {
    it('includes linkages in exported schema', () => {
      const store = usePageStore();

      const linkage: IComponentLinkage = {
        id: 'linkage-1',
        sourceComponentId: 'comp-1',
        sourceProperty: 'price',
        targetComponentId: 'comp-2',
        targetProperty: 'totalPrice',
        enabled: true,
      };

      store.addLinkage(linkage);

      const exported = store.exportPageSchema();

      expect(exported.linkages).toBeDefined();
      expect(exported.linkages).toHaveLength(1);
      expect(exported.linkages![0].id).toBe('linkage-1');
    });

    it('exports undefined linkages when none exist', () => {
      const store = usePageStore();

      const exported = store.exportPageSchema();

      expect(exported.linkages).toBeUndefined();
    });
  });

  describe('importPageSchema', () => {
    it('imports linkages from schema', () => {
      const store = usePageStore();

      const schema = {
        version: '2.0.0',
        pageConfig: {},
        componentMap: {},
        rootIds: [],
        linkages: [
          {
            id: 'linkage-1',
            sourceComponentId: 'comp-1',
            sourceProperty: 'price',
            targetComponentId: 'comp-2',
            targetProperty: 'totalPrice',
            enabled: true,
          },
        ],
      };

      store.importPageSchema(schema);

      expect(store.linkages).toHaveLength(1);
      expect(store.linkages[0].id).toBe('linkage-1');
      expect(store.linkageEngine.getAllLinkages()).toHaveLength(1);
    });

    it('clears existing linkages before import', () => {
      const store = usePageStore();

      // 添加现有联动
      store.addLinkage({
        id: 'old-linkage',
        sourceComponentId: 'comp-old',
        sourceProperty: 'value',
        targetComponentId: 'comp-old-2',
        targetProperty: 'value',
        enabled: true,
      });

      // 导入新 schema
      const schema = {
        version: '2.0.0',
        pageConfig: {},
        componentMap: {},
        rootIds: [],
        linkages: [
          {
            id: 'new-linkage',
            sourceComponentId: 'comp-1',
            sourceProperty: 'price',
            targetComponentId: 'comp-2',
            targetProperty: 'totalPrice',
            enabled: true,
          },
        ],
      };

      store.importPageSchema(schema);

      expect(store.linkages).toHaveLength(1);
      expect(store.linkages[0].id).toBe('new-linkage');
    });

    it('handles schema without linkages', () => {
      const store = usePageStore();

      const schema = {
        version: '2.0.0',
        pageConfig: {},
        componentMap: {},
        rootIds: [],
      };

      store.importPageSchema(schema);

      expect(store.linkages).toHaveLength(0);
      expect(store.linkageEngine.getAllLinkages()).toHaveLength(0);
    });

    it('converts string transformFn to function', () => {
      const store = usePageStore();

      const schema = {
        version: '2.0.0',
        pageConfig: {},
        componentMap: {},
        rootIds: [],
        linkages: [
          {
            id: 'linkage-1',
            sourceComponentId: 'comp-1',
            sourceProperty: 'price',
            targetComponentId: 'comp-2',
            targetProperty: 'totalPrice',
            transformFn: '(value) => value * 1.1',
            enabled: true,
          },
        ],
      };

      store.importPageSchema(schema);

      const engineLinkages = store.linkageEngine.getAllLinkages();
      expect(typeof engineLinkages[0].transformFn).toBe('function');
    });
  });
});
