import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const data = [
  { especialidad: "Cardiología", confirmadas: 45, pendientes: 12, liberadas: 3, reasignadas: 5 },
  { especialidad: "Pediatría", confirmadas: 38, pendientes: 8, liberadas: 2, reasignadas: 4 },
  { especialidad: "Traumatología", confirmadas: 42, pendientes: 15, liberadas: 5, reasignadas: 3 },
  { especialidad: "Ginecología", confirmadas: 35, pendientes: 10, liberadas: 4, reasignadas: 2 },
  { especialidad: "Oftalmología", confirmadas: 40, pendientes: 9, liberadas: 2, reasignadas: 4 },
];

export function OccupationChart() {
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
          <BarChart data={data}>
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
