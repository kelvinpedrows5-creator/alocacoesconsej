import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Shield, ShieldOff, Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface ProfileWithRole {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  role: 'admin' | 'member';
}

export const AdminMembersManagement = () => {
  const [profiles, setProfiles] = useState<ProfileWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ProfileWithRole | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfilesWithRoles();
  }, []);

  const fetchProfilesWithRoles = async () => {
    try {
      setLoading(true);
      
      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, email, display_name, avatar_url')
        .order('display_name', { ascending: true });

      if (profilesError) throw profilesError;

      // Fetch roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Merge profiles with roles
      const rolesMap = new Map(rolesData?.map((r) => [r.user_id, r.role]) || []);
      const profilesWithRoles: ProfileWithRole[] = (profilesData || []).map((p) => ({
        ...p,
        role: rolesMap.get(p.user_id) || 'member',
      }));

      setProfiles(profilesWithRoles);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast({
        title: 'Erro ao carregar membros',
        description: 'Não foi possível carregar a lista de membros.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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

  const handleRoleToggle = async (profile: ProfileWithRole) => {
    const newRole = profile.role === 'admin' ? 'member' : 'admin';
    
    try {
      setUpdating(profile.id);
      
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', profile.user_id);

      if (error) throw error;

      setProfiles((prev) =>
        prev.map((p) => (p.id === profile.id ? { ...p, role: newRole } : p))
      );

      toast({
        title: newRole === 'admin' ? 'Promovido a Administrador' : 'Rebaixado a Membro',
        description: `${profile.display_name || profile.email} agora é ${newRole === 'admin' ? 'administrador' : 'membro'}.`,
      });
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast({
        title: 'Erro ao atualizar cargo',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteMember = async (profile: ProfileWithRole) => {
    if (profile.role === 'admin') {
      toast({
        title: 'Ação não permitida',
        description: 'Rebaixe o administrador para membro antes de removê-lo.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUpdating(profile.id);

      // Get the current user's session token
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      // Call edge function to delete user completely
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: profile.user_id }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao remover usuário');
      }

      setProfiles((prev) => prev.filter((p) => p.id !== profile.id));

      toast({
        title: 'Membro removido',
        description: `${profile.display_name || profile.email} foi removido completamente do sistema.`,
      });
    } catch (error: any) {
      console.error('Error deleting member:', error);
      toast({
        title: 'Erro ao remover membro',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUpdating(null);
      setDeleteTarget(null);
    }
  };

  const filteredProfiles = profiles.filter(
    (p) =>
      p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.display_name && p.display_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const admins = filteredProfiles.filter((p) => p.role === 'admin');
  const members = filteredProfiles.filter((p) => p.role === 'member');

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Gerenciamento de Membros
          </CardTitle>
          <CardDescription>
            Promova, rebaixe ou remova membros do sistema
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

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-6">
                {/* Admins section */}
                {admins.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <Shield className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold text-foreground">
                        Administradores
                      </h3>
                      <Badge variant="secondary" className="text-xs">
                        {admins.length}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {admins.map((profile) => (
                        <MemberRow
                          key={profile.id}
                          profile={profile}
                          updating={updating}
                          onRoleToggle={handleRoleToggle}
                          onDelete={setDeleteTarget}
                          getInitials={getInitials}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Members section */}
                {members.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <h3 className="font-semibold text-foreground">
                        Membros
                      </h3>
                      <Badge variant="secondary" className="text-xs">
                        {members.length}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {members.map((profile) => (
                        <MemberRow
                          key={profile.id}
                          profile={profile}
                          updating={updating}
                          onRoleToggle={handleRoleToggle}
                          onDelete={setDeleteTarget}
                          getInitials={getInitials}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {filteredProfiles.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum membro encontrado
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Confirmar Remoção Definitiva
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover{' '}
              <strong>{deleteTarget?.display_name || deleteTarget?.email}</strong> completamente do sistema?
              <br /><br />
              <span className="text-destructive font-medium">
                Esta ação removerá a conta de autenticação, perfil e todos os dados associados.
                Esta ação não pode ser desfeita.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDeleteMember(deleteTarget)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover Definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

interface MemberRowProps {
  profile: ProfileWithRole;
  updating: string | null;
  onRoleToggle: (profile: ProfileWithRole) => void;
  onDelete: (profile: ProfileWithRole) => void;
  getInitials: (displayName: string | null, email: string) => string;
}

const MemberRow = ({
  profile,
  updating,
  onRoleToggle,
  onDelete,
  getInitials,
}: MemberRowProps) => {
  const isUpdating = updating === profile.id;
  const isAdmin = profile.role === 'admin';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-between p-4 rounded-lg border hover:border-primary/30 transition-colors bg-card"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={profile.avatar_url || undefined} />
          <AvatarFallback className={isAdmin ? 'bg-primary/10 text-primary' : ''}>
            {getInitials(profile.display_name, profile.email)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="font-medium text-foreground truncate">
            {profile.display_name || profile.email}
          </p>
          <p className="text-sm text-muted-foreground truncate">{profile.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {/* Role Toggle */}
        <div className="flex items-center gap-2">
          <Switch
            id={`role-${profile.id}`}
            checked={isAdmin}
            onCheckedChange={() => onRoleToggle(profile)}
            disabled={isUpdating}
          />
          <Label
            htmlFor={`role-${profile.id}`}
            className="text-sm cursor-pointer hidden sm:block"
          >
            {isAdmin ? (
              <span className="flex items-center gap-1 text-primary">
                <Shield className="w-3 h-3" />
                Admin
              </span>
            ) : (
              <span className="flex items-center gap-1 text-muted-foreground">
                <ShieldOff className="w-3 h-3" />
                Membro
              </span>
            )}
          </Label>
        </div>

        {/* Delete Button - only for non-admins */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(profile)}
          disabled={isUpdating || isAdmin}
          className={isAdmin ? 'opacity-50 cursor-not-allowed' : 'text-destructive hover:text-destructive'}
          title={isAdmin ? 'Rebaixe para membro antes de remover' : 'Remover membro'}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};
