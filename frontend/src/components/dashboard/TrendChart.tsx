import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { api } from "@/lib/api";

export function TrendChart() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-trend'],
    queryFn: () => api.get<Array<{ dia: string; confirmaciones: number; noShows: number }>>('/dashboard/charts/trend'),
  });

  if (isLoading) {
    return (
      <Card className="col-span-full lg:col-span-2">
        <CardHeader>
          <CardTitle>Tendencia Semanal</CardTitle>
          <CardDescription>
            Confirmaciones y ausencias (no-shows) por día
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
        <CardTitle>Tendencia Semanal</CardTitle>
        <CardDescription>
          Confirmaciones y ausencias (no-shows) por día
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data || []}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="dia" 
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
            <Line 
              type="monotone" 
              dataKey="confirmaciones" 
              stroke="hsl(var(--success))" 
              strokeWidth={2}
              name="Confirmaciones"
            />
            <Line 
              type="monotone" 
              dataKey="noShows" 
              stroke="hsl(var(--destructive))" 
              strokeWidth={2}
              name="No-Shows"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
