import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Clock, User, MapPin, Plus, Calendar as CalendarIcon, Grid3x3, Square } from "lucide-react";
import { cn, normalizeDate } from "@/lib/utils";
import { appointmentsApi, Appointment } from "@/lib/api";
import { format, startOfMonth, endOfMonth, isSameDay, parseISO, startOfWeek, endOfWeek, addDays, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { WeekView } from "./WeekView";
import { DayView } from "./DayView";

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
  no_show: {
    label: "No-Show",
    className: "bg-red-100 text-red-800 border-red-300",
  },
};

type ViewType = "month" | "week" | "day";

export function AppointmentCalendar({ onAppointmentClick, onDateClick }: AppointmentCalendarProps) {
  const [view, setView] = useState<ViewType>("month");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);

  // Calcular rango de fechas según la vista
  const dateRange = useMemo(() => {
    if (view === "month") {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      return {
        start: monthStart,
        end: monthEnd,
        fechaInicio: format(monthStart, 'yyyy-MM-dd'),
        fechaFin: format(monthEnd, 'yyyy-MM-dd'),
      };
    } else if (view === "week") {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      return {
        start: weekStart,
        end: weekEnd,
        fechaInicio: format(weekStart, 'yyyy-MM-dd'),
        fechaFin: format(weekEnd, 'yyyy-MM-dd'),
      };
    } else {
      // day view
      return {
        start: currentDate,
        end: currentDate,
        fechaInicio: format(currentDate, 'yyyy-MM-dd'),
        fechaFin: format(currentDate, 'yyyy-MM-dd'),
      };
    }
  }, [view, currentDate]);

  // Obtener citas según el rango de fechas
  const { data: appointments = [], isLoading, error, isError } = useQuery({
    queryKey: ['citas', dateRange.fechaInicio, dateRange.fechaFin],
    queryFn: () => appointmentsApi.getByDateRange(dateRange.fechaInicio, dateRange.fechaFin),
  });

  // Agrupar citas por fecha
  const appointmentsByDate = useMemo(() => {
    const grouped: Record<string, Appointment[]> = {};
    appointments.forEach((appointment) => {
      // Normalizar la fecha para asegurar formato consistente
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

  // Obtener citas del día seleccionado
  const selectedDayAppointments = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = normalizeDate(selectedDate);
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
    hasAppointments: "relative",
  };

  const handleDayClick = (date: Date | undefined) => {
    if (date) {
      if (view === "month") {
        const dateKey = normalizeDate(date);
        const dayAppointments = appointmentsByDate[dateKey] || [];
        if (dayAppointments.length === 0 && onDateClick) {
          onDateClick(date);
        } else {
          setSelectedDate(date);
          setIsDayModalOpen(true);
        }
      } else if (view === "week") {
        setCurrentDate(date);
        setView("day");
      } else {
        // day view - allow clicking to create new appointment
        if (onDateClick) {
          onDateClick(date);
        }
      }
    }
  };

  const handleTimeSlotClick = (date: Date, hour: number) => {
    if (onDateClick) {
      onDateClick(date);
    }
  };

  const handleNavigation = (direction: "prev" | "next") => {
    if (view === "month") {
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
      setCurrentDate(newDate);
    } else if (view === "week") {
      const newDate = addDays(currentDate, direction === "next" ? 7 : -7);
      setCurrentDate(newDate);
    } else {
      // day view
      const newDate = addDays(currentDate, direction === "next" ? 1 : -1);
      setCurrentDate(newDate);
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleCreateNewAppointment = () => {
    setIsDayModalOpen(false);
    if (selectedDate && onDateClick) {
      onDateClick(selectedDate);
    }
  };

  const getHeaderTitle = () => {
    if (view === "month") {
      const monthName = format(currentDate, "MMMM yyyy", { locale: es });
      return monthName.charAt(0).toUpperCase() + monthName.slice(1);
    } else if (view === "week") {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(weekStart, "d", { locale: es })} - ${format(weekEnd, "d 'de' MMMM yyyy", { locale: es })}`;
    } else {
      return format(currentDate, "EEEE, d 'de' MMMM yyyy", { locale: es });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle>Calendario de Citas</CardTitle>
            <div className="flex items-center gap-2">
              {/* Selector de vista */}
              <Tabs value={view} onValueChange={(v) => setView(v as ViewType)}>
                <TabsList>
                  <TabsTrigger value="month" className="gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Mes
                  </TabsTrigger>
                  <TabsTrigger value="week" className="gap-2">
                    <Grid3x3 className="h-4 w-4" />
                    Semana
                  </TabsTrigger>
                  <TabsTrigger value="day" className="gap-2">
                    <Square className="h-4 w-4" />
                    Día
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNavigation("prev")}
              >
                ← Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToday}
              >
                Hoy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNavigation("next")}
              >
                Siguiente →
              </Button>
            </div>
            <span className="text-sm font-medium min-w-[200px] text-center">
              {getHeaderTitle()}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando citas...
            </div>
          ) : isError ? (
            <div className="text-center py-8">
              <div className="text-destructive font-semibold mb-2">
                Error al cargar citas
              </div>
              <div className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : 'Error desconocido'}
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Rango consultado: {dateRange.fechaInicio} - {dateRange.fechaFin}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {view === "month" && (
                <>
                  <div className="w-full overflow-x-auto">
                    <div className="min-w-full">
                      <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDayClick}
                      month={currentDate}
                      onMonthChange={setCurrentDate}
                      modifiers={modifiers}
                      modifiersClassNames={modifiersClassNames}
                      className="rounded-md border w-full"
                      locale={es}
                      classNames={{
                        months: "w-full",
                        month: "w-full",
                        table: "w-full",
                        head_row: "flex w-full",
                        head_cell: "flex-1 text-center text-muted-foreground rounded-md font-normal text-[0.8rem]",
                        row: "flex w-full mt-2",
                        day: "h-20 cursor-pointer hover:bg-accent relative",
                        cell: "h-20 p-0.5 relative flex-1",
                      }}
                      components={{
                        Day: (props) => {
                          const { date, displayMonth, ...buttonProps } = props;
                          const day = date;
                          const isCurrentMonth = day.getMonth() === displayMonth.getMonth();
                          const dateKey = normalizeDate(day);
                          const dayAppointments = appointmentsByDate[dateKey] || [];
                          const isSelected = selectedDate && isSameDay(day, selectedDate);
                          const isToday = isSameDay(day, new Date());

                          return (
                            <button
                              {...buttonProps}
                              type="button"
                              className={cn(
                                "h-full w-full p-1 rounded-md transition-colors text-left flex flex-col relative min-w-0",
                                isSelected && "bg-primary text-primary-foreground",
                                !isSelected && isToday && "bg-accent",
                                !isCurrentMonth && "opacity-50",
                                buttonProps.className
                              )}
                              onClick={() => handleDayClick(day)}
                            >
                              <div className="text-sm font-medium mb-1 flex-shrink-0">
                                {format(day, "d")}
                              </div>
                              {isCurrentMonth && dayAppointments.length > 0 && (
                                <div className="flex-1 flex flex-col gap-0.5 overflow-hidden mt-0.5 min-h-0">
                                  {dayAppointments.slice(0, 3).map((appointment) => {
                                    const statusColor = {
                                      confirmed: "bg-green-500",
                                      pending: "bg-yellow-500",
                                      released: "bg-blue-500",
                                      offered: "bg-purple-500",
                                    }[appointment.status] || "bg-gray-500";

                                    return (
                                      <TooltipProvider key={appointment.id}>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div
                                              className={cn(
                                                "text-[9px] px-1 py-0.5 rounded truncate cursor-pointer pointer-events-auto",
                                                "hover:opacity-80 transition-opacity",
                                                statusColor,
                                                "text-white font-medium"
                                              )}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (onAppointmentClick) {
                                                  onAppointmentClick(appointment);
                                                }
                                              }}
                                            >
                                              {appointment.time} - {appointment.doctor.length > 15 
                                                ? `${appointment.doctor.substring(0, 15)}...` 
                                                : appointment.doctor}
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <div className="text-xs">
                                              <div className="font-semibold">{appointment.time}</div>
                                              <div>{appointment.patient}</div>
                                              <div className="text-muted-foreground">{appointment.doctor}</div>
                                              <div className="text-muted-foreground">{appointment.specialty}</div>
                                            </div>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    );
                                  })}
                                    {dayAppointments.length > 3 && (
                                      <div
                                        className="text-[9px] px-1 py-0.5 rounded bg-muted text-muted-foreground cursor-pointer pointer-events-auto hover:bg-muted/80"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedDate(day);
                                          setIsDayModalOpen(true);
                                        }}
                                      >
                                        +{dayAppointments.length - 3} más
                                      </div>
                                    )}
                                  </div>
                                )}
                            </button>
                          );
                        },
                      }}
                      />
                    </div>
                  </div>

                  {/* Leyenda de estados */}
                  <div className="flex flex-wrap gap-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-green-500"></div>
                      <span className="text-sm text-muted-foreground">Confirmada</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-yellow-500"></div>
                      <span className="text-sm text-muted-foreground">Pendiente</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-blue-500"></div>
                      <span className="text-sm text-muted-foreground">Liberada</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-purple-500"></div>
                      <span className="text-sm text-muted-foreground">Ofrecida</span>
                    </div>
                  </div>
                </>
              )}

              {view === "week" && (
                <WeekView
                  currentDate={currentDate}
                  appointments={appointments}
                  onAppointmentClick={onAppointmentClick}
                  onTimeSlotClick={handleTimeSlotClick}
                />
              )}

              {view === "day" && (
                <DayView
                  currentDate={currentDate}
                  appointments={appointments}
                  onAppointmentClick={onAppointmentClick}
                  onTimeSlotClick={handleTimeSlotClick}
                />
              )}
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
