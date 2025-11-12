import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, User, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface Appointment {
  id: string;
  time: string;
  patient: string;
  doctor: string;
  specialty: string;
  status: "confirmed" | "pending" | "released" | "offered";
  channel: "SMS" | "App";
}

const mockAppointments: Appointment[] = [
  {
    id: "1",
    time: "08:00",
    patient: "Juan Pérez García",
    doctor: "Dr. Carlos Mendoza",
    specialty: "Cardiología",
    status: "confirmed",
    channel: "App",
  },
  {
    id: "2",
    time: "08:30",
    patient: "María González López",
    doctor: "Dr. Carlos Mendoza",
    specialty: "Cardiología",
    status: "pending",
    channel: "SMS",
  },
  {
    id: "3",
    time: "09:00",
    patient: "Pedro Rodríguez Silva",
    doctor: "Dr. Carlos Mendoza",
    specialty: "Cardiología",
    status: "confirmed",
    channel: "App",
  },
  {
    id: "4",
    time: "09:30",
    patient: "Ana Martínez Torres",
    doctor: "Dr. Carlos Mendoza",
    specialty: "Cardiología",
    status: "offered",
    channel: "SMS",
  },
];

const statusConfig = {
  confirmed: {
    label: "Confirmada",
    className: "bg-success-light text-success border-success",
  },
  pending: {
    label: "Pendiente",
    className: "bg-warning-light text-warning border-warning",
  },
  released: {
    label: "Liberada",
    className: "bg-info-light text-info border-info",
  },
  offered: {
    label: "Ofrecida",
    className: "bg-accent/10 text-accent border-accent",
  },
};

export function AppointmentCalendar() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Agenda del Día</CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Lunes, 12 de Noviembre 2025</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="day" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="day">Día</TabsTrigger>
            <TabsTrigger value="week">Semana</TabsTrigger>
            <TabsTrigger value="list">Lista</TabsTrigger>
          </TabsList>
          
          <TabsContent value="day" className="space-y-4 mt-4">
            {mockAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className={cn(
                  "p-4 rounded-lg border transition-all hover:shadow-md cursor-pointer",
                  "border-l-4",
                  appointment.status === "confirmed" && "border-l-success",
                  appointment.status === "pending" && "border-l-warning",
                  appointment.status === "offered" && "border-l-accent",
                  appointment.status === "released" && "border-l-info"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
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
          </TabsContent>

          <TabsContent value="week" className="mt-4">
            <div className="text-center text-muted-foreground py-8">
              Vista de semana - Por implementar
            </div>
          </TabsContent>

          <TabsContent value="list" className="mt-4">
            <div className="text-center text-muted-foreground py-8">
              Vista de lista - Por implementar
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
