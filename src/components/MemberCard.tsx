import { motion } from 'framer-motion';
import { User, ChevronRight, History } from 'lucide-react';
import { useAllocationStore } from '@/hooks/useAllocationStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface MemberCardProps {
  memberId: string;
  onViewHistory: (memberId: string) => void;
}

export const MemberCard = ({ memberId, onViewHistory }: MemberCardProps) => {
  const { members, coordinations } = useAllocationStore();
  const member = members.find(m => m.id === memberId);
  
  if (!member) return null;

  const currentCoord = coordinations.find(c => c.id === member.currentCoordinationId);
  const visitedCount = new Set(member.history.map(h => h.coordinationId)).size;
  const coverage = Math.round((visitedCount / coordinations.length) * 100);

  const initials = member.name.split(' ').map(n => n[0]).join('').slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="bg-card rounded-xl p-5 card-shadow hover:card-shadow-hover transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-foreground">{member.name}</h3>
            <p className="text-sm text-muted-foreground">{member.email}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Coordenadoria Atual</span>
          {currentCoord ? (
            <Badge 
              style={{ backgroundColor: `${currentCoord.color}20`, color: currentCoord.color }}
              className="font-medium"
            >
              {currentCoord.name}
            </Badge>
          ) : (
            <Badge variant="secondary">Não alocado</Badge>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Cobertura 360°</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${coverage}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="h-full bg-accent rounded-full"
              />
            </div>
            <span className="text-sm font-medium text-foreground">{coverage}%</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Coordenadorias visitadas</span>
          <span className="text-sm font-medium text-foreground">{visitedCount} de {coordinations.length}</span>
        </div>
      </div>

      <Button
        variant="ghost"
        className="w-full mt-4 justify-between text-muted-foreground hover:text-foreground"
        onClick={() => onViewHistory(member.id)}
      >
        <span className="flex items-center gap-2">
          <History className="w-4 h-4" />
          Ver histórico
        </span>
        <ChevronRight className="w-4 h-4" />
      </Button>
    </motion.div>
  );
};
