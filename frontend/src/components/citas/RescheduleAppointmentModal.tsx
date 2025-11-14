import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { api, appointmentsApi, RescheduleAppointmentData, Appointment } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

interface Professional {
  id: number;
  name: string;
  especialidad_id?: number;
  specialty: string;
  cmp: string;
  consultorio: string;
  schedule: string | object | null;
  status: string;
}

interface Especialidad {
  id: number;
  nombre: string;
  activo: boolean;
}

interface RescheduleAppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
}

// Generar opciones de horas (0-23)
const generateHours = () => {
  const hours = [];
  for (let hour = 0; hour <= 23; hour++) {
    hours.push(hour.toString().padStart(2, '0'));
  }
  return hours;
};

// Generar opciones de minutos (0-59)
const generateMinutes = () => {
  const minutes = [];
  for (let minute = 0; minute <= 59; minute++) {
    minutes.push(minute.toString().padStart(2, '0'));
  }
  return minutes;
};

const hours = generateHours();
const minutes = generateMinutes();

export function RescheduleAppointmentModal({ open, onOpenChange, appointment }: RescheduleAppointmentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string>("");
  const [profesionalId, setProfesionalId] = useState<string>("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [selectedHour, setSelectedHour] = useState<string>("");
  const [selectedMinute, setSelectedMinute] = useState<string>("");
  const [esExcepcional, setEsExcepcional] = useState(false);
  const [razonExcepcional, setRazonExcepcional] = useState<string>("");
  const [razonAdicional, setRazonAdicional] = useState("");
  const [fueraHorario, setFueraHorario] = useState(false);
  const [horarioInfo, setHorarioInfo] = useState<{ dia: string; horarioDia: { inicio: string; fin: string } | null } | null>(null);

  // Prellenar campos cuando se abre el modal
  useEffect(() => {
    if (open && appointment) {
      // Convertir fecha string a Date
      const fechaDate = appointment.fecha ? new Date(appointment.fecha + 'T00:00:00') : undefined;
      setDate(fechaDate);
      
      // Parsear hora (formato HH:MM)
      if (appointment.time) {
        const timeParts = appointment.time.split(':');
        setSelectedHour(timeParts[0] || "");
        setSelectedMinute(timeParts[1] || "");
      } else {
        setSelectedHour("");
        setSelectedMinute("");
      }
      
      // Establecer profesional (se establecerá después cuando se carguen los profesionales)
      if (appointment.profesional_id) {
        setProfesionalId(appointment.profesional_id.toString());
      }
      
      // Resetear campos de excepción
      setEsExcepcional(false);
      setRazonExcepcional("");
      setRazonAdicional("");
      setFueraHorario(false);
      setHorarioInfo(null);
    }
  }, [open, appointment]);

  // Fetch especialidades activas
  const { data: especialidadesData, isLoading: isLoadingEspecialidades } = useQuery({
    queryKey: ['especialidades'],
    queryFn: () => api.get<{ especialidades: Especialidad[] }>('/especialidades?activo=true'),
    enabled: open,
  });

  const especialidades = especialidadesData?.especialidades || [];

  // Fetch profesionales
  const { data: profesionalesData, isLoading: isLoadingProfesionales } = useQuery({
    queryKey: ['profesionales'],
    queryFn: () => api.get<{ profesionales: Professional[] }>('/profesionales'),
    enabled: open,
  });

  const profesionales = profesionalesData?.profesionales || [];

  // Cuando se carga el appointment, buscar su especialidad
  useEffect(() => {
    if (appointment && profesionales.length > 0 && especialidades.length > 0) {
      const profesional = profesionales.find(p => p.id === appointment.profesional_id);
      if (profesional && profesional.especialidad_id) {
        setSelectedSpecialtyId(profesional.especialidad_id.toString());
      }
    }
  }, [appointment, profesionales, especialidades]);

  // Filtrar profesionales por especialidad_id seleccionada
  const filteredProfesionales = selectedSpecialtyId
    ? profesionales.filter(p => p.especialidad_id?.toString() === selectedSpecialtyId && p.status === 'disponible')
    : profesionales.filter(p => p.status === 'disponible');

  // Obtener profesional seleccionado
  const profesionalSeleccionado = profesionales.find(p => p.id.toString() === profesionalId);

  // Combinar hora y minutos en formato "HH:MM"
  const time = selectedHour && selectedMinute ? `${selectedHour}:${selectedMinute}` : "";

  // Función para validar horario
  const validarHorario = () => {
    if (!profesionalSeleccionado || !date || !time) {
      setFueraHorario(false);
      setHorarioInfo(null);
      return;
    }

    const horario = profesionalSeleccionado.schedule;
    if (!horario) {
      setFueraHorario(false);
      setHorarioInfo(null);
      return;
    }

    let horarioObj: Record<string, { inicio: string; fin: string }> = {};
    try {
      horarioObj = typeof horario === 'string' ? JSON.parse(horario) : horario;
    } catch (e) {
      setFueraHorario(false);
      setHorarioInfo(null);
      return;
    }

    const fechaObj = new Date(date);
    const diaNumero = fechaObj.getDay();
    const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const dia = diasSemana[diaNumero];

    if (!horarioObj[dia]) {
      setFueraHorario(true);
      setHorarioInfo({ dia, horarioDia: null });
      return;
    }

    const horarioDia = horarioObj[dia];
    
    const [horaH, horaM] = time.split(':').map(Number);
    const [inicioH, inicioM] = horarioDia.inicio.split(':').map(Number);
    const [finH, finM] = horarioDia.fin.split(':').map(Number);
    
    const minutosHora = horaH * 60 + horaM;
    const minutosInicio = inicioH * 60 + inicioM;
    const minutosFin = finH * 60 + finM;

    const dentroHorario = minutosHora >= minutosInicio && minutosHora <= minutosFin;
    
    setFueraHorario(!dentroHorario);
    setHorarioInfo({ dia, horarioDia: dentroHorario ? null : horarioDia });
  };

  // Validar horario cuando cambian profesional, fecha, hora o minutos
  useEffect(() => {
    validarHorario();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profesionalId, date, selectedHour, selectedMinute, profesionalSeleccionado]);

  // Mutation para reagendar cita
  const rescheduleMutation = useMutation({
    mutationFn: (data: RescheduleAppointmentData) => appointmentsApi.reschedule(appointment!.id, data),
    onSuccess: () => {
      toast({
        title: "Cita reagendada",
        description: "La cita se ha reagendado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ['citas'] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo reagendar la cita.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!appointment) return;
    
    if (!profesionalId || !date || !selectedHour || !selectedMinute) {
      toast({
        title: "Campos requeridos",
        description: "Por favor complete todos los campos obligatorios, incluyendo hora y minutos.",
        variant: "destructive",
      });
      return;
    }

    // Si está fuera del horario, validar que se haya marcado como excepcional
    if (fueraHorario && (!esExcepcional || !razonExcepcional)) {
      toast({
        title: "Cita fuera del horario",
        description: "Debe marcar esta cita como excepcional y proporcionar una razón.",
        variant: "destructive",
      });
      return;
    }

    const profesionalIdNum = parseInt(profesionalId);
    if (isNaN(profesionalIdNum)) {
      toast({
        title: "Error",
        description: "Por favor seleccione un profesional válido.",
        variant: "destructive",
      });
      return;
    }

    const fechaFormatted = format(date, 'yyyy-MM-dd');

    const data: RescheduleAppointmentData = {
      fecha: fechaFormatted,
      hora: time,
    };

    // Solo incluir profesional_id si es diferente al actual
    if (profesionalIdNum !== appointment.profesional_id) {
      data.profesional_id = profesionalIdNum;
    }

    // Incluir campos de excepción si es necesario
    if (fueraHorario && esExcepcional) {
      data.es_excepcional = true;
      data.razon_excepcional = razonExcepcional as 'emergencia' | 'caso_especial' | 'extension_horario' | 'otro';
      if (razonAdicional) {
        data.razon_adicional = razonAdicional;
      }
    }

    rescheduleMutation.mutate(data);
  };

  if (!appointment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reagendar Cita</DialogTitle>
          <DialogDescription>
            Modifique la fecha, hora o profesional de la cita para {appointment.patient}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="specialty">Especialidad *</Label>
              <Select 
                value={selectedSpecialtyId} 
                onValueChange={(value) => {
                  setSelectedSpecialtyId(value);
                  setProfesionalId(""); // Reset profesional when specialty changes
                }}
                required
                disabled={isLoadingEspecialidades}
              >
                <SelectTrigger id="specialty">
                  <SelectValue placeholder={isLoadingEspecialidades ? "Cargando..." : "Seleccionar especialidad"} />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingEspecialidades ? (
                    <SelectItem value="loading" disabled>
                      Cargando especialidades...
                    </SelectItem>
                  ) : especialidades.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No hay especialidades disponibles
                    </SelectItem>
                  ) : (
                    especialidades.map((esp) => (
                      <SelectItem key={esp.id} value={esp.id.toString()}>
                        {esp.nombre}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="doctor">Profesional *</Label>
              <Select 
                value={profesionalId} 
                onValueChange={setProfesionalId}
                required
                disabled={!selectedSpecialtyId || isLoadingProfesionales || filteredProfesionales.length === 0}
              >
                <SelectTrigger id="doctor">
                  <SelectValue 
                    placeholder={
                      !selectedSpecialtyId 
                        ? "Primero seleccione especialidad" 
                        : isLoadingProfesionales 
                        ? "Cargando..." 
                        : filteredProfesionales.length === 0
                        ? "No hay profesionales disponibles"
                        : "Seleccionar médico"
                    } 
                  />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingProfesionales ? (
                    <SelectItem value="loading" disabled>
                      Cargando profesionales...
                    </SelectItem>
                  ) : filteredProfesionales.length === 0 ? (
                    <SelectItem value="none" disabled>
                      {selectedSpecialtyId ? "No hay profesionales disponibles para esta especialidad" : "Seleccione una especialidad primero"}
                    </SelectItem>
                  ) : (
                    filteredProfesionales.map((prof) => (
                      <SelectItem key={prof.id} value={prof.id.toString()}>
                        {prof.name} {prof.consultorio ? `- ${prof.consultorio}` : ''}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: es }) : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Hora *</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="hour" className="text-xs text-muted-foreground">Hora</Label>
                  <Select value={selectedHour} onValueChange={setSelectedHour} required>
                    <SelectTrigger id="hour">
                      <SelectValue placeholder="HH" />
                    </SelectTrigger>
                    <SelectContent>
                      {hours.map((hour) => (
                        <SelectItem key={hour} value={hour}>
                          {hour}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minute" className="text-xs text-muted-foreground">Minutos</Label>
                  <Select value={selectedMinute} onValueChange={setSelectedMinute} required>
                    <SelectTrigger id="minute">
                      <SelectValue placeholder="MM" />
                    </SelectTrigger>
                    <SelectContent>
                      {minutes.map((minute) => (
                        <SelectItem key={minute} value={minute}>
                          {minute}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {fueraHorario && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Advertencia: Cita fuera del horario</AlertTitle>
              <AlertDescription>
                Esta cita está fuera del horario del profesional.
                {horarioInfo?.horarioDia 
                  ? ` El horario de ${horarioInfo.dia.charAt(0).toUpperCase() + horarioInfo.dia.slice(1)} es ${horarioInfo.horarioDia.inicio}-${horarioInfo.horarioDia.fin}.`
                  : ` El ${horarioInfo?.dia ? horarioInfo.dia.charAt(0).toUpperCase() + horarioInfo.dia.slice(1) : 'día seleccionado'} no tiene horario configurado.`
                }
                Debe marcar esta cita como excepcional y proporcionar una razón.
              </AlertDescription>
            </Alert>
          )}

          {fueraHorario && (
            <div className="space-y-4 border rounded-lg p-4 bg-muted/50">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="es-excepcional"
                  checked={esExcepcional}
                  onCheckedChange={(checked) => setEsExcepcional(checked === true)}
                />
                <Label htmlFor="es-excepcional" className="cursor-pointer">
                  Esta cita está fuera del horario del médico
                </Label>
              </div>

              {esExcepcional && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="razon-excepcional">Razón de la excepción *</Label>
                    <Select 
                      value={razonExcepcional} 
                      onValueChange={setRazonExcepcional}
                      required={esExcepcional}
                    >
                      <SelectTrigger id="razon-excepcional">
                        <SelectValue placeholder="Seleccione una razón" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="emergencia">Emergencia</SelectItem>
                        <SelectItem value="caso_especial">Caso especial autorizado</SelectItem>
                        <SelectItem value="extension_horario">Extensión de horario</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="razon-adicional">Razón adicional (opcional)</Label>
                    <Textarea
                      id="razon-adicional"
                      placeholder="Detalle adicional sobre la razón de la excepción..."
                      value={razonAdicional}
                      onChange={(e) => setRazonAdicional(e.target.value)}
                      rows={3}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={rescheduleMutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={rescheduleMutation.isPending}>
              {rescheduleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reagendar Cita
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

