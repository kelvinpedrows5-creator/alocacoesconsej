import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ClipboardList, Lightbulb, Heart, FileText, X } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useLeadership } from '@/hooks/useLeadership';
import { cn } from '@/lib/utils';

interface QuickActionsFabProps {
  onAction: (tab: string) => void;
  activeTab: string;
}

/**
 * Botão de ações rápidas (FAB) — visível apenas no mobile.
 * Abre um leque de atalhos contextuais conforme o papel do usuário.
 */
export function QuickActionsFab({ onAction, activeTab }: QuickActionsFabProps) {
  const [open, setOpen] = useState(false);
  const { isAdmin, user } = useAuthContext();
  const { positions } = useLeadership();

  const isDemandasManager = user
    ? positions.some(p => p.user_id === user.id && p.directorate_id === 'dir-1' && p.position_type === 'manager')
    : false;
  const isDirector = user
    ? positions.some(p => p.user_id === user.id && p.position_type === 'director')
    : false;
  const isNegociosLeadership = user
    ? positions.some(p => p.user_id === user.id && p.directorate_id === 'dir-2' && (p.position_type === 'manager' || p.position_type === 'director'))
    : false;

  const showMemberDemands = !isAdmin && !isDemandasManager && !isDirector;
  const showMemberOpportunities = !isAdmin && !isNegociosLeadership && !isDirector && !isDemandasManager;

  const actions: { label: string; tab: string; icon: typeof Plus }[] = [];
  if (showMemberDemands) actions.push({ label: 'Registrar demanda', tab: 'my-demands', icon: ClipboardList });
  if (showMemberOpportunities) actions.push({ label: 'Nova oportunidade', tab: 'my-opportunities', icon: Lightbulb });
  actions.push({ label: 'Passagem de Bastão', tab: 'handoff-survey', icon: FileText });
  actions.push({ label: 'Central de Ajuda', tab: 'help-center', icon: Heart });

  const handle = (tab: string) => {
    setOpen(false);
    onAction(tab);
  };

  return (
    <div className="md:hidden fixed bottom-5 right-5 z-50 safe-bottom flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm -z-10"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col gap-2 items-end"
          >
            {actions.map((a, i) => (
              <motion.button
                key={a.tab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => handle(a.tab)}
                className={cn(
                  'flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-full',
                  'editorial-card card-shadow-elevated',
                  'text-sm font-medium font-display',
                  activeTab === a.tab && 'ring-1 ring-primary'
                )}
              >
                <span>{a.label}</span>
                <span className="grid place-items-center h-9 w-9 rounded-full bg-primary/15 text-primary">
                  <a.icon className="h-4 w-4" />
                </span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen(o => !o)}
        aria-label="Ações rápidas"
        className={cn(
          'h-14 w-14 rounded-full grid place-items-center',
          'bg-primary text-primary-foreground',
          'shadow-[0_10px_30px_-8px_hsl(243_75%_59%_/_0.6)]',
          'border border-primary-foreground/10'
        )}
      >
        <motion.div animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }}>
          {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
        </motion.div>
      </motion.button>
    </div>
  );
}
