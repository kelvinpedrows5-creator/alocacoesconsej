import { Building2, Users, User, Briefcase, Shield, ClipboardList, Lightbulb, UserCheck } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useLeadership } from '@/hooks/useLeadership';
import {
  Sidebar,
  SidebarContent,
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
    </Sidebar>
  );
}
