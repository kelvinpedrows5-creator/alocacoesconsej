import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Building, Users, FileText, ExternalLink, ClipboardCheck, Upload, Link as LinkIcon, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useClients } from '@/hooks/useClients';
import { useCycles } from '@/hooks/useCycles';
import { useAuthContext } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Profile {
  user_id: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
}

interface DemandSubmission {
  id: string;
  title: string;
  user_id: string;
  gt_client_id: string | null;
  status: string;
  performed_at: string | null;
  created_at: string;
}

export function MyClientsOverview() {
  const { clients, gtMembers, getGTMembersByClient, getClientsByCycle, updateClient } = useClients();
  const { cycles, currentCycle } = useCycles();
  const { profile, isAdmin } = useAuthContext();
  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const [contractDialog, setContractDialog] = useState<{ clientId: string; clientName: string } | null>(null);
  const [contractType, setContractType] = useState<'link' | 'pdf'>('link');
  const [contractLink, setContractLink] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profiles = [] } = useQuery({
    queryKey: ['all_profiles_for_my_clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, email, avatar_url');
      if (error) throw error;
      return data as Profile[];
    },
  });

  // Fetch executed demands with details
  const { data: executedDemands = [] } = useQuery({
    queryKey: ['executed_demands_for_my_clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('demand_submissions')
        .select('id, title, user_id, gt_client_id, status, performed_at, created_at')
        .eq('status', 'evaluated')
        .not('gt_client_id', 'is', null);
      if (error) throw error;
      return (data || []) as DemandSubmission[];
    },
  });

  const getProfileByUserId = (userId: string) => profiles.find(p => p.user_id === userId);

  const getInitials = (name: string | null, email: string) => {
    if (name) return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    return email.charAt(0).toUpperCase();
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'director': return 'Diretor';
      case 'manager': return 'Gerente';
      case 'consultant': return 'Consultor';
      default: return role;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'director': return 'text-purple-700 bg-purple-100 border-purple-200 dark:text-purple-300 dark:bg-purple-900/30 dark:border-purple-700';
      case 'manager': return 'text-blue-700 bg-blue-100 border-blue-200 dark:text-blue-300 dark:bg-blue-900/30 dark:border-blue-700';
      case 'consultant': return 'text-emerald-700 bg-emerald-100 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-900/30 dark:border-emerald-700';
      default: return '';
    }
  };

  const getClientDemands = (clientId: string) => {
    return executedDemands.filter(d => d.gt_client_id === clientId);
  };

  const isUserInGT = (clientId: string, cycleId: string) => {
    if (!profile?.user_id) return false;
    return gtMembers.some(m => m.client_id === clientId && m.cycle_id === cycleId && m.user_id === profile.user_id);
  };

  useEffect(() => {
    if (currentCycle && !selectedCycleId) {
      setSelectedCycleId(currentCycle.id);
    }
  }, [currentCycle, selectedCycleId]);

  const activeCycleId = selectedCycleId || currentCycle?.id || '';
  const cycleClients = getClientsByCycle(activeCycleId);
  const myClients = cycleClients.filter(client => isUserInGT(client.id, activeCycleId));

  const handleSaveLink = (clientId: string) => {
    if (!contractLink.trim()) return;
    updateClient({ id: clientId, updates: { contract_scope_url: contractLink.trim(), contract_scope_type: 'link' } });
    setContractDialog(null);
    setContractLink('');
  };

  const handleUploadPdf = async (clientId: string, file: File) => {
    if (!file || file.type !== 'application/pdf') {
      toast.error('Por favor, selecione um arquivo PDF válido.');
      return;
    }
    setUploading(true);
    try {
      const filePath = `${clientId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from('contracts').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: publicUrlData } = supabase.storage.from('contracts').getPublicUrl(filePath);
      updateClient({ id: clientId, updates: { contract_scope_url: publicUrlData.publicUrl, contract_scope_type: 'pdf' } });
      setContractDialog(null);
      toast.success('PDF do contrato enviado com sucesso!');
    } catch (err: any) {
      toast.error('Erro ao enviar PDF: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveContract = (clientId: string) => {
    updateClient({ id: clientId, updates: { contract_scope_url: null, contract_scope_type: null } });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Building className="h-6 w-6 text-primary" />
            Meus Clientes
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Grupos de Trabalho nos quais você está alocado
          </p>
        </div>
        <Select value={activeCycleId} onValueChange={setSelectedCycleId}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Selecione o ciclo" />
          </SelectTrigger>
          <SelectContent>
            {cycles.filter(c => c.is_visible).map(c => (
              <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {myClients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">Você não está alocado em nenhum Grupo de Trabalho neste ciclo.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {myClients.map(client => {
            const clientGTMembers = getGTMembersByClient(client.id, activeCycleId);
            const clientDemands = getClientDemands(client.id);

            return (
              <Card key={client.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building className="h-5 w-5 text-primary" />
                      {client.name}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* GT Members */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Users className="w-4 h-4" />
                      Equipe do GT ({clientGTMembers.length})
                    </div>
                    <div className="space-y-1.5 pl-6">
                      {clientGTMembers.map(member => {
                        const memberProfile = getProfileByUserId(member.user_id);
                        return (
                          <div key={member.id} className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={memberProfile?.avatar_url || undefined} />
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {getInitials(memberProfile?.display_name || null, memberProfile?.email || '')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm truncate">{memberProfile?.display_name || memberProfile?.email || 'Membro'}</span>
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 ${getRoleBadgeVariant(member.role)}`}>
                              {getRoleLabel(member.role)}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Executed Demands - expandable */}
                  <Accordion type="single" collapsible>
                    <AccordionItem value="demands" className="border-none">
                      <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">
                        <div className="flex items-center gap-2">
                          <ClipboardCheck className="w-4 h-4 text-muted-foreground" />
                          Demandas executadas
                          <Badge variant="secondary" className="font-semibold ml-1">{clientDemands.length}</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {clientDemands.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic pl-6">Nenhuma demanda executada para este cliente.</p>
                        ) : (
                          <div className="space-y-2 pl-6">
                            {clientDemands.map(demand => {
                              const author = getProfileByUserId(demand.user_id);
                              return (
                                <div key={demand.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/30">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{demand.title}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <Avatar className="h-4 w-4">
                                        <AvatarImage src={author?.avatar_url || undefined} />
                                        <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                                          {getInitials(author?.display_name || null, author?.email || '')}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-xs text-muted-foreground">{author?.display_name || author?.email || 'Membro'}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  {/* Contract Scope */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <FileText className="w-4 h-4" />
                      Escopo do Contrato
                    </div>
                    {client.contract_scope_url ? (
                      <div className="flex items-center gap-2 pl-6">
                        <a
                          href={client.contract_scope_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1 truncate"
                        >
                          <ExternalLink className="w-3 h-3 shrink-0" />
                          {client.contract_scope_type === 'pdf' ? 'Ver PDF do contrato' : 'Acessar escopo'}
                        </a>
                        {(isAdmin || isUserInGT(client.id, activeCycleId)) && (
                          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleRemoveContract(client.id)}>
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="pl-6">
                        {isAdmin ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs gap-1"
                            onClick={() => {
                              setContractDialog({ clientId: client.id, clientName: client.name });
                              setContractType('link');
                              setContractLink('');
                            }}
                          >
                            <Upload className="w-3 h-3" />
                            Adicionar escopo
                          </Button>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">Nenhum escopo cadastrado</p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Contract Scope Dialog */}
      <Dialog open={!!contractDialog} onOpenChange={(open) => !open && setContractDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Escopo do Contrato — {contractDialog?.clientName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={contractType === 'link' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setContractType('link')}
                className="gap-1"
              >
                <LinkIcon className="w-3 h-3" />
                Link
              </Button>
              <Button
                variant={contractType === 'pdf' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setContractType('pdf')}
                className="gap-1"
              >
                <Upload className="w-3 h-3" />
                PDF
              </Button>
            </div>

            {contractType === 'link' ? (
              <div className="space-y-2">
                <Label>URL do escopo</Label>
                <Input
                  placeholder="https://..."
                  value={contractLink}
                  onChange={(e) => setContractLink(e.target.value)}
                />
                <Button
                  className="w-full"
                  disabled={!contractLink.trim()}
                  onClick={() => contractDialog && handleSaveLink(contractDialog.clientId)}
                >
                  Salvar link
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Arquivo PDF</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && contractDialog) handleUploadPdf(contractDialog.clientId, file);
                  }}
                  disabled={uploading}
                />
                {uploading && <p className="text-xs text-muted-foreground">Enviando...</p>}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
