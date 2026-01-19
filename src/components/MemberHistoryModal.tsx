import { motion } from 'framer-motion';
import { X, Calendar, ArrowRight } from 'lucide-react';
import { useAllocationStore } from '@/hooks/useAllocationStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MemberHistoryModalProps {
  memberId: string;
  onClose: () => void;
}

export const MemberHistoryModal = ({ memberId, onClose }: MemberHistoryModalProps) => {
  const { members, coordinations, directorates } = useAllocationStore();
  const member = members.find(m => m.id === memberId);

  if (!member) return null;

  const getCoordination = (id: string) => coordinations.find(c => c.id === id);
  const getDirectorate = (coordId: string) => {
    const coord = getCoordination(coordId);
    return coord ? directorates.find(d => d.id === coord.directorateId) : null;
  };

  const sortedHistory = [...member.history].sort((a, b) => 
    new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-card rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">{member.name}</h2>
              <p className="text-sm text-muted-foreground">Histórico de Alocações</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <ScrollArea className="max-h-[60vh]">
          <div className="p-6">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

              <div className="space-y-6">
                {sortedHistory.map((allocation, index) => {
                  const coord = getCoordination(allocation.coordinationId);
                  const directorate = getDirectorate(allocation.coordinationId);

                  return (
                    <motion.div
                      key={`${allocation.coordinationId}-${allocation.quarter}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative pl-10"
                    >
                      {/* Timeline dot */}
                      <div 
                        className="absolute left-2 w-5 h-5 rounded-full border-2 bg-card"
                        style={{ borderColor: coord?.color || '#94A3B8' }}
                      />

                      <div className="bg-secondary/50 rounded-xl p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <Badge 
                              style={{ 
                                backgroundColor: coord ? `${coord.color}20` : undefined, 
                                color: coord?.color 
                              }}
                            >
                              {coord?.name || 'Desconhecido'}
                            </Badge>
                            {directorate && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {directorate.name}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {allocation.quarter}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(allocation.startDate).toLocaleDateString('pt-BR')}</span>
                          {allocation.endDate && (
                            <>
                              <ArrowRight className="w-3 h-3" />
                              <span>{new Date(allocation.endDate).toLocaleDateString('pt-BR')}</span>
                            </>
                          )}
                          {!allocation.endDate && (
                            <Badge variant="secondary" className="text-xs ml-2">
                              Atual
                            </Badge>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {sortedHistory.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum histórico de alocação encontrado.
              </div>
            )}
          </div>
        </ScrollArea>
      </motion.div>
    </motion.div>
  );
};
