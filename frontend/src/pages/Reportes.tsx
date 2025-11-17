import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { OccupationChart } from "@/components/dashboard/OccupationChart";
import { BarChart3, TrendingUp, Users, Calendar, Loader2, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Reportes() {
  const today = new Date();
  const firstDayOfMonth = startOfMonth(today);
  const lastDayOfMonth = endOfMonth(today);
  
  const [fechaInicio, setFechaInicio] = useState(format(firstDayOfMonth, 'yyyy-MM-dd'));
  const [fechaFin, setFechaFin] = useState(format(lastDayOfMonth, 'yyyy-MM-dd'));

  // Reporte General
  const { data: reporteGeneral, isLoading: loadingGeneral } = useQuery({
    queryKey: ['reporte-general', fechaInicio, fechaFin],
    queryFn: () => api.get<{
      fechaInicio: string;
      fechaFin: string;
      totalCitas: number;
      confirmadas: number;
      completadas: number;
      noShows: number;
      canceladas: number;
      pacientesUnicos: number;
      tasaConfirmacion: string;
      tasaNoShow: string;
      ocupacionPromedio: string;
      tiempoPromedioRespuesta: string;
      eficienciaSMS: string;
      reasignaciones: number;
      variacionTotal: string;
    }>(`/reportes/general?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`),
  });

  // Reporte por Especialidad
  const { data: reporteEspecialidades, isLoading: loadingEspecialidades } = useQuery({
    queryKey: ['reporte-especialidades', fechaInicio, fechaFin],
    queryFn: () => api.get<{
      fechaInicio: string;
      fechaFin: string;
      data: Array<{
        id: number;
        especialidad: string;
        totalCitas: number;
        confirmadas: number;
        pendientes: number;
        completadas: number;
        noShows: number;
        canceladas: number;
        pacientesUnicos: number;
        tasaConfirmacion: string;
        tasaNoShow: string;
      }>;
    }>(`/reportes/especialidades?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`),
  });

  // Reporte por Profesional
  const { data: reporteProfesionales, isLoading: loadingProfesionales } = useQuery({
    queryKey: ['reporte-profesionales', fechaInicio, fechaFin],
    queryFn: () => api.get<{
      fechaInicio: string;
      fechaFin: string;
      data: Array<{
        id: number;
        profesional: string;
        especialidad: string;
        totalCitas: number;
        confirmadas: number;
        pendientes: number;
        completadas: number;
        noShows: number;
        canceladas: number;
        pacientesUnicos: number;
        tasaConfirmacion: string;
        tasaNoShow: string;
      }>;
    }>(`/reportes/profesionales?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`),
  });

  // Reporte por Paciente
  const { data: reportePacientes, isLoading: loadingPacientes } = useQuery({
    queryKey: ['reporte-pacientes', fechaInicio, fechaFin],
    queryFn: () => api.get<{
      fechaInicio: string;
      fechaFin: string;
      data: Array<{
        id: number;
        dni: string;
        paciente: string;
        telefono: string | null;
        email: string | null;
        totalCitas: number;
        confirmadas: number;
        completadas: number;
        noShows: number;
        canceladas: number;
        tasaConfirmacion: string;
        tasaNoShow: string;
      }>;
    }>(`/reportes/pacientes?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`),
  });

  const handleResetDates = () => {
    const firstDay = startOfMonth(today);
    const lastDay = endOfMonth(today);
    setFechaInicio(format(firstDay, 'yyyy-MM-dd'));
    setFechaFin(format(lastDay, 'yyyy-MM-dd'));
  };

  const handleLastMonth = () => {
    const lastMonth = subMonths(today, 1);
    const firstDay = startOfMonth(lastMonth);
    const lastDay = endOfMonth(lastMonth);
    setFechaInicio(format(firstDay, 'yyyy-MM-dd'));
    setFechaFin(format(lastDay, 'yyyy-MM-dd'));
  };

  const variacionTotal = reporteGeneral?.variacionTotal || '0.0';
  const isPositiveVariation = parseFloat(variacionTotal) >= 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
          <p className="text-muted-foreground mt-2">
            Análisis y métricas del sistema de citas
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="fecha-inicio" className="text-sm">Desde:</Label>
            <Input
              id="fecha-inicio"
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="fecha-fin" className="text-sm">Hasta:</Label>
            <Input
              id="fecha-fin"
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleLastMonth}>
              Mes Anterior
            </Button>
            <Button variant="outline" size="sm" onClick={handleResetDates}>
              Mes Actual
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="especialidades">Por Especialidad</TabsTrigger>
          <TabsTrigger value="profesionales">Por Profesional</TabsTrigger>
          <TabsTrigger value="pacientes">Pacientes</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          {loadingGeneral ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardDescription>Citas Total</CardDescription>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {reporteGeneral?.totalCitas.toLocaleString() || "0"}
                    </div>
                    <p className={`text-xs ${isPositiveVariation ? 'text-success' : 'text-destructive'}`}>
                      {variacionTotal}% vs mes anterior
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardDescription>Tasa de Confirmación</CardDescription>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {reporteGeneral?.tasaConfirmacion || "0%"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {reporteGeneral?.confirmadas || 0} confirmadas
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardDescription>Pacientes Únicos</CardDescription>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {reporteGeneral?.pacientesUnicos.toLocaleString() || "0"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Pacientes atendidos
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardDescription>Ocupación Promedio</CardDescription>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {reporteGeneral?.ocupacionPromedio || "0%"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Tasa de ocupación
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Tendencia de Confirmaciones</CardTitle>
                    <CardDescription>Confirmaciones y no-shows por día</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TrendChart />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Ocupación por Especialidad</CardTitle>
                    <CardDescription>Distribución de citas por especialidad</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <OccupationChart />
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Métricas Detalladas</CardTitle>
                  <CardDescription>
                    Análisis del período: {format(new Date(fechaInicio), "PPP", { locale: es })} - {format(new Date(fechaFin), "PPP", { locale: es })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Tiempo Promedio de Respuesta</p>
                        <p className="text-2xl font-bold">{reporteGeneral?.tiempoPromedioRespuesta || "0.0 horas"}</p>
                        <p className="text-xs text-muted-foreground">Desde recordatorio hasta confirmación</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Tasa de No-Show</p>
                        <p className="text-2xl font-bold text-destructive">{reporteGeneral?.tasaNoShow || "0%"}</p>
                        <p className="text-xs text-muted-foreground">
                          {reporteGeneral?.noShows || 0} pacientes que no asistieron
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Reasignaciones desde Lista de Espera</p>
                        <p className="text-2xl font-bold">{reporteGeneral?.reasignaciones.toLocaleString() || "0"}</p>
                        <p className="text-xs text-muted-foreground">Citas liberadas y reasignadas</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Eficiencia de Canal SMS</p>
                        <p className="text-2xl font-bold">{reporteGeneral?.eficienciaSMS || "0%"}</p>
                        <p className="text-xs text-muted-foreground">Tasa de entrega exitosa</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="especialidades">
          {loadingEspecialidades ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Reporte por Especialidad</CardTitle>
                <CardDescription>
                  Período: {format(new Date(fechaInicio), "PPP", { locale: es })} - {format(new Date(fechaFin), "PPP", { locale: es })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reporteEspecialidades?.data && reporteEspecialidades.data.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Especialidad</TableHead>
                        <TableHead className="text-right">Total Citas</TableHead>
                        <TableHead className="text-right">Confirmadas</TableHead>
                        <TableHead className="text-right">Pendientes</TableHead>
                        <TableHead className="text-right">Completadas</TableHead>
                        <TableHead className="text-right">No-Shows</TableHead>
                        <TableHead className="text-right">Canceladas</TableHead>
                        <TableHead className="text-right">Pacientes Únicos</TableHead>
                        <TableHead className="text-right">Tasa Confirmación</TableHead>
                        <TableHead className="text-right">Tasa No-Show</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reporteEspecialidades.data.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium">{row.especialidad}</TableCell>
                          <TableCell className="text-right">{row.totalCitas}</TableCell>
                          <TableCell className="text-right">{row.confirmadas}</TableCell>
                          <TableCell className="text-right">{row.pendientes}</TableCell>
                          <TableCell className="text-right">{row.completadas}</TableCell>
                          <TableCell className="text-right text-destructive">{row.noShows}</TableCell>
                          <TableCell className="text-right">{row.canceladas}</TableCell>
                          <TableCell className="text-right">{row.pacientesUnicos}</TableCell>
                          <TableCell className="text-right">{row.tasaConfirmacion}</TableCell>
                          <TableCell className="text-right text-destructive">{row.tasaNoShow}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No hay datos para el período seleccionado</p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="profesionales">
          {loadingProfesionales ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Reporte por Profesional</CardTitle>
                <CardDescription>
                  Período: {format(new Date(fechaInicio), "PPP", { locale: es })} - {format(new Date(fechaFin), "PPP", { locale: es })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reporteProfesionales?.data && reporteProfesionales.data.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Profesional</TableHead>
                        <TableHead>Especialidad</TableHead>
                        <TableHead className="text-right">Total Citas</TableHead>
                        <TableHead className="text-right">Confirmadas</TableHead>
                        <TableHead className="text-right">Pendientes</TableHead>
                        <TableHead className="text-right">Completadas</TableHead>
                        <TableHead className="text-right">No-Shows</TableHead>
                        <TableHead className="text-right">Canceladas</TableHead>
                        <TableHead className="text-right">Pacientes Únicos</TableHead>
                        <TableHead className="text-right">Tasa Confirmación</TableHead>
                        <TableHead className="text-right">Tasa No-Show</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reporteProfesionales.data.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium">{row.profesional}</TableCell>
                          <TableCell>{row.especialidad}</TableCell>
                          <TableCell className="text-right">{row.totalCitas}</TableCell>
                          <TableCell className="text-right">{row.confirmadas}</TableCell>
                          <TableCell className="text-right">{row.pendientes}</TableCell>
                          <TableCell className="text-right">{row.completadas}</TableCell>
                          <TableCell className="text-right text-destructive">{row.noShows}</TableCell>
                          <TableCell className="text-right">{row.canceladas}</TableCell>
                          <TableCell className="text-right">{row.pacientesUnicos}</TableCell>
                          <TableCell className="text-right">{row.tasaConfirmacion}</TableCell>
                          <TableCell className="text-right text-destructive">{row.tasaNoShow}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No hay datos para el período seleccionado</p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pacientes">
          {loadingPacientes ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Reporte de Pacientes</CardTitle>
                <CardDescription>
                  Período: {format(new Date(fechaInicio), "PPP", { locale: es })} - {format(new Date(fechaFin), "PPP", { locale: es })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reportePacientes?.data && reportePacientes.data.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>DNI</TableHead>
                        <TableHead>Paciente</TableHead>
                        <TableHead>Teléfono</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-right">Total Citas</TableHead>
                        <TableHead className="text-right">Confirmadas</TableHead>
                        <TableHead className="text-right">Completadas</TableHead>
                        <TableHead className="text-right">No-Shows</TableHead>
                        <TableHead className="text-right">Canceladas</TableHead>
                        <TableHead className="text-right">Tasa Confirmación</TableHead>
                        <TableHead className="text-right">Tasa No-Show</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportePacientes.data.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium">{row.dni}</TableCell>
                          <TableCell>{row.paciente}</TableCell>
                          <TableCell>{row.telefono || "-"}</TableCell>
                          <TableCell>{row.email || "-"}</TableCell>
                          <TableCell className="text-right">{row.totalCitas}</TableCell>
                          <TableCell className="text-right">{row.confirmadas}</TableCell>
                          <TableCell className="text-right">{row.completadas}</TableCell>
                          <TableCell className="text-right text-destructive">{row.noShows}</TableCell>
                          <TableCell className="text-right">{row.canceladas}</TableCell>
                          <TableCell className="text-right">{row.tasaConfirmacion}</TableCell>
                          <TableCell className="text-right text-destructive">{row.tasaNoShow}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No hay datos para el período seleccionado</p>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
