import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { api } from "@/lib/api";

export function OccupationChart() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-occupation'],
    queryFn: () => api.get<Array<{ especialidad: string; confirmadas: number; pendientes: number; liberadas: number; reasignadas: number }>>('/dashboard/charts/occupation'),
  });

  if (isLoading) {
    return (
      <Card className="col-span-full lg:col-span-2">
        <CardHeader>
          <CardTitle>Ocupación por Especialidad</CardTitle>
          <CardDescription>
            Estado de citas por especialidad médica
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Cargando datos...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle>Ocupación por Especialidad</CardTitle>
        <CardDescription>
          Estado de citas por especialidad médica
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data || []}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="especialidad" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Bar dataKey="confirmadas" stackId="a" fill="hsl(var(--success))" name="Confirmadas" />
            <Bar dataKey="pendientes" stackId="a" fill="hsl(var(--warning))" name="Pendientes" />
            <Bar dataKey="liberadas" stackId="a" fill="hsl(var(--info))" name="Liberadas" />
            <Bar dataKey="reasignadas" stackId="a" fill="hsl(var(--accent))" name="Reasignadas" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
