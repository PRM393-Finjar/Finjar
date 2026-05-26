import { Toaster } from "sonner";
import { QueryProvider, RouterProvider } from "@/app/providers";
import { AuthSessionSync } from "@/features/auth/components/AuthSessionSync";

export function App() {
  return (
    <QueryProvider>
      <AuthSessionSync />
      <RouterProvider />
      <Toaster position="top-right" closeButton />
    </QueryProvider>
  );
}
