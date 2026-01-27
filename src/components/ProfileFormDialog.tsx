import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Sparkles, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { useAllocationStore } from '@/hooks/useAllocationStore';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { profileQuestions, coordinationMatchingProfile } from '@/data/mockData';
import { MemberProfile } from '@/types';

interface CoordinationMatch {
  coordinationId: string;
  score: number;
  coordinationName: string;
  color: string;
}

export const ProfileFormDialog = () => {
  const [open, setOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [matches, setMatches] = useState<CoordinationMatch[]>([]);

  const { members, coordinations, updateMember } = useAllocationStore();

  const currentQuestion = profileQuestions[currentStep];
  const progress = ((currentStep + 1) / profileQuestions.length) * 100;

  const calculateMatches = () => {
    const scores: Record<string, number> = {};

    // Initialize scores
    coordinations.forEach((coord) => {
      scores[coord.id] = 0;
    });

    // Calculate scores based on answers
    Object.entries(coordinationMatchingProfile).forEach(([coordId, profile]) => {
      // Skills match (q1)
      if (answers['q1'] && profile.skills.includes(answers['q1'])) {
        scores[coordId] += 25;
      }

      // Work style match (q2)
      if (answers['q2'] && profile.workStyle.includes(answers['q2'])) {
        scores[coordId] += 20;
      }

      // Activities match (q3)
      if (answers['q3'] && profile.activities.includes(answers['q3'])) {
        scores[coordId] += 25;
      }

      // Competencies match (q4)
      if (answers['q4'] && profile.competencies.includes(answers['q4'])) {
        scores[coordId] += 20;
      }

      // Directorate preference (q5)
      if (answers['q5']) {
        const coordination = coordinations.find((c) => c.id === coordId);
        if (coordination && coordination.directorateId === answers['q5']) {
          scores[coordId] += 10;
        }
      }
    });

    // Sort and get top matches
    const sortedMatches = Object.entries(scores)
      .map(([coordId, score]) => {
        const coord = coordinations.find((c) => c.id === coordId);
        return {
          coordinationId: coordId,
          score,
          coordinationName: coord?.name || '',
          color: coord?.color || '#888',
        };
      })
      .filter((match) => match.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    setMatches(sortedMatches);
    setShowResults(true);

    // Save profile to member
    if (selectedMemberId) {
      const profile: MemberProfile = {
        skills: answers['q1'] || '',
        workStyle: answers['q2'] || '',
        activities: answers['q3'] || '',
        competencies: answers['q4'] || '',
        preferredDirectorate: answers['q5'] || '',
      };
      updateMember(selectedMemberId, { profile });
    }
  };

  const handleNext = () => {
    if (currentStep < profileQuestions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      calculateMatches();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAnswer = (value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
  };

  const resetForm = () => {
    setCurrentStep(0);
    setAnswers({});
    setShowResults(false);
    setMatches([]);
    setSelectedMemberId('');
  };

  const handleClose = () => {
    setOpen(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleClose();
      else setOpen(true);
    }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <User className="w-4 h-4 mr-2" />
          Perfil de Alocação
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Perfil de Alocação
          </DialogTitle>
          <DialogDescription>
            Responda as perguntas para descobrir quais coordenadorias mais combinam com seu perfil.
          </DialogDescription>
        </DialogHeader>

        {!selectedMemberId ? (
          <div className="space-y-4 py-4">
            <Label>Selecione o membro</Label>
            <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha um membro" />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : !showResults ? (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Pergunta {currentStep + 1} de {profileQuestions.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <h3 className="font-medium text-lg">{currentQuestion.question}</h3>
                <RadioGroup
                  value={answers[currentQuestion.id] || ''}
                  onValueChange={handleAnswer}
                  className="space-y-3"
                >
                  {currentQuestion.options.map((option) => (
                    <div
                      key={option.value}
                      className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                        answers[currentQuestion.id] === option.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => handleAnswer(option.value)}
                    >
                      <RadioGroupItem value={option.value} id={option.value} />
                      <Label htmlFor={option.value} className="cursor-pointer flex-1">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>
              <Button
                onClick={handleNext}
                disabled={!answers[currentQuestion.id]}
              >
                {currentStep === profileQuestions.length - 1 ? (
                  <>
                    Ver Resultados
                    <Sparkles className="w-4 h-4 ml-1" />
                  </>
                ) : (
                  <>
                    Próxima
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 py-4"
          >
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Resultados do Perfil</h3>
              <p className="text-sm text-muted-foreground">
                Estas são as coordenadorias mais adequadas para o seu perfil:
              </p>
            </div>

            <div className="space-y-3">
              {matches.map((match, index) => (
                <motion.div
                  key={match.coordinationId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                >
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: match.color }}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{match.coordinationName}</p>
                  </div>
                  <Badge variant={index === 0 ? 'default' : 'secondary'}>
                    {match.score}% match
                  </Badge>
                </motion.div>
              ))}
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={resetForm} className="flex-1">
                Novo Perfil
              </Button>
              <Button onClick={handleClose} className="flex-1">
                Concluir
              </Button>
            </div>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
};
