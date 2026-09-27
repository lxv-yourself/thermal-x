"use client";

import React from "react";
import { useAlert } from "../../contexts/AlertContext";

export const AlertBanner: React.FC = () => {
  const { alert, clear } = useAlert();
  const { visible, message } = alert;

  if (!visible) return null;

  return (
    <div
      role="alert"
      className="fixed top-4 right-4 z-[9999] flex max-w-md items-start gap-3 rounded-xl border border-red-500/30 bg-red-950/90 px-4 py-3 text-sm text-white shadow-2xl backdrop-blur"
    >
      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500 text-xs font-bold">
        !
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-semibold">Alert</p>
        <p className="mt-1 break-words text-red-100">{message}</p>
      </div>

      <button
        type="button"
        onClick={clear}
        aria-label="Close alert"
        className="rounded-md px-2 py-1 text-lg leading-none text-red-200 transition hover:bg-white/10 hover:text-white"
      >
        ×
      </button>
    </div>
  );
};

export default AlertBanner;
