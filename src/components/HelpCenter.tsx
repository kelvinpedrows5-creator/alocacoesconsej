import { useState, useEffect } from 'react';
import { Heart, Send, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Leader {
  user_id: string;
  display_name: string;
  position_type: string;
  directorate_name: string;
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
  const [message, setMessage] = useState('');
  const [selectedLeader, setSelectedLeader] = useState('');
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const fetchLeaders = async () => {
      const { data: positions } = await supabase
        .from('leadership_positions')
        .select('user_id, position_type, directorate_id');

      if (!positions) return;

      const userIds = [...new Set(positions.map((p) => p.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', userIds);

      const profileMap = Object.fromEntries(
        (profiles || []).map((p) => [p.user_id, p.display_name || p.user_id])
      );

      const mapped: Leader[] = positions
        .filter((p) => p.user_id !== user?.id)
        .map((p) => ({
          user_id: p.user_id,
          display_name: profileMap[p.user_id] || 'Membro',
          position_type: p.position_type,
          directorate_name: directorateNames[p.directorate_id] || p.directorate_id,
        }));

      // Deduplicate by user_id + position_type
      const unique = mapped.filter(
        (l, i, arr) => arr.findIndex((x) => x.user_id === l.user_id && x.position_type === l.position_type) === i
      );

      setLeaders(unique);
    };

    fetchLeaders();
  }, [user?.id]);

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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Algo dentro da CONSEJ te deixou desconfortável? Conte para nós. Você será ouvido.
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <CheckCircle className="h-12 w-12 text-green-500" />
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
    </div>
  );
}
