import { useState, useEffect } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AppointmentCalendar } from "@/components/citas/AppointmentCalendar";
import { NewAppointmentModal } from "@/components/citas/NewAppointmentModal";
import { AppointmentDetailsModal } from "@/components/citas/AppointmentDetailsModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Appointment, appointmentsApi } from "@/lib/api";

export default function Citas() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [preselectedDate, setPreselectedDate] = useState<Date | undefined>(undefined);
  
  const citaId = searchParams.get("citaId");
  
  // Obtener la cita del estado de navegación (si viene del TopBar)
  const appointmentFromState = location.state?.appointment as Appointment | undefined;

  // Obtener la cita específica cuando se navega desde la búsqueda (fallback si no viene en el estado)
  const { data: appointmentFromSearch } = useQuery({
    queryKey: ['appointment', citaId],
    queryFn: async () => {
      if (!citaId || appointmentFromState) return null; // No buscar si ya tenemos la cita en el estado
      // Necesitamos obtener todas las citas para encontrar la que corresponde
      // Usaremos un rango amplio para asegurarnos de encontrarla
      const today = new Date();
      const startDate = new Date(today);
      startDate.setMonth(startDate.getMonth() - 6); // 6 meses atrás
      const endDate = new Date(today);
      endDate.setMonth(endDate.getMonth() + 6); // 6 meses adelante
      
      const fechaInicio = startDate.toISOString().split('T')[0];
      const fechaFin = endDate.toISOString().split('T')[0];
      
      const appointments = await appointmentsApi.getByDateRange(fechaInicio, fechaFin);
      return appointments.find(apt => apt.id === citaId) || null;
    },
    enabled: !!citaId && !appointmentFromState,
  });

  // Abrir el modal de detalles cuando se navega desde la búsqueda
  useEffect(() => {
    // Priorizar la cita que viene en el estado de navegación (del TopBar)
    if (appointmentFromState) {
      setSelectedAppointment(appointmentFromState);
      setIsDetailsModalOpen(true);
      // Limpiar el query param y el estado
      setSearchParams({});
      // Limpiar el estado de navegación
      window.history.replaceState({}, document.title);
    } else if (appointmentFromSearch) {
      // Fallback: buscar la cita si no viene en el estado
      setSelectedAppointment(appointmentFromSearch);
      setIsDetailsModalOpen(true);
      // Limpiar el query param
      setSearchParams({});
    }
  }, [appointmentFromState, appointmentFromSearch, setSearchParams]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Citas</h1>
          <p className="text-muted-foreground mt-2">
            Hospital Luis Heysen II de Chiclayo
          </p>
        </div>
        <Button onClick={() => setIsNewModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Cita
        </Button>
      </div>

      <AppointmentCalendar 
        onAppointmentClick={(appointment) => {
          setSelectedAppointment(appointment);
          setIsDetailsModalOpen(true);
        }}
        onDateClick={(date) => {
          setPreselectedDate(date);
          setIsNewModalOpen(true);
        }}
      />

      <NewAppointmentModal 
        open={isNewModalOpen} 
        onOpenChange={(open) => {
          setIsNewModalOpen(open);
          if (!open) {
            setPreselectedDate(undefined);
          }
        }}
        preselectedDate={preselectedDate}
      />
      
      <AppointmentDetailsModal 
        open={isDetailsModalOpen} 
        onOpenChange={(open) => {
          setIsDetailsModalOpen(open);
          if (!open) {
            setSelectedAppointment(null);
          }
        }}
        appointment={selectedAppointment}
      />
    </div>
  );
}
