import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface NewAppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewAppointmentModal({ open, onOpenChange }: NewAppointmentModalProps) {
  const [date, setDate] = useState<Date>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Lógica de guardado
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Cita</DialogTitle>
          <DialogDescription>
            Complete los datos para crear una nueva cita médica
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dni">DNI del Paciente</Label>
              <Input id="dni" placeholder="12345678" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="patient-name">Nombre del Paciente</Label>
              <Input id="patient-name" placeholder="Juan Pérez López" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="specialty">Especialidad</Label>
              <Select required>
                <SelectTrigger id="specialty">
                  <SelectValue placeholder="Seleccionar especialidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cardiologia">Cardiología</SelectItem>
                  <SelectItem value="pediatria">Pediatría</SelectItem>
                  <SelectItem value="traumatologia">Traumatología</SelectItem>
                  <SelectItem value="neurologia">Neurología</SelectItem>
                  <SelectItem value="oftalmologia">Oftalmología</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="doctor">Profesional</Label>
              <Select required>
                <SelectTrigger id="doctor">
                  <SelectValue placeholder="Seleccionar médico" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dr-gomez">Dr. Gómez García</SelectItem>
                  <SelectItem value="dra-lopez">Dra. López Martínez</SelectItem>
                  <SelectItem value="dr-silva">Dr. Silva Romero</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha</Label>
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
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Hora</Label>
              <Select required>
                <SelectTrigger id="time">
                  <SelectValue placeholder="Seleccionar hora" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="08:00">08:00</SelectItem>
                  <SelectItem value="09:00">09:00</SelectItem>
                  <SelectItem value="10:00">10:00</SelectItem>
                  <SelectItem value="11:00">11:00</SelectItem>
                  <SelectItem value="14:00">14:00</SelectItem>
                  <SelectItem value="15:00">15:00</SelectItem>
                  <SelectItem value="16:00">16:00</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas adicionales</Label>
            <Input id="notes" placeholder="Observaciones o indicaciones especiales" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Crear Cita</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
