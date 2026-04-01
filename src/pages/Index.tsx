import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import logo from '@/assets/logo.png';
import { StatsOverview } from '@/components/StatsOverview';
import { MyProfileSection, CoordinationSelector } from '@/components/MyProfileSection';
import { MembersSection } from '@/components/MembersSection';
import { CompanyOverview } from '@/components/CompanyOverview';
import { ClientsOverview } from '@/components/ClientsOverview';
import { LeadershipDialog } from '@/components/LeadershipDialog';
import { ReallocationDialog } from '@/components/ReallocationDialog';
import { WelcomeOnboarding } from '@/components/WelcomeOnboarding';
import { AppSidebar } from '@/components/AppSidebar';
import { DemandsControl } from '@/components/admin/DemandsControl';
import { MemberDemandSubmission } from '@/components/MemberDemandSubmission';
import { MemberBusinessOpportunity } from '@/components/MemberBusinessOpportunity';
import { BusinessOpportunitiesManagement } from '@/components/admin/BusinessOpportunitiesManagement';
import { MyClientsOverview } from '@/components/MyClientsOverview';
import { ManagerClientsView } from '@/components/admin/ManagerClientsView';
import { HelpCenter } from '@/components/HelpCenter';
import { HandoffSurveySection } from '@/components/HandoffSurveySection';
import { useAuthContext } from '@/contexts/AuthContext';
import { useLeadership } from '@/hooks/useLeadership';
import { useCycles } from '@/hooks/useCycles';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
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
  const { profile, isAdmin, roleLoading, refreshProfile, user } = useAuthContext();
  const { positions } = useLeadership();
  const isDemandasManager = user
    ? positions.some(p => p.user_id === user.id && p.directorate_id === 'dir-1' && p.position_type === 'manager')
    : false;
  const { cycles, currentCycle } = useCycles();
  const [activeTab, setActiveTab] = useState('overview');

  const [selectedQuarter, setSelectedQuarter] = useState(currentCycle?.value || '');

  useEffect(() => {
    if (currentCycle?.value && !selectedQuarter) {
      setSelectedQuarter(currentCycle.value);
    }
  }, [currentCycle?.value]);

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

  const handleTabChange = (tab: string) => {
    if (tab === 'admin') {
      navigate('/admin');
    } else {
      setActiveTab(tab);
    }
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

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <CompanyOverview />;
      case 'my-profile':
        return <MyProfileSection />;
      case 'consej':
        return <MembersSection />;
      case 'clients':
        return <ClientsOverview />;
      case 'demands':
        return <DemandsControl />;
      case 'my-demands':
        return <MemberDemandSubmission />;
      case 'my-clients':
        return isDemandasManager ? <ManagerClientsView /> : <MyClientsOverview />;
      case 'my-coordination':
        return <CoordinationSelector />;
      case 'my-opportunities':
        return <MemberBusinessOpportunity />;
      case 'opportunities-management':
        return <BusinessOpportunitiesManagement />;
      case 'help-center':
        return <HelpCenter />;
      case 'handoff-survey':
        return <HandoffSurveySection />;
      default:
        return <CompanyOverview />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar activeTab={activeTab} onTabChange={handleTabChange} />

        <div className="flex-1 flex flex-col min-h-screen">
          {/* Header */}
          <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16 gap-2">
                <div className="flex items-center gap-2">
                  <SidebarTrigger />
                  <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity shrink-0">
                    <img src={logo} alt="CONSEJ Logo" className="w-9 h-9 sm:w-10 sm:h-10 object-contain" />
                    <div className="hidden sm:block">
                      <h1 className="font-bold text-lg text-foreground">Alocações CONSEJ</h1>
                      <p className="text-xs text-muted-foreground">Sistema de Gestão de Membros</p>
                    </div>
                  </Link>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
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
                    </>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={() => setActiveTab('my-profile')}
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
          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {activeTab === 'overview' && <StatsOverview />}
              {activeTab === 'clients' && <StatsOverview variant="clients-only" />}
              {renderContent()}
            </motion.div>
          </main>

          {/* Footer */}
          <footer className="border-t border-border py-4 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center">
              <span className="text-xs text-muted-foreground tracking-wide">
                Developed by Kelvin Watson — 2026
              </span>
            </div>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
