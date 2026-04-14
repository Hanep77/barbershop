import { create } from "zustand";
import type { Barbershop } from "../types/barbershop";
import { getAllBarbershop } from "../services/barbershop";

interface BarbershopState {
  barbershops: Barbershop[];
  loading: boolean;
  error: string | null;
  fetchBarbershops: () => Promise<void>;
}

const useBarbershopStore = create<BarbershopState>((set) => ({
  barbershops: [],
  loading: false,
  error: null,

  fetchBarbershops: async () => {
    set({ loading: true, error: null });
    try {
      const res = await getAllBarbershop();
      set({ barbershops: res.data as Barbershop[] });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? ((err as any).response?.data?.message ?? err.message)
          : "Failed to fetch barbershops";
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },
}));

export default useBarbershopStore;
