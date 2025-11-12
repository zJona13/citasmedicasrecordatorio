import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, UserPlus, Calendar, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { useDebounce } from "@/hooks/use-debounce";

interface Professional {
  id: number;
  name: string;
  specialty: string;
  cmp: string;
  consultorio: string;
  schedule: string;
  appointments: number;
  status: string;
}

export default function Profesionales() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);

  const { data, isLoading } = useQuery({
    queryKey: ['profesionales', debouncedSearch],
    queryFn: () => api.get<{ profesionales: Professional[]; stats: { total: number; disponibles: number; especialidades: number; consultoriosActivos: number } }>(
      `/profesionales${debouncedSearch ? `?search=${encodeURIComponent(debouncedSearch)}` : ''}`
    ),
  });

  const professionals = data?.profesionales || [];
  const stats = data?.stats;

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
            <CardTitle className="text-3xl">{stats?.total?.toLocaleString() || "0"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Disponibles hoy</CardDescription>
            <CardTitle className="text-3xl text-success">{stats?.disponibles?.toLocaleString() || "0"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Especialidades</CardDescription>
            <CardTitle className="text-3xl text-primary">{stats?.especialidades?.toLocaleString() || "0"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Consultorios Activos</CardDescription>
            <CardTitle className="text-3xl text-warning">{stats?.consultoriosActivos?.toLocaleString() || "0"}</CardTitle>
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
              <Input 
                placeholder="Buscar por nombre o especialidad..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando profesionales...
            </div>
          ) : (
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
                {professionals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No se encontraron profesionales
                    </TableCell>
                  </TableRow>
                ) : (
                  professionals.map((prof) => (
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
