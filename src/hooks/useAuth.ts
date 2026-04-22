import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  email: string;
  profile_skills: string | null;
  profile_work_style: string | null;
  profile_activities: string | null;
  profile_competencies: string | null;
  profile_preferred_directorate: string | null;
  profile_communication_style: string | null;
  profile_problem_solving: string | null;
  profile_time_management: string | null;
  profile_team_role: string | null;
  profile_learning_style: string | null;
  profile_stress_handling: string | null;
  profile_leadership_style: string | null;
  profile_feedback_preference: string | null;
  profile_project_type: string | null;
  profile_collaboration_tools: string | null;
  joined_at: string | null;
  past_coordinations: string[] | null;
  created_at: string;
  updated_at: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener BEFORE getting session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Fetch profile with setTimeout to avoid deadlock
          setTimeout(async () => {
            const { data, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .single();
            
            if (!error && data) {
              setProfile(data as UserProfile);
            }
          }, 0);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single()
          .then(({ data, error }) => {
            if (!error && data) {
              setProfile(data as UserProfile);
            }
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<{ data: any; error: any }> => {
    if (!user) return { data: null, error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single();

    if (!error && data) {
      setProfile(data as UserProfile);
    }

    return { data, error };
  };

  const uploadAvatar = async (file: Blob, fileName: string) => {
    if (!user) return { error: new Error('Not authenticated'), url: null };

    const filePath = `${user.id}/${fileName}`;

    // Delete old avatar if exists
    const { data: existingFiles } = await supabase.storage
      .from('avatars')
      .list(user.id);

    if (existingFiles && existingFiles.length > 0) {
      await supabase.storage
        .from('avatars')
        .remove(existingFiles.map(f => `${user.id}/${f.name}`));
    }

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) return { error: uploadError, url: null };

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Update profile with new avatar URL
    await updateProfile({ avatar_url: publicUrl });

    return { error: null, url: publicUrl };
  };

  const refreshProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!error && data) {
      setProfile(data as UserProfile);
    }
  };

  return {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    uploadAvatar,
    refreshProfile,
  };
}
