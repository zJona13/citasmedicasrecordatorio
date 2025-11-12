import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, MessageSquare, Clock, Users, Save } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function Automatizaciones() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Automatizaciones</h1>
        <p className="text-muted-foreground mt-2">
          Configure recordatorios automáticos y reglas de gestión de citas
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle>Recordatorios Automáticos</CardTitle>
            </div>
            <CardDescription>
              Configure los recordatorios automáticos por SMS y App
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="reminder-48h" className="text-base">
                  Recordatorio T-48h
                </Label>
                <p className="text-sm text-muted-foreground">
                  Enviar 48 horas antes de la cita
                </p>
              </div>
              <Switch id="reminder-48h" defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="reminder-24h" className="text-base">
                  Recordatorio T-24h
                </Label>
                <p className="text-sm text-muted-foreground">
                  Enviar 24 horas antes de la cita
                </p>
              </div>
              <Switch id="reminder-24h" defaultChecked />
            </div>

            <Separator />

            <div className="space-y-4">
              <Label>Canal preferido</Label>
              <Select defaultValue="sms">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sms">SMS (predeterminado)</SelectItem>
                  <SelectItem value="app">App Móvil</SelectItem>
                  <SelectItem value="both">Ambos canales</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <CardTitle>Lista de Espera Automática</CardTitle>
            </div>
            <CardDescription>
              Reglas de priorización y asignación automática
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-offer" className="text-base">
                  Oferta automática de cupos liberados
                </Label>
                <p className="text-sm text-muted-foreground">
                  Ofrecer automáticamente cuando se libere un cupo
                </p>
              </div>
              <Switch id="auto-offer" defaultChecked />
            </div>

            <Separator />

            <div className="space-y-4">
              <Label>Tiempo máximo de oferta</Label>
              <div className="flex items-center gap-2">
                <Input type="number" defaultValue="30" className="w-24" />
                <span className="text-sm text-muted-foreground">minutos</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <Label>Prioridad automática</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Switch id="priority-age" defaultChecked />
                  <Label htmlFor="priority-age" className="font-normal">
                    Adultos mayores (65+)
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="priority-urgent" defaultChecked />
                  <Label htmlFor="priority-urgent" className="font-normal">
                    Casos urgentes
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="priority-waiting" />
                  <Label htmlFor="priority-waiting" className="font-normal">
                    Mayor tiempo de espera
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <CardTitle>Mensajes Personalizados</CardTitle>
            </div>
            <CardDescription>
              Plantillas de mensajes automáticos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="msg-confirmation">Mensaje de confirmación</Label>
              <Input 
                id="msg-confirmation" 
                defaultValue="Hola {nombre}, tienes cita el {fecha} a las {hora} en {especialidad}. Confirma respondiendo SÍ."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="msg-offer">Mensaje de oferta de cupo</Label>
              <Input 
                id="msg-offer" 
                defaultValue="Hola {nombre}, hay un cupo disponible el {fecha} a las {hora}. ¿Lo aceptas? Responde en 30 min."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>Chatbot</CardTitle>
            </div>
            <CardDescription>
              Configuración del asistente virtual
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="chatbot-enabled" className="text-base">
                  Habilitar chatbot
                </Label>
                <p className="text-sm text-muted-foreground">
                  Respuestas automáticas 24/7
                </p>
              </div>
              <Switch id="chatbot-enabled" defaultChecked />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="chatbot-greeting">Mensaje de bienvenida</Label>
              <Input 
                id="chatbot-greeting" 
                defaultValue="Hola! Soy tu asistente virtual de EsSalud. ¿En qué puedo ayudarte?"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline">Restaurar valores predeterminados</Button>
          <Button>
            <Save className="h-4 w-4 mr-2" />
            Guardar Cambios
          </Button>
        </div>
      </div>
    </div>
  );
}
