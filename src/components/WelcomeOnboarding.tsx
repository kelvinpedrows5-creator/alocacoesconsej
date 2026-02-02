import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Building2, ArrowRight, Check, Briefcase, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthContext } from '@/contexts/AuthContext';
import { coordinations, directorates } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';
import { useClients } from '@/hooks/useClients';
import { useCycles } from '@/hooks/useCycles';

interface WelcomeOnboardingProps {
  onComplete: () => void;
}

interface GTSelection {
  clientId: string;
  role: 'director' | 'manager' | 'consultant';
}

export const WelcomeOnboarding = ({ onComplete }: WelcomeOnboardingProps) => {
  const { updateProfile } = useAuthContext();
  const { toast } = useToast();
  const { clients } = useClients();
  const { currentCycle } = useCycles();
  
  const [displayName, setDisplayName] = useState('');
  const [selectedCoordination, setSelectedCoordination] = useState('');
  const [gtSelections, setGtSelections] = useState<GTSelection[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Current GT being added
  const [currentGtClient, setCurrentGtClient] = useState('');
  const [currentGtRole, setCurrentGtRole] = useState<'director' | 'manager' | 'consultant'>('consultant');

  const handleAddGT = () => {
    if (!currentGtClient) {
      toast({
        title: 'Selecione um cliente',
        description: 'Escolha o cliente do grupo de trabalho.',
        variant: 'destructive',
      });
      return;
    }

    // Check if already selected
    if (gtSelections.some(g => g.clientId === currentGtClient)) {
      toast({
        title: 'GT já adicionado',
        description: 'Este grupo de trabalho já foi selecionado.',
        variant: 'destructive',
      });
      return;
    }

    setGtSelections(prev => [...prev, { clientId: currentGtClient, role: currentGtRole }]);
    setCurrentGtClient('');
    setCurrentGtRole('consultant');
  };

  const handleRemoveGT = (clientId: string) => {
    setGtSelections(prev => prev.filter(g => g.clientId !== clientId));
  };

  const handleSubmit = async () => {
    if (!displayName.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Por favor, informe como você quer ser chamado.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedCoordination) {
      toast({
        title: 'Coordenadoria obrigatória',
        description: 'Por favor, selecione sua coordenadoria atual.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await updateProfile({
        display_name: displayName.trim(),
        profile_preferred_directorate: selectedCoordination,
      });

      if (error) throw error;

      toast({
        title: 'Bem-vindo(a)!',
        description: 'Seu perfil foi configurado com sucesso.',
      });
      
      onComplete();
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Group coordinations by directorate
  const groupedCoordinations = directorates.map((dir) => ({
    ...dir,
    coordinations: coordinations.filter((c) => c.directorateId === dir.id),
  }));

  const getClientName = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.name || clientId;
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'director': return 'Diretor';
      case 'manager': return 'Gerente';
      case 'consultant': return 'Consultor';
      default: return role;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg"
      >
        <Card className="border-primary/20">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
              {step === 1 ? (
                <User className="w-8 h-8 text-primary" />
              ) : step === 2 ? (
                <Building2 className="w-8 h-8 text-primary" />
              ) : (
                <Briefcase className="w-8 h-8 text-primary" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {step === 1 ? 'Bem-vindo(a) ao CONSEJ!' : step === 2 ? 'Sua Coordenadoria' : 'Grupos de Trabalho'}
            </CardTitle>
            <CardDescription>
              {step === 1
                ? 'Como você gostaria de ser chamado(a)?'
                : step === 2
                ? 'Selecione a coordenadoria onde você está alocado(a)'
                : 'Informe os GTs em que você participa (opcional)'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress indicator */}
            <div className="flex justify-center gap-2 mb-4">
              <div
                className={`h-2 w-12 rounded-full transition-colors ${
                  step >= 1 ? 'bg-primary' : 'bg-muted'
                }`}
              />
              <div
                className={`h-2 w-12 rounded-full transition-colors ${
                  step >= 2 ? 'bg-primary' : 'bg-muted'
                }`}
              />
              <div
                className={`h-2 w-12 rounded-full transition-colors ${
                  step >= 3 ? 'bg-primary' : 'bg-muted'
                }`}
              />
            </div>

            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="displayName">Nome de exibição</Label>
                  <Input
                    id="displayName"
                    placeholder="Ex: Ana Silva"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">
                    Este nome será exibido para todos no sistema
                  </p>
                </div>
                <Button
                  className="w-full"
                  onClick={() => {
                    if (displayName.trim()) {
                      setStep(2);
                    } else {
                      toast({
                        title: 'Nome obrigatório',
                        description: 'Por favor, informe seu nome.',
                        variant: 'destructive',
                      });
                    }
                  }}
                >
                  Continuar
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="coordination">Coordenadoria atual</Label>
                  <Select
                    value={selectedCoordination}
                    onValueChange={setSelectedCoordination}
                  >
                    <SelectTrigger id="coordination">
                      <SelectValue placeholder="Selecione sua coordenadoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {groupedCoordinations.map((dir) => (
                        <div key={dir.id}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                            {dir.name}
                          </div>
                          {dir.coordinations.map((coord) => (
                            <SelectItem key={coord.id} value={coord.id}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: coord.color }}
                                />
                                <span className="truncate">{coord.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    Voltar
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => {
                      if (selectedCoordination) {
                        setStep(3);
                      } else {
                        toast({
                          title: 'Coordenadoria obrigatória',
                          description: 'Por favor, selecione uma coordenadoria.',
                          variant: 'destructive',
                        });
                      }
                    }}
                  >
                    Continuar
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                {/* Selected GTs */}
                {gtSelections.length > 0 && (
                  <div className="space-y-2">
                    <Label>GTs selecionados</Label>
                    <ScrollArea className="max-h-32">
                      <div className="space-y-2">
                        {gtSelections.map((gt) => (
                          <div
                            key={gt.clientId}
                            className="flex items-center justify-between p-2 bg-secondary/50 rounded-lg"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Briefcase className="w-4 h-4 text-primary shrink-0" />
                              <span className="text-sm truncate">{getClientName(gt.clientId)}</span>
                              <Badge variant="outline" className="text-xs shrink-0">
                                {getRoleLabel(gt.role)}
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0"
                              onClick={() => handleRemoveGT(gt.clientId)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* Add GT form */}
                <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                  <div className="space-y-2">
                    <Label className="text-sm">Adicionar Grupo de Trabalho</Label>
                    <Select value={currentGtClient} onValueChange={setCurrentGtClient}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients
                          .filter(c => !gtSelections.some(g => g.clientId === c.id))
                          .map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Sua função</Label>
                    <Select value={currentGtRole} onValueChange={(v) => setCurrentGtRole(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="director">Diretor de Demandas</SelectItem>
                        <SelectItem value="manager">Gerente de Demandas</SelectItem>
                        <SelectItem value="consultant">Consultor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddGT}
                    disabled={!currentGtClient}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar GT
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Você pode pular esta etapa e adicionar GTs depois
                </p>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="flex-1"
                  >
                    Voltar
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? (
                      'Salvando...'
                    ) : (
                      <>
                        Concluir
                        <Check className="ml-2 w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
