import { Toaster, toast } from "sonner";

export function ToastProvider() {
  return <Toaster position="top-right" richColors closeButton />;
}

export const showToast = (
  message: string,
  type: "success" | "error" = "success"
) => {
  const duration = 3000; // 3 seconds

  if (type === "success") toast.success(message, { duration });
  else toast.error(message, { duration });
};
