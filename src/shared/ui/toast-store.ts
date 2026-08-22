import { create } from 'zustand';

interface ToastState {
  message: string | null;
  show: (message: string) => void;
  dismiss: () => void;
}

const VISIBLE_MS = 4200;
let timer: ReturnType<typeof setTimeout> | null = null;

export const useToast = create<ToastState>((set) => ({
  message: null,
  show: (message) => {
    if (timer) clearTimeout(timer);
    set({ message });
    timer = setTimeout(() => set({ message: null }), VISIBLE_MS);
  },
  dismiss: () => {
    if (timer) clearTimeout(timer);
    set({ message: null });
  },
}));
