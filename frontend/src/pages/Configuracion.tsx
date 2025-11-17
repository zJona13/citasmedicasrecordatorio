import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Building, User, Bell, Lock, Globe, Save } from "lucide-react";
import { configuracionesApi, Configuraciones, sedesApi, Sede } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function Configuracion() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Cargar configuraciones
  const { data: configuraciones, isLoading: isLoadingConfig } = useQuery({
    queryKey: ['configuraciones'],
    queryFn: () => configuracionesApi.getConfiguraciones(),
  });

  // Cargar sede por defecto
  const { data: sede, isLoading: isLoadingSede } = useQuery({
    queryKey: ['sede-por-defecto'],
    queryFn: () => sedesApi.getSedePorDefecto(),
  });

  // Estado local para formularios
  const [generalForm, setGeneralForm] = useState({
    sede_name: "",
    sede_code: "",
    sede_address: "",
    sede_phone: "",
    sede_email: "",
    language: "es-PE",
    timezone: "america-lima",
    dark_mode: false,
  });

  const [perfilForm, setPerfilForm] = useState({
    user_name: "Administrador Sistema",
    user_role: "Administrador",
    user_email: "",
    user_phone: "",
  });

  const [notificacionesForm, setNotificacionesForm] = useState({
    notif_new_appointment: true,
    notif_confirmations: true,
    notif_cancellations: true,
    notif_waitlist: false,
  });

  const [seguridadForm, setSeguridadForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  // Mutation para actualizar sede
  const updateSedeMutation = useMutation({
    mutationFn: (data: Partial<Sede>) => {
      if (!sede) throw new Error('No hay sede seleccionada');
      return sedesApi.updateSede(sede.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sede-por-defecto'] });
      toast({
        title: "Sede actualizada",
        description: "La información de la sede se ha actualizado exitosamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la sede.",
        variant: "destructive",
      });
    },
  });

  // Actualizar formularios cuando se cargan las configuraciones y la sede
  useEffect(() => {
    if (configuraciones) {
      setNotificacionesForm({
        notif_new_appointment: configuraciones.reminder_48h_enabled || true,
        notif_confirmations: configuraciones.reminder_24h_enabled || true,
        notif_cancellations: true,
        notif_waitlist: configuraciones.auto_offer_enabled || false,
      });
      
      // Actualizar modo oscuro desde configuraciones (si existe)
      const darkModeEnabled = configuraciones.dark_mode_enabled === true;
      setGeneralForm(prev => ({ ...prev, dark_mode: darkModeEnabled }));
      
      // Aplicar modo oscuro inmediatamente y sincronizar con localStorage
      if (darkModeEnabled) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    }
  }, [configuraciones]);

  // Actualizar formulario cuando se carga la sede
  useEffect(() => {
    if (sede) {
      setGeneralForm(prev => ({
        ...prev,
        sede_name: sede.nombre,
        sede_code: sede.codigo,
        sede_address: sede.direccion,
        sede_phone: sede.telefono || "",
        sede_email: sede.email || "",
      }));
    }
  }, [sede]);

  // Mutation para actualizar configuraciones
  const updateConfiguracionesMutation = useMutation({
    mutationFn: (config: Partial<Configuraciones>) => configuracionesApi.updateConfiguraciones(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuraciones'] });
      toast({
        title: "Configuraciones actualizadas",
        description: "Las configuraciones se han guardado exitosamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudieron actualizar las configuraciones.",
        variant: "destructive",
      });
    },
  });

  const handleSaveGeneral = () => {
    if (!sede) {
      toast({
        title: "Error",
        description: "No se pudo cargar la información de la sede.",
        variant: "destructive",
      });
      return;
    }

    // Actualizar sede
    updateSedeMutation.mutate({
      nombre: generalForm.sede_name,
      codigo: generalForm.sede_code,
      direccion: generalForm.sede_address,
      telefono: generalForm.sede_phone || undefined,
      email: generalForm.sede_email || undefined,
    });

    // Actualizar modo oscuro en configuraciones
    if (configuraciones) {
      updateConfiguracionesMutation.mutate({
        dark_mode_enabled: generalForm.dark_mode,
      } as any);
    }
  };

  const handleSavePerfil = () => {
    // En una implementación real, esto debería actualizar el perfil del usuario
    toast({
      title: "Perfil actualizado",
      description: "El perfil se ha actualizado exitosamente. (Nota: Esto requiere una implementación de usuarios)",
    });
  };

  const handleSaveNotificaciones = () => {
    if (!configuraciones) return;
    
    updateConfiguracionesMutation.mutate({
      reminder_48h_enabled: notificacionesForm.notif_new_appointment,
      reminder_24h_enabled: notificacionesForm.notif_confirmations,
      auto_offer_enabled: notificacionesForm.notif_waitlist,
    });
  };

  const handleSaveSeguridad = () => {
    // Validar contraseñas
    if (seguridadForm.new_password !== seguridadForm.confirm_password) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden.",
        variant: "destructive",
      });
      return;
    }

    if (seguridadForm.new_password.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    // En una implementación real, esto debería cambiar la contraseña del usuario
    toast({
      title: "Contraseña actualizada",
      description: "La contraseña se ha actualizado exitosamente. (Nota: Esto requiere una implementación de autenticación)",
    });
    
    setSeguridadForm({
      current_password: "",
      new_password: "",
      confirm_password: "",
    });
  };

  const isLoading = isLoadingConfig || isLoadingSede;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground mt-2">
          Administre la configuración del sistema
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="perfil">Mi Perfil</TabsTrigger>
          <TabsTrigger value="notificaciones">Notificaciones</TabsTrigger>
          <TabsTrigger value="seguridad">Seguridad</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                <CardTitle>Información de la Sede</CardTitle>
              </div>
              <CardDescription>Datos generales de la institución</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sede-name">Nombre de la sede</Label>
                  <Input 
                    id="sede-name" 
                    value={generalForm.sede_name}
                    onChange={(e) => setGeneralForm({ ...generalForm, sede_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sede-code">Código</Label>
                  <Input 
                    id="sede-code" 
                    value={generalForm.sede_code}
                    onChange={(e) => setGeneralForm({ ...generalForm, sede_code: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sede-address">Dirección</Label>
                <Input 
                  id="sede-address" 
                  value={generalForm.sede_address}
                  onChange={(e) => setGeneralForm({ ...generalForm, sede_address: e.target.value })}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sede-phone">Teléfono</Label>
                  <Input 
                    id="sede-phone" 
                    value={generalForm.sede_phone}
                    onChange={(e) => setGeneralForm({ ...generalForm, sede_phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sede-email">Correo electrónico</Label>
                  <Input 
                    id="sede-email" 
                    type="email"
                    value={generalForm.sede_email}
                    onChange={(e) => setGeneralForm({ ...generalForm, sede_email: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                <CardTitle>Preferencias del Sistema</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="language">Idioma</Label>
                <Select 
                  value={generalForm.language}
                  onValueChange={(value) => setGeneralForm({ ...generalForm, language: value })}
                >
                  <SelectTrigger id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es-PE">Español (Perú)</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="timezone">Zona horaria</Label>
                <Select 
                  value={generalForm.timezone}
                  onValueChange={(value) => setGeneralForm({ ...generalForm, timezone: value })}
                >
                  <SelectTrigger id="timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="america-lima">Lima (GMT-5)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dark-mode" className="text-base">
                    Modo oscuro
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Ajustar el tema de la interfaz
                  </p>
                </div>
                <Switch 
                  id="dark-mode" 
                  checked={generalForm.dark_mode}
                  onCheckedChange={(checked) => {
                    setGeneralForm({ ...generalForm, dark_mode: checked });
                    // Aplicar modo oscuro inmediatamente
                    if (checked) {
                      document.documentElement.classList.add('dark');
                      localStorage.setItem('theme', 'dark');
                    } else {
                      document.documentElement.classList.remove('dark');
                      localStorage.setItem('theme', 'light');
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              onClick={handleSaveGeneral} 
              disabled={updateConfiguracionesMutation.isPending || updateSedeMutation.isPending}
            >
              {(updateConfiguracionesMutation.isPending || updateSedeMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              <Save className="h-4 w-4 mr-2" />
              Guardar Cambios
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="perfil" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle>Información Personal</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="user-name">Nombre completo</Label>
                  <Input 
                    id="user-name" 
                    value={perfilForm.user_name}
                    onChange={(e) => setPerfilForm({ ...perfilForm, user_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-role">Rol</Label>
                  <Input id="user-role" value={perfilForm.user_role} disabled />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-email">Correo electrónico</Label>
                <Input 
                  id="user-email" 
                  type="email" 
                  value={perfilForm.user_email}
                  onChange={(e) => setPerfilForm({ ...perfilForm, user_email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-phone">Teléfono</Label>
                <Input 
                  id="user-phone" 
                  value={perfilForm.user_phone}
                  onChange={(e) => setPerfilForm({ ...perfilForm, user_phone: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSavePerfil}>
              <Save className="h-4 w-4 mr-2" />
              Actualizar Perfil
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="notificaciones" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle>Preferencias de Notificación</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notif-new-appointment" className="text-base">
                    Nuevas citas
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Recibir notificaciones de citas creadas
                  </p>
                </div>
                <Switch 
                  id="notif-new-appointment" 
                  checked={notificacionesForm.notif_new_appointment}
                  onCheckedChange={(checked) => setNotificacionesForm({ ...notificacionesForm, notif_new_appointment: checked })}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notif-confirmations" className="text-base">
                    Confirmaciones
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Notificar cuando un paciente confirme
                  </p>
                </div>
                <Switch 
                  id="notif-confirmations" 
                  checked={notificacionesForm.notif_confirmations}
                  onCheckedChange={(checked) => setNotificacionesForm({ ...notificacionesForm, notif_confirmations: checked })}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notif-cancellations" className="text-base">
                    Cancelaciones
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Alertas de citas canceladas
                  </p>
                </div>
                <Switch 
                  id="notif-cancellations" 
                  checked={notificacionesForm.notif_cancellations}
                  onCheckedChange={(checked) => setNotificacionesForm({ ...notificacionesForm, notif_cancellations: checked })}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notif-waitlist" className="text-base">
                    Lista de espera
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Actividad de la lista de espera
                  </p>
                </div>
                <Switch 
                  id="notif-waitlist" 
                  checked={notificacionesForm.notif_waitlist}
                  onCheckedChange={(checked) => setNotificacionesForm({ ...notificacionesForm, notif_waitlist: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveNotificaciones} disabled={updateConfiguracionesMutation.isPending}>
              {updateConfiguracionesMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Save className="h-4 w-4 mr-2" />
              Guardar Preferencias
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="seguridad" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                <CardTitle>Cambiar Contraseña</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Contraseña actual</Label>
                <Input 
                  id="current-password" 
                  type="password" 
                  value={seguridadForm.current_password}
                  onChange={(e) => setSeguridadForm({ ...seguridadForm, current_password: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Nueva contraseña</Label>
                <Input 
                  id="new-password" 
                  type="password" 
                  value={seguridadForm.new_password}
                  onChange={(e) => setSeguridadForm({ ...seguridadForm, new_password: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar nueva contraseña</Label>
                <Input 
                  id="confirm-password" 
                  type="password" 
                  value={seguridadForm.confirm_password}
                  onChange={(e) => setSeguridadForm({ ...seguridadForm, confirm_password: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sesiones Activas</CardTitle>
              <CardDescription>Dispositivos con sesión iniciada</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Windows PC - Chrome</p>
                    <p className="text-sm text-muted-foreground">Lima, Perú • Activa ahora</p>
                  </div>
                  <Button variant="outline" size="sm">Cerrar sesión</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveSeguridad}>
              <Save className="h-4 w-4 mr-2" />
              Actualizar Contraseña
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
