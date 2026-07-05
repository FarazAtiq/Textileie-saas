import { supabase } from './supabase.js';

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
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      throw new Error('Session error: ' + sessionError.message);
    }

    if (!sessionData.session) {
      throw new Error('Not logged in');
    }

    const userId = sessionData.session.user.id;

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
      throw new Error(error.message || 'Failed to insert report');
    }

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

export async function createSMVTemplate({ name, garment_type, article_number, operations, total_smv }) {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) throw new Error('Not logged in');

  const { data, error } = await supabase
    .from('smv_templates')
    .insert({
      user_id: sessionData.session.user.id,
      name: name,
      garment_type: garment_type || '',
      article_number: article_number || '',
      operations: operations,
      total_smv: total_smv
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

export async function getSMVDropdown() {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return [];

  const { data, error } = await supabase
    .from('smv_templates')
    .select('id, name, garment_type, article_number, total_smv')
    .order('article_number', { ascending: true });

  if (error) {
    console.error('getSMVDropdown error:', error);
    return [];
  }
  return data || [];
}

// ════════════════════════════════════════════════════════════
// MINI ERP: Style / Article / Color / BOM / Thread / Costing
// ════════════════════════════════════════════════════════════
async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data?.session?.user?.id || null;
}

export async function getStyles({ search = '', status, limit = 100 } = {}) {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  let query = supabase
    .from('styles')
    .select('*, style_colors(*), style_sizes(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status && status !== 'all') query = query.eq('status', status);
  if (search) {
    query = query.or(
      `article_number.ilike.%${search}%,buyer.ilike.%${search}%,style_name.ilike.%${search}%`
    );
  }

  const { data, error } = await query;
  if (error) {
    console.error('getStyles error:', error);
    return [];
  }
  return data || [];
}

export async function getStyle(id) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not logged in');

  const { data, error } = await supabase
    .from('styles')
    .select('*, style_colors(*), style_sizes(*)')
    .eq('user_id', userId)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createStyle(payload) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not logged in');

  const { data, error } = await supabase
    .from('styles')
    .insert({
      user_id: userId,
      article_number: payload.article_number || '',
      style_name: payload.style_name || '',
      buyer: payload.buyer || '',
      season: payload.season || '',
      garment_type: payload.garment_type || '',
      base_size: payload.base_size || 'L',
      costing_mode: payload.costing_mode || 'base_size',
      status: payload.status || 'development',
      brand: payload.brand || '',
      product_category: payload.product_category || '',
      costing_method: payload.costing_method || '',
      description: payload.description || '',
      notes: payload.notes || ''
    })
    .select()
    .single();

  if (error) {
    console.error('createStyle error:', error);
    throw error;
  }

  return getStyle(data.id);
}

export async function updateStyle(id, payload) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not logged in');

  const { data, error } = await supabase
    .from('styles')
    .update({
      article_number: payload.article_number || '',
      style_name: payload.style_name || '',
      buyer: payload.buyer || '',
      season: payload.season || '',
      garment_type: payload.garment_type || '',
      base_size: payload.base_size || 'L',
      costing_mode: payload.costing_mode || 'base_size',
      status: payload.status || 'development',
      notes: payload.notes || '',
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteStyle(id) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not logged in');

  const { error } = await supabase
    .from('styles')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function getStyleDropdown() {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('styles')
    .select('id, article_number, style_name, buyer, garment_type, base_size, costing_mode, style_colors(id, color_name, order_qty), style_sizes(id, size_name, ratio, scale_pct)')
    .eq('user_id', userId)
    .order('article_number', { ascending: true });
  if (error) {
    console.error('getStyleDropdown error:', error);
    return [];
  }
    return data || [];
}

export async function upsertStyleCostModule({ style_id, color_id, module_type, data, summary }) {
  const userId = await getCurrentUserId();
  const payload = {
    user_id: userId,
    style_id,
    color_id: color_id || null,
    module_type,
    data: data || {},
    summary: summary || {},
    updated_at: new Date().toISOString()
  };

  const { data: saved, error } = await supabase
    .from('style_cost_modules')
    .upsert(payload, { onConflict: 'user_id,style_id,color_id,module_type' })
    .select()
    .single();
  if (error) throw error;
  return saved;
}

export async function getStyleCostModules({ style_id, color_id } = {}) {
  const userId = await getCurrentUserId();
  let query = supabase
    .from('style_cost_modules')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (style_id) query = query.eq('style_id', style_id);
  if (color_id === null) query = query.is('color_id', null);
  if (color_id) query = query.eq('color_id', color_id);
  const { data, error } = await query;
  if (error) {
    console.error('getStyleCostModules error:', error);
    return [];
  }
  return data || [];
}

export async function getStyleCostSummary({ style_id, color_id }) {
  const modules = await getStyleCostModules({ style_id, color_id });
  const byType = {};
  modules.forEach(m => { byType[m.module_type] = m; });
  return byType;
}
