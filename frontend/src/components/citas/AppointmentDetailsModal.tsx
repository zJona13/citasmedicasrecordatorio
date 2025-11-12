import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, User, Stethoscope, Phone, Mail, MapPin, MessageSquare, Smartphone } from "lucide-react";

interface AppointmentDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: {
    patient: string;
    dni: string;
    specialty: string;
    doctor: string;
    date: string;
    time: string;
    status: string;
    channel: string;
    phone?: string;
    email?: string;
  };
}

export function AppointmentDetailsModal({ open, onOpenChange, appointment }: AppointmentDetailsModalProps) {
  if (!appointment) return null;

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "confirmada": return "default";
      case "pendiente": return "secondary";
      case "ofrecida": return "outline";
      default: return "secondary";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalles de la Cita</DialogTitle>
          <DialogDescription>
            Información completa del paciente y la cita médica
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{appointment.patient}</h3>
              <p className="text-sm text-muted-foreground">DNI: {appointment.dni}</p>
            </div>
            <Badge variant={getStatusVariant(appointment.status)}>
              {appointment.status}
            </Badge>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Fecha</p>
                  <p className="text-sm text-muted-foreground">{appointment.date}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Hora</p>
                  <p className="text-sm text-muted-foreground">{appointment.time}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Stethoscope className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Especialidad</p>
                  <p className="text-sm text-muted-foreground">{appointment.specialty}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Profesional</p>
                  <p className="text-sm text-muted-foreground">{appointment.doctor}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {appointment.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Teléfono</p>
                    <p className="text-sm text-muted-foreground">{appointment.phone}</p>
                  </div>
                </div>
              )}

              {appointment.email && (
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Correo</p>
                    <p className="text-sm text-muted-foreground">{appointment.email}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                {appointment.channel === "SMS" ? (
                  <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5" />
                ) : (
                  <Smartphone className="h-5 w-5 text-muted-foreground mt-0.5" />
                )}
                <div>
                  <p className="text-sm font-medium">Canal de confirmación</p>
                  <p className="text-sm text-muted-foreground">{appointment.channel}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Sede</p>
                  <p className="text-sm text-muted-foreground">Hospital Nacional Rebagliati</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex gap-2 justify-end">
            <Button variant="outline">Reagendar</Button>
            <Button variant="outline">Cancelar Cita</Button>
            <Button>Confirmar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
