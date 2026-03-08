import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Check, X, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProfileData {
  user_id: string;
  display_name: string | null;
  email: string;
}

interface ClientData {
  id: string;
  name: string;
}

interface Opportunity {
  id: string;
  user_id: string;
  client_id: string;
  service_description: string;
  status: string;
  created_at: string;
}

export function BusinessOpportunitiesManagement() {
  const { toast } = useToast();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [oppsRes, profilesRes, clientsRes] = await Promise.all([
        supabase.from('business_opportunities').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('user_id, display_name, email'),
        supabase.from('clients').select('id, name'),
      ]);

      if (oppsRes.data) setOpportunities(oppsRes.data);
      if (profilesRes.data) setProfiles(profilesRes.data);
      if (clientsRes.data) setClients(clientsRes.data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('business_opportunities').update({ status }).eq('id', id);
    if (error) {
      toast({ title: 'Erro ao atualizar', variant: 'destructive' });
    } else {
      toast({ title: `Oportunidade ${status === 'approved' ? 'aprovada' : 'rejeitada'}` });
      fetchData();
    }
  };

  const getMemberName = (userId: string) => {
    const p = profiles.find((pr) => pr.user_id === userId);
    return p?.display_name || p?.email || 'Membro';
  };

  const getClientName = (clientId: string) => clients.find((c) => c.id === clientId)?.name || 'Cliente';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Pendente</Badge>;
      case 'approved':
        return <Badge className="gap-1 bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><Check className="h-3 w-3" /> Aprovada</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1">Rejeitada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filtered = filterStatus === 'all'
    ? opportunities
    : opportunities.filter((o) => o.status === filterStatus);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  Oportunidades de Negócio
                </CardTitle>
                <CardDescription>{opportunities.length} oportunidade(s) recebida(s)</CardDescription>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="approved">Aprovadas</SelectItem>
                  <SelectItem value="rejected">Rejeitadas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Nenhuma oportunidade encontrada.
              </p>
            ) : (
              <ScrollArea className="max-h-[600px]">
                <div className="space-y-4">
                  {filtered.map((opp) => (
                    <div key={opp.id} className="p-4 rounded-lg border border-border bg-muted/30 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <p className="font-medium text-foreground">{getClientName(opp.client_id)}</p>
                          <p className="text-xs text-muted-foreground">
                            por {getMemberName(opp.user_id)} • {format(new Date(opp.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                        {getStatusBadge(opp.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{opp.service_description}</p>
                      {opp.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="gap-1 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10" onClick={() => updateStatus(opp.id, 'approved')}>
                            <Check className="h-3 w-3" /> Aprovar
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => updateStatus(opp.id, 'rejected')}>
                            <X className="h-3 w-3" /> Rejeitar
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
