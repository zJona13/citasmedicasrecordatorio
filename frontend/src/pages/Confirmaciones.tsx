import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Send, CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";

interface Confirmation {
  id: number;
  patient: string;
  date: string;
  time: string;
  status: string;
  response: string;
  channel: string;
  sent: string;
}

export default function Confirmaciones() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all-channels");

  const { data, isLoading } = useQuery({
    queryKey: ['confirmaciones', statusFilter, channelFilter],
    queryFn: () => api.get<{ confirmaciones: Confirmation[]; stats: { enviadosHoy: number; confirmadas: number; pendientes: number; fallidos: number } }>(
      `/confirmaciones?status=${statusFilter}&channel=${channelFilter}`
    ),
  });

  const confirmations = data?.confirmaciones || [];
  const stats = data?.stats;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "entregado":
        return <Badge variant="default" className="gap-1"><CheckCircle className="h-3 w-3" />Entregado</Badge>;
      case "pendiente":
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Pendiente</Badge>;
      case "fallido":
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Fallido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getResponseBadge = (response: string) => {
    switch (response) {
      case "confirmada":
        return <Badge variant="default">Confirmada</Badge>;
      case "rechazada":
        return <Badge variant="destructive">Rechazada</Badge>;
      default:
        return <span className="text-muted-foreground">-</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Confirmaciones & Recordatorios</h1>
        <p className="text-muted-foreground mt-2">
          Gestione los recordatorios automáticos y confirmaciones de citas
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Enviados hoy</CardDescription>
            <CardTitle className="text-3xl">{stats?.enviadosHoy?.toLocaleString() || "0"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Confirmadas</CardDescription>
            <CardTitle className="text-3xl text-success">{stats?.confirmadas?.toLocaleString() || "0"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pendientes</CardDescription>
            <CardTitle className="text-3xl text-warning">{stats?.pendientes?.toLocaleString() || "0"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Fallidos</CardDescription>
            <CardTitle className="text-3xl text-destructive">{stats?.fallidos?.toLocaleString() || "0"}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recordatorios Programados</CardTitle>
              <CardDescription>Envíos automáticos T-48h y T-24h</CardDescription>
            </div>
            <Button>
              <Send className="h-4 w-4 mr-2" />
              Enviar Lote
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por paciente..." className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="entregado">Entregado</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="fallido">Fallido</SelectItem>
              </SelectContent>
            </Select>
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-channels">Todos los canales</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="app">App</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando confirmaciones...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Fecha de Cita</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Enviado</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Respuesta</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {confirmations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No se encontraron confirmaciones
                    </TableCell>
                  </TableRow>
                ) : (
                  confirmations.map((conf) => (
                <TableRow key={conf.id}>
                  <TableCell className="font-medium">{conf.patient}</TableCell>
                  <TableCell>{conf.date}</TableCell>
                  <TableCell>{conf.time}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{conf.sent}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{conf.channel}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(conf.status)}</TableCell>
                  <TableCell>{getResponseBadge(conf.response)}</TableCell>
                  <TableCell className="text-right">
                    {conf.status === "fallido" && (
                      <Button size="sm" variant="ghost">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    )}
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
