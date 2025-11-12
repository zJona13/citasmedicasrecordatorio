import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock, User, MapPin, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { appointmentsApi, Appointment } from "@/lib/api";
import { format, startOfMonth, endOfMonth, isSameDay, parseISO, getMonth, getYear } from "date-fns";
import { es } from "date-fns/locale";

interface AppointmentCalendarProps {
  onAppointmentClick?: (appointment: Appointment) => void;
  onDateClick?: (date: Date) => void;
}

const statusConfig = {
  confirmed: {
    label: "Confirmada",
    className: "bg-green-100 text-green-800 border-green-300",
  },
  pending: {
    label: "Pendiente",
    className: "bg-yellow-100 text-yellow-800 border-yellow-300",
  },
  released: {
    label: "Liberada",
    className: "bg-blue-100 text-blue-800 border-blue-300",
  },
  offered: {
    label: "Ofrecida",
    className: "bg-purple-100 text-purple-800 border-purple-300",
  },
};

export function AppointmentCalendar({ onAppointmentClick, onDateClick }: AppointmentCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);

  // Calcular rango de fechas para el mes actual
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const fechaInicio = format(monthStart, 'yyyy-MM-dd');
  const fechaFin = format(monthEnd, 'yyyy-MM-dd');

  // Obtener citas del mes
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['citas', fechaInicio, fechaFin],
    queryFn: () => appointmentsApi.getByDateRange(fechaInicio, fechaFin),
  });

  // Agrupar citas por fecha
  const appointmentsByDate = useMemo(() => {
    const grouped: Record<string, Appointment[]> = {};
    appointments.forEach((appointment) => {
      const dateKey = appointment.fecha;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(appointment);
    });
    return grouped;
  }, [appointments]);

  // Obtener citas del día seleccionado
  const selectedDayAppointments = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return appointmentsByDate[dateKey] || [];
  }, [selectedDate, appointmentsByDate]);

  // Personalizar el renderizado de los días del calendario
  const modifiers = useMemo(() => {
    const daysWithAppointments = Object.keys(appointmentsByDate).map(date => parseISO(date));
    return {
      hasAppointments: daysWithAppointments,
    };
  }, [appointmentsByDate]);

  const modifiersClassNames = {
    hasAppointments: "relative after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-primary",
  };

  const handleDayClick = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setIsDayModalOpen(true);
    }
  };

  const handleCreateNewAppointment = () => {
    setIsDayModalOpen(false);
    if (selectedDate && onDateClick) {
      onDateClick(selectedDate);
    }
  };

  const monthName = format(currentMonth, "MMMM yyyy", { locale: es });
  const capitalizedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Calendario de Citas</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newDate = new Date(currentMonth);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setCurrentMonth(newDate);
                }}
              >
                ← Anterior
              </Button>
              <span className="text-sm font-medium min-w-[150px] text-center">
                {capitalizedMonthName}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newDate = new Date(currentMonth);
                  newDate.setMonth(newDate.getMonth() + 1);
                  setCurrentMonth(newDate);
                }}
              >
                Siguiente →
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando citas...
            </div>
          ) : (
            <div className="space-y-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDayClick}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                modifiers={modifiers}
                modifiersClassNames={modifiersClassNames}
                className="rounded-md border"
                locale={es}
                classNames={{
                  day: "cursor-pointer hover:bg-accent",
                }}
              />

              {/* Leyenda de estados */}
              <div className="flex flex-wrap gap-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <span className="text-sm text-muted-foreground">Día con citas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={statusConfig.confirmed.className} variant="outline">
                    {statusConfig.confirmed.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={statusConfig.pending.className} variant="outline">
                    {statusConfig.pending.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={statusConfig.released.className} variant="outline">
                    {statusConfig.released.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={statusConfig.offered.className} variant="outline">
                    {statusConfig.offered.label}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal con citas del día seleccionado */}
      <Dialog open={isDayModalOpen} onOpenChange={setIsDayModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Citas del {selectedDate ? format(selectedDate, "EEEE, d 'de' MMMM yyyy", { locale: es }) : ''}
            </DialogTitle>
            <DialogDescription>
              Hospital Luis Heysen II de Chiclayo
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedDayAppointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No hay citas programadas para este día</p>
                <Button
                  onClick={handleCreateNewAppointment}
                  className="mt-4 gap-2"
                  variant="outline"
                >
                  <Plus className="h-4 w-4" />
                  Crear Nueva Cita
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {selectedDayAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className={cn(
                        "p-4 rounded-lg border transition-all hover:shadow-md cursor-pointer",
                        "border-l-4",
                        appointment.status === "confirmed" && "border-l-green-500",
                        appointment.status === "pending" && "border-l-yellow-500",
                        appointment.status === "offered" && "border-l-purple-500",
                        appointment.status === "released" && "border-l-blue-500"
                      )}
                      onClick={() => {
                        if (onAppointmentClick) {
                          onAppointmentClick(appointment);
                        }
                        setIsDayModalOpen(false);
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 font-semibold">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              {appointment.time}
                            </div>
                            <Badge variant="outline" className={statusConfig[appointment.status].className}>
                              {statusConfig[appointment.status].label}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {appointment.channel}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{appointment.patient}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{appointment.doctor} • {appointment.specialty}</span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Ver Detalle
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t">
                  <Button
                    onClick={handleCreateNewAppointment}
                    className="w-full gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Nueva Cita para este Día
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
