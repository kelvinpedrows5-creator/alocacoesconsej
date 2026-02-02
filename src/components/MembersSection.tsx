import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { coordinations, directorates } from '@/data/mockData';

interface ProfileData {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
}

export const MembersSection = () => {
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDirectorate, setSelectedDirectorate] = useState<string>('all');

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, email, display_name, avatar_url')
        .order('display_name', { ascending: true });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
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

  // Mock coordination assignment based on email (in production, this would come from the database)
  const getCoordinationForProfile = (email: string) => {
    // Simple hash to assign coordination consistently
    const hash = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const coordIndex = hash % coordinations.length;
    return coordinations[coordIndex];
  };

  const filteredProfiles = profiles.filter((p) => {
    const matchesSearch =
      p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.display_name && p.display_name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (selectedDirectorate === 'all') return matchesSearch;
    
    const coord = getCoordinationForProfile(p.email);
    return matchesSearch && coord.directorateId === selectedDirectorate;
  });

  const groupedByDirectorate = directorates.map((dir) => {
    const dirCoords = coordinations.filter((c) => c.directorateId === dir.id);
    const dirMembers = filteredProfiles.filter((p) => {
      const coord = getCoordinationForProfile(p.email);
      return coord.directorateId === dir.id;
    });
    return {
      directorate: dir,
      coordinations: dirCoords,
      members: dirMembers,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Membros CONSEJ
        </CardTitle>
        <CardDescription>
          Visualize todos os membros da empresa e suas coordenadorias
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={selectedDirectorate} onValueChange={setSelectedDirectorate}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="Filtrar por diretoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Diretorias</SelectItem>
              {directorates.map((dir) => (
                <SelectItem key={dir.id} value={dir.id}>
                  <span className="truncate">{dir.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="space-y-6">
              {groupedByDirectorate
                .filter((group) => 
                  selectedDirectorate === 'all' || group.directorate.id === selectedDirectorate
                )
                .filter((group) => group.members.length > 0)
                .map((group) => (
                  <motion.div
                    key={group.directorate.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <h3 className="font-semibold text-foreground">
                        {group.directorate.name}
                      </h3>
                      <Badge variant="secondary" className="text-xs">
                        {group.members.length} membros
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {group.members.map((profile) => {
                        const coord = getCoordinationForProfile(profile.email);
                        return (
                          <motion.div
                            key={profile.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary/30 transition-colors bg-card min-w-0"
                          >
                            <Avatar className="h-10 w-10 shrink-0">
                              <AvatarImage src={profile.avatar_url || undefined} />
                              <AvatarFallback 
                                className="text-sm"
                                style={{ backgroundColor: `${coord.color}20`, color: coord.color }}
                              >
                                {getInitials(profile.display_name, profile.email)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">
                                {profile.display_name || profile.email.split('@')[0]}
                              </p>
                              <Badge
                                variant="outline"
                                className="text-xs mt-1 max-w-full"
                                style={{ borderColor: `${coord.color}50`, color: coord.color }}
                              >
                                <span className="truncate">{coord.name}</span>
                              </Badge>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
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
  );
};
