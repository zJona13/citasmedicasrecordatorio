import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, Search } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { api, appointmentsApi, CreateAppointmentData, reniecApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";

interface Professional {
  id: number;
  name: string;
  specialty: string;
  cmp: string;
  consultorio: string;
  schedule: string;
  status: string;
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
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("");
  const [profesionalId, setProfesionalId] = useState<string>("");
  const [date, setDate] = useState<Date | undefined>(preselectedDate);
  const [time, setTime] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [isReniecLoading, setIsReniecLoading] = useState(false);

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
      setSelectedSpecialty("");
      setProfesionalId("");
      setDate(preselectedDate);
      setTime("");
      setNotes("");
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

  // Fetch profesionales
  const { data: profesionalesData, isLoading: isLoadingProfesionales } = useQuery({
    queryKey: ['profesionales'],
    queryFn: () => api.get<{ profesionales: Professional[] }>('/profesionales'),
    enabled: open,
  });

  const profesionales = profesionalesData?.profesionales || [];

  // Filtrar profesionales por especialidad seleccionada
  const filteredProfesionales = selectedSpecialty
    ? profesionales.filter(p => p.specialty.toLowerCase() === selectedSpecialty.toLowerCase())
    : profesionales;

  // Obtener lista única de especialidades
  const especialidades = Array.from(new Set(profesionales.map(p => p.specialty))).sort();

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
                value={selectedSpecialty} 
                onValueChange={(value) => {
                  setSelectedSpecialty(value);
                  setProfesionalId(""); // Reset profesional when specialty changes
                }}
                required
              >
                <SelectTrigger id="specialty">
                  <SelectValue placeholder="Seleccionar especialidad" />
                </SelectTrigger>
                <SelectContent>
                  {especialidades.map((esp) => (
                    <SelectItem key={esp} value={esp}>
                      {esp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="doctor">Profesional *</Label>
              <Select 
                value={profesionalId} 
                onValueChange={setProfesionalId}
                required
                disabled={!selectedSpecialty || isLoadingProfesionales}
              >
                <SelectTrigger id="doctor">
                  <SelectValue placeholder={selectedSpecialty ? "Seleccionar médico" : "Primero seleccione especialidad"} />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingProfesionales ? (
                    <SelectItem value="loading" disabled>
                      Cargando...
                    </SelectItem>
                  ) : filteredProfesionales.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No hay profesionales disponibles
                    </SelectItem>
                  ) : (
                    filteredProfesionales
                      .filter(p => p.status === 'disponible')
                      .map((prof) => (
                        <SelectItem key={prof.id} value={prof.id.toString()}>
                          {prof.name} - {prof.specialty}
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
