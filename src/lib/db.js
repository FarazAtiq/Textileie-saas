import { supabase } from "./supabase.js";

export async function signUp({ email, password, full_name, company_name }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name, company_name } },
  });
  if (error) throw error;
  return data;
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) {
    console.error("getProfile error:", error);
    return null;
  }
  return data;
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getReports({ type, starred, limit = 50 } = {}) {
  let query = supabase
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (type) query = query.eq("type", type);
  if (starred) query = query.eq("is_starred", true);
  const { data, error } = await query;
  if (error) {
    console.error("getReports error:", error);
    return [];
  }
  return data || [];
}

export async function getReportStats() {
  try {
    const { count: total } = await supabase
      .from("reports")
      .select("*", { count: "exact", head: true });

    const { data: allReports } = await supabase.from("reports").select("type");

    const byType = {};
    if (allReports) {
      allReports.forEach((r) => {
        byType[r.type] = (byType[r.type] || 0) + 1;
      });
    }

    const { data: recent } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);

    return {
      total: total || 0,
      byType: byType || {},
      recent: recent || [],
    };
  } catch (err) {
    console.error("getReportStats error:", err);
    return { total: 0, byType: {}, recent: [] };
  }
}

export async function createReport({ type, title, inputs, results, notes, tags, }) {
  try {
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError) {
      throw new Error("Session error: " + sessionError.message);
    }

    if (!sessionData.session) {
      throw new Error("Not logged in");
    }

    const userId = sessionData.session.user.id;

    const { data, error } = await supabase
      .from("reports")
      .insert({
        user_id: userId,
        type: type,
        title: title,
        inputs: inputs,
        results: results,
        notes: notes || "",
        tags: tags || [],
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message || "Failed to insert report");
    }

    return data;
  } catch (err) {
    console.error("createReport failed:", err);
    throw err;
  }
}

export async function updateReport(id, updates) {
  const { data, error } = await supabase
    .from("reports")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteReport(id) {
  const { error } = await supabase.from("reports").delete().eq("id", id);
  if (error) throw error;
}

export async function toggleStar(id, current) {
  return updateReport(id, { is_starred: !current });
}

export async function getSMVTemplates() {
  const { data, error } = await supabase
    .from("smv_templates")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("getSMVTemplates error:", error);
    return [];
  }
  return data || [];
}

