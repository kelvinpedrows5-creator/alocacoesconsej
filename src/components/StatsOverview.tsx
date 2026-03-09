import { motion } from 'framer-motion';
import { Users, Building2, LayoutGrid, TrendingUp, Briefcase } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useRealStats } from '@/hooks/useRealStats';

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

export const StatsOverview = ({ variant = 'full' }: { variant?: 'full' | 'clients-only' }) => {
  const { isAdmin, user } = useAuthContext();
  const { 
    totalMembers, 
    totalCoordinations, 
    totalDirectorates, 
    totalClients,
    userProgress,
    isLoading 
  } = useRealStats(user?.id);

  if (variant === 'clients-only') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Briefcase} label="Clientes (GTs)" value={isLoading ? '...' : totalClients} color="#8B5CF6" delay={0} />
      </div>
    );
  }

  const adminStats = [
    { icon: Users, label: 'Total de Membros', value: isLoading ? '...' : totalMembers, color: '#3B82F6' },
    { icon: LayoutGrid, label: 'Coordenadorias', value: totalCoordinations, color: '#10B981' },
    { icon: Building2, label: 'Diretorias', value: totalDirectorates, color: '#F59E0B' },
    { icon: Briefcase, label: 'Clientes (GTs)', value: isLoading ? '...' : totalClients, color: '#8B5CF6' },
  ];

  const memberStats = [
    { icon: Users, label: 'Total de Membros', value: isLoading ? '...' : totalMembers, color: '#3B82F6' },
    { icon: LayoutGrid, label: 'Coordenadorias', value: totalCoordinations, color: '#10B981' },
    { icon: Building2, label: 'Diretorias', value: totalDirectorates, color: '#F59E0B' },
    { 
      icon: TrendingUp, 
      label: 'Meu Progresso (Diretorias)', 
      value: isLoading ? '...' : `${userProgress.visited}/${userProgress.total}`, 
      color: '#8B5CF6' 
    },
  ];

  const stats = isAdmin ? adminStats : memberStats;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <StatCard key={stat.label} {...stat} delay={i * 0.1} />
      ))}
    </div>
  );
};
