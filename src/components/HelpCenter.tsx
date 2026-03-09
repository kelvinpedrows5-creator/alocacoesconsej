import { useState, useEffect } from 'react';
import { Heart, Send, CheckCircle, Inbox, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useLeadership } from '@/hooks/useLeadership';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Leader {
  user_id: string;
  display_name: string;
  position_type: string;
  directorate_name: string;
}

interface Report {
  id: string;
  message: string;
  created_at: string;
  sender_name: string;
  is_read: boolean;
}

const directorateNames: Record<string, string> = {
  'dir-1': 'Demandas',
  'dir-2': 'Negócios',
  'dir-3': 'Presidência',
  'dir-4': 'Vice-Presidência',
  'dir-5': 'Marketing',
  'dir-6': 'Pesquisas e Pessoas',
};

export function HelpCenter() {
  const { user } = useAuthContext();
  const { positions } = useLeadership();
  const [message, setMessage] = useState('');
  const [selectedLeader, setSelectedLeader] = useState('');
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  const isLeader = user
    ? positions.some((p) => p.user_id === user.id)
    : false;

  useEffect(() => {
    const fetchLeaders = async () => {
      const { data: pos } = await supabase
        .from('leadership_positions')
        .select('user_id, position_type, directorate_id');

      if (!pos) return;

      const userIds = [...new Set(pos.map((p) => p.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', userIds);

      const profileMap = Object.fromEntries(
        (profiles || []).map((p) => [p.user_id, p.display_name || p.user_id])
      );

      const mapped: Leader[] = pos
        .filter((p) => p.user_id !== user?.id)
        .map((p) => ({
          user_id: p.user_id,
          display_name: profileMap[p.user_id] || 'Membro',
          position_type: p.position_type,
          directorate_name: directorateNames[p.directorate_id] || p.directorate_id,
        }));

      const unique = mapped.filter(
        (l, i, arr) => arr.findIndex((x) => x.user_id === l.user_id && x.position_type === l.position_type) === i
      );

      setLeaders(unique);
    };

    fetchLeaders();
  }, [user?.id]);

  const fetchReports = async () => {
    if (!user || !isLeader) return;
    setReportsLoading(true);

    const { data, error } = await supabase
      .from('help_reports')
      .select('id, message, created_at, user_id, is_read')
      .eq('target_leader_id', user.id)
      .order('created_at', { ascending: false });

    if (error || !data) {
      setReportsLoading(false);
      return;
    }

    const senderIds = [...new Set(data.map((r) => r.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name')
      .in('user_id', senderIds);

    const profileMap = Object.fromEntries(
      (profiles || []).map((p) => [p.user_id, p.display_name || 'Membro'])
    );

    setReports(
      data.map((r) => ({
        id: r.id,
        message: r.message,
        created_at: r.created_at,
        sender_name: profileMap[r.user_id] || 'Membro',
        is_read: r.is_read,
      }))
    );
    setReportsLoading(false);
  };

  useEffect(() => {
    if (isLeader) fetchReports();
  }, [isLeader, user?.id]);

  const markReportsAsRead = async () => {
    if (!user) return;
    const unreadIds = reports.filter((r) => !(r as any).is_read).map((r) => r.id);
    if (unreadIds.length === 0) return;
    await supabase
      .from('help_reports')
      .update({ is_read: true })
      .in('id', unreadIds);
  };

  const handleSubmit = async () => {
    if (!message.trim() || !selectedLeader || !user) return;

    setLoading(true);
    const { error } = await supabase.from('help_reports').insert({
      user_id: user.id,
      target_leader_id: selectedLeader,
      message: message.trim(),
    });
    setLoading(false);

    if (error) {
      toast.error('Erro ao enviar relato. Tente novamente.');
      return;
    }

    setSent(true);
    setMessage('');
    setSelectedLeader('');
    toast.success('Seu relato foi enviado com sucesso.');
    setTimeout(() => setSent(false), 4000);
  };

  const positionLabel = (type: string) =>
    type === 'director' ? 'Diretor(a)' : 'Gerente';

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <Heart className="h-10 w-10 text-destructive mx-auto" />
        <h2 className="text-2xl font-bold text-foreground">Central de Ajuda</h2>
        <p className="text-muted-foreground">
          Um espaço seguro para você ser ouvido.
        </p>
      </div>

      <Tabs defaultValue="submit">
        <TabsList className="w-full">
          <TabsTrigger value="submit" className="flex-1 gap-2">
            <MessageSquare className="h-4 w-4" />
            Enviar Relato
          </TabsTrigger>
          {isLeader && (
            <TabsTrigger value="reports" className="flex-1 gap-2" onClick={() => { fetchReports(); markReportsAsRead(); }}>
              <Inbox className="h-4 w-4" />
              Reportes
              {reports.filter((r) => !r.is_read).length > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs px-1.5 py-0">
                  {reports.filter((r) => !r.is_read).length}
                </Badge>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="submit">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Algo dentro da CONSEJ te deixou desconfortável? Conte para nós. Você será ouvido.
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {sent ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <CheckCircle className="h-12 w-12 text-primary" />
                  <p className="text-foreground font-medium">Relato enviado com sucesso!</p>
                  <p className="text-sm text-muted-foreground">
                    A liderança selecionada receberá seu relato. Obrigado por compartilhar.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="message">O que você gostaria de compartilhar?</Label>
                    <Textarea
                      id="message"
                      placeholder="Escreva aqui o que está sentindo..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={5}
                      maxLength={2000}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {message.length}/2000
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Para qual liderança deseja reportar?</Label>
                    <Select value={selectedLeader} onValueChange={setSelectedLeader}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma liderança" />
                      </SelectTrigger>
                      <SelectContent>
                        {leaders.map((l, i) => (
                          <SelectItem key={`${l.user_id}-${l.position_type}-${i}`} value={l.user_id}>
                            {l.display_name} — {positionLabel(l.position_type)} de {l.directorate_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleSubmit}
                    disabled={!message.trim() || !selectedLeader || loading}
                    className="w-full"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {loading ? 'Enviando...' : 'Enviar Relato'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {isLeader && (
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Inbox className="h-5 w-5" />
                  Reportes Recebidos
                </CardTitle>
                <CardDescription>
                  Relatos endereçados a você por membros da CONSEJ.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reportsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  </div>
                ) : reports.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Inbox className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    <p>Nenhum reporte recebido até o momento.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reports.map((report, idx) => (
                      <div key={report.id}>
                        {idx > 0 && <Separator className="mb-4" />}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm text-foreground">
                              {report.sender_name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(report.created_at), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {report.message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
