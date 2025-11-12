import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Users,
  TrendingUp
} from "lucide-react";
import { KPICard } from "@/components/dashboard/KPICard";
import { OccupationChart } from "@/components/dashboard/OccupationChart";
import { TrendChart } from "@/components/dashboard/TrendChart";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Resumen general del sistema de gestión de citas
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Citas Totales Hoy"
          value="156"
          icon={Calendar}
          variant="info"
          description="32 consultorios activos"
        />
        <KPICard
          title="Confirmadas"
          value="124"
          icon={CheckCircle2}
          variant="success"
          trend={{ value: 12, isPositive: true }}
        />
        <KPICard
          title="Pendientes"
          value="28"
          icon={Clock}
          variant="warning"
          trend={{ value: 5, isPositive: false }}
        />
        <KPICard
          title="No-Shows"
          value="4"
          icon={XCircle}
          variant="destructive"
          trend={{ value: 2, isPositive: true }}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <KPICard
          title="Pacientes Atendidos (Mes)"
          value="2,847"
          icon={Users}
          variant="default"
          trend={{ value: 8, isPositive: true }}
        />
        <KPICard
          title="Tasa de Confirmación"
          value="89.2%"
          icon={TrendingUp}
          variant="success"
          trend={{ value: 3, isPositive: true }}
        />
        <KPICard
          title="En Lista de Espera"
          value="47"
          icon={Clock}
          variant="warning"
          description="15 ofertas activas"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <TrendChart />
        <OccupationChart />
      </div>
    </div>
  );
}
