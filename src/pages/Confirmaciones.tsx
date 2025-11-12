import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Send, CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react";

export default function Confirmaciones() {
  const confirmations = [
    { id: 1, patient: "María González", date: "15 Ene 2025", time: "09:00", status: "entregado", response: "confirmada", channel: "SMS", sent: "13 Ene 2025 09:00" },
    { id: 2, patient: "Carlos Rojas", date: "15 Ene 2025", time: "10:00", status: "pendiente", response: "-", channel: "App", sent: "13 Ene 2025 10:00" },
    { id: 3, patient: "Ana Martínez", date: "16 Ene 2025", time: "08:00", status: "entregado", response: "confirmada", channel: "SMS", sent: "14 Ene 2025 08:00" },
    { id: 4, patient: "Jorge Silva", date: "16 Ene 2025", time: "11:00", status: "fallido", response: "-", channel: "SMS", sent: "14 Ene 2025 11:00" },
    { id: 5, patient: "Lucía Pérez", date: "17 Ene 2025", time: "14:00", status: "entregado", response: "rechazada", channel: "App", sent: "15 Ene 2025 14:00" },
  ];

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
            <CardTitle className="text-3xl">128</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Confirmadas</CardDescription>
            <CardTitle className="text-3xl text-success">94</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pendientes</CardDescription>
            <CardTitle className="text-3xl text-warning">28</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Fallidos</CardDescription>
            <CardTitle className="text-3xl text-destructive">6</CardTitle>
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
            <Select defaultValue="all">
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
            <Select defaultValue="all-channels">
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
              {confirmations.map((conf) => (
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
