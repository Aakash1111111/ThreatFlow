import { create } from 'zustand';
import * as api from '../api/client';

const useStore = create((set, get) => ({
  iocs: [],
  loading: false,
  error: null,
  enrichments: {},
  stats: null,
  timeline: null,
  selectedIocs: [],

  fetchIOCs: async () => {
    set({ loading: true, error: null });
    try {
      const iocs = await api.getIOCs();
      set({ iocs, loading: false });
    } catch (e) {
      set({ error: e.message, loading: false });
    }
  },

  submitIOCs: async (iocs, sourceText) => {
    set({ loading: true, error: null });
    try {
      await api.submitIOCs(iocs, sourceText);
      await get().fetchIOCs();
      await get().fetchStats();
    } catch (e) {
      set({ error: e.message, loading: false });
      throw e;
    }
  },

  enrichIOC: async (id) => {
    set({ loading: true, error: null });
    try {
      const result = await api.enrichIOC(id);
      set((state) => ({
        enrichments: { ...state.enrichments, [id]: result }
      }));
      await get().fetchIOCs();
    } catch (e) {
      set({ error: e.message, loading: false });
      throw e;
    }
  },

  enrichBulk: async (ids) => {
    set({ loading: true, error: null });
    try {
      await api.enrichBulk(ids);
      await get().fetchIOCs();
    } catch (e) {
      set({ error: e.message, loading: false });
      throw e;
    }
  },

  fetchStats: async () => {
    try {
      const [stats, timeline] = await Promise.all([
        api.getStats(),
        api.getTimeline()
      ]);
      set({ stats, timeline });
    } catch (e) {
      console.error(e);
    }
  },

  toggleSelectIOC: (id) => {
    set((state) => ({
      selectedIocs: state.selectedIocs.includes(id)
        ? state.selectedIocs.filter(i => i !== id)
        : [...state.selectedIocs, id]
    }));
  },

  selectAllIOCs: (ids) => {
    set({ selectedIocs: ids });
  },

  clearSelection: () => set({ selectedIocs: [] })
}));

export default useStore;
