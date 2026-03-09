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

export function AppSidebar({ activeTab, onTabChange }: AppSidebarProps) {
  const { state, setOpenMobile } = useSidebar();
  const collapsed = state === 'collapsed';
  const { isAdmin, user } = useAuthContext();
  const { positions } = useLeadership();

  // Check if user is Gerente de Demandas (directorate_id = 'dir-1', position_type = 'manager')
  const isDemandasManager = user
    ? positions.some(
        (p) => p.user_id === user.id && p.directorate_id === 'dir-1' && p.position_type === 'manager'
      )
    : false;

  // Check if user is Negócios manager or director (directorate_id = 'dir-2')
  const isNegociosLeadership = user
    ? positions.some(
        (p) => p.user_id === user.id && p.directorate_id === 'dir-2' && (p.position_type === 'manager' || p.position_type === 'director')
      )
    : false;

  // Check if user is any director
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

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isLeader || !user) return;

    const fetchUnread = async () => {
      const { count } = await supabase
        .from('help_reports')
        .select('id', { count: 'exact', head: true })
        .eq('target_leader_id', user.id)
        .eq('is_read', false);
      setUnreadCount(count || 0);
    };

    fetchUnread();

    const channel = supabase
      .channel('help-reports-unread')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'help_reports' }, () => {
        fetchUnread();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'help_reports' }, () => {
        fetchUnread();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isLeader, user?.id]);

  const handleClick = (value: string) => {
    onTabChange(value);
    setOpenMobile(false);
  };

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
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => handleClick('demands')}
                    isActive={activeTab === 'demands'}
                    tooltip="Controle de Demandas"
                  >
                    <ClipboardList className="h-4 w-4" />
                    {!collapsed && <span>Controle de Demandas</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {(showMemberDemands || showMemberOpportunities) && (
          <SidebarGroup>
            <SidebarGroupLabel>Minhas Atividades</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {showMemberDemands && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => handleClick('my-demands')}
                      isActive={activeTab === 'my-demands'}
                      tooltip="Minhas Demandas"
                    >
                      <ClipboardList className="h-4 w-4" />
                      {!collapsed && <span>Minhas Demandas</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
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
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => handleClick('opportunities-management')}
                    isActive={activeTab === 'opportunities-management'}
                    tooltip="Gestão de Oportunidades"
                  >
                    <Lightbulb className="h-4 w-4" />
                    {!collapsed && <span>Gestão de Oportunidades</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
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
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => handleClick('help-center')}
              isActive={activeTab === 'help-center'}
              tooltip="Central de Ajuda"
            >
              <Heart className="h-4 w-4" />
              {!collapsed && <span>Central de Ajuda</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
