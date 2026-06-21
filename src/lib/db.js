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
  if (error) {
    console.error('getProfile error:', error);
    return null;
  }
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
  if (type) query = query.eq('type', type);
  if (starred) query = query.eq('is_starred', true);
  const { data, error } = await query;
  if (error) {
    console.error('getReports error:', error);
    return [];
  }
  return data || [];
}

export async function getReportStats() {
  try {
    const { count: total } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true });

    const { data: allReports } = await supabase
      .from('reports')
      .select('type');

    const byType = {};
    if (allReports) {
      allReports.forEach(r => {
        byType[r.type] = (byType[r.type] || 0) + 1;
      });
    }

    const { data: recent } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    return {
      total: total || 0,
      byType: byType || {},
      recent: recent || []
    };
  } catch (err) {
    console.error('getReportStats error:', err);
    return { total: 0, byType: {}, recent: [] };
  }
}

export async function createReport({ type, title, inputs, results, notes, tags }) {
  try {
    // Get current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      throw new Error('Session error: ' + sessionError.message);
    }

    if (!sessionData.session) {
      console.error('No session found');
      throw new Error('Not logged in - no session');
    }

    const userId = sessionData.session.user.id;
    console.log('Creating report for user:', userId);
    console.log('Report data:', { type, title, inputs, results });

    const { data, error } = await supabase
      .from('reports')
      .insert({
        user_id: userId,
        type: type,
        title: title,
        inputs: inputs,
        results: results,
        notes: notes || '',
        tags: tags || []
      })
      .select()
      .single();

    if (error) {
      console.error('Insert report error:', error);
      console.error('Error details:', JSON.stringify(error));
      throw new Error(error.message || 'Failed to insert report');
    }

    console.log('Report created successfully:', data);
    return data;

  } catch (err) {
    console.error('createReport failed:', err);
    throw err;
  }
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
  const { error } = await supabase
    .from('reports')
    .delete()
    .eq('id', id);
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
  if (error) {
    console.error('getSMVTemplates error:', error);
    return [];
  }
  return data || [];
}

export async function createSMVTemplate({ name, garment_type, operations, total_smv }) {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) throw new Error('Not logged in');

  const { data, error } = await supabase
    .from('smv_templates')
    .insert({
      user_id: sessionData.session.user.id,
      name,
      garment_type,
      operations,
      total_smv
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSMVTemplate(id) {
  const { error } = await supabase
    .from('smv_templates')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
// ── Get SMV templates for dropdown ───────────────────────────
export async function getSMVDropdown() {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return [];

  const { data, error } = await supabase
    .from('smv_templates')
    .select('id, name, garment_type, total_smv')
    .order('name', { ascending: true });

  if (error) {
    console.error('getSMVDropdown error:', error);
    return [];
  }
  return data || [];
}
