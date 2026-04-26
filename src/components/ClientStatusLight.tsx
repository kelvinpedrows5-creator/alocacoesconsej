import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useLeadership } from '@/hooks/useLeadership';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Lightbulb, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export type ClientLightStatus = 'blue' | 'yellow' | 'red';

interface ClientStatusLightProps {
  clientId: string;
  cycleId: string;
  cycleLabel?: string;
}

interface StatusLightRow {
  id: string;
  client_id: string;
  cycle_id: string;
  status: ClientLightStatus;
  notes: string | null;
  updated_by: string;
  updated_at: string;
}

const STATUS_META: Record<ClientLightStatus, { label: string; dot: string; bg: string; text: string; border: string; description: string }> = {
  blue: {
    label: 'Azul',
    dot: 'bg-blue-500',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-700',
    description: 'Cliente em situação tranquila',
  },
  yellow: {
    label: 'Amarelo',
    dot: 'bg-yellow-500',
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-300',
    border: 'border-yellow-200 dark:border-yellow-700',
    description: 'Cliente requer atenção',
  },
  red: {
    label: 'Vermelho',
    dot: 'bg-red-500',
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-700',
    description: 'Cliente em situação crítica',
  },
};

export function ClientStatusLight({ clientId, cycleId, cycleLabel }: ClientStatusLightProps) {
  const queryClient = useQueryClient();
  const { user, isAdmin } = useAuthContext();
  const { positions } = useLeadership();
  const [open, setOpen] = useState(false);
  const [draftStatus, setDraftStatus] = useState<ClientLightStatus>('blue');
  const [draftNotes, setDraftNotes] = useState('');

  const isDemandsManager = !!user && positions.some(
    p => p.user_id === user.id && p.directorate_id === 'dir-1' && p.position_type === 'manager'
  );
  const canEdit = isAdmin || isDemandsManager;

  const { data: light } = useQuery({
    queryKey: ['client_status_light', clientId, cycleId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('client_status_lights')
        .select('*')
        .eq('client_id', clientId)
        .eq('cycle_id', cycleId)
        .maybeSingle();
      if (error) throw error;
      return data as StatusLightRow | null;
    },
    enabled: !!clientId && !!cycleId,
  });

  const saveMutation = useMutation({
    mutationFn: async ({ status, notes }: { status: ClientLightStatus; notes: string }) => {
      if (!user) throw new Error('Usuário não autenticado');
      const payload = {
        client_id: clientId,
        cycle_id: cycleId,
        status,
        notes: notes.trim() || null,
        updated_by: user.id,
      };
      const { error } = await (supabase as any)
        .from('client_status_lights')
        .upsert(payload, { onConflict: 'client_id,cycle_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client_status_light', clientId, cycleId] });
      toast.success('Farol do cliente atualizado!');
      setOpen(false);
    },
    onError: (err: any) => toast.error('Erro ao salvar farol: ' + err.message),
  });

  const openEditor = () => {
    setDraftStatus((light?.status as ClientLightStatus) || 'blue');
    setDraftNotes(light?.notes || '');
    setOpen(true);
  };

  const currentMeta = light ? STATUS_META[light.status] : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Lightbulb className="w-4 h-4" />
        Farol do Cliente {cycleLabel && <span className="text-xs font-normal">({cycleLabel})</span>}
      </div>
      <div className="pl-6 flex items-center gap-2 flex-wrap">
        {currentMeta ? (
          <Badge variant="outline" className={cn('gap-1.5 px-2.5 py-1', currentMeta.bg, currentMeta.text, currentMeta.border)}>
            <span className={cn('w-2.5 h-2.5 rounded-full', currentMeta.dot)} />
            Farol {currentMeta.label}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground italic">Nenhum farol definido neste ciclo</span>
        )}

        {light?.notes && (
          <span className="text-xs text-muted-foreground italic max-w-xs truncate" title={light.notes}>
            — {light.notes}
          </span>
        )}

        {canEdit && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1" onClick={openEditor}>
                <Pencil className="w-3 h-3" />
                {light ? 'Editar' : 'Definir farol'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-semibold">Definir farol do cliente</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    O farol é registrado para este ciclo e fica disponível no histórico.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(STATUS_META) as ClientLightStatus[]).map(s => {
                    const meta = STATUS_META[s];
                    const active = draftStatus === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setDraftStatus(s)}
                        className={cn(
                          'flex flex-col items-center gap-1.5 rounded-md border-2 p-2 text-xs transition-all',
                          active
                            ? cn(meta.border, meta.bg, 'shadow-sm')
                            : 'border-border bg-background hover:bg-muted'
                        )}
                      >
                        <span className={cn('w-4 h-4 rounded-full', meta.dot)} />
                        <span className={cn('font-medium', active && meta.text)}>{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-muted-foreground italic">
                  {STATUS_META[draftStatus].description}
                </p>
                <div className="space-y-1.5">
                  <Label className="text-xs">Observações (opcional)</Label>
                  <Textarea
                    value={draftNotes}
                    onChange={e => setDraftNotes(e.target.value)}
                    placeholder="Ex.: Cliente sem retorno há 2 semanas..."
                    rows={3}
                    className="text-sm"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => saveMutation.mutate({ status: draftStatus, notes: draftNotes })}
                    disabled={saveMutation.isPending}
                  >
                    {saveMutation.isPending ? 'Salvando...' : 'Salvar farol'}
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
}
