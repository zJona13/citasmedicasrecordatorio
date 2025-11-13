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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Search, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/hooks/use-toast";

interface Especialidad {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
  fecha_creacion: string;
  profesionales_count: number;
}

export default function Especialidades() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEspecialidad, setSelectedEspecialidad] = useState<Especialidad | null>(null);
  const [formData, setFormData] = useState({ nombre: "", descripcion: "", activo: true });
  const debouncedSearch = useDebounce(searchTerm, 300);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['especialidades', debouncedSearch],
    queryFn: () => api.get<{ especialidades: Especialidad[] }>(
      `/especialidades${debouncedSearch ? `?search=${encodeURIComponent(debouncedSearch)}` : ''}`
    ),
  });

  const especialidades = data?.especialidades || [];

  const createMutation = useMutation({
    mutationFn: (data: { nombre: string; descripcion?: string; activo: boolean }) =>
      api.post<Especialidad>('/especialidades', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['especialidades'] });
      setIsCreateModalOpen(false);
      setFormData({ nombre: "", descripcion: "", activo: true });
      toast({
        title: "Éxito",
        description: "Especialidad creada correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Error al crear la especialidad",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { nombre?: string; descripcion?: string; activo?: boolean } }) =>
      api.put<Especialidad>(`/especialidades/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['especialidades'] });
      setIsEditModalOpen(false);
      setSelectedEspecialidad(null);
      setFormData({ nombre: "", descripcion: "", activo: true });
      toast({
        title: "Éxito",
        description: "Especialidad actualizada correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar la especialidad",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/especialidades/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['especialidades'] });
      setIsDeleteDialogOpen(false);
      setSelectedEspecialidad(null);
      toast({
        title: "Éxito",
        description: "Especialidad eliminada correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar la especialidad",
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    if (!formData.nombre.trim()) {
      toast({
        title: "Error",
        description: "El nombre es requerido",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEdit = (especialidad: Especialidad) => {
    setSelectedEspecialidad(especialidad);
    setFormData({
      nombre: especialidad.nombre,
      descripcion: especialidad.descripcion,
      activo: especialidad.activo,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = () => {
    if (!formData.nombre.trim()) {
      toast({
        title: "Error",
        description: "El nombre es requerido",
        variant: "destructive",
      });
      return;
    }
    if (selectedEspecialidad) {
      updateMutation.mutate({ id: selectedEspecialidad.id, data: formData });
    }
  };

  const handleDelete = (especialidad: Especialidad) => {
    setSelectedEspecialidad(especialidad);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedEspecialidad) {
      deleteMutation.mutate(selectedEspecialidad.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Especialidades</h1>
          <p className="text-muted-foreground mt-2">
            Gestión de especialidades médicas
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Especialidad
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Especialidades</CardTitle>
          <CardDescription>Gestiona las especialidades médicas disponibles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nombre o descripción..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando especialidades...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Profesionales</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {especialidades.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No se encontraron especialidades
                    </TableCell>
                  </TableRow>
                ) : (
                  especialidades.map((esp) => (
                    <TableRow key={esp.id}>
                      <TableCell className="font-medium">{esp.nombre}</TableCell>
                      <TableCell className="max-w-md truncate">{esp.descripcion || "-"}</TableCell>
                      <TableCell>{esp.profesionales_count}</TableCell>
                      <TableCell>
                        <Badge variant={esp.activo ? "default" : "secondary"}>
                          {esp.activo ? "Activa" : "Inactiva"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleEdit(esp)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleDelete(esp)}
                            disabled={esp.profesionales_count > 0}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Especialidad</DialogTitle>
            <DialogDescription>
              Completa los datos para crear una nueva especialidad médica
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                placeholder="Ej: Cardiología"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                placeholder="Descripción de la especialidad..."
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="activo"
                checked={formData.activo}
                onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
              />
              <Label htmlFor="activo">Activa</Label>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Especialidad</DialogTitle>
            <DialogDescription>
              Modifica los datos de la especialidad
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nombre">Nombre *</Label>
              <Input
                id="edit-nombre"
                placeholder="Ej: Cardiología"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-descripcion">Descripción</Label>
              <Textarea
                id="edit-descripcion"
                placeholder="Descripción de la especialidad..."
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-activo"
                checked={formData.activo}
                onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
              />
              <Label htmlFor="edit-activo">Activa</Label>
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
              Esta acción no se puede deshacer. Se eliminará la especialidad "{selectedEspecialidad?.nombre}".
              {selectedEspecialidad && selectedEspecialidad.profesionales_count > 0 && (
                <span className="block mt-2 text-destructive">
                  No se puede eliminar porque está siendo utilizada por {selectedEspecialidad.profesionales_count} profesional(es).
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending || (selectedEspecialidad?.profesionales_count || 0) > 0}
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

