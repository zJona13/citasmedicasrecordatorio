import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, UserPlus, Phone, Mail, Calendar } from "lucide-react";
import { api } from "@/lib/api";
import { useDebounce } from "@/hooks/use-debounce";

interface Patient {
  id: number;
  name: string;
  dni: string;
  phone: string;
  email: string;
  lastVisit: string;
  appointments: number;
  status: string;
}

export default function Pacientes() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);

  const { data, isLoading } = useQuery({
    queryKey: ['pacientes', debouncedSearch],
    queryFn: () => api.get<{ pacientes: Patient[]; stats: { total: number; activos: number; nuevos: number; conCitasPendientes: number } }>(
      `/pacientes${debouncedSearch ? `?search=${encodeURIComponent(debouncedSearch)}` : ''}`
    ),
  });

  const patients = data?.pacientes || [];
  const stats = data?.stats;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
          <p className="text-muted-foreground mt-2">
            Gestión del registro de pacientes
          </p>
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Nuevo Paciente
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Pacientes</CardDescription>
            <CardTitle className="text-3xl">{stats?.total?.toLocaleString() || "0"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Activos (30 días)</CardDescription>
            <CardTitle className="text-3xl text-success">{stats?.activos?.toLocaleString() || "0"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Nuevos (este mes)</CardDescription>
            <CardTitle className="text-3xl text-primary">{stats?.nuevos?.toLocaleString() || "0"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Con citas pendientes</CardDescription>
            <CardTitle className="text-3xl text-warning">{stats?.conCitasPendientes?.toLocaleString() || "0"}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Directorio de Pacientes</CardTitle>
          <CardDescription>Lista completa de pacientes registrados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nombre o DNI..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando pacientes...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>DNI</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Última Visita</TableHead>
                  <TableHead>Citas Totales</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No se encontraron pacientes
                    </TableCell>
                  </TableRow>
                ) : (
                  patients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium">{patient.name}</TableCell>
                  <TableCell>{patient.dni}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span>{patient.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span>{patient.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{patient.lastVisit}</TableCell>
                  <TableCell>{patient.appointments}</TableCell>
                  <TableCell>
                    <Badge variant={patient.status === "activo" ? "default" : "secondary"}>
                      {patient.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost">
                      <Calendar className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
