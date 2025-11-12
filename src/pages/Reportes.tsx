import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { OccupationChart } from "@/components/dashboard/OccupationChart";
import { BarChart3, TrendingUp, Users, Calendar } from "lucide-react";

export default function Reportes() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
        <p className="text-muted-foreground mt-2">
          Análisis y métricas del sistema de citas
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="especialidades">Por Especialidad</TabsTrigger>
          <TabsTrigger value="profesionales">Por Profesional</TabsTrigger>
          <TabsTrigger value="pacientes">Pacientes</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription>Citas Total</CardDescription>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,248</div>
                <p className="text-xs text-success">+12.5% vs mes anterior</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription>Tasa de Confirmación</CardDescription>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">87.2%</div>
                <p className="text-xs text-success">+2.1% vs mes anterior</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription>Pacientes Únicos</CardDescription>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">892</div>
                <p className="text-xs text-success">+8.3% vs mes anterior</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription>Ocupación Promedio</CardDescription>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">78.5%</div>
                <p className="text-xs text-warning">-1.2% vs mes anterior</p>
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
              <CardDescription>Análisis mensual del sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Tiempo Promedio de Respuesta</p>
                    <p className="text-2xl font-bold">4.2 horas</p>
                    <p className="text-xs text-muted-foreground">Desde recordatorio hasta confirmación</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Tasa de No-Show</p>
                    <p className="text-2xl font-bold">8.7%</p>
                    <p className="text-xs text-muted-foreground">Pacientes que no asistieron</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Reasignaciones desde Lista de Espera</p>
                    <p className="text-2xl font-bold">156</p>
                    <p className="text-xs text-muted-foreground">Citas liberadas y reasignadas</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Eficiencia de Canal SMS</p>
                    <p className="text-2xl font-bold">92.1%</p>
                    <p className="text-xs text-muted-foreground">Tasa de entrega exitosa</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="especialidades">
          <Card>
            <CardHeader>
              <CardTitle>Reporte por Especialidad</CardTitle>
              <CardDescription>En construcción</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>

        <TabsContent value="profesionales">
          <Card>
            <CardHeader>
              <CardTitle>Reporte por Profesional</CardTitle>
              <CardDescription>En construcción</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>

        <TabsContent value="pacientes">
          <Card>
            <CardHeader>
              <CardTitle>Reporte de Pacientes</CardTitle>
              <CardDescription>En construcción</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
