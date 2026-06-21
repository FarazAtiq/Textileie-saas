import { supabase } from './supabase.js';

// ── Auth ──────────────────────────────────────────────────────

export async function signUp({ email, password, full_name, company_name }) {
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { full_name, company_name } }
  });
  if (error) throw error;
  return data;
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Reports ───────────────────────────────────────────────────

export async function getReports({ type, starred, limit = 50 } = {}) {
  let query = supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (type)    query = query.eq('type', type);
  if (starred) query = query.eq('is_starred', true);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getReportStats() {
  // Total count
  const { count: total } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true });

  // By type
  const { data: byType } = await supabase
    .from('reports')
    .select('type')
    .then(({ data }) => {
      const counts = {};
      (data || []).forEach(r => { counts[r.type] = (counts[r.type] || 0) + 1; });
      return { data: counts };
    });

  // Recent 5
  const { data: recent } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  return { total: total || 0, byType: byType || {}, recent: recent || [] };
}

export async function createReport({ type, title, inputs, results, notes = '', tags = [] }) {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('reports')
    .insert({ user_id: user.id, type, title, inputs, results, notes, tags })
    .select()
    .single();
  if (error) throw error;

  // Log usage
  await supabase.from('usage_log').insert({ user_id: user.id, action: 'report_created' });
  return data;
}

export async function updateReport(id, updates) {
  const { data, error } = await supabase
    .from('reports')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteReport(id) {
  const { error } = await supabase.from('reports').delete().eq('id', id);
  if (error) throw error;
}

export async function toggleStar(id, current) {
  return updateReport(id, { is_starred: !current });
}

// ── SMV Templates ─────────────────────────────────────────────

export async function getSMVTemplates() {
  const { data, error } = await supabase
    .from('smv_templates')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createSMVTemplate({ name, garment_type, operations, total_smv }) {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('smv_templates')
    .insert({ user_id: user.id, name, garment_type, operations, total_smv })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSMVTemplate(id) {
  const { error } = await supabase.from('smv_templates').delete().eq('id', id);
  if (error) throw error;
}