export async function createSMVTemplate({ name, garment_type, article_number, operations, total_smv, }) {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) throw new Error("Not logged in");

  const { data, error } = await supabase
    .from("smv_templates")
    .insert({
      user_id: sessionData.session.user.id,
      name: name,
      garment_type: garment_type || "",
      article_number: article_number || "",
      operations: operations,
      total_smv: total_smv,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSMVTemplate(id) {
  const { error } = await supabase.from("smv_templates").delete().eq("id", id);
  if (error) throw error;
}

export async function getSMVDropdown() {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return [];

  const { data, error } = await supabase
    .from("smv_templates")
    .select("id, name, garment_type, article_number, total_smv")
    .order("article_number", { ascending: true });

  if (error) {
    console.error("getSMVDropdown error:", error);
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

export async function getStyles({ search = "", status, limit = 100 } = {}) {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  let query = supabase
    .from("styles")
    .select("*, style_colors(*), style_sizes(*), style_cost_modules(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status && status !== "all") query = query.eq("status", status);
  if (search) {
    query = query.or(
      `article_number.ilike.%${search}%,buyer.ilike.%${search}%,style_name.ilike.%${search}%`
    );
  }

  const { data, error } = await query;
  if (error) {
    console.error("getStyles error:", error);
    return [];
  }
  return data || [];
}

export async function getStyle(id) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not logged in");

  const { data, error } = await supabase
    .from("styles")
    .select("*, style_colors(*), style_sizes(*)")
    .eq("user_id", userId)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function createStyle(payload) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not logged in");

  const { data: style, error: styleError } = await supabase
    .from("styles")
    .insert({
      user_id: userId,
      article_number: payload.article_number || "",
      style_name: payload.style_name || "",
      buyer: payload.buyer || "",
      brand: payload.brand || "",
      season: payload.season || "",
      garment_type: payload.garment_type || "",
      product_category: payload.product_category || "",
      base_size: payload.base_size || "L",
      costing_mode: payload.costing_mode || "base_size",
      costing_method: payload.costing_method || "FOB",
      description: payload.description || "",
      notes: payload.notes || "",
      status: payload.status || "development",
    })
    .select()
    .single();

  if (styleError) {
    console.error("createStyle style error:", styleError);
    throw styleError;
  }

  const colors = (payload.colors || [])
    .filter((c) => c.color_name && c.color_name.trim())
    .map((c) => ({
      user_id: userId,
      style_id: style.id,
      color_name: c.color_name || "",
      color_code: c.color_code || "",
      order_qty: Number(c.order_qty || 0),
      buyer_color_code: c.buyer_color_code || "",
      pantone: c.pantone || "",
      status: c.status || "Active",
    }));

  if (colors.length) {
    const { error } = await supabase.from("style_colors").insert(colors);
    if (error) {
      console.error("createStyle colors error:", error);
      throw error;
    }
  }

  const sizes = (payload.sizes || [])
    .filter((s) => s.size_name && s.size_name.trim())
    .map((s, index) => ({
      user_id: userId,
      style_id: style.id,
      size_name: s.size_name || "",
      ratio: Number(s.ratio || 1),
      scale_pct: Number(s.scale_pct || 0),
      grading: Number(s.grading ?? s.scale_pct ?? 0),
      status: s.status || "Active",
      sort_order: index + 1,
    }));

  if (sizes.length) {
    const { error } = await supabase.from("style_sizes").insert(sizes);
    if (error) {
      console.error("createStyle sizes error:", error);
      throw error;
    }
  }

  return getStyle(style.id);
}

export async function updateStyle(id, payload) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not logged in");

  const { data: style, error: styleError } = await supabase
    .from("styles")
    .update({
      article_number: payload.article_number || "",
      style_name: payload.style_name || "",
      buyer: payload.buyer || "",
      brand: payload.brand || "",
      season: payload.season || "",
      garment_type: payload.garment_type || "",
      product_category: payload.product_category || "",
      base_size: payload.base_size || "L",
      costing_mode: payload.costing_mode || "base_size",
      costing_method: payload.costing_method || "FOB",
      description: payload.description || "",
      status: payload.status || "development",
      notes: payload.notes || "",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (styleError) {
    console.error("updateStyle style error:", styleError);
    throw styleError;
  }

  const { error: deleteColorsError } = await supabase
    .from("style_colors")
    .delete()
    .eq("style_id", id);

  if (deleteColorsError) {
    console.error("updateStyle delete colors error:", deleteColorsError);
    throw deleteColorsError;
  }

  const { error: deleteSizesError } = await supabase
    .from("style_sizes")
    .delete()
    .eq("style_id", id);

  if (deleteSizesError) {
    console.error("updateStyle delete sizes error:", deleteSizesError);
    throw deleteSizesError;
  }

  const colors = (payload.colors || [])
    .filter((c) => c.color_name && c.color_name.trim())
    .map((c) => ({
      style_id: id,
      color_name: c.color_name || "",
      color_code: c.color_code || "",
      order_qty: Number(c.order_qty || 0),
      buyer_color_code: c.buyer_color_code || "",
      pantone: c.pantone || "",
      status: c.status || "Active",
    }));

  if (colors.length) {
    const { error } = await supabase.from("style_colors").insert(colors);
    if (error) {
      console.error("updateStyle colors error:", error);
      throw error;
    }
  }

  const sizes = (payload.sizes || [])
    .filter((s) => s.size_name && s.size_name.trim())
    .map((s, index) => ({
      style_id: id,
      size_name: s.size_name || "",
      ratio: Number(s.ratio || 1),
      scale_pct: Number(s.scale_pct || 0),
      grading: Number(s.grading ?? s.scale_pct ?? 0),
      status: s.status || "Active",
      sort_order: index + 1,
    }));

  if (sizes.length) {
    const { error } = await supabase.from("style_sizes").insert(sizes);
    if (error) {
      console.error("updateStyle sizes error:", error);
      throw error;
    }
  }

  return getStyle(style.id);
}

export async function deleteStyle(id) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not logged in");

  const { error } = await supabase
    .from("styles")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function getStyleDropdown() {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("styles")
    .select(
      "id, article_number, style_name, buyer, garment_type, base_size, costing_mode, style_colors(id, color_name, order_qty), style_sizes(id, size_name, ratio, scale_pct)"
    )
    .eq("user_id", userId)
    .order("article_number", { ascending: true });
  if (error) {
    console.error("getStyleDropdown error:", error);
    return [];
  }
  return data || [];
}

export async function upsertStyleCostModule({ style_id, color_id, module_type, data, summary, }) {
  const userId = await getCurrentUserId();
  const payload = {
    user_id: userId,
    style_id,
    color_id: color_id || null,
    module_type,
    data: data || {},
    summary: summary || {},
    updated_at: new Date().toISOString(),
  };

  const { data: saved, error } = await supabase
    .from("style_cost_modules")
    .upsert(payload, { onConflict: "user_id,style_id,color_id,module_type" })
    .select()
    .single();
  if (error) throw error;
  return saved;
}

export async function getStyleCostModules({ style_id, color_id } = {}) {
  const userId = await getCurrentUserId();
  let query = supabase
    .from("style_cost_modules")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (style_id) query = query.eq("style_id", style_id);
  if (color_id === null) query = query.is("color_id", null);
  if (color_id) query = query.eq("color_id", color_id);
  const { data, error } = await query;
  if (error) {
    console.error("getStyleCostModules error:", error);
    return [];
  }
  return data || [];
}

export async function getStyleCostSummary({ style_id, color_id } = {}) {
  const userId = await getCurrentUserId();
  if (!userId || !style_id) return {};

  // Load all saved engineering modules for the style. This supports older
  // records saved against a color as well as newer common style-level records.
  const { data, error } = await supabase
    .from("style_cost_modules")
    .select("*")
    .eq("user_id", userId)
    .eq("style_id", style_id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("getStyleCostSummary error:", error);
    return {};
  }

  const byType = {};
  const rows = data || [];

  // Priority:
  // 1. Requested color-specific record, when a color is supplied.
  // 2. Common style-level record (color_id is null).
  // 3. Latest record saved under any color, for backward compatibility.
  const moduleTypes = [
    ...new Set(rows.map((row) => row.module_type).filter(Boolean)),
  ];

  moduleTypes.forEach((moduleType) => {
    const matches = rows.filter((row) => row.module_type === moduleType);
    const requestedColor = color_id
      ? matches.find((row) => String(row.color_id || "") === String(color_id))
      : null;
    const common = matches.find((row) => row.color_id == null);
    byType[moduleType] = requestedColor || common || matches[0];
  });

  return byType;
}
// ════════════════════════════════════════════════════════════
// FABRIC MASTER
// ════════════════════════════════════════════════════════════

export async function getFabrics({ search = "", status = "all", limit = 100, } = {}) {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  let query = supabase
    .from("fabric_master")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status && status !== "all") query = query.eq("status", status);

  if (search) {
    query = query.or(
      `fabric_code.ilike.%${search}%,fabric_name.ilike.%${search}%,description.ilike.%${search}%,supplier.ilike.%${search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("getFabrics error:", error);
    return [];
  }

  return data || [];
}

export async function createFabric(payload) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not logged in");

  const { data, error } = await supabase
    .from("fabric_master")
    .insert({
      user_id: userId,
      fabric_code: payload.fabric_code || "",
      fabric_name: payload.fabric_name || "",
      description: payload.description || "",
      composition: payload.composition || "",
      gsm: Number(payload.gsm || 0),
      finished_width: Number(payload.finished_width || 0),
      cuttable_width: Number(payload.cuttable_width || 0),
      width_unit: payload.width_unit || "inch",
      supplier: payload.supplier || "",
      price_unit: payload.price_unit || "KG",
      price: Number(payload.price || 0),
      currency: payload.currency || "USD",
      lead_time_days: Number(payload.lead_time_days || 0),
      moq: Number(payload.moq || 0),
      storage_location: payload.storage_location || "",
      status: payload.status || "Active",
      notes: payload.notes || "",
      fabric_type: payload.fabric_type || "",
      fabric_category: payload.fabric_category || "",
      supplier_fabric_code: payload.supplier_fabric_code || "",
      fabric_form: payload.fabric_form || "Open Width",
      color_type: payload.color_type || "Solid",
      shrinkage_length_pct: Number(payload.shrinkage_length_pct || 0),
      shrinkage_width_pct: Number(payload.shrinkage_width_pct || 0),
      image_url: payload.image_url || "",
      fabric_type: payload.fabric_type || "",
      fabric_category: payload.fabric_category || "",
      supplier_fabric_code: payload.supplier_fabric_code || "",
      fabric_form: payload.fabric_form || "Open Width",
      color_type: payload.color_type || "Solid",
      shrinkage_length_pct: Number(payload.shrinkage_length_pct || 0),
      shrinkage_width_pct: Number(payload.shrinkage_width_pct || 0),
      image_url: payload.image_url || "",
    })
    .select()
    .single();

  if (error) {
    console.error("createFabric error:", error);
    throw error;
  }

  return data;
}

export async function updateFabric(id, payload) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not logged in");

  const { data, error } = await supabase
    .from("fabric_master")
    .update({
      fabric_code: payload.fabric_code || "",
      fabric_name: payload.fabric_name || "",
      description: payload.description || "",
      composition: payload.composition || "",
      gsm: Number(payload.gsm || 0),
      finished_width: Number(payload.finished_width || 0),
      cuttable_width: Number(payload.cuttable_width || 0),
      width_unit: payload.width_unit || "inch",
      supplier: payload.supplier || "",
      price_unit: payload.price_unit || "KG",
      price: Number(payload.price || 0),
      currency: payload.currency || "USD",
      lead_time_days: Number(payload.lead_time_days || 0),
      moq: Number(payload.moq || 0),
      storage_location: payload.storage_location || "",
      status: payload.status || "Active",
      notes: payload.notes || "",
      fabric_type: payload.fabric_type || "",
      fabric_category: payload.fabric_category || "",
      supplier_fabric_code: payload.supplier_fabric_code || "",
      fabric_form: payload.fabric_form || "Open Width",
      color_type: payload.color_type || "Solid",
      shrinkage_length_pct: Number(payload.shrinkage_length_pct || 0),
      shrinkage_width_pct: Number(payload.shrinkage_width_pct || 0),
      image_url: payload.image_url || "",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("updateFabric error:", error);
    throw error;
  }

  return data;
}

export async function deleteFabric(id) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not logged in");

  const { error } = await supabase
    .from("fabric_master")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("deleteFabric error:", error);
    throw error;
  }
}
// ════════════════════════════════════════════════════════════
// SUPPLIER MASTER
// ════════════════════════════════════════════════════════════

export async function getSuppliers({ search = "", status = "all", type = "all", limit = 100, } = {}) {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  let query = supabase
    .from("supplier_master")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status !== "all") query = query.eq("status", status);
  if (type !== "all") query = query.eq("supplier_type", type);

  if (search) {
    query = query.or(
      `supplier_code.ilike.%${search}%,supplier_name.ilike.%${search}%,city.ilike.%${search}%,country.ilike.%${search}%`
    );
  }

  const { data, error } = await query;
  if (error) {
    console.error("getSuppliers error:", error);
    return [];
  }

  return data || [];
}

export async function createSupplier(payload) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not logged in");

  const { data, error } = await supabase
    .from("supplier_master")
    .insert({
      user_id: userId,
      supplier_code: payload.supplier_code || "",
      supplier_name: payload.supplier_name || "",
      supplier_type: payload.supplier_type || "Fabric",
      contact_person: payload.contact_person || "",
      phone: payload.phone || "",
      email: payload.email || "",
      address: payload.address || "",
      city: payload.city || "",
      country: payload.country || "",
      payment_terms: payload.payment_terms || "",
      lead_time_days: Number(payload.lead_time_days || 0),
      status: payload.status || "Active",
      notes: payload.notes || "",
    })
    .select()
    .single();

  if (error) {
    console.error("createSupplier error:", error);
    throw error;
  }

  return data;
}

export async function updateSupplier(id, payload) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not logged in");

  const { data, error } = await supabase
    .from("supplier_master")
    .update({
      supplier_code: payload.supplier_code || "",
      supplier_name: payload.supplier_name || "",
      supplier_type: payload.supplier_type || "Fabric",
      contact_person: payload.contact_person || "",
      phone: payload.phone || "",
      email: payload.email || "",
      address: payload.address || "",
      city: payload.city || "",
      country: payload.country || "",
      payment_terms: payload.payment_terms || "",
      lead_time_days: Number(payload.lead_time_days || 0),
      status: payload.status || "Active",
      notes: payload.notes || "",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("updateSupplier error:", error);
    throw error;
  }

  return data;
}

export async function deleteSupplier(id) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not logged in");

  const { error } = await supabase
    .from("supplier_master")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("deleteSupplier error:", error);
    throw error;
  }
}
// ════════════════════════════════════════════════════════════
// THREAD MASTER
// ════════════════════════════════════════════════════════════

export async function getThreads({ search = "", status = "all", limit = 100, } = {}) {
  let query = supabase
    .from("thread_master")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status !== "all") query = query.eq("status", status);

  if (search) {
    query = query.or(
      `thread_code.ilike.%${search}%,thread_name.ilike.%${search}%,material.ilike.%${search}%,supplier.ilike.%${search}%`
    );
  }

  const { data, error } = await query;
  if (error) {
    console.error("getThreads error:", error);
    return [];
  }

  return data || [];
}

export async function createThread(payload) {
  const { data, error } = await supabase
    .from("thread_master")
    .insert({
      thread_code: payload.thread_code || "",
      thread_name: payload.thread_name || "",
      material: payload.material || "",
      thread_use: payload.thread_use || "",
      ticket_no: payload.ticket_no || "",
      tex: payload.tex || "",
      denier: payload.denier || "",
      supplier: payload.supplier || "",
      price: Number(payload.price || 0),
      price_unit: payload.price_unit || "Meter",
      currency: payload.currency || "USD",
      cone_length: Number(payload.cone_length || 0),
      cone_weight: Number(payload.cone_weight || 0),
      color: payload.color || "",
      status: payload.status || "Active",
      notes: payload.notes || "",
    })
    .select()
    .single();

  if (error) {
    console.error("createThread error:", error);
    throw error;
  }

  return data;
}

export async function updateThread(id, payload) {
  const { data, error } = await supabase
    .from("thread_master")
    .update({
      thread_code: payload.thread_code || "",
      thread_name: payload.thread_name || "",
      material: payload.material || "",
      thread_use: payload.thread_use || "",
      ticket_no: payload.ticket_no || "",
      tex: payload.tex || "",
      denier: payload.denier || "",
      supplier: payload.supplier || "",
      price: Number(payload.price || 0),
      price_unit: payload.price_unit || "Meter",
      currency: payload.currency || "USD",
      cone_length: Number(payload.cone_length || 0),
      cone_weight: Number(payload.cone_weight || 0),
      color: payload.color || "",
      status: payload.status || "Active",
      notes: payload.notes || "",
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("updateThread error:", error);
    throw error;
  }

  return data;
}

export async function deleteThread(id) {
  const { error } = await supabase.from("thread_master").delete().eq("id", id);

  if (error) {
    console.error("deleteThread error:", error);
    throw error;
  }
}

// ════════════════════════════════════════════════════════════
// STITCH MASTER
// ════════════════════════════════════════════════════════════

export async function getStitches({ search = "", status = "all", limit = 100, } = {}) {
  let query = supabase
    .from("stitch_master")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status !== "all") query = query.eq("status", status);

  if (search) {
    query = query.or(
      `stitch_code.ilike.%${search}%,stitch_name.ilike.%${search}%,seam_class.ilike.%${search}%`
    );
  }

  const { data, error } = await query;
  if (error) {
    console.error("getStitches error:", error);
    return [];
  }

  return data || [];
}

export async function createStitch(payload) {
  const { data, error } = await supabase
    .from("stitch_master")
    .insert({
      stitch_code: payload.stitch_code || "",
      stitch_name: payload.stitch_name || "",
      seam_class: payload.seam_class || "",
      needle_ratio: Number(payload.needle_ratio || 0),
      looper_ratio: Number(payload.looper_ratio || 0),
      cover_ratio: Number(payload.cover_ratio || 0),
      default_spi: Number(payload.default_spi || 0),
      description: payload.description || "",
      status: payload.status || "Active",
    })
    .select()
    .single();

  if (error) {
    console.error("createStitch error:", error);
    throw error;
  }

  return data;
}

export async function updateStitch(id, payload) {
  const { data, error } = await supabase
    .from("stitch_master")
    .update({
      stitch_code: payload.stitch_code || "",
      stitch_name: payload.stitch_name || "",
      seam_class: payload.seam_class || "",
      needle_ratio: Number(payload.needle_ratio || 0),
      looper_ratio: Number(payload.looper_ratio || 0),
      cover_ratio: Number(payload.cover_ratio || 0),
      default_spi: Number(payload.default_spi || 0),
      description: payload.description || "",
      status: payload.status || "Active",
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("updateStitch error:", error);
    throw error;
  }

  return data;
}

export async function deleteStitch(id) {
  const { error } = await supabase.from("stitch_master").delete().eq("id", id);

  if (error) {
    console.error("deleteStitch error:", error);
    throw error;
  }
}

// ════════════════════════════════════════════════════════════
// MASTER DATA DUPLICATE CHECKS
// ════════════════════════════════════════════════════════════
export async function findStyleByArticle(articleNumber, excludeId = null) {
  const userId = await getCurrentUserId();
  if (!userId || !articleNumber) return null;
  let query = supabase
    .from("styles")
    .select("id, article_number, style_name, buyer, created_at")
    .eq("user_id", userId)
    .ilike("article_number", String(articleNumber).trim());
  if (excludeId) query = query.neq("id", excludeId);
  const { data, error } = await query.limit(1).maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function findFabricByCode(fabricCode, excludeId = null) {
  const userId = await getCurrentUserId();
  if (!userId || !fabricCode) return null;
  let query = supabase
    .from("fabric_master")
    .select("id, fabric_code, fabric_name, supplier, created_at")
    .eq("user_id", userId)
    .ilike("fabric_code", String(fabricCode).trim());
  if (excludeId) query = query.neq("id", excludeId);
  const { data, error } = await query.limit(1).maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function findThreadByCode(threadCode, excludeId = null) {
  const userId = await getCurrentUserId();
  if (!userId || !threadCode) return null;
  let query = supabase
    .from("thread_master")
    .select("id, thread_code, thread_name, supplier, created_at")
    .eq("user_id", userId)
    .ilike("thread_code", String(threadCode).trim());
  if (excludeId) query = query.neq("id", excludeId);
  const { data, error } = await query.limit(1).maybeSingle();
  if (error) throw error;
  return data || null;
}

// ════════════════════════════════════════════════════════════
// ENTERPRISE ACCESS CONTROL
// ════════════════════════════════════════════════════════════

export const MODULE_KEYS = [
  "dashboard",
  "styles",
  "fabric_master",
  "thread_master",
  "stitch_master",
  "smv",
  "efficiency",
  "capacity",
  "fabric_engineering",
  "thread_engineering",
  "costing",
  "reports",
  "administration",
  "export_orders",
  "fabric_requirements",
  "inventory",
];

export const PERMISSION_ACTIONS = [
  "view",
  "create",
  "edit",
  "delete",
  "approve",
  "export",
  "view_cost",
  "design_reports",
];

export async function getMyAccessContext() {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const { data: membership, error } = await supabase
    .from("company_users")
    .select(
      `
      id,
      company_id,
      factory_id,
      department_id,
      status,
      role_id,
      companies(id, name, code),
      factories(id, name, code),
      departments(id, name, code),
      roles(id, name, code, is_system)
    `
    )
    .eq("user_id", userId)
    .eq("status", "Active")
    .maybeSingle();

  if (error) {
    console.error("getMyAccessContext membership error:", error);
    return null;
  }

  if (!membership) {
    return {
      membership: null,
      role: null,
      permissions: {},
      isOwner: true,
      hasConfiguredAccess: false,
    };
  }

  const { data: rows, error: permissionsError } = await supabase
    .from("role_permissions")
    .select("module_key, action_key, allowed")
    .eq("role_id", membership.role_id);

  if (permissionsError) {
    console.error("getMyAccessContext permissions error:", permissionsError);
  }

  const permissions = {};
  (rows || []).forEach((row) => {
    if (!permissions[row.module_key]) permissions[row.module_key] = {};
    permissions[row.module_key][row.action_key] = Boolean(row.allowed);
  });

  const roleCode = membership.roles?.code || "";
  const isOwner = roleCode === "OWNER";

  return {
    membership,
    role: membership.roles || null,
    permissions,
    isOwner,
    hasConfiguredAccess: true,
  };
}

export async function getCompanyRoles() {
  const access = await getMyAccessContext();
  const companyId = access?.membership?.company_id;
  if (!companyId) return [];

  const { data, error } = await supabase
    .from("roles")
    .select("*")
    .eq("company_id", companyId)
    .order("name");

  if (error) throw error;
  return data || [];
}

export async function getRolePermissions(roleId) {
  if (!roleId) return [];

  const { data, error } = await supabase
    .from("role_permissions")
    .select("*")
    .eq("role_id", roleId)
    .order("module_key")
    .order("action_key");

  if (error) throw error;
  return data || [];
}

export async function saveRolePermissions(roleId, matrix) {
  if (!roleId) throw new Error("Role is required");

  const rows = [];
  Object.entries(matrix || {}).forEach(([moduleKey, actions]) => {
    Object.entries(actions || {}).forEach(([actionKey, allowed]) => {
      rows.push({
        role_id: roleId,
        module_key: moduleKey,
        action_key: actionKey,
        allowed: Boolean(allowed),
        updated_at: new Date().toISOString(),
      });
    });
  });

  if (!rows.length) return [];

  const { data, error } = await supabase
    .from("role_permissions")
    .upsert(rows, { onConflict: "role_id,module_key,action_key" })
    .select();

  if (error) throw error;
  return data || [];
}

export async function createCompanyRole({ name, code }) {
  const access = await getMyAccessContext();
  const companyId = access?.membership?.company_id;
  if (!companyId) throw new Error("Company access is not configured");

  const normalizedCode = String(code || name || "")
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .toUpperCase();

  const { data, error } = await supabase
    .from("roles")
    .insert({
      company_id: companyId,
      name: String(name || "").trim(),
      code: normalizedCode,
      is_system: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getCompanyUsers() {
  const access = await getMyAccessContext();
  const companyId = access?.membership?.company_id;
  if (!companyId) return [];

  const { data, error } = await supabase
    .from("company_users")
    .select(
      `
      id,
      user_id,
      invited_email,
      status,
      company_id,
      factory_id,
      department_id,
      role_id,
      created_at,
      profiles(id, full_name, company_name),
      roles(id, name, code),
      factories(id, name, code),
      departments(id, name, code)
    `
    )
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createUserInvitation({ email, role_id, factory_id = null, department_id = null, }) {
  const access = await getMyAccessContext();
  const companyId = access?.membership?.company_id;
  if (!companyId) throw new Error("Company access is not configured");

  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();
  if (!normalizedEmail) throw new Error("Email is required");

  const { data, error } = await supabase
    .from("company_user_invitations")
    .insert({
      company_id: companyId,
      email: normalizedEmail,
      role_id,
      factory_id: factory_id || null,
      department_id: department_id || null,
      invited_by: await getCurrentUserId(),
      status: "Pending",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCompanyUserAccess(id, updates) {
  const { data, error } = await supabase
    .from("company_users")
    .update({
      role_id: updates.role_id,
      factory_id: updates.factory_id || null,
      department_id: updates.department_id || null,
      status: updates.status || "Active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getCompanyFactoriesAndDepartments() {
  const access = await getMyAccessContext();
  const companyId = access?.membership?.company_id;
  if (!companyId) return { factories: [], departments: [] };

  const [
    { data: factories, error: fError },
    { data: departments, error: dError },
  ] = await Promise.all([
    supabase
      .from("factories")
      .select("*")
      .eq("company_id", companyId)
      .eq("status", "Active")
      .order("name"),
    supabase
      .from("departments")
      .select("*")
      .eq("company_id", companyId)
      .eq("status", "Active")
      .order("name"),
  ]);

  if (fError) throw fError;
  if (dError) throw dError;

  return { factories: factories || [], departments: departments || [] };
}

// ============================================================
// EXPORT ORDER PHASE 1
// ============================================================

export async function getExportOrders({ search = "", status = "all", limit = 200, } = {}) {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  let query = supabase
    .from("export_orders")
    .select(
      `
      *,
      export_order_pos(
        *,
        export_order_po_colors(
          *,
          export_order_sizes(*)
        )
      )
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status && status !== "all") query = query.eq("status", status);

  if (search) {
    query = query.or(
      `order_number.ilike.%${search}%,buyer.ilike.%${search}%,brand.ilike.%${search}%,season.ilike.%${search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getExportOrder(id) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not logged in");

  const { data, error } = await supabase
    .from("export_orders")
    .select(
      `
      *,
      export_order_pos(
        *,
        export_order_po_colors(
          *,
          export_order_sizes(*)
        )
      )
    `
    )
    .eq("user_id", userId)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function generateExportOrderNumber() {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not logged in");

  const year = new Date().getFullYear();
  const prefix = `EO-${year}-`;

  const { data, error } = await supabase
    .from("export_orders")
    .select("order_number")
    .eq("user_id", userId)
    .ilike("order_number", `${prefix}%`)
    .order("order_number", { ascending: false })
    .limit(1);

  if (error) throw error;

  const latest = data?.[0]?.order_number || "";
  const currentSequence = Number(latest.split("-").pop() || 0);
  return prefix + String(currentSequence + 1).padStart(5, "0");
}

export async function checkDuplicateExportOrderNumber( orderNumber, excludeId = null ) {
  const userId = await getCurrentUserId();
  if (!userId || !orderNumber) return null;

  let query = supabase
    .from("export_orders")
    .select("id, order_number, buyer, status, created_at")
    .eq("user_id", userId)
    .ilike("order_number", String(orderNumber).trim())
    .limit(1);

  if (excludeId) query = query.neq("id", excludeId);

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function checkDuplicatePONumbers( poNumbers, excludeOrderId = null ) {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const normalized = [
    ...new Set(
      (poNumbers || [])
        .map((value) =>
          String(value || "")
            .trim()
            .toUpperCase()
        )
        .filter(Boolean)
    ),
  ];

  if (!normalized.length) return [];

  let query = supabase
    .from("export_order_pos")
    .select(
      "id, export_order_id, po_number, article_number, color_name, export_orders!inner(user_id, order_number)"
    )
    .eq("export_orders.user_id", userId)
    .in("po_number", normalized);

  if (excludeOrderId) query = query.neq("export_order_id", excludeOrderId);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createExportOrder(payload) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not logged in");

  const pos = payload.pos || [];

  const { data: order, error: orderError } = await supabase
    .from("export_orders")
    .insert({
      user_id: userId,
      order_number: payload.order_number,
      buyer: payload.buyer || "",
      brand: payload.brand || "",
      season: payload.season || "",
      factory_name: payload.factory_name || "",
      merchandiser: payload.merchandiser || "",
      order_date: payload.order_date || null,
      shipment_date: payload.shipment_date || null,
      delivery_date: payload.delivery_date || null,
      currency: payload.currency || "USD",
      status: payload.status || "Draft",
      remarks: payload.remarks || "",
      total_quantity: pos.reduce(
        (sum, po) => sum + Number(po.total_quantity || 0),
        0
      ),
      po_count: pos.length,
    })
    .select()
    .single();

  if (orderError) throw orderError;

  try {
    await replaceExportOrderPOs(order.id, pos);
    return await getExportOrder(order.id);
  } catch (error) {
    await supabase.from("export_orders").delete().eq("id", order.id);
    throw error;
  }
}

export async function updateExportOrder(id, payload) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not logged in");

  const pos = payload.pos || [];

  const { error } = await supabase
    .from("export_orders")
    .update({
      order_number: payload.order_number,
      buyer: payload.buyer || "",
      brand: payload.brand || "",
      season: payload.season || "",
      factory_name: payload.factory_name || "",
      merchandiser: payload.merchandiser || "",
      order_date: payload.order_date || null,
      shipment_date: payload.shipment_date || null,
      delivery_date: payload.delivery_date || null,
      currency: payload.currency || "USD",
      status: payload.status || "Draft",
      remarks: payload.remarks || "",
      total_quantity: pos.reduce(
        (sum, po) => sum + Number(po.total_quantity || 0),
        0
      ),
      po_count: pos.length,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("id", id);

  if (error) throw error;

  await replaceExportOrderPOs(id, pos);
  return getExportOrder(id);
}

async function replaceExportOrderPOs(exportOrderId, pos) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not logged in");

  const { error: deleteError } = await supabase
    .from("export_order_pos")
    .delete()
    .eq("export_order_id", exportOrderId)
    .eq("user_id", userId);

  if (deleteError) throw deleteError;

  for (let sequence = 0; sequence < pos.length; sequence += 1) {
    const po = pos[sequence];
    const colors = po.colors || [];
    const poTotal = colors.reduce(
      (sum, color) =>
        sum +
        (color.sizes || []).reduce(
          (sizeSum, size) => sizeSum + Number(size.quantity || 0),
          0
        ),
      0
    );

    const { data: poRow, error: poError } = await supabase
      .from("export_order_pos")
      .insert({
        user_id: userId,
        export_order_id: exportOrderId,
        sequence_no: sequence + 1,
        po_number: String(po.po_number || "")
          .trim()
          .toUpperCase(),
        style_id: po.style_id || null,
        article_number: po.article_number || "",
        style_name: po.style_name || "",
        buyer_style: po.buyer_style || "",
        garment_type: po.garment_type || "",
        color_id: null,
        color_code: "",
        color_name: "",
        total_quantity: poTotal,
        engineering_status: po.engineering_status || "Pending",
        readiness: po.readiness || {},
      })
      .select()
      .single();

    if (poError) throw poError;

    for (
      let colorSequence = 0;
      colorSequence < colors.length;
      colorSequence += 1
    ) {
      const color = colors[colorSequence];
      const colorTotal = (color.sizes || []).reduce(
        (sum, size) => sum + Number(size.quantity || 0),
        0
      );

      const { data: colorRow, error: colorError } = await supabase
        .from("export_order_po_colors")
        .insert({
          user_id: userId,
          export_order_id: exportOrderId,
          export_order_po_id: poRow.id,
          sequence_no: colorSequence + 1,
          color_id: color.color_id || null,
          color_code: color.color_code || "",
          color_name: color.color_name || "",
          total_quantity: colorTotal,
          readiness: color.readiness || {},
          engineering_status: color.engineering_status || "Pending",
        })
        .select()
        .single();

      if (colorError) throw colorError;

      const sizeRows = (color.sizes || [])
        .filter((size) => String(size.size_name || "").trim())
        .map((size, index) => ({
          user_id: userId,
          export_order_id: exportOrderId,
          export_order_po_id: poRow.id,
          export_order_po_color_id: colorRow.id,
          size_id: size.size_id || null,
          size_name: size.size_name,
          quantity: Number(size.quantity || 0),
          sort_order: Number(size.sort_order ?? index),
        }));

      if (sizeRows.length) {
        const { error: sizeError } = await supabase
          .from("export_order_sizes")
          .insert(sizeRows);

        if (sizeError) throw sizeError;
      }
    }
  }
}

export async function updateExportOrderStatus(id, status) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not logged in");

  const { data, error } = await supabase
    .from("export_orders")
    .update({
      status,
      approved_at: status === "Approved" ? new Date().toISOString() : null,
      approved_by: status === "Approved" ? userId : null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  if (status === "Approved") {
    await generateFabricRequirementsForExportOrder(id);
  }

  return data;
}

export async function deleteExportOrder(id) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not logged in");

  const { error } = await supabase
    .from("export_orders")
    .delete()
    .eq("user_id", userId)
    .eq("id", id)
    .eq("status", "Draft");

  if (error) throw error;
}

export async function duplicateExportOrder(id) {
  const source = await getExportOrder(id);
  const orderNumber = await generateExportOrderNumber();

  return createExportOrder({
    ...source,
    order_number: orderNumber,
    status: "Draft",
    remarks: source.remarks
      ? `${source.remarks} | Copied from ${source.order_number}`
      : `Copied from ${source.order_number}`,
    pos: (source.export_order_pos || []).map((po) => ({
      ...po,
      id: undefined,
      colors: (po.export_order_po_colors || []).map((color) => ({
        ...color,
        id: undefined,
        sizes: (color.export_order_sizes || []).map((size) => ({
          size_id: size.size_id,
          size_name: size.size_name,
          quantity: size.quantity,
          sort_order: size.sort_order,
        })),
      })),
    })),
  });
}

// ============================================================
// AUTOMATIC FABRIC REQUIREMENT - PHASE 2A
// ============================================================

function getFabricConsumptionForSize(component, sizeId, sizeName) {
  const sizeData = component?.sizeData || {};

  let row = sizeId ? sizeData[sizeId] : null;

  if (!row && sizeName) {
    row = Object.values(sizeData).find(
      (item) =>
        String(item?.size_name || item?.sizeName || item?.label || "")
          .trim()
          .toLowerCase() === String(sizeName).trim().toLowerCase()
    );
  }

  row = row || {};

  const uom = String(
    component?.uom || component?.priceUnit || "KG"
  ).toUpperCase();

  if (uom === "M" || uom === "METER" || uom === "METERS") {
    return Number(row.meterConsumption || row.consumption || 0);
  }

  if (uom === "YD" || uom === "YARD" || uom === "YARDS") {
    return Number(row.yardConsumption || row.consumption || 0);
  }

  return Number(row.kgConsumption || row.consumption || 0);
}

function fabricComponentKey(component, index) {
  return String(
    component?.fabric_id ||
      component?.fabricCode ||
      component?.fabric_code ||
      component?.id ||
      `${
        component?.usageAt || component?.fabricDescription || "FABRIC"
      }-${index}`
  );
}

export async function generateFabricRequirementsForExportOrder(exportOrderId) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not logged in");

  const order = await getExportOrder(exportOrderId);
  if (!order) throw new Error("Export Order not found");

  const { data: existing, error: existingError } = await supabase
    .from("fabric_requirements")
    .select("id")
    .eq("user_id", userId)
    .eq("export_order_id", exportOrderId)
    .maybeSingle();

  if (existingError) throw existingError;

  let requirementId = existing?.id || null;

  if (!requirementId) {
    const { data: created, error } = await supabase
      .from("fabric_requirements")
      .insert({
        user_id: userId,
        company_id: order.company_id || null,
        export_order_id: exportOrderId,
        requirement_number: `FR-${order.order_number}`,
        order_number: order.order_number,
        buyer: order.buyer || "",
        factory_name: order.factory_name || "",
        shipment_date: order.shipment_date || null,
        status: "Generated",
        total_lines: 0,
        generated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    requirementId = created.id;
  } else {
    const { error } = await supabase
      .from("fabric_requirements")
      .update({
        order_number: order.order_number,
        buyer: order.buyer || "",
        factory_name: order.factory_name || "",
        shipment_date: order.shipment_date || null,
        status: "Generated",
        generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", requirementId)
      .eq("user_id", userId);

    if (error) throw error;

    const { error: deleteError } = await supabase
      .from("fabric_requirement_lines")
      .delete()
      .eq("fabric_requirement_id", requirementId)
      .eq("user_id", userId);

    if (deleteError) throw deleteError;
  }

  const lines = [];

  for (const po of order.export_order_pos || []) {
    const moduleSummary = await getStyleCostSummary({
      style_id: po.style_id,
      color_id: null,
    });

    const fabricModule = moduleSummary?.fabric_bom;

    if (!fabricModule) {
      throw new Error(
        `Fabric BOM is missing for Article ${
          po.article_number || po.style_name || "-"
        }`
      );
    }

    const bomData = fabricModule.data || fabricModule.summary || {};
    const components =
      bomData.components ||
      fabricModule.summary?.components ||
      fabricModule.data?.components ||
      [];

    if (!components.length) {
      throw new Error(
        `Fabric BOM has no components for Article ${po.article_number || "-"}`
      );
    }

    for (const color of po.export_order_po_colors || []) {
      for (
        let componentIndex = 0;
        componentIndex < components.length;
        componentIndex += 1
      ) {
        const component = components[componentIndex];
        const sizeBreakdown = [];
        let totalRequirement = 0;

        for (const size of color.export_order_sizes || []) {
          const consumptionPerGarment = getFabricConsumptionForSize(
            component,
            size.size_id,
            size.size_name
          );

          if (Number(size.quantity || 0) > 0 && consumptionPerGarment <= 0) {
            throw new Error(
              `Fabric consumption is missing for Article ${
                po.article_number
              }, Size ${size.size_name}, Component ${
                component.usageAt ||
                component.fabricDescription ||
                componentIndex + 1
              }`
            );
          }

          const requiredQuantity =
            consumptionPerGarment * Number(size.quantity || 0);

          totalRequirement += requiredQuantity;

          sizeBreakdown.push({
            size_id: size.size_id || null,
            size_name: size.size_name,
            po_quantity: Number(size.quantity || 0),
            consumption_per_garment: consumptionPerGarment,
            required_quantity: requiredQuantity,
          });
        }

        lines.push({
          user_id: userId,
          company_id: order.company_id || null,
          fabric_requirement_id: requirementId,
          export_order_id: order.id,
          export_order_po_id: po.id,
          export_order_po_color_id: color.id,
          po_number: po.po_number,
          style_id: po.style_id,
          article_number: po.article_number || "",
          style_name: po.style_name || "",
          color_id: color.color_id || null,
          color_code: color.color_code || "",
          color_name: color.color_name || "",
          component_key: fabricComponentKey(component, componentIndex),
          component_name:
            component.usageAt ||
            component.fabricCategory ||
            `Fabric Component ${componentIndex + 1}`,
          fabric_id: component.fabric_id || null,
          fabric_code: component.fabricCode || component.fabric_code || "",
          fabric_name:
            component.fabricDescription ||
            component.fabric_name ||
            component.fabricType ||
            "",
          supplier: component.supplier || "",
          composition: component.composition || "",
          gsm: Number(component.gsm || 0),
          width: Number(component.fabricWidth || component.width || 0),
          width_unit: component.widthUnit || "inch",
          uom: String(component.uom || "KG").toUpperCase(),
          allowance_pct: Number(component.allowancePct || 0),
          total_requirement: totalRequirement,
          size_breakdown: sizeBreakdown,
          required_date: order.shipment_date || order.delivery_date || null,
          source_module_updated_at: fabricModule.updated_at || null,
          status: "Generated",
        });
      }
    }
  }

  if (lines.length) {
    const { error: lineError } = await supabase
      .from("fabric_requirement_lines")
      .insert(lines);

    if (lineError) throw lineError;
  }

  const { error: headerError } = await supabase
    .from("fabric_requirements")
    .update({
      total_lines: lines.length,
      generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", requirementId)
    .eq("user_id", userId);

  if (headerError) throw headerError;

  return getFabricRequirement(requirementId);
}

export async function getFabricRequirements({ search = "", status = "all", limit = 200, } = {}) {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  let query = supabase
    .from("fabric_requirements")
    .select(
      `
      *,
      fabric_requirement_lines(*)
    `
    )
    .eq("user_id", userId)
    .order("generated_at", { ascending: false })
    .limit(limit);

  if (status && status !== "all") query = query.eq("status", status);

  if (search) {
    query = query.or(
      `requirement_number.ilike.%${search}%,order_number.ilike.%${search}%,buyer.ilike.%${search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getFabricRequirement(id) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not logged in");

  const { data, error } = await supabase
    .from("fabric_requirements")
    .select(
      `
      *,
      fabric_requirement_lines(*)
    `
    )
    .eq("user_id", userId)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function getCombinedFabricRequirements() {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("fabric_requirement_lines")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["Generated", "Reviewed", "Reserved"])
    .order("required_date", { ascending: true });

  if (error) throw error;

  const grouped = new Map();

  for (const line of data || []) {
    const key = [
      line.fabric_id || "",
      line.fabric_code || "",
      line.fabric_name || "",
      line.color_code || line.color_name || "",
      line.uom || "",
    ]
      .join("|")
      .toLowerCase();

    if (!grouped.has(key)) {
      grouped.set(key, {
        key,
        fabric_id: line.fabric_id,
        fabric_code: line.fabric_code,
        fabric_name: line.fabric_name,
        color_code: line.color_code,
        color_name: line.color_name,
        supplier: line.supplier,
        uom: line.uom,
        total_requirement: 0,
        required_date: line.required_date,
        po_details: [],
      });
    }

    const group = grouped.get(key);
    group.total_requirement += Number(line.total_requirement || 0);

    if (
      !group.required_date ||
      (line.required_date && line.required_date < group.required_date)
    ) {
      group.required_date = line.required_date;
    }

    group.po_details.push({
      export_order_id: line.export_order_id,
      po_number: line.po_number,
      article_number: line.article_number,
      style_name: line.style_name,
      color_code: line.color_code,
      color_name: line.color_name,
      component_name: line.component_name,
      quantity: Number(line.total_requirement || 0),
    });
  }

  return [...grouped.values()].sort((a, b) =>
    String(a.required_date || "").localeCompare(String(b.required_date || ""))
  );
}
