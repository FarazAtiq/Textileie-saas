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
    .select('*, style_colors(*), style_sizes(*), style_cost_modules(*)')
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

  const { data: style, error: styleError } = await supabase
    .from('styles')
    .insert({
      user_id: userId,
      article_number: payload.article_number || '',
      style_name: payload.style_name || '',
      buyer: payload.buyer || '',
      brand: payload.brand || '',
      season: payload.season || '',
      garment_type: payload.garment_type || '',
      product_category: payload.product_category || '',
      base_size: payload.base_size || 'L',
      costing_mode: payload.costing_mode || 'base_size',
      costing_method: payload.costing_method || 'FOB',
      description: payload.description || '',
      status: payload.status || 'development',
      notes: payload.notes || ''
    })
    .select()
    .single();

  if (styleError) {
    console.error('createStyle style error:', styleError);
    throw styleError;
  }

  const colors = (payload.colors || [])
    .filter(c => c.color_name && c.color_name.trim())
    .map(c => ({
  user_id: userId,
  style_id: style.id,
  color_name: c.color_name || '',
  color_code: c.color_code || '',
  order_qty: Number(c.order_qty || 0),
  buyer_color_code: c.buyer_color_code || '',
  pantone: c.pantone || '',
  status: c.status || 'Active'
}));

  if (colors.length) {
    const { error } = await supabase.from('style_colors').insert(colors);
    if (error) {
      console.error('createStyle colors error:', error);
      throw error;
    }
  }

  const sizes = (payload.sizes || [])
    .filter(s => s.size_name && s.size_name.trim())
   .map((s, index) => ({
  user_id: userId,
  style_id: style.id,
  size_name: s.size_name || '',
  ratio: Number(s.ratio || 1),
  scale_pct: Number(s.scale_pct || 0),
  grading: Number(s.grading ?? s.scale_pct ?? 0),
  status: s.status || 'Active',
  sort_order: index + 1
}));

  if (sizes.length) {
    const { error } = await supabase.from('style_sizes').insert(sizes);
    if (error) {
      console.error('createStyle sizes error:', error);
      throw error;
    }
  }

  return getStyle(style.id);
}

export async function updateStyle(id, payload) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not logged in');

  const { data: style, error: styleError } = await supabase
    .from('styles')
    .update({
      article_number: payload.article_number || '',
      style_name: payload.style_name || '',
      buyer: payload.buyer || '',
      brand: payload.brand || '',
      season: payload.season || '',
      garment_type: payload.garment_type || '',
      product_category: payload.product_category || '',
      base_size: payload.base_size || 'L',
      costing_mode: payload.costing_mode || 'base_size',
      costing_method: payload.costing_method || 'FOB',
      description: payload.description || '',
      status: payload.status || 'development',
      notes: payload.notes || '',
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (styleError) {
    console.error('updateStyle style error:', styleError);
    throw styleError;
  }

  const { error: deleteColorsError } = await supabase
    .from('style_colors')
    .delete()
    .eq('style_id', id);

  if (deleteColorsError) {
    console.error('updateStyle delete colors error:', deleteColorsError);
    throw deleteColorsError;
  }

  const { error: deleteSizesError } = await supabase
    .from('style_sizes')
    .delete()
    .eq('style_id', id);

  if (deleteSizesError) {
    console.error('updateStyle delete sizes error:', deleteSizesError);
    throw deleteSizesError;
  }

  const colors = (payload.colors || [])
    .filter(c => c.color_name && c.color_name.trim())
    .map(c => ({
      style_id: id,
      color_name: c.color_name || '',
      color_code: c.color_code || '',
      order_qty: Number(c.order_qty || 0),
      buyer_color_code: c.buyer_color_code || '',
      pantone: c.pantone || '',
      status: c.status || 'Active'
    }));

  if (colors.length) {
    const { error } = await supabase.from('style_colors').insert(colors);
    if (error) {
      console.error('updateStyle colors error:', error);
      throw error;
    }
  }

  const sizes = (payload.sizes || [])
    .filter(s => s.size_name && s.size_name.trim())
    .map((s, index) => ({
      style_id: id,
      size_name: s.size_name || '',
      ratio: Number(s.ratio || 1),
      scale_pct: Number(s.scale_pct || 0),
      grading: Number(s.grading ?? s.scale_pct ?? 0),
      status: s.status || 'Active',
      sort_order: index + 1
    }));

  if (sizes.length) {
    const { error } = await supabase.from('style_sizes').insert(sizes);
    if (error) {
      console.error('updateStyle sizes error:', error);
      throw error;
    }
  }

  return getStyle(style.id);
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
// ════════════════════════════════════════════════════════════
// FABRIC MASTER
// ════════════════════════════════════════════════════════════

export async function getFabrics({ search = '', status = 'all', limit = 100 } = {}) {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  let query = supabase
    .from('fabric_master')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status && status !== 'all') query = query.eq('status', status);

  if (search) {
    query = query.or(
      `fabric_code.ilike.%${search}%,fabric_name.ilike.%${search}%,description.ilike.%${search}%,supplier.ilike.%${search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error('getFabrics error:', error);
    return [];
  }

  return data || [];
}

export async function createFabric(payload) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not logged in');

  const { data, error } = await supabase
    .from('fabric_master')
    .insert({
      user_id: userId,
      fabric_code: payload.fabric_code || '',
      fabric_name: payload.fabric_name || '',
      description: payload.description || '',
      composition: payload.composition || '',
      gsm: Number(payload.gsm || 0),
      finished_width: Number(payload.finished_width || 0),
      cuttable_width: Number(payload.cuttable_width || 0),
      width_unit: payload.width_unit || 'inch',
      supplier: payload.supplier || '',
      price_unit: payload.price_unit || 'KG',
      price: Number(payload.price || 0),
      currency: payload.currency || 'USD',
      lead_time_days: Number(payload.lead_time_days || 0),
      moq: Number(payload.moq || 0),
      storage_location: payload.storage_location || '',
      status: payload.status || 'Active',
      notes: payload.notes || ''
    })
    .select()
    .single();

  if (error) {
    console.error('createFabric error:', error);
    throw error;
  }

  return data;
}

export async function updateFabric(id, payload) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not logged in');

  const { data, error } = await supabase
    .from('fabric_master')
    .update({
      fabric_code: payload.fabric_code || '',
      fabric_name: payload.fabric_name || '',
      description: payload.description || '',
      composition: payload.composition || '',
      gsm: Number(payload.gsm || 0),
      finished_width: Number(payload.finished_width || 0),
      cuttable_width: Number(payload.cuttable_width || 0),
      width_unit: payload.width_unit || 'inch',
      supplier: payload.supplier || '',
      price_unit: payload.price_unit || 'KG',
      price: Number(payload.price || 0),
      currency: payload.currency || 'USD',
      lead_time_days: Number(payload.lead_time_days || 0),
      moq: Number(payload.moq || 0),
      storage_location: payload.storage_location || '',
      status: payload.status || 'Active',
      notes: payload.notes || '',
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('updateFabric error:', error);
    throw error;
  }

  return data;
}

export async function deleteFabric(id) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Not logged in');

  const { error } = await supabase
    .from('fabric_master')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    console.error('deleteFabric error:', error);
    throw error;
  }
}
