import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, UserPlus, Phone, Mail, Calendar } from "lucide-react";

export default function Pacientes() {
  const [searchTerm, setSearchTerm] = useState("");

  const patients = [
    { id: 1, name: "María González", dni: "12345678", phone: "987654321", email: "maria.g@mail.com", lastVisit: "10 Ene 2025", appointments: 5, status: "activo" },
    { id: 2, name: "Carlos Rojas", dni: "23456789", phone: "987654322", email: "carlos.r@mail.com", lastVisit: "08 Ene 2025", appointments: 3, status: "activo" },
    { id: 3, name: "Ana Martínez", dni: "34567890", phone: "987654323", email: "ana.m@mail.com", lastVisit: "05 Ene 2025", appointments: 8, status: "activo" },
    { id: 4, name: "Jorge Silva", dni: "45678901", phone: "987654324", email: "jorge.s@mail.com", lastVisit: "28 Dic 2024", appointments: 2, status: "inactivo" },
    { id: 5, name: "Lucía Pérez", dni: "56789012", phone: "987654325", email: "lucia.p@mail.com", lastVisit: "12 Ene 2025", appointments: 12, status: "activo" },
  ];

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.dni.includes(searchTerm)
  );

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
            <CardTitle className="text-3xl">1,248</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Activos (30 días)</CardDescription>
            <CardTitle className="text-3xl text-success">892</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Nuevos (este mes)</CardDescription>
            <CardTitle className="text-3xl text-primary">156</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Con citas pendientes</CardDescription>
            <CardTitle className="text-3xl text-warning">234</CardTitle>
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
              {filteredPatients.map((patient) => (
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
