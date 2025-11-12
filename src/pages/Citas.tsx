import { AppointmentCalendar } from "@/components/citas/AppointmentCalendar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Citas() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Citas</h1>
          <p className="text-muted-foreground mt-2">
            Visualiza y administra las citas programadas
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Cita
        </Button>
      </div>

      <AppointmentCalendar />
    </div>
  );
}
