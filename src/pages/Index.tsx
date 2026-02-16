import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Users, Building2, User, Shield, Briefcase } from 'lucide-react';
import { StatsOverview } from '@/components/StatsOverview';
import { MemberProfileResults } from '@/components/MemberProfileResults';
import { MembersSection } from '@/components/MembersSection';
import { CompanyOverview } from '@/components/CompanyOverview';
import { ClientsOverview } from '@/components/ClientsOverview';
import { LeadershipDialog } from '@/components/LeadershipDialog';
import { ReallocationDialog } from '@/components/ReallocationDialog';
import { WelcomeOnboarding } from '@/components/WelcomeOnboarding';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCycles } from '@/hooks/useCycles';
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

const Index = () => {
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { profile, isAdmin, roleLoading, refreshProfile } = useAuthContext();
  const { cycles, currentCycle } = useCycles();

  const [selectedQuarter, setSelectedQuarter] = useState(currentCycle?.value || '2026-C1');

  // Check if new user needs onboarding (no display_name set)
  const needsOnboarding = profile && !profile.display_name;

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

  const currentCycleLabel = cycles.find((c) => c.value === selectedQuarter)?.label || selectedQuarter;
  const cycleOptions = cycles.map((c) => ({ label: c.label, value: c.value }));

  const handleOnboardingComplete = async () => {
    await refreshProfile();
    setShowOnboarding(false);
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (needsOnboarding || showOnboarding) {
    return <WelcomeOnboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity shrink-0">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-accent">
                <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bold text-lg text-foreground">Alocações CONSEJ</h1>
                <p className="text-xs text-muted-foreground">Sistema de Gestão de Membros</p>
              </div>
            </Link>

            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto">
              <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                <SelectTrigger className="w-32 sm:w-52 shrink-0">
                  <SelectValue>
                    <span className="truncate">{currentCycleLabel}</span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {cycleOptions.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {isAdmin && (
                <>
                  <ReallocationDialog />
                  <LeadershipDialog />
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/admin')}
                    className="gap-2 hidden sm:flex"
                  >
                    <Shield className="w-4 h-4" />
                    <span className="hidden md:inline">Admin</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => navigate('/admin')}
                    className="sm:hidden"
                  >
                    <Shield className="w-4 h-4" />
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

          {/* Unified tabs for all users */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-secondary/50 w-full sm:w-auto overflow-x-auto flex-wrap justify-start">
              <TabsTrigger value="overview" className="gap-2">
                <Building2 className="w-4 h-4" />
                <span className="hidden sm:inline">Panorama</span>
              </TabsTrigger>
              <TabsTrigger value="my-profile" className="gap-2">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Pesquisa de Perfil</span>
              </TabsTrigger>
              <TabsTrigger value="consej" className="gap-2">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">CONSEJ</span>
              </TabsTrigger>
              <TabsTrigger value="clients" className="gap-2">
                <Briefcase className="w-4 h-4" />
                <span className="hidden sm:inline">Clientes</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <CompanyOverview />
            </TabsContent>

            <TabsContent value="my-profile" className="space-y-6">
              <MemberProfileResults />
            </TabsContent>

            <TabsContent value="consej" className="space-y-6">
              <MembersSection />
            </TabsContent>

            <TabsContent value="clients" className="space-y-6">
              <ClientsOverview />
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
};

export default Index;
