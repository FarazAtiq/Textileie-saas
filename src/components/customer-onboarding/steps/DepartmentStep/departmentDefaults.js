export const defaultDepartment = {
  code: "",
  name: "",
  type: "Production",
  status: "Active",
};

export const departmentTypes = [
  "Production",
  "Support",
  "Quality",
  "Administration",
  "Warehouse",
];

// Common garment-factory departments offered as one-tap quick-add.
export const departmentPresets = [
  { name: "Cutting", type: "Production" },
  { name: "Sewing", type: "Production" },
  { name: "Finishing", type: "Production" },
  { name: "Embroidery", type: "Production" },
  { name: "Printing", type: "Production" },
  { name: "Washing", type: "Production" },
  { name: "Packing", type: "Production" },
  { name: "Quality Assurance", type: "Quality" },
  { name: "Warehouse", type: "Warehouse" },
  { name: "Maintenance", type: "Support" },
  { name: "Human Resources", type: "Administration" },
  { name: "Administration", type: "Administration" },
];

let counter = 0;
export function nextDepartmentCode(existing = []) {
  counter = existing.length;
  let code;
  do {
    counter += 1;
    code = `DEPT-${String(counter).padStart(3, "0")}`;
  } while (existing.some((d) => d.code === code));
  return code;
}
