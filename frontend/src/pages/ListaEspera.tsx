import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, Phone, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface WaitlistPatient {
  id: string;
  patient: string;
  phone: string;
  specialty: string;
  priority: number;
  waitTime: string;
  offerActive: boolean;
  offerExpiry?: string;
}

const mockWaitlist: WaitlistPatient[] = [
  {
    id: "1",
    patient: "Carlos Ramos Vega",
    phone: "987654321",
    specialty: "Cardiología",
    priority: 1,
    waitTime: "5 días",
    offerActive: true,
    offerExpiry: "14:30",
  },
  {
    id: "2",
    patient: "Laura Sánchez Díaz",
    phone: "987654322",
    specialty: "Cardiología",
    priority: 2,
    waitTime: "4 días",
    offerActive: false,
  },
  {
    id: "3",
    patient: "Roberto Flores Quispe",
    phone: "987654323",
    specialty: "Traumatología",
    priority: 1,
    waitTime: "7 días",
    offerActive: false,
  },
];

export default function ListaEspera() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lista de Espera Digital</h1>
        <p className="text-muted-foreground mt-2">
          Gestión de pacientes en lista de espera y ofertas de cupos
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          1 oferta activa expira en menos de 15 minutos
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Pacientes en Lista de Espera</CardTitle>
          <CardDescription>
            {mockWaitlist.length} pacientes esperando cupo disponible
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mockWaitlist.map((patient) => (
            <div
              key={patient.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4 flex-1">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground font-semibold">
                  {patient.priority}
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{patient.patient}</span>
                    {patient.priority === 1 && (
                      <Badge variant="destructive" className="text-xs">
                        Alta Prioridad
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {patient.specialty}
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {patient.phone}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Esperando {patient.waitTime}
                    </div>
                  </div>
                  {patient.offerActive && patient.offerExpiry && (
                    <Badge variant="outline" className="bg-warning-light text-warning border-warning">
                      Oferta activa • Expira a las {patient.offerExpiry}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {patient.offerActive ? (
                  <Button variant="outline" size="sm">
                    Cancelar Oferta
                  </Button>
                ) : (
                  <Button size="sm">
                    Ofrecer Cupo
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
