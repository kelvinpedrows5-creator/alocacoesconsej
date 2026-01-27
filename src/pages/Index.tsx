import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Users, Building2, Menu, X } from 'lucide-react';
import { StatsOverview } from '@/components/StatsOverview';
import { MemberCard } from '@/components/MemberCard';
import { MemberHistoryModal } from '@/components/MemberHistoryModal';
import { SuggestionsPanel } from '@/components/SuggestionsPanel';
import { CoordinationGrid } from '@/components/CoordinationGrid';
import { AddMemberDialog } from '@/components/AddMemberDialog';
import { ReallocationDialog } from '@/components/ReallocationDialog';
import { ProfileFormDialog } from '@/components/ProfileFormDialog';
import { useAllocationStore } from '@/hooks/useAllocationStore';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { quarters } from '@/data/mockData';

const Index = () => {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const { members, selectedQuarter, setSelectedQuarter } = useAllocationStore();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-accent">
                <LayoutDashboard className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-foreground">Alocação 360°</h1>
                <p className="text-xs text-muted-foreground">Sistema de Gestão de Membros</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {quarters.map((q) => (
                    <SelectItem key={q.value} value={q.value}>
                      {q.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ProfileFormDialog />
              <ReallocationDialog />
              <AddMemberDialog />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Stats */}
          <StatsOverview />

          {/* Tabs for different views */}
          <Tabs defaultValue="suggestions" className="space-y-6">
            <TabsList className="bg-secondary/50">
              <TabsTrigger value="suggestions" className="gap-2">
                <LayoutDashboard className="w-4 h-4" />
                Sugestões
              </TabsTrigger>
              <TabsTrigger value="members" className="gap-2">
                <Users className="w-4 h-4" />
                Membros
              </TabsTrigger>
              <TabsTrigger value="coordinations" className="gap-2">
                <Building2 className="w-4 h-4" />
                Coordenadorias
              </TabsTrigger>
            </TabsList>

            <TabsContent value="suggestions" className="space-y-6">
              <SuggestionsPanel />
              <CoordinationGrid />
            </TabsContent>

            <TabsContent value="members">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {members.map((member) => (
                  <MemberCard
                    key={member.id}
                    memberId={member.id}
                    onViewHistory={setSelectedMemberId}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="coordinations">
              <CoordinationGrid />
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      {/* History Modal */}
      <AnimatePresence>
        {selectedMemberId && (
          <MemberHistoryModal
            memberId={selectedMemberId}
            onClose={() => setSelectedMemberId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
