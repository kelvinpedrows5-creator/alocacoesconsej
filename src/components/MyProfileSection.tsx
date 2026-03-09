import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Save,
  User,
  LogOut,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Check,
  Building2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageCropper } from '@/components/ImageCropper';
import { useToast } from '@/hooks/use-toast';
import { profileQuestions, coordinationMatchingProfile, coordinations, directorates } from '@/data/mockData';
import { useCycles } from '@/hooks/useCycles';
import { supabase } from '@/integrations/supabase/client';

interface CoordinationMatch {
  coordinationId: string;
  score: number;
  coordinationName: string;
  color: string;
}

function CoordinationSelector() {
  const { profile } = useAuthContext();
  const { currentCycle } = useCycles();
  const { toast } = useToast();
  const [selectedCoord, setSelectedCoord] = useState('');
  const [saving, setSaving] = useState(false);
  const [currentAllocation, setCurrentAllocation] = useState<string | null>(null);

  const groupedCoordinations = directorates.map((dir) => ({
    ...dir,
    coordinations: coordinations.filter((c) => c.directorateId === dir.id),
  }));

  useEffect(() => {
    const loadAllocation = async () => {
      if (!profile?.user_id || !currentCycle) return;
      const { data } = await supabase
        .from('member_allocations')
        .select('coordination_id')
        .eq('user_id', profile.user_id)
        .eq('cycle_id', currentCycle.id)
        .maybeSingle();
      if (data) {
        setCurrentAllocation(data.coordination_id);
        setSelectedCoord(data.coordination_id);
      }
    };
    loadAllocation();
  }, [profile?.user_id, currentCycle]);

  const handleSave = async () => {
    if (!selectedCoord || !profile?.user_id || !currentCycle) return;
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('member_allocations')
        .select('id')
        .eq('user_id', profile.user_id)
        .eq('cycle_id', currentCycle.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('member_allocations')
          .update({ coordination_id: selectedCoord })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('member_allocations')
          .insert({
            user_id: profile.user_id,
            cycle_id: currentCycle.id,
            coordination_id: selectedCoord,
          });
        if (error) throw error;
      }

      setCurrentAllocation(selectedCoord);
      toast({ title: 'Coordenadoria atualizada!', description: 'Sua alocação foi salva com sucesso.' });
    } catch (error: any) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const currentCoordName = coordinations.find(c => c.id === currentAllocation)?.name;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          Minha Coordenadoria
        </CardTitle>
        <CardDescription>
          {currentCoordName
            ? `Você está alocado(a) em: ${currentCoordName}`
            : 'Informe em qual coordenadoria você está alocado(a) neste ciclo'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Coordenadoria ({currentCycle?.label || 'ciclo atual'})</Label>
          <Select value={selectedCoord} onValueChange={setSelectedCoord}>
            <SelectTrigger>
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
                        <span>{coord.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || !selectedCoord}
          className="w-full"
        >
          <Save className="w-4 h-4 mr-2" />
          {currentAllocation ? 'Atualizar Coordenadoria' : 'Salvar Coordenadoria'}
        </Button>
      </CardContent>
    </Card>
  );
}

