import { useState, useEffect } from 'react';
import { Building2, Users, User, Briefcase, Shield, ClipboardList, Lightbulb, UserCheck, Heart } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useLeadership } from '@/hooks/useLeadership';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

interface AppSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { title: 'Panorama', value: 'overview', icon: Building2 },
  { title: 'Meu Perfil', value: 'my-profile', icon: User },
  { title: 'Minha Coordenadoria', value: 'my-coordination', icon: ClipboardList },
  { title: 'CONSEJ', value: 'consej', icon: Users },
  { title: 'Portfólio de Clientes', value: 'clients', icon: Briefcase },
  { title: 'Meus Clientes', value: 'my-clients', icon: UserCheck },
];

function NotificationBadge({ count, collapsed }: { count: number; collapsed: boolean }) {
  if (count === 0) return null;
  if (collapsed) {
    return <span className="absolute -top-1.5 -right-1.5 h-3 w-3 rounded-full bg-destructive" />;
  }
  return (
    <Badge variant="destructive" className="text-xs px-1.5 py-0 h-5 min-w-5 flex items-center justify-center">
      {count}
    </Badge>
  );
}

export function AppSidebar({ activeTab, onTabChange }: AppSidebarProps) {
  const { state, setOpenMobile } = useSidebar();
  const collapsed = state === 'collapsed';
  const { isAdmin, user } = useAuthContext();
  const { positions } = useLeadership();

  const isDemandasManager = user
    ? positions.some(
        (p) => p.user_id === user.id && p.directorate_id === 'dir-1' && p.position_type === 'manager'
      )
    : false;

  const isNegociosLeadership = user
    ? positions.some(
        (p) => p.user_id === user.id && p.directorate_id === 'dir-2' && (p.position_type === 'manager' || p.position_type === 'director')
      )
    : false;

  const isDirector = user
    ? positions.some(
        (p) => p.user_id === user.id && p.position_type === 'director'
      )
    : false;

  const showDemandsControl = isDemandasManager;
  const showMemberDemands = !isAdmin && !isDemandasManager && !isDirector;
  const showMemberOpportunities = !isAdmin && !isNegociosLeadership && !isDirector && !isDemandasManager;
  const showOpportunitiesManagement = isNegociosLeadership;

  const isLeader = user
    ? positions.some((p) => p.user_id === user.id)
    : false;

  const [unreadHelpCount, setUnreadHelpCount] = useState(0);
  const [unseenMemberCount, setUnseenMemberCount] = useState(0);
  const [pendingDemandsCount, setPendingDemandsCount] = useState(0);
  const [returnedDemandsCount, setReturnedDemandsCount] = useState(0);
  const [pendingOpportunitiesCount, setPendingOpportunitiesCount] = useState(0);

  // Help reports notifications (leaders)
  useEffect(() => {
    if (!isLeader || !user) return;
    const fetchUnread = async () => {
      const { count } = await supabase
        .from('help_reports')
        .select('id', { count: 'exact', head: true })
        .eq('target_leader_id', user.id)
        .neq('status', 'resolved');
      setUnreadHelpCount(count || 0);
    };
    fetchUnread();
    const channel = supabase
      .channel('help-reports-unread')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'help_reports' }, () => fetchUnread())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isLeader, user?.id]);

  // Pending demands notifications (Demandas manager)
  useEffect(() => {
    if (!isDemandasManager || !user) return;
    const fetchPending = async () => {
      const { count } = await supabase
        .from('demand_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');
      setPendingDemandsCount(count || 0);
    };
    fetchPending();
    const channel = supabase
      .channel('demands-pending')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'demand_submissions' }, () => fetchPending())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isDemandasManager, user?.id]);

  // Returned demands notifications (members)
  useEffect(() => {
    if (!showMemberDemands || !user) return;
    const fetchReturned = async () => {
      const { count } = await supabase
        .from('demand_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'returned');
      setReturnedDemandsCount(count || 0);
    };
    fetchReturned();
    const channel = supabase
      .channel('demands-returned')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'demand_submissions' }, () => fetchReturned())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [showMemberDemands, user?.id]);

  // Pending opportunities notifications (Negócios leadership)
  useEffect(() => {
    if (!isNegociosLeadership || !user) return;
    const fetchPending = async () => {
      const { count } = await supabase
        .from('business_opportunities')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');
      setPendingOpportunitiesCount(count || 0);
    };
    fetchPending();
    const channel = supabase
      .channel('opportunities-pending')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'business_opportunities' }, () => fetchPending())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isNegociosLeadership, user?.id]);

  const handleClick = (value: string) => {
    onTabChange(value);
    setOpenMobile(false);
  };

  const renderMenuButton = (
    value: string,
    label: string,
    Icon: React.ElementType,
    count: number,
    tooltip: string
  ) => (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={() => handleClick(value)}
        isActive={activeTab === value}
        tooltip={tooltip}
      >
        <div className="relative">
          <Icon className="h-4 w-4" />
          {collapsed && <NotificationBadge count={count} collapsed={true} />}
        </div>
        {!collapsed && (
          <span className="flex items-center gap-2">
            {label}
            <NotificationBadge count={count} collapsed={false} />
          </span>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.value}>
                  <SidebarMenuButton
                    onClick={() => handleClick(item.value)}
                    isActive={activeTab === item.value}
                    tooltip={item.title}
                  >
                    <item.icon className="h-4 w-4" />
                    {!collapsed && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {showDemandsControl && (
          <SidebarGroup>
            <SidebarGroupLabel>Gestão</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {renderMenuButton('demands', 'Controle de Demandas', ClipboardList, pendingDemandsCount, 'Controle de Demandas')}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {(showMemberDemands || showMemberOpportunities) && (
          <SidebarGroup>
            <SidebarGroupLabel>Minhas Atividades</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {showMemberDemands && renderMenuButton('my-demands', 'Minhas Demandas', ClipboardList, returnedDemandsCount, 'Minhas Demandas')}
                {showMemberOpportunities && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => handleClick('my-opportunities')}
                      isActive={activeTab === 'my-opportunities'}
                      tooltip="Oportunidades de Negócio"
                    >
                      <Lightbulb className="h-4 w-4" />
                      {!collapsed && <span>Oportunidades</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {showOpportunitiesManagement && (
          <SidebarGroup>
            <SidebarGroupLabel>Negócios</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {renderMenuButton('opportunities-management', 'Gestão de Oportunidades', Lightbulb, pendingOpportunitiesCount, 'Gestão de Oportunidades')}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administração</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => handleClick('admin')}
                    isActive={activeTab === 'admin'}
                    tooltip="Admin"
                  >
                    <Shield className="h-4 w-4" />
                    {!collapsed && <span>Painel Admin</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          {renderMenuButton('help-center', 'Central de Ajuda', Heart, unreadHelpCount, 'Central de Ajuda')}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
