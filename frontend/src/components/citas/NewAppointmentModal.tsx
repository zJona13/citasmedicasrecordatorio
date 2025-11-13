import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, Search, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { api, appointmentsApi, CreateAppointmentData, reniecApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
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

interface NewAppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedDate?: Date;
}

// Generar horas disponibles (8:00 AM a 5:00 PM, cada hora)
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 8; hour <= 17; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
  }
  return slots;
};

const timeSlots = generateTimeSlots();

export function NewAppointmentModal({ open, onOpenChange, preselectedDate }: NewAppointmentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [dni, setDni] = useState("");
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string>("");
  const [profesionalId, setProfesionalId] = useState<string>("");
  const [date, setDate] = useState<Date | undefined>(preselectedDate);
  const [time, setTime] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [isReniecLoading, setIsReniecLoading] = useState(false);
  const [esExcepcional, setEsExcepcional] = useState(false);
  const [razonExcepcional, setRazonExcepcional] = useState<string>("");
  const [razonAdicional, setRazonAdicional] = useState("");
  const [fueraHorario, setFueraHorario] = useState(false);
  const [horarioInfo, setHorarioInfo] = useState<{ dia: string; horarioDia: { inicio: string; fin: string } | null } | null>(null);

  // Debounce DNI para consultar RENIEC
  const debouncedDni = useDebounce(dni, 800);

  // Reset form when modal opens/closes or preselectedDate changes
  useEffect(() => {
    if (open) {
      if (preselectedDate) {
        setDate(preselectedDate);
      }
    } else {
      // Reset form when closing
      setDni("");
      setNombreCompleto("");
      setTelefono("");
      setEmail("");
      setSelectedSpecialtyId("");
      setProfesionalId("");
      setDate(preselectedDate);
      setTime("");
      setNotes("");
      setEsExcepcional(false);
      setRazonExcepcional("");
      setRazonAdicional("");
      setFueraHorario(false);
      setHorarioInfo(null);
    }
  }, [open, preselectedDate]);

  // Consultar RENIEC cuando el DNI tiene 8 dígitos
  const { data: reniecData, isLoading: isLoadingReniec, error: reniecError } = useQuery({
    queryKey: ['reniec', debouncedDni],
    queryFn: () => reniecApi.consultarDNI(debouncedDni),
    enabled: !!debouncedDni && /^\d{8}$/.test(debouncedDni) && open,
    retry: false,
  });

  // Actualizar estado de carga
  useEffect(() => {
    setIsReniecLoading(isLoadingReniec);
  }, [isLoadingReniec]);

  // Manejar respuesta exitosa de RENIEC
  useEffect(() => {
    if (reniecData?.success && reniecData.data) {
      // Autocompletar campos con datos de RENIEC
      setNombreCompleto(reniecData.data.nombre_completo || "");
      toast({
        title: "Datos encontrados",
        description: "Los datos del paciente se han cargado desde RENIEC.",
      });
    }
  }, [reniecData, toast]);

  // Manejar errores de RENIEC
  useEffect(() => {
    if (reniecError && debouncedDni.length === 8) {
      const errorMessage = reniecError instanceof Error ? reniecError.message : 'Error desconocido';
      // No mostrar error si es porque el DNI no se encontró (es normal)
      if (!errorMessage.includes('no encontrado')) {
        toast({
          title: "Error al consultar RENIEC",
          description: errorMessage || "No se pudieron obtener los datos del DNI.",
          variant: "destructive",
        });
      }
    }
  }, [reniecError, debouncedDni, toast]);

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

  // Filtrar profesionales por especialidad_id seleccionada
  const filteredProfesionales = selectedSpecialtyId
    ? profesionales.filter(p => p.especialidad_id?.toString() === selectedSpecialtyId && p.status === 'disponible')
    : profesionales.filter(p => p.status === 'disponible');

  // Obtener profesional seleccionado
  const profesionalSeleccionado = profesionales.find(p => p.id.toString() === profesionalId);

  // Función para validar horario
  const validarHorario = () => {
    if (!profesionalSeleccionado || !date || !time) {
      setFueraHorario(false);
      setHorarioInfo(null);
      return;
    }

    const horario = profesionalSeleccionado.schedule;
    if (!horario) {
      // Si no hay horario configurado, considerar dentro del horario
      setFueraHorario(false);
      setHorarioInfo(null);
      return;
    }

    // Parsear horario
    let horarioObj: Record<string, { inicio: string; fin: string }> = {};
    try {
      horarioObj = typeof horario === 'string' ? JSON.parse(horario) : horario;
    } catch (e) {
      // Si no se puede parsear, considerar dentro del horario
      setFueraHorario(false);
      setHorarioInfo(null);
      return;
    }

    // Obtener día de la semana
    const fechaObj = new Date(date);
    const diaNumero = fechaObj.getDay();
    const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const dia = diasSemana[diaNumero];

    // Verificar si el día tiene horario configurado
    if (!horarioObj[dia]) {
      setFueraHorario(true);
      setHorarioInfo({ dia, horarioDia: null });
      return;
    }

    const horarioDia = horarioObj[dia];
    
    // Convertir horas a minutos para comparar
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

  // Validar horario cuando cambian profesional, fecha o hora
  useEffect(() => {
    validarHorario();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profesionalId, date, time, profesionalSeleccionado]);

  // Mutation para crear cita
  const createMutation = useMutation({
    mutationFn: (data: CreateAppointmentData) => appointmentsApi.create(data),
    onSuccess: () => {
      toast({
        title: "Cita creada",
        description: "La cita se ha creado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ['citas'] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la cita.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!dni || !nombreCompleto || !profesionalId || !date || !time) {
      toast({
        title: "Campos requeridos",
        description: "Por favor complete todos los campos obligatorios.",
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

    createMutation.mutate({
      dni,
      nombre_completo: nombreCompleto,
      telefono: telefono || undefined,
      email: email || undefined,
      profesional_id: profesionalIdNum,
      fecha: fechaFormatted,
      hora: time,
      notas: notes || undefined,
      es_excepcional: fueraHorario ? esExcepcional : undefined,
      razon_excepcional: fueraHorario && esExcepcional ? razonExcepcional as 'emergencia' | 'caso_especial' | 'extension_horario' | 'otro' : undefined,
      razon_adicional: fueraHorario && esExcepcional ? razonAdicional || undefined : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Cita</DialogTitle>
          <DialogDescription>
            Hospital Luis Heysen II de Chiclayo - Complete los datos para crear una nueva cita médica
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dni">DNI del Paciente *</Label>
              <div className="relative">
                <Input 
                  id="dni" 
                  placeholder="12345678" 
                  value={dni}
                  onChange={(e) => {
                    // Solo permitir números y máximo 8 dígitos
                    const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                    setDni(value);
                  }}
                  maxLength={8}
                  required 
                  className={cn(
                    isReniecLoading && "pr-10"
                  )}
                />
                {isReniecLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
                {!isReniecLoading && dni.length === 8 && reniecData?.success && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Search className="h-4 w-4 text-green-600" />
                  </div>
                )}
              </div>
              {dni.length === 8 && !isReniecLoading && reniecData?.success && (
                <p className="text-xs text-green-600">✓ Datos encontrados en RENIEC</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="patient-name">Nombre del Paciente *</Label>
              <Input 
                id="patient-name" 
                placeholder="Juan Pérez López" 
                value={nombreCompleto}
                onChange={(e) => setNombreCompleto(e.target.value)}
                required 
                className={cn(
                  reniecData?.success && "border-green-300"
                )}
              />
              {reniecData?.success && (
                <p className="text-xs text-muted-foreground">Datos de RENIEC - Puede editar si es necesario</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input 
                id="telefono" 
                placeholder="987654321" 
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input 
                id="email" 
                type="email"
                placeholder="correo@ejemplo.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

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
              <Label htmlFor="time">Hora *</Label>
              <Select value={time} onValueChange={setTime} required>
                <SelectTrigger id="time">
                  <SelectValue placeholder="Seleccionar hora" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

          <div className="space-y-2">
            <Label htmlFor="notes">Notas adicionales</Label>
            <Input 
              id="notes" 
              placeholder="Observaciones o indicaciones especiales" 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Cita
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
