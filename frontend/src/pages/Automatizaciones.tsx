import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, MessageSquare, Clock, Users, Save, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { configuracionesApi, type Configuraciones } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function Automatizaciones() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<Configuraciones>({
    reminder_48h_enabled: true,
    reminder_24h_enabled: true,
    canal_preferido: 'sms',
    auto_offer_enabled: true,
    tiempo_max_oferta: 30,
    prioridad_adultos_mayores: true,
    prioridad_urgentes: true,
    prioridad_tiempo_espera: false,
    mensaje_confirmacion: '',
    mensaje_oferta_cupo: '',
    chatbot_enabled: true,
    chatbot_greeting: ''
  });

  // Cargar configuraciones al montar el componente
  useEffect(() => {
    loadConfiguraciones();
  }, []);

  const loadConfiguraciones = async () => {
    try {
      setLoading(true);
      const data = await configuracionesApi.getConfiguraciones();
      setConfig(data);
    } catch (error) {
      console.error('Error cargando configuraciones:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las configuraciones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await configuracionesApi.updateConfiguraciones(config);
      toast({
        title: "Éxito",
        description: "Configuraciones guardadas correctamente",
      });
    } catch (error) {
      console.error('Error guardando configuraciones:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudieron guardar las configuraciones",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async () => {
    if (!confirm('¿Está seguro de que desea restaurar los valores predeterminados?')) {
      return;
    }

    try {
      setSaving(true);
      const result = await configuracionesApi.restoreDefaults();
      setConfig(result.configuraciones);
      toast({
        title: "Éxito",
        description: "Valores predeterminados restaurados",
      });
    } catch (error) {
      console.error('Error restaurando valores por defecto:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudieron restaurar los valores predeterminados",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

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
              <Switch 
                id="reminder-48h" 
                checked={config.reminder_48h_enabled}
                onCheckedChange={(checked) => setConfig({ ...config, reminder_48h_enabled: checked })}
              />
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
              <Switch 
                id="reminder-24h" 
                checked={config.reminder_24h_enabled}
                onCheckedChange={(checked) => setConfig({ ...config, reminder_24h_enabled: checked })}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <Label>Canal preferido</Label>
              <Select 
                value={config.canal_preferido} 
                onValueChange={(value: 'sms' | 'app' | 'ambos') => setConfig({ ...config, canal_preferido: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sms">SMS (predeterminado)</SelectItem>
                  <SelectItem value="app">App Móvil</SelectItem>
                  <SelectItem value="ambos">Ambos canales</SelectItem>
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
              <Switch 
                id="auto-offer" 
                checked={config.auto_offer_enabled}
                onCheckedChange={(checked) => setConfig({ ...config, auto_offer_enabled: checked })}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <Label>Tiempo máximo de oferta</Label>
              <div className="flex items-center gap-2">
                <Input 
                  type="number" 
                  value={config.tiempo_max_oferta} 
                  onChange={(e) => setConfig({ ...config, tiempo_max_oferta: parseInt(e.target.value) || 30 })}
                  className="w-24" 
                  min="1"
                />
                <span className="text-sm text-muted-foreground">minutos</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <Label>Prioridad automática</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Switch 
                    id="priority-age" 
                    checked={config.prioridad_adultos_mayores}
                    onCheckedChange={(checked) => setConfig({ ...config, prioridad_adultos_mayores: checked })}
                  />
                  <Label htmlFor="priority-age" className="font-normal">
                    Adultos mayores (65+)
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch 
                    id="priority-urgent" 
                    checked={config.prioridad_urgentes}
                    onCheckedChange={(checked) => setConfig({ ...config, prioridad_urgentes: checked })}
                  />
                  <Label htmlFor="priority-urgent" className="font-normal">
                    Casos urgentes
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch 
                    id="priority-waiting" 
                    checked={config.prioridad_tiempo_espera}
                    onCheckedChange={(checked) => setConfig({ ...config, prioridad_tiempo_espera: checked })}
                  />
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
                value={config.mensaje_confirmacion}
                onChange={(e) => setConfig({ ...config, mensaje_confirmacion: e.target.value })}
                placeholder="Hola {nombre}, tienes cita el {fecha} a las {hora} en {especialidad}. Confirma respondiendo SÍ."
              />
              <p className="text-xs text-muted-foreground">
                Variables disponibles: {'{nombre}'}, {'{fecha}'}, {'{hora}'}, {'{especialidad}'}, {'{doctor}'}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="msg-offer">Mensaje de oferta de cupo</Label>
              <Input 
                id="msg-offer" 
                value={config.mensaje_oferta_cupo}
                onChange={(e) => setConfig({ ...config, mensaje_oferta_cupo: e.target.value })}
                placeholder="Hola {nombre}, hay un cupo disponible el {fecha} a las {hora}. ¿Lo aceptas? Responde en {tiempo} min."
              />
              <p className="text-xs text-muted-foreground">
                Variables disponibles: {'{nombre}'}, {'{fecha}'}, {'{hora}'}, {'{especialidad}'}, {'{doctor}'}, {'{tiempo}'}
              </p>
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
              <Switch 
                id="chatbot-enabled" 
                checked={config.chatbot_enabled}
                onCheckedChange={(checked) => setConfig({ ...config, chatbot_enabled: checked })}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="chatbot-greeting">Mensaje de bienvenida</Label>
              <Input 
                id="chatbot-greeting" 
                value={config.chatbot_greeting}
                onChange={(e) => setConfig({ ...config, chatbot_greeting: e.target.value })}
                placeholder="Hola! Soy tu asistente virtual de EsSalud. ¿En qué puedo ayudarte?"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleRestore} disabled={saving}>
            Restaurar valores predeterminados
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
