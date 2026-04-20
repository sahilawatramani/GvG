// Toast notification utility
// This is a simple wrapper around sonner which is already installed

import { toast as sonnerToast } from "sonner";

export const toast = {
  success: (message: string) => {
    sonnerToast.success(message, {
      style: {
        background: "#1a1d24",
        border: "1px solid #10b981",
        color: "#e5e7eb",
      },
    });
  },
  error: (message: string) => {
    sonnerToast.error(message, {
      style: {
        background: "#1a1d24",
        border: "1px solid #ef4444",
        color: "#e5e7eb",
      },
    });
  },
  info: (message: string) => {
    sonnerToast.info(message, {
      style: {
        background: "#1a1d24",
        border: "1px solid #3b82f6",
        color: "#e5e7eb",
      },
    });
  },
  loading: (message: string) => {
    return sonnerToast.loading(message, {
      style: {
        background: "#1a1d24",
        border: "1px solid #9ca3af",
        color: "#e5e7eb",
      },
    });
  },
  dismiss: (id: string | number) => {
    sonnerToast.dismiss(id);
  },
};