export function MyProfileSection() {
  const navigate = useNavigate();
  const { profile, updateProfile, uploadAvatar, signOut, loading } = useAuthContext();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [matches, setMatches] = useState<CoordinationMatch[]>([]);
  const [_hasFilledProfile, setHasFilledProfile] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      const savedAnswers: Record<string, string> = {};
      if (profile.profile_skills) savedAnswers.q1 = profile.profile_skills;
      if (profile.profile_work_style) savedAnswers.q2 = profile.profile_work_style;
      if (profile.profile_activities) savedAnswers.q3 = profile.profile_activities;
      if (profile.profile_competencies) savedAnswers.q4 = profile.profile_competencies;
      if (profile.profile_preferred_directorate) savedAnswers.q5 = profile.profile_preferred_directorate;
      if ((profile as any).profile_communication_style) savedAnswers.q6 = (profile as any).profile_communication_style;
      if ((profile as any).profile_problem_solving) savedAnswers.q7 = (profile as any).profile_problem_solving;
      if ((profile as any).profile_time_management) savedAnswers.q8 = (profile as any).profile_time_management;
      if ((profile as any).profile_team_role) savedAnswers.q9 = (profile as any).profile_team_role;
      if ((profile as any).profile_learning_style) savedAnswers.q10 = (profile as any).profile_learning_style;
      if ((profile as any).profile_stress_handling) savedAnswers.q11 = (profile as any).profile_stress_handling;
      if ((profile as any).profile_leadership_style) savedAnswers.q12 = (profile as any).profile_leadership_style;
      if ((profile as any).profile_feedback_preference) savedAnswers.q13 = (profile as any).profile_feedback_preference;
      if ((profile as any).profile_project_type) savedAnswers.q14 = (profile as any).profile_project_type;
      if ((profile as any).profile_collaboration_tools) savedAnswers.q15 = (profile as any).profile_collaboration_tools;
      if (Object.keys(savedAnswers).length > 0) {
        setAnswers(savedAnswers);
        setHasFilledProfile(true);
      }
    }
  }, [profile]);

  const currentQuestion = profileQuestions[currentStep];
  const progress = ((currentStep + 1) / profileQuestions.length) * 100;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast({ title: 'Formato inválido', description: 'Por favor, selecione uma imagem nos formatos: JPG, PNG, WebP ou GIF', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Arquivo muito grande', description: 'A imagem deve ter no máximo 5MB', variant: 'destructive' });
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
      toast({ title: 'Foto atualizada!', description: 'Sua foto de perfil foi salva com sucesso.' });
    } catch (error: any) {
      toast({ title: 'Erro ao salvar foto', description: error.message, variant: 'destructive' });
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
      toast({ title: 'Nome atualizado!', description: 'Seu nome de exibição foi salvo com sucesso.' });
    } catch (error: any) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
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
      return profile.display_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return profile?.email?.charAt(0).toUpperCase() || 'U';
  };

  const calculateMatches = () => {
    const scores: Record<string, number> = {};
    coordinations.forEach((coord) => { scores[coord.id] = 0; });
    Object.entries(coordinationMatchingProfile).forEach(([coordId, profileData]) => {
      if (answers['q1'] && profileData.skills.includes(answers['q1'])) scores[coordId] += 15;
      if (answers['q2'] && profileData.workStyle.includes(answers['q2'])) scores[coordId] += 15;
      if (answers['q3'] && profileData.activities.includes(answers['q3'])) scores[coordId] += 15;
      if (answers['q4'] && profileData.competencies.includes(answers['q4'])) scores[coordId] += 15;
      if (answers['q5']) {
        const coordination = coordinations.find((c) => c.id === coordId);
        if (coordination && coordination.directorateId === answers['q5']) scores[coordId] += 10;
      }
      const bonusQuestions = ['q6', 'q7', 'q8', 'q9', 'q10', 'q11', 'q12', 'q13', 'q14', 'q15'];
      bonusQuestions.forEach((qId) => { if (answers[qId]) scores[coordId] += 3; });
    });
    const sortedMatches = Object.entries(scores)
      .map(([coordId, score]) => {
        const coord = coordinations.find((c) => c.id === coordId);
        return { coordinationId: coordId, score: Math.min(score, 100), coordinationName: coord?.name || '', color: coord?.color || '#888' };
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
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleAnswer = (value: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
  };

  const saveAllocationProfile = async () => {
    try {
      await updateProfile({
        profile_skills: answers['q1'] || null,
        profile_work_style: answers['q2'] || null,
        profile_activities: answers['q3'] || null,
        profile_competencies: answers['q4'] || null,
        profile_preferred_directorate: answers['q5'] || null,
        profile_communication_style: answers['q6'] || null,
        profile_problem_solving: answers['q7'] || null,
        profile_time_management: answers['q8'] || null,
        profile_team_role: answers['q9'] || null,
        profile_learning_style: answers['q10'] || null,
        profile_stress_handling: answers['q11'] || null,
        profile_leadership_style: answers['q12'] || null,
        profile_feedback_preference: answers['q13'] || null,
        profile_project_type: answers['q14'] || null,
        profile_collaboration_tools: answers['q15'] || null,
      } as any);
      toast({ title: 'Perfil salvo!', description: 'Suas respostas foram salvas com sucesso.' });
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
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            Meu Perfil
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Gerencie suas informações pessoais e perfil de alocação
          </p>
        </div>
        <Button variant="outline" onClick={handleSignOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-4 h-4" />
            Dados Pessoais
          </TabsTrigger>
          <TabsTrigger value="allocation" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Pesquisa de Perfil
          </TabsTrigger>
          <TabsTrigger value="coordination" className="gap-2">
            <Building2 className="w-4 h-4" />
            Minha Coordenadoria
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Dados Pessoais</CardTitle>
              <CardDescription>Atualize suas informações de perfil</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Avatar className="h-32 w-32 border-4 border-primary/20">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-3xl bg-primary/10">{getInitials()}</AvatarFallback>
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
                <p className="text-sm text-muted-foreground">Clique no ícone para alterar sua foto</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName">Nome de Exibição</Label>
                <div className="flex gap-2">
                  <Input
                    id="displayName"
                    placeholder="Como você quer ser chamado"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                  <Button onClick={handleSaveDisplayName} disabled={saving || !displayName.trim()}>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={profile?.email || ''} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">O email não pode ser alterado</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allocation">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Pesquisa de Perfil
              </CardTitle>
              <CardDescription>
                Responda as 15 perguntas para descobrir quais coordenadorias mais combinam com seu perfil.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!showResults ? (
                <div className="space-y-6">
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
                            <RadioGroupItem value={option.value} id={`profile-${option.value}`} />
                            <Label htmlFor={`profile-${option.value}`} className="cursor-pointer flex-1">
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </motion.div>
                  </AnimatePresence>
                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 0}>
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Anterior
                    </Button>
                    <Button onClick={handleNext} disabled={!answers[currentQuestion.id]}>
                      {currentStep === profileQuestions.length - 1 ? (
                        <>Ver Resultados <Sparkles className="w-4 h-4 ml-1" /></>
                      ) : (
                        <>Próxima <ChevronRight className="w-4 h-4 ml-1" /></>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
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
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: match.color }} />
                        <div className="flex-1"><p className="font-medium">{match.coordinationName}</p></div>
                        <Badge variant={index === 0 ? 'default' : 'secondary'}>{match.score}% match</Badge>
                      </motion.div>
                    ))}
                  </div>
                  <div className="flex justify-center pt-4">
                    <Button variant="outline" onClick={resetAllocationProfile}>Refazer Perfil</Button>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coordination">
          <CoordinationSelector />
        </TabsContent>
      </Tabs>

      {imageSrc && (
        <ImageCropper
          imageSrc={imageSrc}
          open={showCropper}
          onClose={() => { setShowCropper(false); setImageSrc(null); }}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
}
