import { motion } from 'framer-motion';
import { Users, Building2, LayoutGrid, TrendingUp } from 'lucide-react';
import { useAllocationStore } from '@/hooks/useAllocationStore';
import { useAuthContext } from '@/contexts/AuthContext';
import { directorates } from '@/data/mockData';

const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  color,
  delay 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string | number;
  color: string;
  delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="bg-card rounded-xl p-6 card-shadow hover:card-shadow-hover transition-shadow duration-300"
  >
    <div className="flex items-center gap-4">
      <div 
        className="p-3 rounded-lg"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
      </div>
    </div>
  </motion.div>
);

export const StatsOverview = () => {
  const { members, coordinations } = useAllocationStore();
  const { isAdmin, profile } = useAuthContext();

  // Get unique directorates the current user has visited (for member view)
  const getCurrentUserProgress = () => {
    // Find the current user in members (mock data simulation)
    // In a real scenario, this would match based on the logged-in user's profile
    const userEmail = profile?.email;
    const currentMember = members.find(m => m.email === userEmail);
    
    if (!currentMember) {
      // Default progress if user not found
      return { visited: 0, total: directorates.length };
    }
    
    // Get unique directorates from history
    const visitedCoordIds = new Set(currentMember.history.map(h => h.coordinationId));
    const visitedDirectorateIds = new Set<string>();
    
    visitedCoordIds.forEach(coordId => {
      const coord = coordinations.find(c => c.id === coordId);
      if (coord) {
        visitedDirectorateIds.add(coord.directorateId);
      }
    });
    
    return { visited: visitedDirectorateIds.size, total: directorates.length };
  };

  const userProgress = getCurrentUserProgress();

  // Admin sees full stats
  const adminStats = [
    { icon: Users, label: 'Total de Membros', value: members.length, color: '#3B82F6' },
    { icon: LayoutGrid, label: 'Coordenadorias', value: coordinations.length, color: '#10B981' },
    { icon: Building2, label: 'Diretorias', value: directorates.length, color: '#F59E0B' },
  ];

  // Member sees their own progress
  const memberStats = [
    { icon: Users, label: 'Total de Membros', value: members.length, color: '#3B82F6' },
    { icon: LayoutGrid, label: 'Coordenadorias', value: coordinations.length, color: '#10B981' },
    { icon: Building2, label: 'Diretorias', value: directorates.length, color: '#F59E0B' },
    { 
      icon: TrendingUp, 
      label: 'Meu Progresso (Diretorias)', 
      value: `${userProgress.visited}/${userProgress.total}`, 
      color: '#8B5CF6' 
    },
  ];

  const stats = isAdmin ? adminStats : memberStats;

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${isAdmin ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-4`}>
      {stats.map((stat, i) => (
        <StatCard key={stat.label} {...stat} delay={i * 0.1} />
      ))}
    </div>
  );
};
