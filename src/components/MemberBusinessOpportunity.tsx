import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Lightbulb, Check, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ClientData {
  id: string;
  name: string;
}

interface Opportunity {
  id: string;
  client_id: string;
  service_description: string;
  status: string;
  created_at: string;
}

export function MemberBusinessOpportunity() {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedClientId, setSelectedClientId] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [clientsRes, oppsRes] = await Promise.all([
        supabase.from('clients').select('id, name').order('name'),
        supabase
          .from('business_opportunities')
          .select('*')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false }),
      ]);

      if (clientsRes.data) setClients(clientsRes.data);
      if (oppsRes.data) setOpportunities(oppsRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedClientId || !serviceDescription.trim()) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('business_opportunities').insert({
        user_id: user!.id,
        client_id: selectedClientId,
        service_description: serviceDescription.trim(),
      });

      if (error) throw error;

      toast({ title: 'Oportunidade enviada com sucesso!' });
      setSelectedClientId('');
      setServiceDescription('');
      fetchData();
    } catch (err: any) {
      toast({ title: 'Erro ao enviar', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Pendente</Badge>;
      case 'acknowledged':
        return <Badge className="gap-1 bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><Check className="h-3 w-3" /> Ciente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getClientName = (clientId: string) => clients.find((c) => c.id === clientId)?.name || 'Cliente';

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
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Nova Oportunidade de Negócio
            </CardTitle>
            <CardDescription>
              Indique a possibilidade de vender novos serviços para um cliente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Cliente</label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Serviço a ser vendido</label>
              <Textarea
                placeholder="Descreva o serviço que poderia ser oferecido ao cliente..."
                value={serviceDescription}
                onChange={(e) => setServiceDescription(e.target.value)}
                rows={3}
              />
            </div>

            <Button onClick={handleSubmit} disabled={submitting} className="w-full gap-2">
              <Plus className="h-4 w-4" />
              {submitting ? 'Enviando...' : 'Enviar Oportunidade'}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Minhas Oportunidades</CardTitle>
            <CardDescription>{opportunities.length} oportunidade(s) enviada(s)</CardDescription>
          </CardHeader>
          <CardContent>
            {opportunities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Nenhuma oportunidade enviada ainda.
              </p>
            ) : (
              <ScrollArea className="max-h-[400px]">
                <div className="space-y-3">
                  {opportunities.map((opp) => (
                    <div key={opp.id} className="p-3 rounded-lg border border-border bg-muted/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm text-foreground">
                          {getClientName(opp.client_id)}
                        </span>
                        {getStatusBadge(opp.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{opp.service_description}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(opp.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
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
