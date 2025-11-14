import { useMemo } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { cn, normalizeDate } from "@/lib/utils";
import { Appointment } from "@/lib/api";
import { Clock, User } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface WeekViewProps {
  currentDate: Date;
  appointments: Appointment[];
  onAppointmentClick?: (appointment: Appointment) => void;
  onTimeSlotClick?: (date: Date, hour: number) => void;
}

const statusColors = {
  confirmed: "bg-green-100 border-green-300 text-green-900 hover:bg-green-200",
  pending: "bg-yellow-100 border-yellow-300 text-yellow-900 hover:bg-yellow-200",
  released: "bg-blue-100 border-blue-300 text-blue-900 hover:bg-blue-200",
  offered: "bg-purple-100 border-purple-300 text-purple-900 hover:bg-purple-200",
};

// Generar horas del día (0:00 a 23:00)
const generateHours = () => {
  const hours = [];
  for (let i = 0; i <= 23; i++) {
    hours.push(i);
  }
  return hours;
};

export function WeekView({ currentDate, appointments, onAppointmentClick, onTimeSlotClick }: WeekViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Lunes
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const hours = generateHours();

  // Agrupar citas por día usando fechas normalizadas
  const appointmentsByDayAndHour = useMemo(() => {
    const grouped: Record<string, Appointment[]> = {};
    appointments.forEach((appointment) => {
      const dateKey = normalizeDate(appointment.fecha);
      if (dateKey) {
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(appointment);
      }
    });
    return grouped;
  }, [appointments]);

  // Obtener citas para un día específico usando fechas normalizadas
  const getAppointmentsForDay = (day: Date) => {
    const dateKey = normalizeDate(day);
    return appointmentsByDayAndHour[dateKey] || [];
  };

  // Agrupar citas por hora exacta o cercana (dentro de 10 minutos)
  const groupAppointmentsByExactTime = (appointments: Appointment[]) => {
    if (appointments.length === 0) return {};
    
    // Ordenar citas por tiempo
    const sorted = [...appointments].sort((a, b) => {
      const [aHours, aMinutes] = a.time.split(':').map(Number);
      const [bHours, bMinutes] = b.time.split(':').map(Number);
      return (aHours * 60 + aMinutes) - (bHours * 60 + bMinutes);
    });
    
    const grouped: Record<string, Appointment[]> = {};
    const TIME_THRESHOLD_MINUTES = 10; // Agrupar citas dentro de 10 minutos
    
    sorted.forEach((appointment) => {
      const [hours, minutes] = appointment.time.split(':').map(Number);
      const totalMinutes = hours * 60 + minutes;
      
      // Buscar un grupo existente donde esta cita pueda caber
      let addedToGroup = false;
      for (const [groupKey, groupAppointments] of Object.entries(grouped)) {
        const [groupHours, groupMinutes] = groupKey.split(':').map(Number);
        const groupTotalMinutes = groupHours * 60 + groupMinutes;
        
        // Si la cita está dentro del umbral de tiempo, agregarla a este grupo
        if (Math.abs(totalMinutes - groupTotalMinutes) <= TIME_THRESHOLD_MINUTES) {
          groupAppointments.push(appointment);
          addedToGroup = true;
          break;
        }
      }
      
      // Si no se agregó a ningún grupo, crear uno nuevo
      if (!addedToGroup) {
        grouped[appointment.time] = [appointment];
      }
    });
    
    return grouped;
  };

  // Calcular posición y altura de una cita relativa a la hora específica
  const getAppointmentStyle = (
    appointment: Appointment,
    hour: number,
    indexInGroup: number,
    totalInGroup: number
  ) => {
    const [appointmentHour, appointmentMinutes] = appointment.time.split(':').map(Number);
    const appointmentStartMinutes = appointmentHour * 60 + appointmentMinutes;
    const hourStartMinutes = hour * 60;
    const hourEndMinutes = (hour + 1) * 60;
    
    // Si la cita está completamente fuera de esta hora, no mostrar
    if (appointmentStartMinutes >= hourEndMinutes || appointmentStartMinutes < hourStartMinutes) {
      return { display: 'none' };
    }
    
    // Calcular posición top en píxeles (cada hora tiene 80px de altura)
    const hourHeight = 80; // h-[80px] = 80px
    const topPixels = appointmentMinutes === 0 ? 0 : (appointmentMinutes / 60) * hourHeight;
    
    // Calcular duración (asumir 30 minutos por defecto)
    const duration = 30;
    let heightPixels = (duration / 60) * hourHeight;
    
    // Reducir altura cuando hay múltiples citas para evitar superposiciones
    if (totalInGroup > 1) {
      // Reducir altura proporcionalmente, mínimo 20px
      const minHeight = 20;
      const reducedHeight = Math.max(minHeight, heightPixels * 0.7);
      heightPixels = reducedHeight;
    }
    
    // Asegurar que no exceda el espacio disponible de la hora
    const maxHeight = hourHeight - topPixels;
    const finalHeight = Math.min(heightPixels, maxHeight);
    
    // Calcular distribución horizontal cuando hay múltiples citas a la misma hora
    const margin = 4; // Margen entre citas en píxeles
    const sideMargin = 4; // Margen lateral desde el borde en píxeles
    
    let left = `${sideMargin}px`;
    let width = `calc(100% - ${sideMargin * 2}px)`;
    
    if (totalInGroup > 1) {
      // Distribuir horizontalmente cuando hay múltiples citas
      // Calcular el ancho disponible descontando márgenes
      const totalMarginsBetween = (totalInGroup - 1) * margin;
      const widthPerAppointment = `calc((100% - ${sideMargin * 2}px - ${totalMarginsBetween}px) / ${totalInGroup})`;
      const leftOffset = `calc(${sideMargin}px + ${indexInGroup} * (${widthPerAppointment} + ${margin}px))`;
      
      left = leftOffset;
      width = widthPerAppointment;
    }
    
    // Calcular z-index: citas más tempranas tienen z-index más alto para ser visibles
    // Invertir el índice para que las primeras (índice 0) estén arriba
    const zIndex = 20 + (totalInGroup - indexInGroup);
    
    return {
      top: `${topPixels}px`,
      height: `${finalHeight}px`,
      maxHeight: `${maxHeight}px`, // Limitar altura máxima al espacio disponible
      left,
      width,
      zIndex,
    };
  };

  const handleTimeSlotClick = (day: Date, hour: number) => {
    if (onTimeSlotClick) {
      const date = new Date(day);
      date.setHours(hour, 0, 0, 0);
      onTimeSlotClick(date, hour);
    }
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Encabezado con días de la semana */}
        <div className="grid grid-cols-8 border-b">
          <div className="p-2 text-sm font-medium text-muted-foreground border-r">
            Hora
          </div>
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className={cn(
                "p-2 text-center border-r last:border-r-0",
                isSameDay(day, new Date()) && "bg-accent"
              )}
            >
              <div className="text-xs text-muted-foreground">
                {format(day, "EEE", { locale: es })}
              </div>
              <div className="text-sm font-semibold">
                {format(day, "d")}
              </div>
            </div>
          ))}
        </div>

        {/* Grid de horas y citas */}
        <div className="relative border-b">
          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-8 border-b last:border-b-0">
              {/* Columna de horas */}
              <div className="p-2 text-xs text-muted-foreground border-r h-[80px] flex items-start">
                {hour.toString().padStart(2, '0')}:00
              </div>

              {/* Columnas de días */}
              {weekDays.map((day) => {
                const dayAppointments = getAppointmentsForDay(day);
                const hourAppointments = dayAppointments.filter((apt) => {
                  const [aptHour] = apt.time.split(':').map(Number);
                  return aptHour === hour;
                });

                // Agrupar citas por hora exacta
                const appointmentsByExactTime = groupAppointmentsByExactTime(hourAppointments);

                return (
                  <div
                    key={`${day.toISOString()}-${hour}`}
                    className="relative border-r last:border-r-0 h-[80px] cursor-pointer hover:bg-accent/30 transition-colors overflow-visible"
                    onClick={() => handleTimeSlotClick(day, hour)}
                  >
                    {/* Renderizar citas agrupadas por hora exacta */}
                    {Object.entries(appointmentsByExactTime).map(([exactTime, timeGroup]) => {
                      return timeGroup.map((appointment, index) => {
                        const style = getAppointmentStyle(appointment, hour, index, timeGroup.length);
                        if (style.display === 'none') {
                          return null;
                        }
                        return (
                          <TooltipProvider key={appointment.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className={cn(
                                    "absolute px-2 py-1.5 rounded-lg border cursor-pointer shadow-sm",
                                    "transition-all hover:shadow-lg hover:scale-[1.02]",
                                    "overflow-hidden", // Contener el contenido
                                    statusColors[appointment.status]
                                  )}
                                  style={style}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onAppointmentClick) {
                                      onAppointmentClick(appointment);
                                    }
                                  }}
                                >
                                  <div className="flex items-center gap-1.5 h-full w-full text-xs leading-tight">
                                    <span className="font-semibold flex-shrink-0">
                                      {appointment.time}
                                    </span>
                                    <span className="font-medium truncate">
                                      {appointment.patient}
                                    </span>
                                    <span className="text-muted-foreground flex-shrink-0">-</span>
                                    <span className="opacity-75 truncate">
                                      {appointment.doctor}
                                    </span>
                                    <span className="text-muted-foreground flex-shrink-0">-</span>
                                    <span className="opacity-60 truncate">
                                      {appointment.specialty}
                                    </span>
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-xs space-y-1">
                                  <div className="font-semibold">{appointment.time}</div>
                                  <div>{appointment.patient}</div>
                                  <div className="text-muted-foreground">{appointment.doctor}</div>
                                  <div className="text-muted-foreground">{appointment.specialty}</div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        );
                      });
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

