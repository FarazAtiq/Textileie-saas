const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateInvite(invite, existing = []) {
  const errors = {};

  const email = invite.email.trim().toLowerCase();

  if (!email) {
    errors.email = "Email is required.";
  } else if (!EMAIL_RE.test(email)) {
    errors.email = "Enter a valid email address.";
  } else if (existing.some((i) => i.email.toLowerCase() === email)) {
    errors.email = "This person has already been invited.";
  }

  if (!invite.roleId) {
    errors.roleId = "Select a role.";
  }

  return errors;
}
