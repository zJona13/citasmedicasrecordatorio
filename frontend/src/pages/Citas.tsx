import { useState } from "react";
import { AppointmentCalendar } from "@/components/citas/AppointmentCalendar";
import { NewAppointmentModal } from "@/components/citas/NewAppointmentModal";
import { AppointmentDetailsModal } from "@/components/citas/AppointmentDetailsModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Citas() {
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Citas</h1>
          <p className="text-muted-foreground mt-2">
            Visualiza y administra las citas programadas
          </p>
        </div>
        <Button onClick={() => setIsNewModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Cita
        </Button>
      </div>

      <AppointmentCalendar />

      <NewAppointmentModal 
        open={isNewModalOpen} 
        onOpenChange={setIsNewModalOpen}
      />
      
      <AppointmentDetailsModal 
        open={isDetailsModalOpen} 
        onOpenChange={setIsDetailsModalOpen}
        appointment={selectedAppointment}
      />
    </div>
  );
}
