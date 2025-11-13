import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, UserPlus, Phone, Mail, Calendar, Pencil, Trash2, Loader2 } from "lucide-react";
import { api, reniecApi } from "@/lib/api";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Patient {
  id: number;
  name: string;
  dni: string;
  phone: string;
  email: string;
  lastVisit: string;
  appointments: number;
  status: string;
}

export default function Pacientes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPaciente, setSelectedPaciente] = useState<Patient | null>(null);
  const [formData, setFormData] = useState({
    dni: "",
    nombre_completo: "",
    telefono: "",
    email: "",
    fecha_nacimiento: "",
    direccion: "",
    estado: "activo" as "activo" | "inactivo",
  });
  const [isReniecLoading, setIsReniecLoading] = useState(false);
  const debouncedDni = useDebounce(formData.dni, 800);
  const debouncedSearch = useDebounce(searchTerm, 300);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['pacientes', debouncedSearch],
    queryFn: () => api.get<{ pacientes: Patient[]; stats: { total: number; activos: number; nuevos: number; conCitasPendientes: number } }>(
      `/pacientes${debouncedSearch ? `?search=${encodeURIComponent(debouncedSearch)}` : ''}`
    ),
  });

  // Consultar RENIEC cuando el DNI tiene 8 dígitos (solo en modal de crear)
  const { data: reniecData, isLoading: isLoadingReniec } = useQuery({
    queryKey: ['reniec', debouncedDni],
    queryFn: () => reniecApi.consultarDNI(debouncedDni),
    enabled: !!debouncedDni && /^\d{8}$/.test(debouncedDni) && isCreateModalOpen && !isEditModalOpen,
    retry: false,
  });

  useEffect(() => {
    setIsReniecLoading(isLoadingReniec);
  }, [isLoadingReniec]);

  // Manejar respuesta exitosa de RENIEC
  useEffect(() => {
    if (reniecData?.success && isCreateModalOpen && !isEditModalOpen) {
      const data = reniecData.data;
      setFormData(prev => ({
        ...prev,
        nombre_completo: data.nombre_completo || prev.nombre_completo,
        fecha_nacimiento: data.fecha_nacimiento || prev.fecha_nacimiento,
        direccion: data.direccion || prev.direccion,
      }));
    }
  }, [reniecData, isCreateModalOpen, isEditModalOpen]);

  const patients = data?.pacientes || [];
  const stats = data?.stats;

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => api.post<Patient>('/pacientes', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      setIsCreateModalOpen(false);
      setFormData({
        dni: "",
        nombre_completo: "",
        telefono: "",
        email: "",
        fecha_nacimiento: "",
        direccion: "",
        estado: "activo",
      });
      toast({
        title: "Éxito",
        description: "Paciente creado correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Error al crear el paciente",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<typeof formData> }) =>
      api.put<Patient>(`/pacientes/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      setIsEditModalOpen(false);
      setSelectedPaciente(null);
      setFormData({
        dni: "",
        nombre_completo: "",
        telefono: "",
        email: "",
        fecha_nacimiento: "",
        direccion: "",
        estado: "activo",
      });
      toast({
        title: "Éxito",
        description: "Paciente actualizado correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar el paciente",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/pacientes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      setIsDeleteDialogOpen(false);
      setSelectedPaciente(null);
      toast({
        title: "Éxito",
        description: "Paciente eliminado correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar el paciente",
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    if (!formData.dni.trim() || !formData.nombre_completo.trim()) {
      toast({
        title: "Error",
        description: "Completa todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEdit = (paciente: Patient) => {
    setSelectedPaciente(paciente);
    setFormData({
      dni: paciente.dni,
      nombre_completo: paciente.name,
      telefono: paciente.phone || "",
      email: paciente.email || "",
      fecha_nacimiento: "",
      direccion: "",
      estado: paciente.status as "activo" | "inactivo",
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = () => {
    if (!formData.dni.trim() || !formData.nombre_completo.trim()) {
      toast({
        title: "Error",
        description: "Completa todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }
    if (selectedPaciente) {
      updateMutation.mutate({ 
        id: selectedPaciente.id, 
        data: formData
      });
    }
  };

  const handleDelete = (paciente: Patient) => {
    setSelectedPaciente(paciente);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedPaciente) {
      deleteMutation.mutate(selectedPaciente.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
          <p className="text-muted-foreground mt-2">
            Gestión del registro de pacientes
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Nuevo Paciente
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Pacientes</CardDescription>
            <CardTitle className="text-3xl">{stats?.total?.toLocaleString() || "0"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Activos (30 días)</CardDescription>
            <CardTitle className="text-3xl text-success">{stats?.activos?.toLocaleString() || "0"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Nuevos (este mes)</CardDescription>
            <CardTitle className="text-3xl text-primary">{stats?.nuevos?.toLocaleString() || "0"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Con citas pendientes</CardDescription>
            <CardTitle className="text-3xl text-warning">{stats?.conCitasPendientes?.toLocaleString() || "0"}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Directorio de Pacientes</CardTitle>
          <CardDescription>Lista completa de pacientes registrados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nombre o DNI..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando pacientes...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>DNI</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Última Visita</TableHead>
                  <TableHead>Citas Totales</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No se encontraron pacientes
                    </TableCell>
                  </TableRow>
                ) : (
                  patients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium">{patient.name}</TableCell>
                  <TableCell>{patient.dni}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span>{patient.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span>{patient.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{patient.lastVisit}</TableCell>
                  <TableCell>{patient.appointments}</TableCell>
                  <TableCell>
                    <Badge variant={patient.status === "activo" ? "default" : "secondary"}>
                      {patient.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleEdit(patient)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleDelete(patient)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal Crear */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Paciente</DialogTitle>
            <DialogDescription>
              Completa los datos para crear un nuevo paciente. Puedes consultar RENIEC ingresando el DNI.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dni">DNI *</Label>
              <div className="relative">
                <Input
                  id="dni"
                  placeholder="12345678"
                  value={formData.dni}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                    setFormData({ ...formData, dni: value });
                  }}
                  maxLength={8}
                  className={cn(
                    isReniecLoading && "pr-10"
                  )}
                />
                {isReniecLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
                {!isReniecLoading && formData.dni.length === 8 && reniecData?.success && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Search className="h-4 w-4 text-green-600" />
                  </div>
                )}
              </div>
              {formData.dni.length === 8 && !isReniecLoading && reniecData?.success && (
                <p className="text-xs text-green-600">✓ Datos encontrados en RENIEC</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre Completo *</Label>
              <Input
                id="nombre"
                placeholder="Ej: Juan Pérez García"
                value={formData.nombre_completo}
                onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  placeholder="Ej: 987654321"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Ej: juan@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento</Label>
                <Input
                  id="fecha_nacimiento"
                  type="date"
                  value={formData.fecha_nacimiento}
                  onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Select
                  value={formData.estado}
                  onValueChange={(value) => setFormData({ ...formData, estado: value as typeof formData.estado })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Textarea
                id="direccion"
                placeholder="Dirección completa del paciente..."
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Paciente</DialogTitle>
            <DialogDescription>
              Modifica los datos del paciente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-dni">DNI *</Label>
              <Input
                id="edit-dni"
                placeholder="12345678"
                value={formData.dni}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                  setFormData({ ...formData, dni: value });
                }}
                maxLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-nombre">Nombre Completo *</Label>
              <Input
                id="edit-nombre"
                placeholder="Ej: Juan Pérez García"
                value={formData.nombre_completo}
                onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-telefono">Teléfono</Label>
                <Input
                  id="edit-telefono"
                  placeholder="Ej: 987654321"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="Ej: juan@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-fecha_nacimiento">Fecha de Nacimiento</Label>
                <Input
                  id="edit-fecha_nacimiento"
                  type="date"
                  value={formData.fecha_nacimiento}
                  onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-estado">Estado</Label>
                <Select
                  value={formData.estado}
                  onValueChange={(value) => setFormData({ ...formData, estado: value as typeof formData.estado })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-direccion">Dirección</Label>
              <Textarea
                id="edit-direccion"
                placeholder="Dirección completa del paciente..."
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Eliminar */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el paciente "{selectedPaciente?.name}".
              {selectedPaciente && selectedPaciente.appointments > 0 && (
                <span className="block mt-2 text-destructive">
                  Advertencia: Este paciente tiene citas activas y no se puede eliminar.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending || (selectedPaciente?.appointments || 0) > 0}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
