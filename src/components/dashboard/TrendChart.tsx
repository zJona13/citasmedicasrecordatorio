import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const data = [
  { dia: "Lun", confirmaciones: 65, noShows: 8 },
  { dia: "Mar", confirmaciones: 72, noShows: 5 },
  { dia: "Mié", confirmaciones: 68, noShows: 7 },
  { dia: "Jue", confirmaciones: 75, noShows: 4 },
  { dia: "Vie", confirmaciones: 70, noShows: 6 },
  { dia: "Sáb", confirmaciones: 45, noShows: 3 },
  { dia: "Dom", confirmaciones: 30, noShows: 2 },
];

export function TrendChart() {
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
          <LineChart data={data}>
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
