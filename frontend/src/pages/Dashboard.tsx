import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Users,
  TrendingUp
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { KPICard } from "@/components/dashboard/KPICard";
import { OccupationChart } from "@/components/dashboard/OccupationChart";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { api } from "@/lib/api";

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get<{
      citasTotalesHoy: number;
      confirmadas: number;
      pendientes: number;
      noShows: number;
      consultoriosActivos: number;
      pacientesMes: number;
      tasaConfirmacion: string;
      enListaEspera: number;
      ofertasActivas: number;
    }>('/dashboard/stats'),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Resumen general del sistema de gestión de citas
          </p>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          Cargando estadísticas...
        </div>
      </div>
    );
  }

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
          value={stats?.citasTotalesHoy?.toString() || "0"}
          icon={Calendar}
          variant="info"
          description={`${stats?.consultoriosActivos || 0} consultorios activos`}
        />
        <KPICard
          title="Confirmadas"
          value={stats?.confirmadas?.toString() || "0"}
          icon={CheckCircle2}
          variant="success"
        />
        <KPICard
          title="Pendientes"
          value={stats?.pendientes?.toString() || "0"}
          icon={Clock}
          variant="warning"
        />
        <KPICard
          title="No-Shows"
          value={stats?.noShows?.toString() || "0"}
          icon={XCircle}
          variant="destructive"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <KPICard
          title="Pacientes Atendidos (Mes)"
          value={stats?.pacientesMes?.toLocaleString() || "0"}
          icon={Users}
          variant="default"
        />
        <KPICard
          title="Tasa de Confirmación"
          value={stats?.tasaConfirmacion || "0%"}
          icon={TrendingUp}
          variant="success"
        />
        <KPICard
          title="En Lista de Espera"
          value={stats?.enListaEspera?.toString() || "0"}
          icon={Clock}
          variant="warning"
          description={`${stats?.ofertasActivas || 0} ofertas activas`}
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
