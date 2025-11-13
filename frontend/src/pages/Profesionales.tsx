import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, UserPlus, Calendar, Clock, Pencil, Trash2, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

interface Professional {
  id: number;
  name: string;
  especialidad_id?: number;
  specialty: string;
  cmp: string;
  consultorio: string;
  schedule: string | object | null;
  appointments: number;
  status: string;
}

export default function Profesionales() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProfesional, setSelectedProfesional] = useState<Professional | null>(null);
  const [formData, setFormData] = useState({
    nombre_completo: "",
    cmp: "",
    especialidad_id: "",
    consultorio: "",
    horario: {} as Record<string, { inicio: string; fin: string }>,
    estado: "disponible" as "disponible" | "ocupado" | "inactivo",
  });

  const diasSemana = [
    { key: 'lunes', label: 'Lunes' },
    { key: 'martes', label: 'Martes' },
    { key: 'miercoles', label: 'Miércoles' },
    { key: 'jueves', label: 'Jueves' },
    { key: 'viernes', label: 'Viernes' },
    { key: 'sabado', label: 'Sábado' },
    { key: 'domingo', label: 'Domingo' },
  ];
  const debouncedSearch = useDebounce(searchTerm, 300);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['profesionales', debouncedSearch],
    queryFn: () => api.get<{ profesionales: Professional[]; stats: { total: number; disponibles: number; especialidades: number; consultoriosActivos: number } }>(
      `/profesionales${debouncedSearch ? `?search=${encodeURIComponent(debouncedSearch)}` : ''}`
    ),
  });

  const { data: especialidadesData } = useQuery({
    queryKey: ['especialidades'],
    queryFn: () => api.get<{ especialidades: { id: number; nombre: string; activo: boolean }[] }>('/especialidades?activo=true'),
  });

  const professionals = data?.profesionales || [];
  const stats = data?.stats;
  const especialidades = especialidadesData?.especialidades || [];

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => api.post<Professional>('/profesionales', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profesionales'] });
      setIsCreateModalOpen(false);
      setFormData({
        nombre_completo: "",
        cmp: "",
        especialidad_id: "",
        consultorio: "",
        horario: {},
        estado: "disponible",
      });
      toast({
        title: "Éxito",
        description: "Profesional creado correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Error al crear el profesional",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<typeof formData> }) =>
      api.put<Professional>(`/profesionales/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profesionales'] });
      setIsEditModalOpen(false);
      setSelectedProfesional(null);
      setFormData({
        nombre_completo: "",
        cmp: "",
        especialidad_id: "",
        consultorio: "",
        horario: {},
        estado: "disponible",
      });
      toast({
        title: "Éxito",
        description: "Profesional actualizado correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar el profesional",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/profesionales/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profesionales'] });
      setIsDeleteDialogOpen(false);
      setSelectedProfesional(null);
      toast({
        title: "Éxito",
        description: "Profesional eliminado correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar el profesional",
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    if (!formData.nombre_completo.trim() || !formData.cmp.trim() || !formData.especialidad_id) {
      toast({
        title: "Error",
        description: "Completa todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }
    
    // Validar que al menos un día tenga horario configurado
    const diasConHorario = Object.keys(formData.horario).filter(
      dia => formData.horario[dia]?.inicio && formData.horario[dia]?.fin
    );
    
    if (diasConHorario.length === 0) {
      toast({
        title: "Error",
        description: "Debe configurar al menos un día con horario",
        variant: "destructive",
      });
      return;
    }
    
    // Validar que hora inicio < hora fin para cada día
    for (const dia of diasConHorario) {
      const horario = formData.horario[dia];
      if (horario.inicio >= horario.fin) {
        toast({
          title: "Error",
          description: `La hora de fin debe ser mayor que la hora de inicio para ${dia}`,
          variant: "destructive",
        });
        return;
      }
    }
    
    createMutation.mutate({
      ...formData,
      especialidad_id: parseInt(formData.especialidad_id),
      horario: Object.keys(formData.horario).length > 0 ? formData.horario : null,
    });
  };

  const handleEdit = (profesional: Professional) => {
    setSelectedProfesional(profesional);
    
    // Parsear horario si es JSON string, sino usar objeto vacío
    let horarioObj: Record<string, { inicio: string; fin: string }> = {};
    if (profesional.schedule) {
      try {
        const parsed = typeof profesional.schedule === 'string' 
          ? JSON.parse(profesional.schedule) 
          : profesional.schedule;
        if (typeof parsed === 'object' && parsed !== null) {
          horarioObj = parsed;
        }
      } catch (e) {
        // Si no se puede parsear, dejar vacío
        horarioObj = {};
      }
    }
    
    setFormData({
      nombre_completo: profesional.name,
      cmp: profesional.cmp,
      especialidad_id: profesional.especialidad_id?.toString() || "",
      consultorio: profesional.consultorio || "",
      horario: horarioObj,
      estado: profesional.status as "disponible" | "ocupado" | "inactivo",
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = () => {
    if (!formData.nombre_completo.trim() || !formData.cmp.trim() || !formData.especialidad_id) {
      toast({
        title: "Error",
        description: "Completa todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }
    
    // Validar que al menos un día tenga horario configurado
    const diasConHorario = Object.keys(formData.horario).filter(
      dia => formData.horario[dia]?.inicio && formData.horario[dia]?.fin
    );
    
    if (diasConHorario.length === 0) {
      toast({
        title: "Error",
        description: "Debe configurar al menos un día con horario",
        variant: "destructive",
      });
      return;
    }
    
    // Validar que hora inicio < hora fin para cada día
    for (const dia of diasConHorario) {
      const horario = formData.horario[dia];
      if (horario.inicio >= horario.fin) {
        toast({
          title: "Error",
          description: `La hora de fin debe ser mayor que la hora de inicio para ${dia}`,
          variant: "destructive",
        });
        return;
      }
    }
    
    if (selectedProfesional) {
      updateMutation.mutate({ 
        id: selectedProfesional.id, 
        data: {
          ...formData,
          especialidad_id: parseInt(formData.especialidad_id),
          horario: Object.keys(formData.horario).length > 0 ? formData.horario : null,
        }
      });
    }
  };
  
  const toggleDiaHorario = (dia: string) => {
    const nuevoHorario = { ...formData.horario };
    if (nuevoHorario[dia]) {
      delete nuevoHorario[dia];
    } else {
      nuevoHorario[dia] = { inicio: "08:00", fin: "17:00" };
    }
    setFormData({ ...formData, horario: nuevoHorario });
  };
  
  const updateHorarioDia = (dia: string, campo: 'inicio' | 'fin', valor: string) => {
    const nuevoHorario = { ...formData.horario };
    if (!nuevoHorario[dia]) {
      nuevoHorario[dia] = { inicio: "08:00", fin: "17:00" };
    }
    nuevoHorario[dia][campo] = valor;
    setFormData({ ...formData, horario: nuevoHorario });
  };

  const formatearHorario = (schedule: string | object | null | undefined): string => {
    if (!schedule) {
      return 'Sin horario configurado';
    }
    
    let horarioObj: Record<string, { inicio: string; fin: string }> = {};
    try {
      horarioObj = typeof schedule === 'string' ? JSON.parse(schedule) : schedule;
      if (typeof horarioObj !== 'object' || horarioObj === null) {
        return typeof schedule === 'string' ? schedule : 'Sin horario configurado';
      }
    } catch (e) {
      return typeof schedule === 'string' ? schedule : 'Sin horario configurado';
    }
    
    const dias = Object.keys(horarioObj);
    if (dias.length === 0) {
      return 'Sin horario configurado';
    }
    
    const diasLabels: Record<string, string> = {
      lunes: 'Lun',
      martes: 'Mar',
      miercoles: 'Mié',
      jueves: 'Jue',
      viernes: 'Vie',
      sabado: 'Sáb',
      domingo: 'Dom'
    };
    
    const partes = dias.map(dia => {
      const h = horarioObj[dia];
      const diaLabel = diasLabels[dia] || dia;
      return `${diaLabel}: ${h.inicio}-${h.fin}`;
    });
    
    return partes.join(', ');
  };

  const handleDelete = (profesional: Professional) => {
    setSelectedProfesional(profesional);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedProfesional) {
      deleteMutation.mutate(selectedProfesional.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profesionales</h1>
          <p className="text-muted-foreground mt-2">
            Gestión de médicos y consultorios
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Nuevo Profesional
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Profesionales</CardDescription>
            <CardTitle className="text-3xl">{stats?.total?.toLocaleString() || "0"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Disponibles hoy</CardDescription>
            <CardTitle className="text-3xl text-success">{stats?.disponibles?.toLocaleString() || "0"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Especialidades</CardDescription>
            <CardTitle className="text-3xl text-primary">{stats?.especialidades?.toLocaleString() || "0"}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Consultorios Activos</CardDescription>
            <CardTitle className="text-3xl text-warning">{stats?.consultoriosActivos?.toLocaleString() || "0"}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Directorio de Profesionales</CardTitle>
          <CardDescription>Personal médico y especialistas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nombre o especialidad..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando profesionales...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profesional</TableHead>
                  <TableHead>Especialidad</TableHead>
                  <TableHead>CMP</TableHead>
                  <TableHead>Consultorio</TableHead>
                  <TableHead>Horario</TableHead>
                  <TableHead>Citas/Semana</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {professionals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No se encontraron profesionales
                    </TableCell>
                  </TableRow>
                ) : (
                  professionals.map((prof) => (
                <TableRow key={prof.id}>
                  <TableCell className="font-medium">{prof.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{prof.specialty}</Badge>
                  </TableCell>
                  <TableCell>{prof.cmp}</TableCell>
                  <TableCell>{prof.consultorio}</TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs">{formatearHorario(prof.schedule)}</span>
                    </div>
                  </TableCell>
                  <TableCell>{prof.appointments}</TableCell>
                  <TableCell>
                    <Badge variant={prof.status === "disponible" ? "default" : "secondary"}>
                      {prof.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleEdit(prof)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleDelete(prof)}
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
            <DialogTitle>Nuevo Profesional</DialogTitle>
            <DialogDescription>
              Completa los datos para crear un nuevo profesional
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre Completo *</Label>
              <Input
                id="nombre"
                placeholder="Ej: Dr. Juan Pérez"
                value={formData.nombre_completo}
                onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cmp">CMP *</Label>
                <Input
                  id="cmp"
                  placeholder="Ej: 12345"
                  value={formData.cmp}
                  onChange={(e) => setFormData({ ...formData, cmp: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="especialidad">Especialidad *</Label>
                <Select
                  value={formData.especialidad_id}
                  onValueChange={(value) => setFormData({ ...formData, especialidad_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una especialidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {especialidades.map((esp) => (
                      <SelectItem key={esp.id} value={esp.id.toString()}>
                        {esp.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="consultorio">Consultorio</Label>
                <Input
                  id="consultorio"
                  placeholder="Ej: Consultorio 101"
                  value={formData.consultorio}
                  onChange={(e) => setFormData({ ...formData, consultorio: e.target.value })}
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
                    <SelectItem value="disponible">Disponible</SelectItem>
                    <SelectItem value="ocupado">Ocupado</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Horario</Label>
              <div className="space-y-3 border rounded-lg p-4">
                {diasSemana.map((dia) => (
                  <div key={dia.key} className="flex items-center gap-3">
                    <Checkbox
                      id={`dia-${dia.key}`}
                      checked={!!formData.horario[dia.key]}
                      onCheckedChange={() => toggleDiaHorario(dia.key)}
                    />
                    <Label htmlFor={`dia-${dia.key}`} className="w-24 cursor-pointer">
                      {dia.label}
                    </Label>
                    {formData.horario[dia.key] && (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          type="time"
                          value={formData.horario[dia.key].inicio}
                          onChange={(e) => updateHorarioDia(dia.key, 'inicio', e.target.value)}
                          className="w-32"
                        />
                        <span className="text-muted-foreground">-</span>
                        <Input
                          type="time"
                          value={formData.horario[dia.key].fin}
                          onChange={(e) => updateHorarioDia(dia.key, 'fin', e.target.value)}
                          className="w-32"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
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
            <DialogTitle>Editar Profesional</DialogTitle>
            <DialogDescription>
              Modifica los datos del profesional
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nombre">Nombre Completo *</Label>
              <Input
                id="edit-nombre"
                placeholder="Ej: Dr. Juan Pérez"
                value={formData.nombre_completo}
                onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-cmp">CMP *</Label>
                <Input
                  id="edit-cmp"
                  placeholder="Ej: 12345"
                  value={formData.cmp}
                  onChange={(e) => setFormData({ ...formData, cmp: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-especialidad">Especialidad *</Label>
                <Select
                  value={formData.especialidad_id}
                  onValueChange={(value) => setFormData({ ...formData, especialidad_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una especialidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {especialidades.map((esp) => (
                      <SelectItem key={esp.id} value={esp.id.toString()}>
                        {esp.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-consultorio">Consultorio</Label>
                <Input
                  id="edit-consultorio"
                  placeholder="Ej: Consultorio 101"
                  value={formData.consultorio}
                  onChange={(e) => setFormData({ ...formData, consultorio: e.target.value })}
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
                    <SelectItem value="disponible">Disponible</SelectItem>
                    <SelectItem value="ocupado">Ocupado</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Horario</Label>
              <div className="space-y-3 border rounded-lg p-4">
                {diasSemana.map((dia) => (
                  <div key={dia.key} className="flex items-center gap-3">
                    <Checkbox
                      id={`edit-dia-${dia.key}`}
                      checked={!!formData.horario[dia.key]}
                      onCheckedChange={() => toggleDiaHorario(dia.key)}
                    />
                    <Label htmlFor={`edit-dia-${dia.key}`} className="w-24 cursor-pointer">
                      {dia.label}
                    </Label>
                    {formData.horario[dia.key] && (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          type="time"
                          value={formData.horario[dia.key].inicio}
                          onChange={(e) => updateHorarioDia(dia.key, 'inicio', e.target.value)}
                          className="w-32"
                        />
                        <span className="text-muted-foreground">-</span>
                        <Input
                          type="time"
                          value={formData.horario[dia.key].fin}
                          onChange={(e) => updateHorarioDia(dia.key, 'fin', e.target.value)}
                          className="w-32"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
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
              Esta acción no se puede deshacer. Se eliminará el profesional "{selectedProfesional?.name}".
              {selectedProfesional && selectedProfesional.appointments > 0 && (
                <span className="block mt-2 text-destructive">
                  Advertencia: Este profesional tiene citas activas y no se puede eliminar.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending || (selectedProfesional?.appointments || 0) > 0}
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
