import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL      || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
export const hasSupabase = Boolean(SUPABASE_URL.startsWith('https://') && SUPABASE_ANON_KEY.length > 10);

let supabase: ReturnType<typeof createClient> | null = null;
try { if (hasSupabase) supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY); } catch { console.warn('Supabase não configurado.'); }

function nowBR() { return new Date().toLocaleString('pt-BR'); }

// ── Rate limiting (login) ──────────────────────────────────────────────────
const loginAttempts = new Map<string, { count: number; since: number }>();
const MAX_ATTEMPTS  = 5;
const WINDOW_MS     = 15 * 60 * 1000; // 15 min

function checkRateLimit(email: string) {
  const key  = email.toLowerCase();
  const now  = Date.now();
  const prev = loginAttempts.get(key);
  if (prev && now - prev.since < WINDOW_MS) {
    if (prev.count >= MAX_ATTEMPTS)
      throw new Error(`Muitas tentativas. Tente novamente em ${Math.ceil((WINDOW_MS - (now - prev.since)) / 60000)} min.`);
    prev.count++;
  } else {
    loginAttempts.set(key, { count: 1, since: now });
  }
}

function resetRateLimit(email: string) {
  loginAttempts.delete(email.toLowerCase());
}

// ── Validação de dados do dispositivo ─────────────────────────────────────
const ICCID_RE = /^\d{15,22}$/;
const IMEI_RE  = /^\d{15}$/;

