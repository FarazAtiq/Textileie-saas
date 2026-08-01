export const defaultRoles = [
  {
    id: "administrator",
    name: "Administrator",
    description: "Full access to all modules, settings, and user management.",
  },
  {
    id: "manager",
    name: "Manager",
    description: "Manage engineering, production, and reporting modules.",
  },
  {
    id: "industrial-engineer",
    name: "Industrial Engineer",
    description: "Access to SMV, capacity, efficiency, and costing tools.",
  },
  {
    id: "production-supervisor",
    name: "Production Supervisor",
    description: "Access to export orders, requirements, and factory floor data.",
  },
  {
    id: "viewer",
    name: "Viewer",
    description: "Read-only access to reports and dashboards.",
  },
];

export const defaultInvite = {
  email: "",
  roleId: "",
  departmentCode: "",
};
