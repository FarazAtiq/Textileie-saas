export function normalizeCode(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

export function normalizeName(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function validateStyleForm(form) {
  const errors = [];
  if (!normalizeCode(form.article_number))
    errors.push("Article number is required");
  if (!String(form.style_name || "").trim())
    errors.push("Style name is required");
  return errors;
}

export function validateFabricForm(form) {
  const errors = [];
  if (!normalizeCode(form.fabric_code)) errors.push("Fabric code is required");
  if (!String(form.fabric_name || "").trim())
    errors.push("Fabric name is required");
  if ((Number(form.gsm) || 0) <= 0) errors.push("GSM must be greater than 0");
  if ((Number(form.cuttable_width) || 0) <= 0)
    errors.push("Cuttable width must be greater than 0");
  if ((Number(form.price) || 0) < 0) errors.push("Price cannot be negative");
  return errors;
}

export function validateThreadForm(form) {
  const errors = [];
  if (!normalizeCode(form.thread_code)) errors.push("Thread code is required");
  if (!String(form.thread_name || "").trim())
    errors.push("Thread name is required");
  if ((Number(form.price) || 0) < 0) errors.push("Price cannot be negative");
  if ((Number(form.cone_length) || 0) < 0)
    errors.push("Cone length cannot be negative");
  return errors;
}

export function duplicateMessage({ entity, code, existing }) {
  const details = [];
  if (existing?.style_name) details.push(`Style: ${existing.style_name}`);
  if (existing?.buyer) details.push(`Buyer: ${existing.buyer}`);
  if (existing?.fabric_name) details.push(`Fabric: ${existing.fabric_name}`);
  if (existing?.thread_name) details.push(`Thread: ${existing.thread_name}`);
  return `${entity} ${code} already exists.${ details.length ? " " + details.join(" · ") : "" } Please edit the existing record or use another code.`;
}
