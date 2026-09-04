import { create } from 'zustand';

export const useAppStore = create((set, get) => ({
  schools: [],
  activeSchoolId: null,
  academicYear: '2026-2027',
  toasts: [],
  particleBurst: null, // { x, y, key }

  setSchools: (schools) => set({ schools }),

  setActiveSchool: (id) => set({ activeSchoolId: id }),

  setAcademicYear: (year) => set({ academicYear: year }),

  activeSchool: () => get().schools.find((s) => s.id === get().activeSchoolId) || null,

  pushToast: (toast) => {
    const id = Math.random().toString(36).slice(2);
    set((state) => ({ toasts: [...state.toasts, { id, ...toast }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, toast.duration || 3600);
  },

  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  fireParticleBurst: (x, y, color) => {
    const key = Math.random().toString(36).slice(2);
    set({ particleBurst: { x, y, key, color: color || 'emerald' } });
  },

  clearParticleBurst: () => set({ particleBurst: null }),
}));
