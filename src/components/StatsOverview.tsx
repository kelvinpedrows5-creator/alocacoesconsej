import { motion } from 'framer-motion';
import { Users, Building2, LayoutGrid, Sparkles, TrendingUp } from 'lucide-react';
import { useAllocationStore } from '@/hooks/useAllocationStore';

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
  const { members, coordinations, directorates, suggestions } = useAllocationStore();

  const avgCoverage = members.reduce((acc, m) => {
    const visited = new Set(m.history.map(h => h.coordinationId)).size;
    return acc + (visited / coordinations.length) * 100;
  }, 0) / members.length;

  const stats = [
    { icon: Users, label: 'Total de Membros', value: members.length, color: '#3B82F6' },
    { icon: LayoutGrid, label: 'Coordenadorias', value: coordinations.length, color: '#10B981' },
    { icon: Building2, label: 'Diretorias', value: directorates.length, color: '#F59E0B' },
    { icon: TrendingUp, label: 'Cobertura Média', value: `${avgCoverage.toFixed(0)}%`, color: '#8B5CF6' },
    { icon: Sparkles, label: 'Sugestões Pendentes', value: suggestions.length, color: '#EC4899' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {stats.map((stat, i) => (
        <StatCard key={stat.label} {...stat} delay={i * 0.1} />
      ))}
    </div>
  );
};
