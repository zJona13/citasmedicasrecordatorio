import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Bell, Search, MapPin, CalendarDays, Clock, User, Loader2, AlertCircle, X, CheckCircle2, XCircle, Timer } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { appointmentsApi, Appointment, notificacionesApi, Notification } from "@/lib/api";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useDebounce } from "@/hooks/use-debounce";

export function TopBar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchValue, setSearchValue] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const debouncedSearch = useDebounce(searchValue, 500);

  // Buscar citas por DNI cuando hay un valor debounced y es un DNI válido
  const isValidDNI = debouncedSearch.trim().length >= 8 && /^\d+$/.test(debouncedSearch.trim());
  
  const { data: appointments = [], isLoading: isSearching } = useQuery({
    queryKey: ['search-appointments', debouncedSearch],
    queryFn: () => appointmentsApi.searchByDNI(debouncedSearch.trim()),
    enabled: isValidDNI && debouncedSearch.trim().length >= 8,
    retry: false,
  });

  // Función para obtener notificaciones leídas del localStorage
  const getNotificacionesLeidas = (): Set<string> => {
    try {
      const stored = localStorage.getItem('notificaciones_leidas');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  };

  // Función para guardar notificaciones leídas en localStorage
  const saveNotificacionesLeidas = (leidas: Set<string>) => {
    try {
      localStorage.setItem('notificaciones_leidas', JSON.stringify(Array.from(leidas)));
    } catch (error) {
      console.error('Error guardando notificaciones leídas:', error);
    }
  };

  // Obtener notificaciones con polling cada 30 segundos
  const { data: notificacionesData, isLoading: isLoadingNotificaciones } = useQuery({
    queryKey: ['notificaciones'],
    queryFn: () => notificacionesApi.getNotificaciones(),
    refetchInterval: 30000, // Refrescar cada 30 segundos
    retry: false,
  });

  // Filtrar y marcar notificaciones como leídas basándose en localStorage
  const notificacionesLeidas = getNotificacionesLeidas();
  const notificaciones = (notificacionesData?.notificaciones || []).map(notif => ({
    ...notif,
    leida: notificacionesLeidas.has(notif.id)
  }));
  
  const noLeidas = notificaciones.filter(n => !n.leida).length;

  // Mutación para marcar notificación como leída
  const marcarLeidaMutation = useMutation({
    mutationFn: async (id: string) => {
      // Llamar al backend (aunque no persista, mantiene la consistencia)
      await notificacionesApi.marcarLeida(id);
      // Guardar en localStorage
      const leidas = getNotificacionesLeidas();
      leidas.add(id);
      saveNotificacionesLeidas(leidas);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
    },
  });

  // Mutación para marcar todas como leídas
  const marcarTodasLeidasMutation = useMutation({
    mutationFn: async () => {
      // Llamar al backend (aunque no persista, mantiene la consistencia)
      await notificacionesApi.marcarTodasLeidas();
      // Guardar todas las notificaciones actuales en localStorage
      const leidas = getNotificacionesLeidas();
      (notificacionesData?.notificaciones || []).forEach(notif => leidas.add(notif.id));
      saveNotificacionesLeidas(leidas);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificaciones'] });
    },
  });

  // Cerrar popover cuando no hay búsqueda válida
  useEffect(() => {
    if (!isValidDNI || debouncedSearch.trim().length < 8) {
      setIsSearchOpen(false);
    } else if (appointments.length > 0 || isSearching) {
      setIsSearchOpen(true);
    }
  }, [isValidDNI, debouncedSearch, appointments, isSearching]);

  const handleAppointmentClick = (appointment: Appointment) => {
    setIsSearchOpen(false);
    setSearchValue("");
    // Navegar a la página de citas pasando la cita completa en el estado de navegación
    navigate(`/citas?citaId=${appointment.id}`, {
      state: { appointment }
    });
  };

  const getStatusLabel = (status: Appointment['status']) => {
    switch (status) {
      case "confirmed": return "Confirmada";
      case "pending": return "Pendiente";
      case "offered": return "Ofrecida";
      case "released": return "Liberada";
      case "no_show": return "No-Show";
      default: return "Pendiente";
    }
  };

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case "confirmed": return "bg-green-100 text-green-800 border-green-300";
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "offered": return "bg-purple-100 text-purple-800 border-purple-300";
      case "released": return "bg-blue-100 text-blue-800 border-blue-300";
      case "no_show": return "bg-red-100 text-red-800 border-red-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getNotificationIcon = (tipo: Notification['tipo']) => {
    switch (tipo) {
      case 'confirmacion_pendiente':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'confirmacion_fallida':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'oferta_expirando':
        return <Timer className="h-4 w-4 text-orange-600" />;
      case 'cita_pendiente':
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const handleNotificationClick = (notificacion: Notification) => {
    if (notificacion.accion) {
      setIsNotificationsOpen(false);
      const params = new URLSearchParams();
      if (notificacion.accion.params) {
        Object.entries(notificacion.accion.params).forEach(([key, value]) => {
          params.append(key, String(value));
        });
      }
      const queryString = params.toString();
      navigate(`${notificacion.accion.ruta}${queryString ? `?${queryString}` : ''}`);
    }
  };

  const handleMarcarLeida = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    marcarLeidaMutation.mutate(id);
  };

  const handleMarcarTodasLeidas = () => {
    marcarTodasLeidasMutation.mutate();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card shadow-sm">
      <div className="flex h-16 items-center gap-4 px-6">
        <SidebarTrigger />
        
        <div className="flex flex-1 items-center gap-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <Select defaultValue="sede1">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Seleccionar sede" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sede1">Hospital Luis Heysen II</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <Select defaultValue="hoy">
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Rango de fecha" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hoy">Hoy</SelectItem>
                <SelectItem value="semana">Esta semana</SelectItem>
                <SelectItem value="mes">Este mes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
            <div className="relative flex-1 max-w-md ml-auto">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <PopoverTrigger asChild>
                <Input
                  type="search"
                  placeholder="Buscar paciente por DNI..."
                  className="pl-10"
                  value={searchValue}
                  onChange={(e) => {
                    setSearchValue(e.target.value);
                    const value = e.target.value.trim();
                    if (value.length >= 8 && /^\d+$/.test(value)) {
                      // El popover se abrirá automáticamente cuando haya resultados
                    }
                  }}
                />
              </PopoverTrigger>
              {searchValue && !isValidDNI && searchValue.trim().length > 0 && (
                <p className="absolute -bottom-6 left-0 text-xs text-muted-foreground">
                  Ingrese un DNI válido (mínimo 8 dígitos)
                </p>
              )}
            </div>
            <PopoverContent className="w-[500px] p-0" align="end">
              {isSearching ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : appointments.length === 0 && isValidDNI ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No se encontraron citas para este DNI</p>
                </div>
              ) : appointments.length > 0 ? (
                <div className="max-h-[400px] overflow-y-auto">
                  <div className="p-3 border-b bg-muted/50">
                    <p className="text-sm font-medium">
                      {appointments.length} {appointments.length === 1 ? 'cita encontrada' : 'citas encontradas'}
                    </p>
                    <p className="text-xs text-muted-foreground">DNI: {debouncedSearch}</p>
                  </div>
                  <div className="divide-y">
                    {appointments.map((appointment) => {
                      const fecha = appointment.fecha 
                        ? format(new Date(appointment.fecha), "EEEE, d 'de' MMMM yyyy", { locale: es })
                        : "N/A";
                      
                      return (
                        <div
                          key={appointment.id}
                          className="p-4 hover:bg-accent cursor-pointer transition-colors"
                          onClick={() => handleAppointmentClick(appointment)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="font-semibold">{appointment.time}</span>
                                <Badge 
                                  variant="outline" 
                                  className={cn("text-xs", getStatusColor(appointment.status))}
                                >
                                  {getStatusLabel(appointment.status)}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{appointment.patient}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">{fecha}</p>
                              <p className="text-sm text-muted-foreground">
                                {appointment.doctor} • {appointment.specialty}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </PopoverContent>
          </Popover>

          <Popover open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {noLeidas > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                  >
                    {noLeidas > 99 ? '99+' : noLeidas}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="end">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Notificaciones</h3>
                  {notificaciones.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMarcarTodasLeidas}
                      disabled={marcarTodasLeidasMutation.isPending}
                      className="h-7 text-xs"
                    >
                      Marcar todas como leídas
                    </Button>
                  )}
                </div>
              </div>
              {isLoadingNotificaciones ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : notificaciones.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle2 className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No hay notificaciones</p>
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto">
                  <div className="divide-y">
                    {notificaciones.map((notificacion) => (
                      <div
                        key={notificacion.id}
                        className={cn(
                          "p-4 hover:bg-accent transition-colors cursor-pointer",
                          !notificacion.leida && "bg-muted/30"
                        )}
                        onClick={() => handleNotificationClick(notificacion)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {getNotificationIcon(notificacion.tipo)}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium leading-none">
                                {notificacion.titulo}
                              </p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => handleMarcarLeida(e, notificacion.id)}
                                disabled={marcarLeidaMutation.isPending}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {notificacion.mensaje}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notificacion.fecha), {
                                addSuffix: true,
                                locale: es
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  );
}
