"use client";

import { XIcon } from "lucide-react";

export default function Dialog({
  open,
  children,
  toggleDialog,
}: {
  open: boolean;
  children: React.ReactNode;
  toggleDialog: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-all duration-300">
      <div className="rounded-lg p-6 w-full max-w-md flex flex-col relative">
        <button
          className="absolute top-0 right-0 hover:cursor-pointer"
          onClick={toggleDialog}
        >
          <XIcon className="h-6 w-6 text-white/70 hover:text-white" />
        </button>
        <div>{children}</div>
      </div>
    </div>
  );
}
