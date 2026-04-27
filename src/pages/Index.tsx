import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
import { QuickActionsFab } from '@/components/QuickActionsFab';
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

const SECTION_META: Record<string, { eyebrow: string; title: string }> = {
  overview: { eyebrow: 'Vista Geral', title: 'Panorama' },
  'my-profile': { eyebrow: 'Pessoal', title: 'Meu Perfil' },
  'my-coordination': { eyebrow: 'Pessoal', title: 'Minha Coordenadoria' },
  consej: { eyebrow: 'Comunidade', title: 'Membros CONSEJ' },
  clients: { eyebrow: 'Operação', title: 'Portfólio de Clientes' },
  'my-clients': { eyebrow: 'Operação', title: 'Meus Clientes' },
  demands: { eyebrow: 'Gestão', title: 'Controle de Demandas' },
  'my-demands': { eyebrow: 'Atividades', title: 'Minhas Demandas' },
  'my-opportunities': { eyebrow: 'Atividades', title: 'Oportunidades de Negócio' },
  'opportunities-management': { eyebrow: 'Negócios', title: 'Gestão de Oportunidades' },
  'help-center': { eyebrow: 'Suporte', title: 'Central de Ajuda' },
  'handoff-survey': { eyebrow: 'Atividades', title: 'Passagem de Bastão' },
};

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

  const [selectedQuarter, setSelectedQuarter] = useState<string>('');

  useEffect(() => {
    if (currentCycle?.value) {
      setSelectedQuarter(prev => prev || currentCycle.value);
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

  const sectionMeta = SECTION_META[activeTab] ?? SECTION_META.overview;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background relative overflow-hidden">
        {/* Mesh gradient ambient — fixo no fundo */}
        <div className="pointer-events-none fixed inset-0 bg-mesh -z-10" />
        <div className="pointer-events-none fixed inset-0 bg-noise -z-10" />

        <AppSidebar activeTab={activeTab} onTabChange={handleTabChange} />

        <div className="flex-1 flex flex-col min-h-screen min-w-0">
          {/* Header editorial */}
          <header className="sticky top-0 z-40 glass-card-strong border-b border-border/60">
            <div className="px-4 sm:px-6 lg:px-10">
              <div className="flex items-center justify-between h-16 gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <SidebarTrigger className="shrink-0" />
                  <button
                    onClick={() => setActiveTab('overview')}
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity shrink-0"
                  >
                    <img src={logo} alt="CONSEJ" className="w-9 h-9 object-contain" />
                    <div className="hidden md:flex flex-col text-left leading-tight">
                      <span className="font-display font-bold text-xl text-foreground tracking-tight">
                        Gestão CONSEJ
                      </span>
                    </div>
                  </button>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  {selectedQuarter && cycleOptions.length > 0 && (
                    <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                      <SelectTrigger className="w-32 sm:w-52 shrink-0 font-mono text-xs uppercase tracking-wider">
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
                  )}

                  {isAdmin && (
                    <div className="hidden sm:flex items-center gap-2">
                      <ReallocationDialog />
                      <LeadershipDialog />
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={() => setActiveTab('my-profile')}
                  >
                    <Avatar className="h-9 w-9 ring-1 ring-border">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/15 text-primary text-sm font-display font-semibold">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 sm:py-10 pb-28 md:pb-10">
            {/* Hero editorial da seção */}
            <motion.div
              key={`hero-${activeTab}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="mb-6 sm:mb-10"
            >
              <div className="editorial-divider mb-4" />
              <div className="flex items-end justify-between flex-wrap gap-3">
                <div>
                  <p className="eyebrow mb-2">{sectionMeta.eyebrow}</p>
                  <h1 className="display text-3xl sm:text-5xl text-foreground">
                    {sectionMeta.title}
                  </h1>
                </div>
                {currentCycleLabel && (
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {currentCycleLabel}
                  </p>
                )}
              </div>
            </motion.div>

            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-8"
            >
              {activeTab === 'overview' && <StatsOverview />}
              {activeTab === 'clients' && <StatsOverview variant="clients-only" />}
              {renderContent()}
            </motion.div>
          </main>

          {/* Footer */}
          <footer className="border-t border-border/60 py-5 px-4 sm:px-6 lg:px-10">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.25em] text-muted-foreground">
                CONSEJ · Consultoria Jurídica Júnior
              </span>
              <span className="text-xs text-muted-foreground tracking-wide">
                Developed by Kelvin Watson — 2026
              </span>
            </div>
          </footer>
        </div>

        {/* FAB — apenas mobile */}
        <QuickActionsFab onAction={handleTabChange} activeTab={activeTab} />
      </div>
    </SidebarProvider>
  );
};

export default Index;
