import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Building2, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

interface WelcomeOnboardingProps {
  onComplete: () => void;
}

export const WelcomeOnboarding = ({ onComplete }: WelcomeOnboardingProps) => {
  const { profile, updateProfile } = useAuthContext();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState('');
  const [selectedCoordination, setSelectedCoordination] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

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
        // Store the coordination in the preferred directorate field for now
        // This could be extended to a separate field in the future
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card className="border-primary/20">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
              {step === 1 ? (
                <User className="w-8 h-8 text-primary" />
              ) : (
                <Building2 className="w-8 h-8 text-primary" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {step === 1 ? 'Bem-vindo(a) ao CONSEJ!' : 'Sua Coordenadoria'}
            </CardTitle>
            <CardDescription>
              {step === 1
                ? 'Como você gostaria de ser chamado(a)?'
                : 'Selecione a coordenadoria onde você está alocado(a) atualmente'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress indicator */}
            <div className="flex justify-center gap-2 mb-4">
              <div
                className={`h-2 w-16 rounded-full transition-colors ${
                  step >= 1 ? 'bg-primary' : 'bg-muted'
                }`}
              />
              <div
                className={`h-2 w-16 rounded-full transition-colors ${
                  step >= 2 ? 'bg-primary' : 'bg-muted'
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
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: coord.color }}
                                />
                                {coord.name}
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
