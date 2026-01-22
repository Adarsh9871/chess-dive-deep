import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type UserRole = 'admin' | 'coach' | 'student' | null;

export const useUserRole = () => {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = useCallback(async () => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching role:', error);
        setRole('student'); // Default to student if error
      } else if (data) {
        setRole(data.role as UserRole);
      } else {
        // No role found, default to student
        setRole('student');
      }
    } catch (err) {
      console.error('Error in fetchRole:', err);
      setRole('student');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      fetchRole();
    }
  }, [authLoading, fetchRole]);

  const isAdmin = role === 'admin';
  const isCoach = role === 'coach';
  const isStudent = role === 'student' || role === null;

  const getDashboardPath = useCallback(() => {
    switch (role) {
      case 'admin':
        return '/admin';
      case 'coach':
        return '/coach-dashboard';
      default:
        return '/student-dashboard';
    }
  }, [role]);

  return {
    role,
    loading: authLoading || loading,
    isAdmin,
    isCoach,
    isStudent,
    getDashboardPath,
    refetchRole: fetchRole,
  };
};
