import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ArrowLeft,
  Camera,
  Save,
  User,
  LogOut,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Check,
} from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageCropper } from '@/components/ImageCropper';
import { useToast } from '@/hooks/use-toast';
import { profileQuestions, coordinationMatchingProfile, coordinations } from '@/data/mockData';

interface CoordinationMatch {
  coordinationId: string;
  score: number;
  coordinationName: string;
  color: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const { profile, updateProfile, uploadAvatar, signOut, loading } = useAuthContext();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);

  // Allocation profile state
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [matches, setMatches] = useState<CoordinationMatch[]>([]);
  const [_hasFilledProfile, setHasFilledProfile] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      
      // Load saved allocation profile
      if (profile.profile_skills) {
        setAnswers({
          q1: profile.profile_skills || '',
          q2: profile.profile_work_style || '',
          q3: profile.profile_activities || '',
          q4: profile.profile_competencies || '',
          q5: profile.profile_preferred_directorate || '',
        });
        setHasFilledProfile(true);
      }
    }
  }, [profile]);

  const currentQuestion = profileQuestions[currentStep];
  const progress = ((currentStep + 1) / profileQuestions.length) * 100;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Formato inválido',
        description: 'Por favor, selecione uma imagem nos formatos: JPG, PNG, WebP ou GIF',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'A imagem deve ter no máximo 5MB',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    try {
      setSaving(true);
      const fileName = `avatar-${Date.now()}.jpg`;
      const { error } = await uploadAvatar(croppedBlob, fileName);

      if (error) throw error;

      toast({
        title: 'Foto atualizada!',
        description: 'Sua foto de perfil foi salva com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar foto',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
      setImageSrc(null);
    }
  };

  const handleSaveDisplayName = async () => {
    try {
      setSaving(true);
      const { error } = await updateProfile({ display_name: displayName });

      if (error) throw error;

      toast({
        title: 'Nome atualizado!',
        description: 'Seu nome de exibição foi salvo com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getInitials = () => {
    if (profile?.display_name) {
      return profile.display_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return profile?.email?.charAt(0).toUpperCase() || 'U';
  };

  // Allocation profile functions
  const calculateMatches = () => {
    const scores: Record<string, number> = {};

    coordinations.forEach((coord) => {
      scores[coord.id] = 0;
    });

    Object.entries(coordinationMatchingProfile).forEach(([coordId, profileData]) => {
      if (answers['q1'] && profileData.skills.includes(answers['q1'])) {
        scores[coordId] += 25;
      }
      if (answers['q2'] && profileData.workStyle.includes(answers['q2'])) {
        scores[coordId] += 20;
      }
      if (answers['q3'] && profileData.activities.includes(answers['q3'])) {
        scores[coordId] += 25;
      }
      if (answers['q4'] && profileData.competencies.includes(answers['q4'])) {
        scores[coordId] += 20;
      }
      if (answers['q5']) {
        const coordination = coordinations.find((c) => c.id === coordId);
        if (coordination && coordination.directorateId === answers['q5']) {
          scores[coordId] += 10;
        }
      }
    });

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
    setHasFilledProfile(true);
  };

  const handleNext = () => {
    if (currentStep < profileQuestions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      calculateMatches();
      saveAllocationProfile();
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

  const saveAllocationProfile = async () => {
    try {
      await updateProfile({
        profile_skills: answers['q1'] || null,
        profile_work_style: answers['q2'] || null,
        profile_activities: answers['q3'] || null,
        profile_competencies: answers['q4'] || null,
        profile_preferred_directorate: answers['q5'] || null,
      });
    } catch (error) {
      console.error('Error saving allocation profile:', error);
    }
  };

  const resetAllocationProfile = () => {
    setCurrentStep(0);
    setShowResults(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-accent">
                <LayoutDashboard className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-foreground">Meu Perfil</h1>
                <p className="text-xs text-muted-foreground">{profile?.email}</p>
              </div>
            </div>

            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="bg-secondary/50">
              <TabsTrigger value="profile" className="gap-2">
                <User className="w-4 h-4" />
                Dados Pessoais
              </TabsTrigger>
              <TabsTrigger value="allocation" className="gap-2">
                <Sparkles className="w-4 h-4" />
                Perfil de Alocação
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Dados Pessoais</CardTitle>
                  <CardDescription>
                    Atualize suas informações de perfil
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar Section */}
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-32 w-32 border-4 border-primary/20">
                        <AvatarImage src={profile?.avatar_url || undefined} />
                        <AvatarFallback className="text-3xl bg-primary/10">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <Button
                        size="icon"
                        className="absolute bottom-0 right-0 rounded-full h-10 w-10"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={saving}
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Clique no ícone para alterar sua foto
                    </p>
                  </div>

                  {/* Display Name */}
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Nome de Exibição</Label>
                    <div className="flex gap-2">
                      <Input
                        id="displayName"
                        placeholder="Como você quer ser chamado"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                      />
                      <Button
                        onClick={handleSaveDisplayName}
                        disabled={saving || !displayName.trim()}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Salvar
                      </Button>
                    </div>
                  </div>

                  {/* Email (read-only) */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={profile?.email || ''}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      O email não pode ser alterado
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="allocation">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Perfil de Alocação
                  </CardTitle>
                  <CardDescription>
                    Responda as perguntas para descobrir quais coordenadorias mais combinam com seu perfil.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!showResults ? (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>
                            Pergunta {currentStep + 1} de {profileQuestions.length}
                          </span>
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
                      className="space-y-6"
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

                      <div className="flex justify-center pt-4">
                        <Button variant="outline" onClick={resetAllocationProfile}>
                          Refazer Perfil
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      {/* Image Cropper Modal */}
      {imageSrc && (
        <ImageCropper
          imageSrc={imageSrc}
          open={showCropper}
          onClose={() => {
            setShowCropper(false);
            setImageSrc(null);
          }}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
};

export default Profile;
