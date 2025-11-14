import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopBar } from "@/components/layout/TopBar";
import Dashboard from "./pages/Dashboard";
import Citas from "./pages/Citas";
import ListaEspera from "./pages/ListaEspera";
import Confirmaciones from "./pages/Confirmaciones";
import Pacientes from "./pages/Pacientes";
import Profesionales from "./pages/Profesionales";
import Especialidades from "./pages/Especialidades";
import Reportes from "./pages/Reportes";
import Automatizaciones from "./pages/Automatizaciones";
import Configuracion from "./pages/Configuracion";
import Auth from "./pages/Auth";
import Chatbot from "./pages/Chatbot";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/chatbot" element={<Chatbot />} />
            <Route
              path="/*"
              element={
                <SidebarProvider>
                  <div className="min-h-screen flex w-full">
                    <AppSidebar />
                    <div className="flex-1 flex flex-col">
                      <TopBar />
                      <main className="flex-1 p-6 overflow-auto">
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/citas" element={<Citas />} />
                          <Route path="/lista-espera" element={<ListaEspera />} />
                          <Route path="/confirmaciones" element={<Confirmaciones />} />
                          <Route path="/pacientes" element={<Pacientes />} />
                          <Route path="/profesionales" element={<Profesionales />} />
                          <Route path="/especialidades" element={<Especialidades />} />
                          <Route path="/reportes" element={<Reportes />} />
                          <Route path="/automatizaciones" element={<Automatizaciones />} />
                          <Route path="/configuracion" element={<Configuracion />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </main>
                    </div>
                  </div>
                </SidebarProvider>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
