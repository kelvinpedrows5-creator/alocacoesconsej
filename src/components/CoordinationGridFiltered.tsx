import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAllocationStore } from '@/hooks/useAllocationStore';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Building2, Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CoordinationGridFilteredProps {
  showMemberPhotos?: boolean;
}

export const CoordinationGridFiltered = ({ showMemberPhotos = true }: CoordinationGridFilteredProps) => {
  const { members, coordinations, directorates } = useAllocationStore();
  const [selectedDirectorate, setSelectedDirectorate] = useState<string>('all');

  const getMembersForCoord = (coordId: string) => 
    members.filter(m => m.currentCoordinationId === coordId);

  const getDirectorate = (directorateId: string) =>
    directorates.find(d => d.id === directorateId);

  const filteredCoordinations = selectedDirectorate === 'all'
    ? coordinations
    : coordinations.filter(c => c.directorateId === selectedDirectorate);

  const getInitials = (name: string) => 
    name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="bg-card rounded-xl card-shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Visão por Coordenadorias</h2>
            <p className="text-sm text-muted-foreground">Distribuição atual dos membros</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={selectedDirectorate} onValueChange={setSelectedDirectorate}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Filtrar por diretoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Todas as Diretorias
                </div>
              </SelectItem>
              {directorates.map((dir) => (
                <SelectItem key={dir.id} value={dir.id}>
                  {dir.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Directorate header when filtered */}
      {selectedDirectorate !== 'all' && (
        <div className="mb-4 p-3 bg-secondary/50 rounded-lg">
          <h3 className="font-medium text-foreground">
            {getDirectorate(selectedDirectorate)?.name}
          </h3>
          <p className="text-sm text-muted-foreground">
            {getDirectorate(selectedDirectorate)?.description}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCoordinations.map((coord, index) => {
          const coordMembers = getMembersForCoord(coord.id);
          const directorate = getDirectorate(coord.directorateId);

          return (
            <motion.div
              key={coord.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="border border-border rounded-xl p-4 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: coord.color }}
                    />
                    <h3 className="font-medium text-foreground">{coord.name}</h3>
                  </div>
                  {directorate && selectedDirectorate === 'all' && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {directorate.name}
                    </p>
                  )}
                </div>
                <Badge variant="secondary" className="text-xs">
                  {coordMembers.length}/{coord.maxMembers}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-2">
                {coordMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">Nenhum membro</p>
                ) : (
                  coordMembers.map(member => {
                    const initials = getInitials(member.name);
                    return (
                      <div 
                        key={member.id}
                        className="flex items-center gap-2 bg-secondary/50 rounded-full pl-1 pr-3 py-1"
                      >
                        <Avatar className="h-6 w-6">
                          {showMemberPhotos && member.avatar && (
                            <AvatarImage src={member.avatar} alt={member.name} />
                          )}
                          <AvatarFallback 
                            className="text-xs"
                            style={{ backgroundColor: `${coord.color}30`, color: coord.color }}
                          >
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-foreground">{member.name.split(' ')[0]}</span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Capacity bar */}
              <div className="mt-3">
                <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(coordMembers.length / coord.maxMembers) * 100}%` }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: coord.color }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
