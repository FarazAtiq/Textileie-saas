import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { signUp, signIn, signOut, getProfile } from '../lib/db.js';

const AuthContext = createContext(null);

function normalizeStatus(value) {
  return String(value || '').trim().toLowerCase();
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [companyUser, setCompanyUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [factory, setFactory] = useState(null);
  const [department, setDepartment] = useState(null);
  const [role, setRole] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  const clearCompanyContext = () => {
    setCompanyUser(null);
    setCompany(null);
    setFactory(null);
    setDepartment(null);
    setRole(null);
    setPermissions([]);
  };

  const loadCompanyContext = async (userId) => {
    const { data: membership, error: membershipError } = await supabase
      .from('company_users')
      .select(`
        id,
        company_id,
        user_id,
        invited_email,
        role_id,
        factory_id,
        department_id,
        status,
        full_name,
        employee_id,
        phone,
        designation,
        is_factory_owner,
        last_login_at,
        created_at,
        updated_at,
        company:companies(
          id,
          owner_user_id,
          name,
          code,
          status,
          subscription_plan,
          subscription_status,
          licensed_users,
          subscription_starts_at,
          subscription_expires_at,
          logo_url,
          address,
          city,
          country,
          currency,
          timezone,
          created_at,
          updated_at
        ),
        factory:factories(
          id,
          company_id,
          name,
          code,
          status
        ),
        department:departments(
          id,
          company_id,
          factory_id,
          name,
          code,
          status
        ),
        role:roles(
          id,
          company_id,
          name,
          code,
          description,
          status,
          is_system
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'Active')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (membershipError) throw membershipError;

    if (!membership) {
      clearCompanyContext();
      return null;
    }

    const { data: rolePermissions, error: permissionError } = await supabase
      .from('role_permissions')
      .select('module_key, action_key, allowed')
      .eq('role_id', membership.role_id)
      .eq('allowed', true);

    if (permissionError) throw permissionError;

    setCompanyUser(membership);
    setCompany(membership.company || null);
    setFactory(membership.factory || null);
    setDepartment(membership.department || null);
    setRole(membership.role || null);
    setPermissions(rolePermissions || []);

    return membership;
  };

  const loadProfile = async (userId) => {
    setAuthError('');

    try {
      const [personalProfile] = await Promise.all([
        getProfile(userId),
        loadCompanyContext(userId),
      ]);

      setProfile(personalProfile || null);
    } catch (error) {
      console.error('Failed to load TextileIE user context:', error);
      setProfile(null);
      clearCompanyContext();
      setAuthError(error?.message || 'Failed to load user access.');
    }
  };

  useEffect(() => {
    let active = true;

    const initialize = async () => {
      setLoading(true);

      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) throw error;
        if (!active) return;

        const sessionUser = session?.user ?? null;
        setUser(sessionUser);

        if (sessionUser) {
          await loadProfile(sessionUser.id);
        } else {
          setProfile(null);
          clearCompanyContext();
        }
      } catch (error) {
        console.error('Authentication initialization failed:', error);
        if (active) setAuthError(error?.message || 'Authentication failed.');
      } finally {
        if (active) setLoading(false);
      }
    };

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const sessionUser = session?.user ?? null;

      setUser(sessionUser);
      setLoading(true);

      try {
        if (sessionUser) {
          await loadProfile(sessionUser.id);
        } else {
          setProfile(null);
          clearCompanyContext();
        }
      } finally {
        setLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

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
    clearCompanyContext();
  };

  const refreshProfile = async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      await loadProfile(user.id);
    } finally {
      setLoading(false);
    }
  };

  const isOwner = useMemo(() => {
    if (!user || !company) return false;

    return Boolean(
      companyUser?.is_factory_owner ||
      company.owner_user_id === user.id
    );
  }, [company, companyUser, user]);

  const isCompanyAdmin = useMemo(() => {
    const roleCode = String(role?.code || '').trim().toLowerCase();
    const roleName = String(role?.name || '').trim().toLowerCase();

    return (
      isOwner ||
      ['owner', 'factory_owner', 'factory_admin', 'admin'].includes(roleCode) ||
      ['owner', 'factory owner', 'factory admin', 'admin'].includes(roleName)
    );
  }, [isOwner, role]);

  const can = (moduleKey, actionKey = 'view') => {
    if (!user || normalizeStatus(companyUser?.status) !== 'active') return false;
    if (isOwner) return true;

    return permissions.some(
      permission =>
        permission.allowed === true &&
        permission.module_key === moduleKey &&
        permission.action_key === actionKey
    );
  };

  const value = {
    user,
    profile,
    companyUser,
    company,
    factory,
    department,
    role,
    permissions,
    loading,
    authError,
    isOwner,
    isCompanyAdmin,
    can,
    register,
    login,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
};
