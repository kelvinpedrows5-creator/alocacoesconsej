import { useState, useEffect } from 'react';
import { Heart, Send, CheckCircle, Inbox, MessageSquare, MessageCircle, CheckCheck, FileText, Trash2 } from 'lucide-react';
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
  status: string;
  leader_comment: string | null;
}

interface SentReport {
  id: string;
  message: string;
  created_at: string;
  status: string;
  leader_comment: string | null;
  target_name: string;
  member_seen: boolean;
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
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyComment, setReplyComment] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [sentReports, setSentReports] = useState<SentReport[]>([]);
  const [sentReportsLoading, setSentReportsLoading] = useState(false);

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

  // Fetch reports received (for leaders)
  const fetchReports = async () => {
    if (!user || !isLeader) return;
    setReportsLoading(true);

    const { data, error } = await supabase
      .from('help_reports')
      .select('id, message, created_at, user_id, is_read, status, leader_comment')
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
        status: r.status,
        leader_comment: r.leader_comment,
      }))
    );
    setReportsLoading(false);
  };

  // Fetch reports sent by this member
  const fetchSentReports = async () => {
    if (!user) return;
    setSentReportsLoading(true);

    const { data, error } = await supabase
      .from('help_reports')
      .select('id, message, created_at, status, leader_comment, target_leader_id, member_seen')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error || !data) {
      setSentReportsLoading(false);
      return;
    }

    const leaderIds = [...new Set(data.map((r) => r.target_leader_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name')
      .in('user_id', leaderIds);

    const profileMap = Object.fromEntries(
      (profiles || []).map((p) => [p.user_id, p.display_name || 'Liderança'])
    );

    setSentReports(
      data.map((r) => ({
        id: r.id,
        message: r.message,
        created_at: r.created_at,
        status: r.status,
        leader_comment: r.leader_comment,
        target_name: profileMap[r.target_leader_id] || 'Liderança',
        member_seen: r.member_seen,
      }))
    );
    setSentReportsLoading(false);
  };

  useEffect(() => {
    if (isLeader) fetchReports();
    fetchSentReports();
  }, [isLeader, user?.id]);

  const markReportsAsRead = async () => {
    if (!user) return;
    const unreadIds = reports.filter((r) => !r.is_read).map((r) => r.id);
    if (unreadIds.length === 0) return;
    await supabase
      .from('help_reports')
      .update({ is_read: true })
      .in('id', unreadIds);
  };

  const markSentReportsAsSeen = async () => {
    if (!user) return;
    const unseenIds = sentReports.filter((r) => !r.member_seen).map((r) => r.id);
    if (unseenIds.length === 0) return;
    await supabase
      .from('help_reports')
      .update({ member_seen: true })
      .in('id', unseenIds);
    setSentReports((prev) => prev.map((r) => ({ ...r, member_seen: true })));
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
    fetchSentReports();
    setTimeout(() => setSent(false), 4000);
  };

  const handleReply = async (reportId: string) => {
    if (!replyComment.trim()) return;
    setReplyLoading(true);

    const { error } = await supabase
      .from('help_reports')
      .update({ leader_comment: replyComment.trim(), is_read: true })
      .eq('id', reportId);

    setReplyLoading(false);

    if (error) {
      toast.error('Erro ao enviar comentário.');
      return;
    }

    toast.success('Comentário enviado com sucesso.');
    setReplyComment('');
    setReplyingTo(null);
    fetchReports();
  };

  const handleResolve = async (reportId: string) => {
    const { error } = await supabase
      .from('help_reports')
      .update({ status: 'resolved', is_read: true })
      .eq('id', reportId);

    if (error) {
      toast.error('Erro ao marcar como resolvido.');
      return;
    }

    toast.success('Situação marcada como resolvida.');
    fetchReports();
  };

  const handleDeleteReport = async (reportId: string, type: 'sent' | 'received') => {
    const { error } = await supabase
      .from('help_reports')
      .delete()
      .eq('id', reportId);

    if (error) {
      toast.error('Erro ao excluir relato.');
      return;
    }

    toast.success('Relato excluído com sucesso.');
    if (type === 'sent') {
      setSentReports((prev) => prev.filter((r) => r.id !== reportId));
    } else {
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    }
  };

  const positionLabel = (type: string) =>
    type === 'director' ? 'Diretor(a)' : 'Gerente';

  const unresolvedCount = reports.filter((r) => r.status !== 'resolved').length;
  const unseenSentCount = sentReports.filter((r) => !r.member_seen).length;

  const statusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return <Badge variant="outline" className="text-xs border-primary text-primary">Resolvido</Badge>;
      case 'pending':
      default:
        return <Badge variant="secondary" className="text-xs">Pendente</Badge>;
    }
  };

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
          <TabsTrigger
            value="my-reports"
            className="flex-1 gap-2"
            onClick={() => { fetchSentReports(); }}
          >
            <FileText className="h-4 w-4" />
            Meus Relatos
            {unseenSentCount > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs px-1.5 py-0">
                {unseenSentCount}
              </Badge>
            )}
          </TabsTrigger>
          {isLeader && (
            <TabsTrigger value="reports" className="flex-1 gap-2" onClick={() => { fetchReports(); markReportsAsRead(); }}>
              <Inbox className="h-4 w-4" />
              Reportes
              {unresolvedCount > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs px-1.5 py-0">
                  {unresolvedCount}
                </Badge>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        {/* Tab: Enviar Relato */}
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
                    <Label htmlFor="help-message">O que você gostaria de compartilhar?</Label>
                    <Textarea
                      id="help-message"
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

        {/* Tab: Meus Relatos */}
        <TabsContent value="my-reports">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Meus Relatos Enviados
              </CardTitle>
              <CardDescription>
                Acompanhe o status dos relatos que você enviou.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sentReportsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                </div>
              ) : sentReports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p>Você ainda não enviou nenhum relato.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sentReports.map((report, idx) => (
                    <div key={report.id}>
                      {idx > 0 && <Separator className="mb-4" />}
                      <div className={`space-y-3 pl-3 border-l-2 ${!report.member_seen ? 'border-destructive' : report.status === 'resolved' ? 'border-primary' : 'border-muted'}`}>
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <span className="font-medium text-sm text-foreground flex items-center gap-2">
                            Para: {report.target_name}
                            {statusBadge(report.status)}
                            {!report.member_seen && (
                              <Badge variant="destructive" className="text-xs px-1.5 py-0">Novidade</Badge>
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(report.created_at), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {report.message}
                        </p>

                        {report.leader_comment && (
                          <div className="bg-muted/50 rounded-md p-3 space-y-1">
                            <span className="text-xs font-medium text-foreground flex items-center gap-1">
                              <MessageCircle className="h-3 w-3" /> Resposta da liderança
                            </span>
                            <p className="text-sm text-muted-foreground">{report.leader_comment}</p>
                          </div>
                        )}

                        {report.status === 'resolved' && (
                          <div className="flex items-center gap-1 text-xs text-primary">
                            <CheckCheck className="h-3.5 w-3.5" />
                            Situação marcada como resolvida pela liderança
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {unseenSentCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={markSentReportsAsSeen}
                    >
                      Marcar todas as novidades como vistas
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Reportes Recebidos (leaders only) */}
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
                        <div className={`space-y-3 ${report.status !== 'resolved' ? 'pl-3 border-l-2 border-destructive' : 'pl-3 border-l-2 border-primary'}`}>
                          <div className="flex items-center justify-between flex-wrap gap-1">
                            <span className="font-medium text-sm text-foreground flex items-center gap-2">
                              {report.sender_name}
                              {report.status === 'resolved' ? (
                                <Badge variant="outline" className="text-xs border-primary text-primary">Resolvido</Badge>
                              ) : (
                                <Badge variant="destructive" className="text-xs px-1.5 py-0">Pendente</Badge>
                              )}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(report.created_at), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {report.message}
                          </p>

                          {report.leader_comment && (
                            <div className="bg-muted/50 rounded-md p-3 space-y-1">
                              <span className="text-xs font-medium text-foreground flex items-center gap-1">
                                <MessageCircle className="h-3 w-3" /> Seu comentário
                              </span>
                              <p className="text-sm text-muted-foreground">{report.leader_comment}</p>
                            </div>
                          )}

                          {report.status !== 'resolved' && (
                            <div className="flex gap-2 flex-wrap">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setReplyingTo(replyingTo === report.id ? null : report.id);
                                  setReplyComment(report.leader_comment || '');
                                }}
                              >
                                <MessageCircle className="h-3.5 w-3.5 mr-1" />
                                {report.leader_comment ? 'Editar comentário' : 'Comentar'}
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleResolve(report.id)}
                              >
                                <CheckCheck className="h-3.5 w-3.5 mr-1" />
                                Marcar como resolvido
                              </Button>
                            </div>
                          )}

                          {replyingTo === report.id && (
                            <div className="space-y-2 pt-1">
                              <Textarea
                                placeholder="Escreva seu comentário para o membro..."
                                value={replyComment}
                                onChange={(e) => setReplyComment(e.target.value)}
                                rows={3}
                                maxLength={1000}
                              />
                              <div className="flex gap-2 justify-end">
                                <Button variant="ghost" size="sm" onClick={() => { setReplyingTo(null); setReplyComment(''); }}>
                                  Cancelar
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleReply(report.id)}
                                  disabled={!replyComment.trim() || replyLoading}
                                >
                                  <Send className="h-3.5 w-3.5 mr-1" />
                                  {replyLoading ? 'Enviando...' : 'Enviar'}
                                </Button>
                              </div>
                            </div>
                          )}
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
