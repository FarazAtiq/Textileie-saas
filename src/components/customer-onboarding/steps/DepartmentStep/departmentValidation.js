export function validateDepartments(departments) {
  const errors = {};

  if (!departments || departments.length === 0) {
    errors.list = "Add at least one department to continue.";
    return errors;
  }

  const names = departments.map((d) => d.name.trim().toLowerCase());
  const hasDuplicate = names.some(
    (name, i) => name && names.indexOf(name) !== i
  );

  if (hasDuplicate) {
    errors.list = "Department names must be unique.";
  }

  const hasEmptyName = departments.some((d) => !d.name.trim());
  if (hasEmptyName) {
    errors.list = "Every department needs a name.";
  }

  return errors;
}

export function validateNewDepartment(department, existing = []) {
  const errors = {};

  if (!department.name.trim()) {
    errors.name = "Department name is required.";
  } else if (
    existing.some(
      (d) => d.name.trim().toLowerCase() === department.name.trim().toLowerCase()
    )
  ) {
    errors.name = "This department already exists.";
  }

  return errors;
}
