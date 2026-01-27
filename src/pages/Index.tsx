import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Users, Building2, User, Shield } from 'lucide-react';
import { StatsOverview } from '@/components/StatsOverview';
import { MemberCard } from '@/components/MemberCard';
import { MemberHistoryModal } from '@/components/MemberHistoryModal';
import { SuggestionsPanel } from '@/components/SuggestionsPanel';
import { CoordinationGridFiltered } from '@/components/CoordinationGridFiltered';
import { MemberProfileResults } from '@/components/MemberProfileResults';
import { AddMemberDialog } from '@/components/AddMemberDialog';
import { ReallocationDialog } from '@/components/ReallocationDialog';
import { useAllocationStore } from '@/hooks/useAllocationStore';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { quarters } from '@/data/mockData';

const Index = () => {
  const navigate = useNavigate();
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const { members, selectedQuarter, setSelectedQuarter } = useAllocationStore();
  const { profile, isAdmin, roleLoading } = useAuthContext();

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

  if (roleLoading) {
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-accent">
                <LayoutDashboard className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-foreground">Alocações CONSEJ</h1>
                <p className="text-xs text-muted-foreground">Sistema de Gestão de Membros</p>
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
              
              {isAdmin && (
                <>
                  <ReallocationDialog />
                  <AddMemberDialog />
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/admin')}
                    className="gap-2"
                  >
                    <Shield className="w-4 h-4" />
                    Admin
                  </Button>
                </>
              )}
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full"
                onClick={() => navigate('/profile')}
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {getInitials()}
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
          <Tabs defaultValue={isAdmin ? "suggestions" : "overview"} className="space-y-6">
            <TabsList className="bg-secondary/50">
              {isAdmin ? (
                <>
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
                </>
              ) : (
                <>
                  <TabsTrigger value="overview" className="gap-2">
                    <Building2 className="w-4 h-4" />
                    Panorama
                  </TabsTrigger>
                  <TabsTrigger value="my-profile" className="gap-2">
                    <User className="w-4 h-4" />
                    Meu Perfil de Alocação
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            {isAdmin ? (
              <>
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
              </>
            ) : (
              <>
                <TabsContent value="overview" className="space-y-6">
                  <CoordinationGridFiltered showMemberPhotos={true} />
                </TabsContent>

                <TabsContent value="my-profile" className="space-y-6">
                  <MemberProfileResults />
                </TabsContent>
              </>
            )}
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
    </div>
  );
};

export default Index;
