import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/features/auth";
import TenantBranding from "@/layout/TenantBranding";
import { AppRoutes } from "./app/routes";

function App() {
  return (
    <div className="app-shell">
      <BrowserRouter>
        <AuthProvider>
          <TenantBranding />
          <Toaster position="top-center" richColors />
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
