import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, UserPlus, Calendar, Clock } from "lucide-react";

export default function Profesionales() {
  const professionals = [
    { id: 1, name: "Dr. Juan Gómez García", specialty: "Cardiología", cmp: "12345", consultorio: "201-A", schedule: "Lun-Vie 8:00-14:00", appointments: 32, status: "disponible" },
    { id: 2, name: "Dra. María López Martínez", specialty: "Pediatría", cmp: "23456", consultorio: "105-B", schedule: "Lun-Vie 9:00-15:00", appointments: 28, status: "disponible" },
    { id: 3, name: "Dr. Carlos Silva Romero", specialty: "Traumatología", cmp: "34567", consultorio: "302-C", schedule: "Lun-Mie-Vie 8:00-13:00", appointments: 24, status: "ocupado" },
    { id: 4, name: "Dra. Ana Rodríguez Pérez", specialty: "Neurología", cmp: "45678", consultorio: "401-D", schedule: "Mar-Jue 14:00-18:00", appointments: 18, status: "disponible" },
    { id: 5, name: "Dr. Luis Fernández Torres", specialty: "Oftalmología", cmp: "56789", consultorio: "150-E", schedule: "Lun-Vie 8:00-12:00", appointments: 26, status: "disponible" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profesionales</h1>
          <p className="text-muted-foreground mt-2">
            Gestión de médicos y consultorios
          </p>
        </div>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Nuevo Profesional
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Profesionales</CardDescription>
            <CardTitle className="text-3xl">48</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Disponibles hoy</CardDescription>
            <CardTitle className="text-3xl text-success">32</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Especialidades</CardDescription>
            <CardTitle className="text-3xl text-primary">12</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Consultorios Activos</CardDescription>
            <CardTitle className="text-3xl text-warning">28</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Directorio de Profesionales</CardTitle>
          <CardDescription>Personal médico y especialistas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nombre o especialidad..." className="pl-10" />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Profesional</TableHead>
                <TableHead>Especialidad</TableHead>
                <TableHead>CMP</TableHead>
                <TableHead>Consultorio</TableHead>
                <TableHead>Horario</TableHead>
                <TableHead>Citas/Semana</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {professionals.map((prof) => (
                <TableRow key={prof.id}>
                  <TableCell className="font-medium">{prof.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{prof.specialty}</Badge>
                  </TableCell>
                  <TableCell>{prof.cmp}</TableCell>
                  <TableCell>{prof.consultorio}</TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {prof.schedule}
                    </div>
                  </TableCell>
                  <TableCell>{prof.appointments}</TableCell>
                  <TableCell>
                    <Badge variant={prof.status === "disponible" ? "default" : "secondary"}>
                      {prof.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost">
                      <Calendar className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
