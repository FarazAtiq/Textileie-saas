import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import {
  signUp,
  signIn,
  signOut,
  getProfile,
  getMyAccessContext,
  acceptPendingInvitations,
  ensureTrialWorkspace,
} from '../lib/db.js';

const AuthContext = createContext(null);

const FULL_ACCESS_ACTIONS = {
  view: true,
  create: true,
  edit: true,
  delete: true,
  approve: true,
  export: true,
  view_cost: true,
  design_reports: true,
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [access, setAccess] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUserContext = useCallback(async (authUser) => {
    if (!authUser?.id) {
      setProfile(null);
      setAccess(null);
      return;
    }

    // Pick up any pending invitation for this email before loading
    // access, so a first-time login after accepting an invite
    // reflects the new membership immediately. Non-fatal: normal
    // login must still work even if this call fails.
    try {
      await acceptPendingInvitations();
    } catch (err) {
      console.error('acceptPendingInvitations error:', err);
    }

    // If the invitation check above didn't enroll this user anywhere,
    // and they're a genuinely new self-registered account (not a
    // pre-existing user, not a platform admin), auto-provision their
    // 30-day trial workspace. The RPC itself guards every one of
    // those conditions — this call is safe to make unconditionally.
    try {
      await ensureTrialWorkspace();
    } catch (err) {
      console.error('ensureTrialWorkspace error:', err);
    }

    const [profileResult, accessResult] = await Promise.allSettled([
      getProfile(authUser.id),
      getMyAccessContext(),
    ]);

    setProfile(profileResult.status === 'fulfilled' ? profileResult.value : null);
    setAccess(accessResult.status === 'fulfilled' ? accessResult.value : null);
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      await loadUserContext(nextUser);
      if (mounted) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      await loadUserContext(nextUser);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserContext]);

  const register = async (data) => {
    await signUp(data);
  };

  const login = async (email, password) => {
    const { user: signedInUser } = await signIn({ email, password });
    return signedInUser;
  };

  const logout = async () => {
    await signOut();
    setUser(null);
    setProfile(null);
    setAccess(null);
  };

  const refreshProfile = async () => {
    if (user) await loadUserContext(user);
  };

  const refreshAccess = async () => {
    if (user) {
      const nextAccess = await getMyAccessContext();
      setAccess(nextAccess);
      return nextAccess;
    }
    return null;
  };

  const can = useCallback((moduleKey, actionKey = 'view') => {
    if (!user) return false;

    // Existing single-user installations remain fully usable until
    // enterprise access has been configured in Supabase.
    if (!access || !access.hasConfiguredAccess) return true;
// TextileIE platform admins are not blocked by factory role permissions.
    if (access.isPlatformAdmin) return true;

    // Expired trial: read-only. Data stays fully intact and visible
    // (view still allowed) — only writes are blocked, until the
    // workspace is upgraded to a paid subscription.
    if (access.subscription?.isTrialExpired) return actionKey === 'view';

    // Subscription/module license is checked before role permission.
    
    const subscriptionStatus = String(access.subscription?.status || 'Active').toLowerCase();
    if (['suspended', 'expired', 'cancelled'].includes(subscriptionStatus)) return false;
    if (access.enabledModules && access.enabledModules[moduleKey] === false) return false;

    if (access.isOwner) return true;
    return Boolean(access.permissions?.[moduleKey]?.[actionKey]);
  }, [access, user]);

  const getModulePermissions = useCallback((moduleKey) => {
    if (!access || access.isOwner || !access.hasConfiguredAccess) {
      return { ...FULL_ACCESS_ACTIONS };
    }
    return { ...(access.permissions?.[moduleKey] || {}) };
  }, [access]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        access,
        role: access?.role || null,
        membership: access?.membership || null,
        permissions: access?.permissions || {},
        loading,
        register,
        login,
        logout,
        refreshProfile,
        refreshAccess,
        can,
        getModulePermissions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
