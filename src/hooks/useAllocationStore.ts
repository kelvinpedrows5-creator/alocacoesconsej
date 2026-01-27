import { create } from 'zustand';
import { Member, Coordination, Directorate, AllocationSuggestion } from '@/types';
import { members as initialMembers, coordinations as initialCoordinations, directorates as initialDirectorates } from '@/data/mockData';

interface AllocationStore {
  members: Member[];
  coordinations: Coordination[];
  directorates: Directorate[];
  suggestions: AllocationSuggestion[];
  selectedQuarter: string;
  setSelectedQuarter: (quarter: string) => void;
  addMember: (member: Omit<Member, 'id' | 'history'>) => void;
  updateMember: (id: string, updates: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  addCoordination: (coordination: Omit<Coordination, 'id'>) => void;
  generateSuggestions: () => void;
  applySuggestion: (suggestion: AllocationSuggestion) => void;
  applyAllSuggestions: () => void;
}

export const useAllocationStore = create<AllocationStore>((set, get) => ({
  members: initialMembers,
  coordinations: initialCoordinations,
  directorates: initialDirectorates,
  suggestions: [],
  selectedQuarter: '2025-C4',

  setSelectedQuarter: (quarter) => set({ selectedQuarter: quarter }),

  addMember: (memberData) => {
    const newMember: Member = {
      ...memberData,
      id: `mem-${Date.now()}`,
      history: [],
    };
    set((state) => ({ members: [...state.members, newMember] }));
  },

  updateMember: (id, updates) => {
    set((state) => ({
      members: state.members.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    }));
  },

  deleteMember: (id) => {
    set((state) => ({
      members: state.members.filter((m) => m.id !== id),
    }));
  },

  addCoordination: (coordinationData) => {
    const newCoordination: Coordination = {
      ...coordinationData,
      id: `coord-${Date.now()}`,
    };
    set((state) => ({ coordinations: [...state.coordinations, newCoordination] }));
  },

  generateSuggestions: () => {
    const { members, coordinations, selectedQuarter } = get();
    const suggestions: AllocationSuggestion[] = [];

    members.forEach((member) => {
      // Get coordinations the member has NOT been part of
      const visitedCoordIds = new Set(member.history.map((h) => h.coordinationId));
      const unvisitedCoords = coordinations.filter((c) => !visitedCoordIds.has(c.id));

      if (unvisitedCoords.length > 0) {
        // Prioritize coordinations with fewer members and that the member hasn't visited
        const coordMemberCounts = new Map<string, number>();
        coordinations.forEach((c) => coordMemberCounts.set(c.id, 0));
        members.forEach((m) => {
          if (m.currentCoordinationId) {
            coordMemberCounts.set(
              m.currentCoordinationId,
              (coordMemberCounts.get(m.currentCoordinationId) || 0) + 1
            );
          }
        });

        // Sort unvisited by member count (prefer less crowded)
        const sorted = unvisitedCoords.sort((a, b) => {
          const countA = coordMemberCounts.get(a.id) || 0;
          const countB = coordMemberCounts.get(b.id) || 0;
          return countA - countB;
        });

        const suggested = sorted[0];
        const visitedCount = member.history.length;
        const totalCoords = coordinations.length;
        const coverage = (visitedCount / totalCoords) * 100;

        suggestions.push({
          memberId: member.id,
          suggestedCoordinationId: suggested.id,
          reason: coverage < 30 
            ? `Baixa cobertura (${visitedCount}/${totalCoords} coordenadorias). Recomendado para experiência 360°.`
            : coverage < 60
            ? `Cobertura média (${visitedCount}/${totalCoords}). Ainda não passou por ${suggested.name}.`
            : `Boa cobertura (${visitedCount}/${totalCoords}). Última coordenadoria não visitada: ${suggested.name}.`,
          priority: coverage < 30 ? 'high' : coverage < 60 ? 'medium' : 'low',
        });
      }
    });

    set({ suggestions });
  },

  applySuggestion: (suggestion) => {
    const { selectedQuarter } = get();
    set((state) => ({
      members: state.members.map((m) => {
        if (m.id === suggestion.memberId) {
          return {
            ...m,
            currentCoordinationId: suggestion.suggestedCoordinationId,
            history: [
              ...m.history.map((h) => 
                !h.endDate ? { ...h, endDate: new Date().toISOString().split('T')[0] } : h
              ),
              {
                coordinationId: suggestion.suggestedCoordinationId,
                quarter: selectedQuarter,
                startDate: new Date().toISOString().split('T')[0],
              },
            ],
          };
        }
        return m;
      }),
      suggestions: state.suggestions.filter((s) => s.memberId !== suggestion.memberId),
    }));
  },

  applyAllSuggestions: () => {
    const { suggestions, applySuggestion } = get();
    suggestions.forEach((s) => applySuggestion(s));
  },
}));
