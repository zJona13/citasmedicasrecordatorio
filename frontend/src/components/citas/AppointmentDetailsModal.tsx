import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar, Clock, User, Stethoscope, Phone, Mail, MapPin, MessageSquare, Smartphone, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Appointment, appointmentsApi } from "@/lib/api";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { RescheduleAppointmentModal } from "./RescheduleAppointmentModal";

interface AppointmentDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: Appointment | null;
}

export function AppointmentDetailsModal({ open, onOpenChange, appointment }: AppointmentDetailsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isNoShowDialogOpen, setIsNoShowDialogOpen] = useState(false);

  // Mutation para confirmar cita
  const confirmMutation = useMutation({
    mutationFn: () => {
      if (!appointment) throw new Error('No hay cita seleccionada');
      return appointmentsApi.confirm(appointment.id);
    },
    onSuccess: (updatedAppointment: Appointment & { mensajeEnviado?: boolean }) => {
      // Actualizar optimísticamente todas las queries de citas
      queryClient.setQueriesData<Appointment[]>(
        { queryKey: ['citas'] },
        (oldData) => {
          if (!oldData) return oldData;
          return oldData.map((cita) =>
            cita.id === updatedAppointment.id ? updatedAppointment : cita
          );
        }
      );
      
      // Invalidar y refetch para asegurar sincronización
      queryClient.invalidateQueries({ queryKey: ['citas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.refetchQueries({ queryKey: ['citas'] });
      
      toast({
        title: "Cita confirmada",
        description: (updatedAppointment as any).mensajeEnviado 
          ? "La cita ha sido confirmada y se ha enviado un mensaje al paciente."
          : "La cita ha sido confirmada.",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo confirmar la cita.",
        variant: "destructive",
      });
    },
  });

  // Mutation para cancelar cita
  const cancelMutation = useMutation({
    mutationFn: () => {
      if (!appointment) throw new Error('No hay cita seleccionada');
      return appointmentsApi.cancel(appointment.id);
    },
    onSuccess: (updatedAppointment: Appointment) => {
      // Actualizar optimísticamente todas las queries de citas
      queryClient.setQueriesData<Appointment[]>(
        { queryKey: ['citas'] },
        (oldData) => {
          if (!oldData) return oldData;
          return oldData.map((cita) =>
            cita.id === updatedAppointment.id ? updatedAppointment : cita
          );
        }
      );
      
      // Invalidar y refetch para asegurar sincronización
      queryClient.invalidateQueries({ queryKey: ['citas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.refetchQueries({ queryKey: ['citas'] });
      
      toast({
        title: "Cita cancelada",
        description: "La cita ha sido cancelada. Se notificará a la lista de espera si corresponde.",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo cancelar la cita.",
        variant: "destructive",
      });
    },
  });

  // Mutation para marcar como no-show
  const noShowMutation = useMutation({
    mutationFn: () => {
      if (!appointment) throw new Error('No hay cita seleccionada');
      return appointmentsApi.markAsNoShow(appointment.id);
    },
    onSuccess: (updatedAppointment: Appointment) => {
      // Actualizar optimísticamente todas las queries de citas
      queryClient.setQueriesData<Appointment[]>(
        { queryKey: ['citas'] },
        (oldData) => {
          if (!oldData) return oldData;
          return oldData.map((cita) =>
            cita.id === updatedAppointment.id ? updatedAppointment : cita
          );
        }
      );
      
      // Invalidar y refetch para asegurar sincronización
      queryClient.invalidateQueries({ queryKey: ['citas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      
      // Forzar refetch inmediato
      queryClient.refetchQueries({ queryKey: ['citas'] });
      
      toast({
        title: "Cita marcada como No-Show",
        description: "La cita ha sido marcada como no-show. El paciente no asistió a la cita.",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo marcar la cita como no-show.",
        variant: "destructive",
      });
    },
  });

  const handleReschedule = () => {
    setIsRescheduleModalOpen(true);
  };

  const handleConfirm = () => {
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmAction = () => {
    setIsConfirmDialogOpen(false);
    confirmMutation.mutate();
  };

  const handleCancel = () => {
    setIsCancelDialogOpen(true);
  };

  const handleCancelAction = () => {
    setIsCancelDialogOpen(false);
    cancelMutation.mutate();
  };

  const handleNoShow = () => {
    setIsNoShowDialogOpen(true);
  };

  const handleNoShowAction = () => {
    setIsNoShowDialogOpen(false);
    noShowMutation.mutate();
  };

  // Early return DESPUÉS de todos los hooks
  if (!appointment) return null;

  const getStatusLabel = (status: Appointment['status']) => {
    switch (status) {
      case "confirmed": return "Confirmada";
      case "pending": return "Pendiente";
      case "offered": return "Ofrecida";
      case "released": return "Liberada";
      case "no_show": return "No-Show";
      default: return "Pendiente";
    }
  };

  const getStatusVariant = (status: Appointment['status']) => {
    switch (status) {
      case "confirmed": return "default";
      case "pending": return "secondary";
      case "offered": return "outline";
      case "released": return "secondary";
      case "no_show": return "destructive";
      default: return "secondary";
    }
  };

  const formattedDate = appointment.fecha 
    ? format(new Date(appointment.fecha), "EEEE, d 'de' MMMM yyyy", { locale: es })
    : "N/A";

  // Determinar qué botones deben estar deshabilitados
  const isConfirmed = appointment.status === 'confirmed';
  const isCancelled = appointment.status === 'released';
  const isCompleted = appointment.status === 'offered'; // Asumiendo que 'offered' es completada
  const isNoShow = appointment.status === 'no_show';

  const canReschedule = !isCancelled && !isCompleted && !isNoShow;
  const canConfirm = !isConfirmed && !isCancelled && !isCompleted && !isNoShow;
  const canCancel = !isCancelled && !isCompleted && !isNoShow;
  const canMarkNoShow = (appointment.status === 'pending' || appointment.status === 'confirmed') && !isCancelled && !isCompleted;

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
              {getStatusLabel(appointment.status)}
            </Badge>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Fecha</p>
                  <p className="text-sm text-muted-foreground">{formattedDate}</p>
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
                  <p className="text-sm text-muted-foreground">Hospital Luis Heysen II de Chiclayo</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={handleReschedule}
              disabled={!canReschedule || confirmMutation.isPending || cancelMutation.isPending || noShowMutation.isPending}
            >
              Reagendar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleNoShow}
              disabled={!canMarkNoShow || confirmMutation.isPending || cancelMutation.isPending || noShowMutation.isPending}
            >
              {noShowMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Marcar como No-Show
            </Button>
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={!canCancel || confirmMutation.isPending || cancelMutation.isPending || noShowMutation.isPending}
            >
              {cancelMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cancelar Cita
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={!canConfirm || confirmMutation.isPending || cancelMutation.isPending || noShowMutation.isPending}
            >
              {confirmMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar
            </Button>
          </div>
        </div>
      </DialogContent>
      
      <RescheduleAppointmentModal 
        open={isRescheduleModalOpen} 
        onOpenChange={(open) => {
          setIsRescheduleModalOpen(open);
          if (!open) {
            // Invalidar queries cuando se cierra el modal de reagendar
            queryClient.invalidateQueries({ queryKey: ['citas'] });
          }
        }}
        appointment={appointment}
      />

      {/* Diálogo de confirmación para confirmar cita */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <AlertDialogTitle>Confirmar Cita</AlertDialogTitle>
                <AlertDialogDescription className="mt-1">
                  ¿Está seguro de que desea confirmar esta cita?
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Se enviará un mensaje de confirmación al paciente al número de teléfono registrado.
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={confirmMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmAction}
              disabled={confirmMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {confirmMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sí, confirmar cita
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de confirmación para cancelar cita */}
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <AlertDialogTitle>Cancelar Cita</AlertDialogTitle>
                <AlertDialogDescription className="mt-1">
                  ¿Está seguro de que desea cancelar esta cita?
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Esta acción no se puede deshacer. Si corresponde, se notificará a los pacientes en lista de espera.
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelMutation.isPending}>
              No, mantener cita
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancelAction}
              disabled={cancelMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sí, cancelar cita
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de confirmación para marcar como no-show */}
      <AlertDialog open={isNoShowDialogOpen} onOpenChange={setIsNoShowDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <AlertDialogTitle>Marcar como No-Show</AlertDialogTitle>
                <AlertDialogDescription className="mt-1">
                  ¿Está seguro de que desea marcar esta cita como no-show?
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Esta acción marcará la cita como no-show, indicando que el paciente no asistió a la cita programada.
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={noShowMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleNoShowAction}
              disabled={noShowMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {noShowMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sí, marcar como no-show
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