function sanitizeStr(v: unknown, max = 255): string {
  if (typeof v !== 'string') return '';
  // Remove HTML chars + caracteres de fórmula Excel (=, +, @, %)
  return v.trim().slice(0, max).replace(/[<>"'`=+@%]/g, '');
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizeEmail(v: unknown): string {
  if (typeof v !== 'string') return '';
  // Mantém @ mas remove chars perigosos; valida formato
  const cleaned = v.trim().slice(0, 255).replace(/[<>"'`]/g, '');
  if (!EMAIL_RE.test(cleaned)) throw new Error('E-mail inválido.');
  return cleaned.toLowerCase();
}

function validateDevice(item: any): Record<string, string> {
  // Validate ANTES de sanitize para não mascarar dados inválidos
  const rawIccid = typeof item.iccid === 'string' ? item.iccid.trim() : '';
  const rawImei  = typeof item.imei  === 'string' ? item.imei.trim()  : '';
  if (!ICCID_RE.test(rawIccid)) throw new Error(`ICCID inválido: "${rawIccid}"`);
  if (rawImei && !IMEI_RE.test(rawImei)) throw new Error(`IMEI inválido: "${rawImei}"`);
  return {
    iccid:          sanitizeStr(item.iccid, 22),
    imei:           sanitizeStr(item.imei,  15),
    cliente:        sanitizeStr(item.cliente),
    cotacao:        sanitizeStr(item.cotacao),
    simcard:        sanitizeStr(item.simcard),
    codigo_cliente: sanitizeStr(item['codigo do cliente'] || item.codigo_cliente),
  };
}

// ── LocalStorage helper ───────────────────────────────────────────────────
const LS = {
  get: (k: string): any[] => { try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch { return []; } },
  set: (k: string, v: any) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  clear: () => { ['arqia_devices','arqia_bases','arqia_usuarios'].forEach(k => localStorage.removeItem(k)); },
};

export { LS };

// ── Auth ──────────────────────────────────────────────────────────────────
export async function dbLogin(email: string, password: string): Promise<{ email: string; name: string; role: 'ADM' | 'Suporte' }> {
  const em = email.trim().toLowerCase();
  checkRateLimit(em);
  if (!supabase) throw new Error('Sistema não configurado. Contate o administrador.');
  try {
    const { data, error } = await supabase.from('usuarios').select('*').eq('email', em).eq('senha', password).single();
    if (error || !data) throw new Error('E-mail ou senha inválidos.');
    resetRateLimit(em);
    return { email: data.email, name: data.nome, role: data.role };
  } catch (err: any) {
    if (err.message === 'E-mail ou senha inválidos.') throw err;
    throw new Error('Não foi possível conectar ao servidor. Tente novamente em instantes.');
  }
}

// ── Devices ───────────────────────────────────────────────────────────────
export async function dbGetDevices(): Promise<any[]> {
  if (supabase) {
    try {
      const all: any[] = [];
      const PAGE = 1000;
      let from = 0;
      while (true) {
        const { data, error } = await supabase
          .from('devices').select('*')
          .order('criado_em', { ascending: false })
          .range(from, from + PAGE - 1);
        if (error || !data) break;
        all.push(...data);
        if (data.length < PAGE) break;
        from += PAGE;
      }
      if (all.length > 0) return all;
    } catch {}
  }
  return LS.get('arqia_devices');
}

export async function dbSaveDevices(items: any[]): Promise<{ inserted: number; duplicates: number; errors: string[] }> {
  const errors: string[] = [];
  const validated: Record<string, string>[] = [];

  for (const item of items) {
    try { validated.push(validateDevice(item)); }
    catch (e: any) { errors.push(e.message); }
  }

  if (supabase) {
    try {
      let inserted = 0, duplicates = 0;
      for (const row of validated) {
        const { error } = await supabase.from('devices').insert(row);
        if (error?.code === '23505') duplicates++;
        else if (!error) inserted++;
      }
      return { inserted, duplicates, errors };
    } catch {}
  }

  const existing = LS.get('arqia_devices');
  const iccids   = new Set(existing.map((d: any) => d.iccid));
  let inserted = 0, duplicates = 0;
  for (const row of validated) {
    if (iccids.has(row.iccid)) { duplicates++; continue; }
    existing.unshift({ ...row, id: Date.now() + inserted, criado_em: nowBR() });
    iccids.add(row.iccid);
    inserted++;
  }
  LS.set('arqia_devices', existing);
  return { inserted, duplicates, errors };
}

export async function dbDeleteDevice(id: number) {
  if (supabase) { try { await supabase.from('devices').delete().eq('id', id); return; } catch {} }
  LS.set('arqia_devices', LS.get('arqia_devices').filter((d: any) => d.id !== id));
}

// ── Bases ─────────────────────────────────────────────────────────────────
export async function dbGetBases(): Promise<any[]> {
  if (supabase) { try { const { data } = await supabase.from('bases').select('*').order('criado_em', { ascending: false }); if (data) return data; } catch {} }
  return LS.get('arqia_bases');
}

export async function dbCreateBase(data: any): Promise<any> {
  const payload = { cnpj_cpf: sanitizeStr(data.cnpjCpf), razao_social: sanitizeStr(data.razaoSocial), nome_fantasia: sanitizeStr(data.nomeFantasia), proprietario: sanitizeStr(data.proprietario), codigo_cliente: sanitizeStr(data.codigoCliente), status: 'Ativo', plataforma: 'N/A', ultima_alteracao: nowBR() };
  if (supabase) { try { const { data: row, error } = await supabase.from('bases').insert(payload).select().single(); if (!error && row) return row; } catch {} }
  const base = { ...payload, id: Date.now(), criado_em: nowBR() };
  const bases = LS.get('arqia_bases'); bases.unshift(base); LS.set('arqia_bases', bases); return base;
}

export async function dbUpdateBase(id: number, data: any): Promise<any> {
  const payload = { cnpj_cpf: sanitizeStr(data.cnpjCpf), razao_social: sanitizeStr(data.razaoSocial), nome_fantasia: sanitizeStr(data.nomeFantasia), proprietario: sanitizeStr(data.proprietario), codigo_cliente: sanitizeStr(data.codigoCliente), status: data.status || 'Ativo', plataforma: data.plataforma || 'N/A', ultima_alteracao: nowBR() };
  if (supabase) { try { const { data: row, error } = await supabase.from('bases').update(payload).eq('id', id).select().single(); if (!error && row) return row; } catch {} }
  const bases = LS.get('arqia_bases'); const idx = bases.findIndex((b: any) => b.id === id);
  if (idx !== -1) { bases[idx] = { ...bases[idx], ...payload }; LS.set('arqia_bases', bases); return bases[idx]; }
}

export async function dbDeleteBase(id: number) {
  if (supabase) { try { await supabase.from('bases').delete().eq('id', id); return; } catch {} }
  LS.set('arqia_bases', LS.get('arqia_bases').filter((b: any) => b.id !== id));
}

// ── Usuários ──────────────────────────────────────────────────────────────
export async function dbGetUsuarios(): Promise<any[]> {
  if (supabase) { try { const { data } = await supabase.from('usuarios').select('id, email, nome, role').order('role', { ascending: false }); if (data) return data; } catch {} }
  return LS.get('arqia_usuarios').map(({ senha: _s, ...u }: any) => u);
}

export async function dbCreateUsuario(email: string, password: string, role: string, nome?: string) {
  const em   = sanitizeEmail(email);
  const name = sanitizeStr(nome || em.split('@')[0], 80) || em.split('@')[0];
  if (supabase) {
    try {
      const { error } = await supabase.from('usuarios').insert({ email: em, senha: password, nome: name, role });
      if (error?.code === '23505') throw new Error('E-mail já cadastrado.');
      if (!error) return;
    } catch (e: any) { throw e; }
  }
  const users = LS.get('arqia_usuarios');
  if (users.some((u: any) => u.email === em)) throw new Error('E-mail já cadastrado.');
  users.push({ id: Date.now(), email: em, senha: password, nome: name, role });
  LS.set('arqia_usuarios', users);
}

export async function dbUpdateUsuarioRole(email: string, role: string) {
  if (supabase) { try { await supabase.from('usuarios').update({ role }).eq('email', email); return; } catch {} }
  LS.set('arqia_usuarios', LS.get('arqia_usuarios').map((u: any) => u.email === email ? { ...u, role } : u));
}

export async function dbDeleteUsuario(email: string) {
  if (supabase) { try { await supabase.from('usuarios').delete().eq('email', email); return; } catch {} }
  LS.set('arqia_usuarios', LS.get('arqia_usuarios').filter((u: any) => u.email !== email));
}
