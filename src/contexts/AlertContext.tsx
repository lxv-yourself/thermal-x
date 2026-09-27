'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type AlertState = { visible: boolean; message: string };

type AlertContextType = {
  alert: AlertState;
  show: (msg: string) => void;
  clear: () => void;
};

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [alert, setAlert] = useState<AlertState>({ visible: false, message: '' });
  const show = (msg: string) => setAlert({ visible: true, message: msg });
  const clear = () => setAlert({ visible: false, message: '' });
  return (
    <AlertContext.Provider value={{ alert, show, clear }}>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error('useAlert must be used within AlertProvider');
  return ctx;
};
