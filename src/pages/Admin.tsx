import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Building2,
  ArrowLeft,
  FileText,
  Shield,
  Search,
  Eye,
  UserCog,
  Calendar,
  Crown,
  Briefcase,
} from 'lucide-react';
import { useAllocationStore } from '@/hooks/useAllocationStore';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCycles } from '@/hooks/useCycles';
import { supabase } from '@/integrations/supabase/client';
import { StatsOverview } from '@/components/StatsOverview';
import { MemberCard } from '@/components/MemberCard';
import { MemberHistoryModal } from '@/components/MemberHistoryModal';
import { SuggestionsPanel } from '@/components/SuggestionsPanel';
import { CoordinationGridFiltered } from '@/components/CoordinationGridFiltered';
import { AdminMembersManagement } from '@/components/AdminMembersManagement';
import { CyclesManagement } from '@/components/admin/CyclesManagement';
import { LeadershipManagement } from '@/components/admin/LeadershipManagement';
import { AllocationManagement } from '@/components/admin/AllocationManagement';
import { GTManagement } from '@/components/admin/GTManagement';
import { AddMemberDialog } from '@/components/AddMemberDialog';
import { ReallocationDialog } from '@/components/ReallocationDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { profileQuestions, directorates } from '@/data/mockData';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ProfileData {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  profile_skills: string | null;
  profile_work_style: string | null;
  profile_activities: string | null;
  profile_competencies: string | null;
  profile_preferred_directorate: string | null;
  profile_communication_style: string | null;
  profile_problem_solving: string | null;
  profile_time_management: string | null;
  profile_team_role: string | null;
  profile_learning_style: string | null;
  profile_stress_handling: string | null;
  profile_leadership_style: string | null;
  profile_feedback_preference: string | null;
  profile_project_type: string | null;
  profile_collaboration_tools: string | null;
  created_at: string;
  updated_at: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const { members, selectedQuarter, setSelectedQuarter } = useAllocationStore();
  const { profile } = useAuthContext();
  const { cycles, loading: loadingCycles } = useCycles();

  const [allProfiles, setAllProfiles] = useState<ProfileData[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    fetchAllProfiles();
  }, []);

  // Set selected quarter when cycles load
  useEffect(() => {
    if (cycles.length > 0 && !selectedQuarter) {
      const currentCycle = cycles.find((c) => c.is_current);
      if (currentCycle) {
        setSelectedQuarter(currentCycle.value);
      }
    }
  }, [cycles, selectedQuarter, setSelectedQuarter]);

  const fetchAllProfiles = async () => {
    try {
      setLoadingProfiles(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoadingProfiles(false);
    }
  };

  const getInitials = (displayName: string | null, email: string) => {
    if (displayName) {
      return displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email.charAt(0).toUpperCase();
  };

  const filteredProfiles = allProfiles.filter(
    (p) =>
      p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.display_name && p.display_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getAnswerLabel = (questionId: string, value: string | null) => {
    if (!value) return 'Não respondido';
    const question = profileQuestions.find((q) => q.id === questionId);
    const option = question?.options.find((o) => o.value === value);
    return option?.label || value;
  };

  const getDirectorateName = (dirId: string | null) => {
    if (!dirId) return 'Não respondido';
    const dir = directorates.find((d) => d.id === dirId);
    return dir?.name || dirId;
  };

  const profilesWithResponses = allProfiles.filter(
    (p) => p.profile_skills || p.profile_work_style || p.profile_activities
  );

  const getProfileAnswers = (profileData: ProfileData) => {
    return [
      { id: 'q1', label: 'Habilidades de Interesse', value: profileData.profile_skills },
      { id: 'q2', label: 'Estilo de Trabalho', value: profileData.profile_work_style },
      { id: 'q3', label: 'Atividade que Motiva', value: profileData.profile_activities },
      { id: 'q4', label: 'Competência a Desenvolver', value: profileData.profile_competencies },
      { id: 'q5', label: 'Diretoria de Preferência', value: profileData.profile_preferred_directorate, isDirectorate: true },
      { id: 'q6', label: 'Estilo de Comunicação', value: profileData.profile_communication_style },
      { id: 'q7', label: 'Resolução de Problemas', value: profileData.profile_problem_solving },
      { id: 'q8', label: 'Gestão de Tempo', value: profileData.profile_time_management },
      { id: 'q9', label: 'Papel em Equipes', value: profileData.profile_team_role },
      { id: 'q10', label: 'Estilo de Aprendizagem', value: profileData.profile_learning_style },
      { id: 'q11', label: 'Lidando com Pressão', value: profileData.profile_stress_handling },
      { id: 'q12', label: 'Estilo de Liderança', value: profileData.profile_leadership_style },
      { id: 'q13', label: 'Preferência de Feedback', value: profileData.profile_feedback_preference },
      { id: 'q14', label: 'Tipo de Projeto', value: profileData.profile_project_type },
      { id: 'q15', label: 'Ferramentas de Colaboração', value: profileData.profile_collaboration_tools },
    ];
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-accent">
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-foreground">Painel Administrativo</h1>
                <p className="text-xs text-muted-foreground">Alocações CONSEJ</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {cycles.length > 0 && (
                <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                  <SelectTrigger className="w-52">
                    <SelectValue>
                      {cycles.find((c) => c.value === selectedQuarter)?.label || selectedQuarter}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {cycles.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        <span className="flex items-center gap-2">
                          {c.label}
                          {c.is_current && (
                            <Badge variant="secondary" className="text-xs">Atual</Badge>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <ReallocationDialog />
              <AddMemberDialog />
              <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate('/profile')}>
                <Avatar className="h-9 w-9">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {getInitials(profile?.display_name || null, profile?.email || '')}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Stats */}
          <StatsOverview />

          {/* Tabs for different views */}
          <Tabs defaultValue="allocations" className="space-y-6">
            <TabsList className="bg-secondary/50 flex-wrap h-auto gap-1">
              <TabsTrigger value="allocations" className="gap-2">
                <Users className="w-4 h-4" />
                Alocações
              </TabsTrigger>
              <TabsTrigger value="cycles" className="gap-2">
                <Calendar className="w-4 h-4" />
                Ciclos
              </TabsTrigger>
              <TabsTrigger value="leadership" className="gap-2">
                <Crown className="w-4 h-4" />
                Lideranças
              </TabsTrigger>
              <TabsTrigger value="suggestions" className="gap-2">
                <LayoutDashboard className="w-4 h-4" />
                Sugestões
              </TabsTrigger>
              <TabsTrigger value="coordinations" className="gap-2">
                <Building2 className="w-4 h-4" />
                Coordenadorias
              </TabsTrigger>
              <TabsTrigger value="gts" className="gap-2">
                <Briefcase className="w-4 h-4" />
                Grupos de Trabalho
              </TabsTrigger>
              <TabsTrigger value="profiles" className="gap-2">
                <FileText className="w-4 h-4" />
                Pesquisas ({profilesWithResponses.length})
              </TabsTrigger>
              <TabsTrigger value="management" className="gap-2">
                <UserCog className="w-4 h-4" />
                Gerenciar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="allocations" className="space-y-6">
              <AllocationManagement />
            </TabsContent>

            <TabsContent value="cycles" className="space-y-6">
              <CyclesManagement />
            </TabsContent>

            <TabsContent value="leadership" className="space-y-6">
              <LeadershipManagement />
            </TabsContent>

            <TabsContent value="suggestions" className="space-y-6">
              <SuggestionsPanel />
              <CoordinationGridFiltered />
            </TabsContent>

            <TabsContent value="coordinations">
              <CoordinationGridFiltered />
            </TabsContent>

            <TabsContent value="gts">
              <GTManagement />
            </TabsContent>

            <TabsContent value="profiles">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Respostas das Pesquisas de Perfil
                  </CardTitle>
                  <CardDescription>
                    Visualize as respostas do questionário de alocação de cada membro (15 perguntas)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por nome ou email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  {loadingProfiles ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <ScrollArea className="h-[500px]">
                      <div className="space-y-3">
                        {filteredProfiles.map((profileItem) => {
                          const hasResponses =
                            profileItem.profile_skills ||
                            profileItem.profile_work_style ||
                            profileItem.profile_activities;

                          return (
                            <motion.div
                              key={profileItem.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex items-center justify-between p-4 rounded-lg border hover:border-primary/30 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={profileItem.avatar_url || undefined} />
                                  <AvatarFallback className="bg-primary/10 text-primary">
                                    {getInitials(profileItem.display_name, profileItem.email)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-foreground">
                                    {profileItem.display_name || profileItem.email}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {profileItem.email}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={hasResponses ? 'default' : 'secondary'}>
                                  {hasResponses ? 'Respondido' : 'Pendente'}
                                </Badge>
                                {hasResponses && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setSelectedProfile(profileItem)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="management">
              <AdminMembersManagement />
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      {/* History Modal */}
      <AnimatePresence>
        {selectedMemberId && (
          <MemberHistoryModal
            memberId={selectedMemberId}
            onClose={() => setSelectedMemberId(null)}
          />
        )}
      </AnimatePresence>

      {/* Profile Details Modal */}
      <Dialog open={!!selectedProfile} onOpenChange={() => setSelectedProfile(null)}>
        <DialogContent className="max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedProfile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {selectedProfile && getInitials(selectedProfile.display_name, selectedProfile.email)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p>{selectedProfile?.display_name || selectedProfile?.email}</p>
                <p className="text-sm font-normal text-muted-foreground">{selectedProfile?.email}</p>
              </div>
            </DialogTitle>
            <DialogDescription>Respostas do questionário de alocação (15 perguntas)</DialogDescription>
          </DialogHeader>
          {selectedProfile && (
            <ScrollArea className="max-h-[50vh]">
              <div className="space-y-3 pr-4">
                {getProfileAnswers(selectedProfile).map((answer) => (
                  <div key={answer.id} className="p-3 rounded-lg bg-secondary/50">
                    <p className="text-xs text-muted-foreground mb-1">{answer.label}</p>
                    <p className="font-medium">
                      {answer.isDirectorate 
                        ? getDirectorateName(answer.value)
                        : getAnswerLabel(answer.id, answer.value)
                      }
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
