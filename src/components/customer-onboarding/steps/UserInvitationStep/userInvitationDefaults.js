// `code` must match the codes seeded by the create_company_workspace RPC
// (supabase/migrations/002_bootstrap_workspace.sql) so invitations can be
// mapped to the real roles.role_id created for this workspace.
export const defaultRoles = [
  {
    id: "administrator",
    code: "OWNER",
    name: "Administrator",
    description: "Full access to all modules, settings, and user management.",
  },
  {
    id: "manager",
    code: "MANAGER",
    name: "Manager",
    description: "Manage engineering, production, and reporting modules.",
  },
  {
    id: "industrial-engineer",
    code: "INDUSTRIAL_ENGINEER",
    name: "Industrial Engineer",
    description: "Access to SMV, capacity, efficiency, and costing tools.",
  },
  {
    id: "production-supervisor",
    code: "PRODUCTION_SUPERVISOR",
    name: "Production Supervisor",
    description: "Access to export orders, requirements, and factory floor data.",
  },
  {
    id: "viewer",
    code: "VIEWER",
    name: "Viewer",
    description: "Read-only access to reports and dashboards.",
  },
];

export const defaultInvite = {
  email: "",
  roleId: "",
  departmentCode: "",
};
