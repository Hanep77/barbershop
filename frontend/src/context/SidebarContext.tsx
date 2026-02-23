import { create } from "zustand";

interface SidebarContextProps {
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
}

export const useSidebarContext = create<SidebarContextProps>((set) => ({
  isOpen: false,
  setOpen: (isOpen) => set(() => ({ isOpen })),
}));
