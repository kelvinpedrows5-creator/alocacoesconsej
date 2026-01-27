import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Building2,
  Settings,
  ArrowLeft,
  FileText,
  Shield,
  Search,
  Eye,
} from 'lucide-react';
import { useAllocationStore } from '@/hooks/useAllocationStore';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { StatsOverview } from '@/components/StatsOverview';
import { MemberCard } from '@/components/MemberCard';
import { MemberHistoryModal } from '@/components/MemberHistoryModal';
import { SuggestionsPanel } from '@/components/SuggestionsPanel';
import { CoordinationGridFiltered } from '@/components/CoordinationGridFiltered';
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
import { quarters, profileQuestions, directorates } from '@/data/mockData';
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
  created_at: string;
  updated_at: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const { members, selectedQuarter, setSelectedQuarter } = useAllocationStore();
  const { profile } = useAuthContext();

  const [allProfiles, setAllProfiles] = useState<ProfileData[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    fetchAllProfiles();
  }, []);

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
              <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {quarters.map((q) => (
                    <SelectItem key={q.value} value={q.value}>
                      {q.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          <Tabs defaultValue="suggestions" className="space-y-6">
            <TabsList className="bg-secondary/50">
              <TabsTrigger value="suggestions" className="gap-2">
                <LayoutDashboard className="w-4 h-4" />
                Sugestões
              </TabsTrigger>
              <TabsTrigger value="members" className="gap-2">
                <Users className="w-4 h-4" />
                Membros
              </TabsTrigger>
              <TabsTrigger value="coordinations" className="gap-2">
                <Building2 className="w-4 h-4" />
                Coordenadorias
              </TabsTrigger>
              <TabsTrigger value="profiles" className="gap-2">
                <FileText className="w-4 h-4" />
                Pesquisas ({profilesWithResponses.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="suggestions" className="space-y-6">
              <SuggestionsPanel />
              <CoordinationGridFiltered />
            </TabsContent>

            <TabsContent value="members">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {members.map((member) => (
                  <MemberCard
                    key={member.id}
                    memberId={member.id}
                    onViewHistory={setSelectedMemberId}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="coordinations">
              <CoordinationGridFiltered />
            </TabsContent>

            <TabsContent value="profiles">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Respostas das Pesquisas de Perfil
                  </CardTitle>
                  <CardDescription>
                    Visualize as respostas do questionário de alocação de cada membro
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
        <DialogContent className="max-w-lg">
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
            <DialogDescription>Respostas do questionário de alocação</DialogDescription>
          </DialogHeader>
          {selectedProfile && (
            <div className="space-y-4 mt-4">
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-xs text-muted-foreground mb-1">Habilidades de Interesse</p>
                  <p className="font-medium">{getAnswerLabel('q1', selectedProfile.profile_skills)}</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-xs text-muted-foreground mb-1">Estilo de Trabalho</p>
                  <p className="font-medium">{getAnswerLabel('q2', selectedProfile.profile_work_style)}</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-xs text-muted-foreground mb-1">Atividade que Motiva</p>
                  <p className="font-medium">{getAnswerLabel('q3', selectedProfile.profile_activities)}</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-xs text-muted-foreground mb-1">Competência a Desenvolver</p>
                  <p className="font-medium">{getAnswerLabel('q4', selectedProfile.profile_competencies)}</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50">
                  <p className="text-xs text-muted-foreground mb-1">Diretoria de Preferência</p>
                  <p className="font-medium">{getDirectorateName(selectedProfile.profile_preferred_directorate)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
