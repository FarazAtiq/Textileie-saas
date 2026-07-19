import { supabase } from "./supabase.js";
import { getMyAccessContext } from "./db.js";

function ensurePlatformAdmin(access) {
  if (!access?.isPlatformAdmin) {
    throw new Error("TextileIE platform administrator access required");
  }
}

export async function getPlatformDashboardSummary() {
  const access = await getMyAccessContext();
  ensurePlatformAdmin(access);

  const [
    companiesResult,
    usersResult,
    modulesResult,
    invitationsResult,
    activityResult,
  ] = await Promise.all([
    supabase
      .from("companies")
      .select(
        ` id, name, code, subscription_plan, subscription_status, licensed_users, subscription_expires_at, trial_ends_at, city, country, created_at, company_users(id, status), company_modules(id, module_key, enabled) `
      )
      .order("created_at", { ascending: false }),
    supabase.from("company_users").select("id, company_id, status"),
    supabase
      .from("company_modules")
      .select("company_id, module_key, enabled")
      .eq("enabled", true),
    supabase
      .from("company_user_invitations")
      .select("id, company_id, status")
      .eq("status", "Pending"),
    supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  const firstError = [
    companiesResult.error,
    usersResult.error,
    modulesResult.error,
    invitationsResult.error,
  ].find(Boolean);

  if (firstError) throw firstError;

  // Activity logs are optional during early installation.
  if (activityResult.error) {
    console.error(
      "getPlatformDashboardSummary activity error:",
      activityResult.error
    );
  }

  const companies = companiesResult.data || [];
  const users = usersResult.data || [];
  const modules = modulesResult.data || [];
  const invitations = invitationsResult.data || [];

  const statusCounts = {
    active: 0,
    trial: 0,
    suspended: 0,
    expired: 0,
    cancelled: 0,
  };

  const planCounts = {};
  const countryCounts = {};

  companies.forEach((company) => {
    const status = String(
      company.subscription_status || "Active"
    ).toLowerCase();
    if (Object.prototype.hasOwnProperty.call(statusCounts, status)) {
      statusCounts[status] += 1;
    }

    const plan = company.subscription_plan || "Unassigned";
    planCounts[plan] = (planCounts[plan] || 0) + 1;

    const country = company.country || "Not specified";
    countryCounts[country] = (countryCounts[country] || 0) + 1;
  });

  const licensedSeats = companies.reduce(
    (sum, company) => sum + Number(company.licensed_users || 0),
    0
  );

  const activeUsers = users.filter(
    (user) => String(user.status || "").toLowerCase() === "active"
  ).length;

  const expiringSoon = companies.filter((company) => {
    const dateValue = company.subscription_expires_at || company.trial_ends_at;
    if (!dateValue) return false;

    const expiryTime = new Date(dateValue).getTime();
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    return expiryTime >= now && expiryTime <= now + thirtyDays;
  }).length;

  return {
    kpis: {
      totalCompanies: companies.length,
      activeCompanies: statusCounts.active,
      trialCompanies: statusCounts.trial,
      suspendedCompanies: statusCounts.suspended,
      expiredCompanies: statusCounts.expired,
      licensedSeats,
      activeUsers,
      availableSeats: Math.max(licensedSeats - activeUsers, 0),
      pendingInvitations: invitations.length,
      enabledModuleLicenses: modules.length,
      expiringSoon,
    },
    planDistribution: Object.entries(planCounts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value),
    countryDistribution: Object.entries(countryCounts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value),
    recentCompanies: companies.slice(0, 8).map((company) => ({
      ...company,
      active_user_count: (company.company_users || []).filter(
        (user) => String(user.status || "").toLowerCase() === "active"
      ).length,
      enabled_module_count: (company.company_modules || []).filter(
        (module) => module.enabled
      ).length,
    })),
    recentActivity: activityResult.data || [],
  };
}
