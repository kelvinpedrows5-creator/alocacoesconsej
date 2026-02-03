import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Plus, Eye, EyeOff, Trash2, Star, AlertTriangle, History } from 'lucide-react';
import { useCycles, AllocationCycle } from '@/hooks/useCycles';
import { CycleHistoryView } from '@/components/CycleHistoryView';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const CyclesManagement = () => {
  const { cycles, loading, addCycle, updateCycleVisibility, setCurrentCycle, deleteCycle } = useCycles();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AllocationCycle | null>(null);
  const [historyTarget, setHistoryTarget] = useState<AllocationCycle | null>(null);
  const [newCycleLabel, setNewCycleLabel] = useState('');
  const [newCycleValue, setNewCycleValue] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAddCycle = async () => {
    if (!newCycleLabel.trim() || !newCycleValue.trim()) return;
    setAdding(true);
    await addCycle(newCycleLabel.trim(), newCycleValue.trim());
    setAdding(false);
    setShowAddDialog(false);
    setNewCycleLabel('');
    setNewCycleValue('');
  };

  const handleDelete = async (cycle: AllocationCycle) => {
    await deleteCycle(cycle.id);
    setDeleteTarget(null);
  };

  // Generate next cycle suggestion
  const generateNextCycle = () => {
    if (cycles.length === 0) {
      setNewCycleLabel('1º Ciclo de 2026');
      setNewCycleValue('2026-C1');
      return;
    }

    // Find the latest cycle by value
    const sortedCycles = [...cycles].sort((a, b) => b.value.localeCompare(a.value));
    const latestValue = sortedCycles[0].value;
    
    // Parse the value (format: YYYY-CX)
    const match = latestValue.match(/(\d{4})-C(\d+)/);
    if (match) {
      const year = parseInt(match[1]);
      const cycleNum = parseInt(match[2]);
      
      if (cycleNum >= 4) {
        // Next year, cycle 1
        setNewCycleLabel(`1º Ciclo de ${year + 1}`);
        setNewCycleValue(`${year + 1}-C1`);
      } else {
        // Same year, next cycle
        const ordinals = ['', '1º', '2º', '3º', '4º'];
        setNewCycleLabel(`${ordinals[cycleNum + 1]} Ciclo de ${year}`);
        setNewCycleValue(`${year}-C${cycleNum + 1}`);
      }
    } else {
      setNewCycleLabel('');
      setNewCycleValue('');
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Gestão de Ciclos
              </CardTitle>
              <CardDescription>
                Gerencie os ciclos de alocação e sua visibilidade
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                generateNextCycle();
                setShowAddDialog(true);
              }}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Novo Ciclo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : cycles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum ciclo cadastrado. Crie o primeiro ciclo para começar.
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {cycles.map((cycle) => (
                  <motion.div
                    key={cycle.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-between p-4 rounded-lg border hover:border-primary/30 transition-colors bg-card"
                  >
                    <div 
                      className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                      onClick={() => setHistoryTarget(cycle)}
                    >
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground truncate">{cycle.label}</p>
                          {cycle.is_current && (
                            <Badge variant="default" className="text-xs shrink-0">
                              <Star className="w-3 h-3 mr-1" />
                              Atual
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{cycle.value}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                      {/* View History Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setHistoryTarget(cycle)}
                        className="gap-1 hidden sm:flex"
                      >
                        <History className="w-4 h-4" />
                        Ver
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setHistoryTarget(cycle)}
                        className="sm:hidden"
                      >
                        <History className="w-4 h-4" />
                      </Button>

                      {/* Visibility Toggle */}
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`visibility-${cycle.id}`}
                          checked={cycle.is_visible}
                          onCheckedChange={(checked) => updateCycleVisibility(cycle.id, checked)}
                        />
                        <Label
                          htmlFor={`visibility-${cycle.id}`}
                          className="text-sm cursor-pointer hidden sm:block"
                        >
                          {cycle.is_visible ? (
                            <span className="flex items-center gap-1 text-primary">
                              <Eye className="w-3 h-3" />
                              Visível
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <EyeOff className="w-3 h-3" />
                              Oculto
                            </span>
                          )}
                        </Label>
                      </div>

                      {/* Set as Current */}
                      {!cycle.is_current && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCurrentCycle(cycle.id)}
                          className="hidden sm:flex"
                        >
                          <Star className="w-4 h-4 mr-1" />
                          Definir Atual
                        </Button>
                      )}

                      {/* Delete Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(cycle)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Cycle History View */}
      {historyTarget && (
        <CycleHistoryView
          cycle={historyTarget}
          open={!!historyTarget}
          onClose={() => setHistoryTarget(null)}
        />
      )}

      {/* Add Cycle Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Ciclo de Alocação</DialogTitle>
            <DialogDescription>
              Crie um novo ciclo para realizar novas alocações
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cycle-label">Nome do Ciclo</Label>
              <Input
                id="cycle-label"
                placeholder="Ex: 2º Ciclo de 2026"
                value={newCycleLabel}
                onChange={(e) => setNewCycleLabel(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cycle-value">Identificador</Label>
              <Input
                id="cycle-value"
                placeholder="Ex: 2026-C2"
                value={newCycleValue}
                onChange={(e) => setNewCycleValue(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Use o formato YYYY-CX (ex: 2026-C2)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAddCycle}
              disabled={adding || !newCycleLabel.trim() || !newCycleValue.trim()}
            >
              {adding ? 'Criando...' : 'Criar Ciclo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o ciclo <strong>{deleteTarget?.label}</strong>?
              Todas as alocações associadas a este ciclo também serão removidas.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
