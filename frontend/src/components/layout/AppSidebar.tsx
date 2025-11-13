import { 
  LayoutDashboard, 
  Calendar, 
  ClipboardList, 
  UserCog, 
  Users, 
  Stethoscope, 
  BarChart3, 
  Settings,
  Bell,
  Clock,
  BookOpen
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Citas", url: "/citas", icon: Calendar },
  { title: "Lista de Espera", url: "/lista-espera", icon: ClipboardList },
  { title: "Confirmaciones", url: "/confirmaciones", icon: Bell },
  { title: "Pacientes", url: "/pacientes", icon: Users },
  { title: "Profesionales", url: "/profesionales", icon: Stethoscope },
  { title: "Especialidades", url: "/especialidades", icon: BookOpen },
  { title: "Reportes", url: "/reportes", icon: BarChart3 },
  { title: "Automatizaciones", url: "/automatizaciones", icon: Clock },
  { title: "Configuración", url: "/configuracion", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent>
        <div className="px-4 py-6">
          <div className="flex items-center gap-3">
            {!isCollapsed && (
              <>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
                  <Stethoscope className="h-6 w-6 text-sidebar-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-sidebar-foreground">EsSalud</h1>
                  <p className="text-xs text-sidebar-foreground/80">Gestión de Citas</p>
                </div>
              </>
            )}
            {isCollapsed && (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary mx-auto">
                <Stethoscope className="h-6 w-6 text-sidebar-primary-foreground" />
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? "sr-only" : ""}>
            Navegación Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <NavLink 
                        to={item.url} 
                        end
                        className="flex items-center gap-3"
                      >
                        <item.icon className="h-5 w-5" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
