import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'admin' | 'member';

export function useRole(userId: string | null) {
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setRole(null);
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      try {
        const { data, error } = await supabase.rpc('get_user_role', { _user_id: userId });
        
        if (error) {
          console.error('Error fetching role:', error);
          setRole('member'); // Default to member if error
        } else {
          setRole(data as AppRole || 'member');
        }
      } catch (err) {
        console.error('Error in useRole:', err);
        setRole('member');
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [userId]);

  const isAdmin = role === 'admin';
  const isMember = role === 'member';

  return { role, loading, isAdmin, isMember };
}
