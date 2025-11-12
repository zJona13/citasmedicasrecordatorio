import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Building, User, Bell, Lock, Globe, Save } from "lucide-react";

export default function Configuracion() {
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
                  <Input id="sede-name" defaultValue="Hospital Nacional Rebagliati" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sede-code">Código</Label>
                  <Input id="sede-code" defaultValue="HNR-001" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sede-address">Dirección</Label>
                <Input id="sede-address" defaultValue="Av. Rebagliati 490, Jesús María, Lima" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sede-phone">Teléfono</Label>
                  <Input id="sede-phone" defaultValue="(01) 265-4901" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sede-email">Correo electrónico</Label>
                  <Input id="sede-email" defaultValue="contacto@essalud.gob.pe" />
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
                <Select defaultValue="es-PE">
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
                <Select defaultValue="america-lima">
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
                <Switch id="dark-mode" />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button>
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
                  <Input id="user-name" defaultValue="Administrador Sistema" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user-role">Rol</Label>
                  <Input id="user-role" defaultValue="Administrador" disabled />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-email">Correo electrónico</Label>
                <Input id="user-email" type="email" defaultValue="admin@essalud.gob.pe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-phone">Teléfono</Label>
                <Input id="user-phone" defaultValue="+51 987 654 321" />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button>
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
                <Switch id="notif-new-appointment" defaultChecked />
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
                <Switch id="notif-confirmations" defaultChecked />
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
                <Switch id="notif-cancellations" defaultChecked />
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
                <Switch id="notif-waitlist" />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button>
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
                <Input id="current-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Nueva contraseña</Label>
                <Input id="new-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar nueva contraseña</Label>
                <Input id="confirm-password" type="password" />
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
            <Button>
              <Save className="h-4 w-4 mr-2" />
              Actualizar Contraseña
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
