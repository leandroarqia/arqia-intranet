import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import TRX16Hero from './components/TRX16Hero';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Shield, User, BarChart3, Globe, Loader2 } from 'lucide-react';
import {
  dbLogin, dbGetDevices, dbSaveDevices, dbDeleteDevice,
  dbGetBases, dbCreateBase, dbUpdateBase, dbDeleteBase,
  dbGetUsuarios, dbCreateUsuario, dbUpdateUsuarioRole, dbDeleteUsuario,
  hasSupabase, LS,
} from './db';

function validatePasswordStrength(pwd: string): string[] {
  const errors: string[] = [];
  if (pwd.length < 8)          errors.push('mínimo 8 caracteres');
  if (!/[A-Za-z]/.test(pwd))   errors.push('pelo menos 1 letra');
  if (!/[0-9]/.test(pwd))      errors.push('pelo menos 1 número');
  return errors;
}

// ── Componente de alerta unificado ────────────────────────────────────────
type AlertType = 'error' | 'warning' | 'success' | 'info';
function Alert({ type, children }: { type: AlertType; children: React.ReactNode }) {
  const styles: Record<AlertType, string> = {
    error:   'bg-red-900/20 border-red-800/40 text-red-300',
    warning: 'bg-yellow-900/20 border-yellow-700/40 text-yellow-300',
    success: 'bg-[#00D1C1]/10 border-[#00D1C1]/20 text-[#00D1C1]',
    info:    'bg-[#00AEEF]/10 border-[#00AEEF]/20 text-[#00AEEF]',
  };
  const icons: Record<AlertType, string> = { error: '✕', warning: '⚠️', success: '✅', info: 'ℹ️' };
  return (
    <div className={`flex items-start gap-2 px-4 py-2.5 rounded-lg border text-sm mb-4 ${styles[type]}`}>
      <span className="flex-shrink-0">{icons[type]}</span>
      <span>{children}</span>
    </div>
  );
}

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

type Role = 'ADM' | 'Suporte';
type UserSession = { email: string; name: string; role: Role };

export default function App() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeView, setActiveView] = useState('dashboard');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [csvBuffer, setCsvBuffer] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCliente, setFilterCliente] = useState('');
  const [filterCotacao, setFilterCotacao] = useState('');
  const [filterSimcard, setFilterSimcard] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [bases, setBases] = useState<any[]>([]);
  const [isBaseModalOpen, setIsBaseModalOpen] = useState(false);
  const [editingBase, setEditingBase] = useState<any | null>(null);
  const [baseLoading, setBaseLoading] = useState(false);
  const [newBase, setNewBase] = useState({ cnpjCpf:'', razaoSocial:'', nomeFantasia:'', proprietario:'', codigoCliente:'' });
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [newProfileEmail, setNewProfileEmail] = useState('');
  const [newProfilePassword, setNewProfilePassword] = useState('');
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileRole, setNewProfileRole] = useState<Role>('Suporte');
  const [addUserError, setAddUserError] = useState('');
  const [addUserSuccess, setAddUserSuccess] = useState('');
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState<string | null>(null);
  const isUserAdmin = user?.role === 'ADM';
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState('');

  useEffect(() => {
    if (!user) return;
    setDataLoading(true);
    setDataError('');
    (async () => {
      try {
        setClients(await dbGetDevices());
        const b = await dbGetBases();
        setBases(b.map(dbBaseToState));
        setRegisteredUsers(await dbGetUsuarios());
      } catch (err: any) {
        setDataError('Erro ao carregar dados. Verifique a conexão e tente novamente.');
      } finally {
        setDataLoading(false);
      }
    })();
  }, [user]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault(); setLoginError('');
    try { const u = await dbLogin(email, password); setUser(u); }
    catch (err: any) { setLoginError(err.message); }
  };

  const logout = () => { LS.clear(); setUser(null); setEmail(''); setPassword(''); setActiveView('dashboard'); setClients([]); setBases([]); setRegisteredUsers([]); setCsvBuffer([]); setImportStatus(''); };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setImportStatus('erro_tamanho'); return; }
    if (!file.name.toLowerCase().endsWith('.csv')) { setImportStatus('erro_tipo'); return; }
    Papa.parse(file, { header: true, skipEmptyLines: true, preview: 10000, complete: (results: any) => { setCsvBuffer(results.data); setImportStatus(''); } });
  };

  const downloadTemplate = () => { const blob = new Blob(['iccid,imei,cliente,cotacao,simcard,codigo_cliente\n'], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'modelo_dispositivos.csv'; document.body.appendChild(a); a.click(); document.body.removeChild(a); };

  const getFilteredClients = () => clients.filter(c => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || (c.cliente?.toLowerCase()||'').includes(q) || (c.iccid||'').includes(q) || (c.imei||'').includes(q) || (c.cotacao?.toLowerCase()||'').includes(q);
    const matchCliente  = !filterCliente  || c.cliente  === filterCliente;
    const matchCotacao  = !filterCotacao  || c.cotacao  === filterCotacao;
    const matchSimcard  = !filterSimcard  || c.simcard  === filterSimcard;
    return matchSearch && matchCliente && matchCotacao && matchSimcard;
  });

  const exportToExcel = () => { const data = getFilteredClients(); if (!data.length) return; const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Dispositivos'); XLSX.writeFile(wb, 'dispositivos.xlsx'); };

  const exportToCSV = () => { const data = getFilteredClients(); if (!data.length) return; const headers = ['iccid','imei','cliente','cotacao','simcard','codigo_cliente']; const sanitizeCell = (v: unknown) => { const s = (v||'').toString().replace(/"/g,'""'); return /^[=+@%]/.test(s) ? `'${s}` : s; }; const rows = data.map(c => headers.map(h => `"${sanitizeCell(c[h])}"`).join(',')); const blob = new Blob([headers.join(',') + '\n' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'dispositivos.csv'; document.body.appendChild(a); a.click(); document.body.removeChild(a); };

  const handleSaveToDatabase = async () => {
    if (!csvBuffer.length) return; setImportLoading(true); setImportStatus('');
    try { const { inserted, duplicates, errors } = await dbSaveDevices(csvBuffer); if (errors.length) setImportStatus(`erros:${errors.length}`); else if (duplicates > 0 && inserted === 0) setImportStatus('duplicados'); else if (duplicates > 0) setImportStatus(`sucesso_dup:${inserted}:${duplicates}`); else setImportStatus(`sucesso:${inserted}`); setClients(await dbGetDevices()); setCsvBuffer([]); } catch { setImportStatus('erro'); } finally { setImportLoading(false); }
  };

  const dbBaseToState = (b: any) => ({ id: b.id, cnpjCpf: b.cnpj_cpf ?? b.cnpjCpf ?? '', razaoSocial: b.razao_social ?? b.razaoSocial ?? '', nomeFantasia: b.nome_fantasia ?? b.nomeFantasia ?? '', proprietario: b.proprietario ?? '', codigoCliente: b.codigo_cliente ?? b.codigoCliente ?? '', status: b.status ?? 'Ativo', plataforma: b.plataforma ?? 'N/A', ultimaAlteracao: b.ultima_alteracao ?? b.ultimaAlteracao ?? '' });

  const handleSaveBase = async () => { setBaseLoading(true); try { if (editingBase) { const updated = await dbUpdateBase(editingBase.id, { ...newBase, status: editingBase.status, plataforma: editingBase.plataforma }); setBases(bases.map(b => b.id === editingBase.id ? dbBaseToState(updated) : b)); } else { const created = await dbCreateBase(newBase); setBases([dbBaseToState(created), ...bases]); } setNewBase({ cnpjCpf:'', razaoSocial:'', nomeFantasia:'', proprietario:'', codigoCliente:'' }); setIsBaseModalOpen(false); setEditingBase(null); } catch (err: any) { alert('Erro ao salvar base: ' + err.message); } finally { setBaseLoading(false); } };

  const handleDeleteBase = async (id: number) => { await dbDeleteBase(id); setBases(bases.filter(b => b.id !== id)); setIsBaseModalOpen(false); setEditingBase(null); };

  const handleAddUser = async () => {
    setAddUserError(''); setAddUserSuccess('');
    if (!newProfileEmail || !newProfilePassword) { setAddUserError('Preencha e-mail e senha.'); return; }
    if (!newProfileName.trim()) { setAddUserError('Preencha o nome do usuário.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newProfileEmail.trim())) { setAddUserError('E-mail inválido.'); return; }
    const pwdErrors = validatePasswordStrength(newProfilePassword);
    if (pwdErrors.length) { setAddUserError('Senha fraca: ' + pwdErrors.join(', ') + '.'); return; }
    try {
      await dbCreateUsuario(newProfileEmail, newProfilePassword, newProfileRole, newProfileName.trim());
      setRegisteredUsers(await dbGetUsuarios());
      setNewProfileEmail(''); setNewProfilePassword(''); setNewProfileName(''); setNewProfileRole('Suporte');
      setAddUserSuccess('Usuário criado com sucesso!');
      setTimeout(() => setAddUserSuccess(''), 3000);
    } catch (err: any) { setAddUserError(err.message); }
  };

  const handleToggleRole = async (targetEmail: string, currentRole: Role) => { const newRole: Role = currentRole === 'ADM' ? 'Suporte' : 'ADM'; await dbUpdateUsuarioRole(targetEmail, newRole); setRegisteredUsers(await dbGetUsuarios()); };

  const handleDeleteUser = async (targetEmail: string) => { await dbDeleteUsuario(targetEmail); setRegisteredUsers(await dbGetUsuarios()); setDeleteConfirmEmail(null); };
  return (
    <div className="min-h-screen bg-[#0A1128] text-white font-sans">
      <AnimatePresence mode="wait">
        {!user ? (
          <motion.div key="login" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="flex h-screen items-center justify-center p-4"
            style={{ background:'radial-gradient(ellipse at 60% 30%, #0D4F5C 0%, #0A1128 65%)' }}>
            <div className="w-full max-w-md">
              <div className="flex justify-center mb-8">
                <img src="/logo.png" alt="Arqia" className="h-24 w-auto object-contain drop-shadow-[0_0_24px_rgba(0,176,176,0.35)]" />
              </div>
              <form onSubmit={handleLogin} className="w-full p-8 bg-[#0C1635]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
                <h1 className="text-2xl font-bold mb-1 text-center tracking-tight">Device <span className="text-[#00D1C1]">Intranet</span></h1>
                <p className="text-center text-sm text-white/40 mb-6">Acesso exclusivo equipe Arqia</p>
                {loginError && <Alert type={loginError.includes('servidor') || loginError.includes('configurado') ? 'warning' : 'error'}>{loginError}</Alert>}
                <div className="space-y-4 mb-6">
                  <div>
                    <label htmlFor="login-email" className="block text-xs text-white/50 mb-1 ml-1">E-mail corporativo</label>
                    <input id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@arqia.com.br" className="w-full bg-[#080E24] border border-white/10 rounded-lg py-2.5 px-4 text-white placeholder-white/30 hover:border-white/20 focus:border-[#00AEEF] outline-none transition-colors text-sm" required />
                  </div>
                  <div>
                    <label htmlFor="login-password" className="block text-xs text-white/50 mb-1 ml-1">Senha</label>
                    <input id="login-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-[#080E24] border border-white/10 rounded-lg py-2.5 px-4 text-white placeholder-white/30 hover:border-white/20 focus:border-[#00AEEF] outline-none transition-colors text-sm" required />
                  </div>
                </div>
                <button type="submit" className="w-full py-3 px-4 bg-gradient-to-r from-[#00AEEF] to-[#00D1C1] text-[#0A1128] rounded-lg hover:opacity-90 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#00AEEF]/60 focus-visible:outline-none transition font-bold tracking-wide">Entrar</button>
              </form>
            </div>
          </motion.div>
        ) : (
          <div className="min-h-screen">
            <nav className="flex justify-between items-center px-5 py-2 text-white text-sm relative z-20" style={{ background:'linear-gradient(90deg,#0A1B2E 0%,#0D2940 100%)', borderBottom:'1px solid rgba(0,174,239,0.15)' }}>
              <div className="flex items-center gap-6">
                <button onClick={() => setActiveView('dashboard')} className="flex-shrink-0">
                  <img src="/logo.png" alt="Arqia" className="h-8 w-auto object-contain" />
                </button>
                <div className="h-5 w-px bg-white/10" />
                <div className="relative">
                  <button onClick={() => { setIsDropdownOpen(!isDropdownOpen); setIsProfileDropdownOpen(false); }} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors text-white/80 hover:text-white">
                    <span>≡</span><span>Ferramentas</span><span className="text-xs opacity-60">▼</span>
                  </button>
                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div initial={{ opacity:0,y:-8 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-8 }} className="absolute top-10 left-0 bg-[#0C1635] border border-white/10 rounded-xl shadow-2xl p-2 z-30 w-64">
                        {[{ id:'clientes', icon:User, label:'Controle de Clientes' }, { id:'importar', icon:Package, label:'Importar Dispositivos' }, { id:'base-cliente', icon:BarChart3, label:'Base do Cliente' }].map(item => (
                          <div key={item.id} onClick={() => { setActiveView(item.id); setIsDropdownOpen(false); }} className="flex items-center gap-3 p-2.5 hover:bg-white/5 rounded-lg cursor-pointer text-sm text-white/80 hover:text-white transition-colors">
                            <item.icon size={16} className="text-[#00D1C1]" />{item.label}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <div className="relative">
                <button onClick={() => { setIsProfileDropdownOpen(!isProfileDropdownOpen); setIsDropdownOpen(false); }} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#00AEEF] to-[#00D1C1] flex items-center justify-center text-[#0A1128] font-bold text-xs">{(user.name || user.email).charAt(0).toUpperCase()}</div>
                  <div className="text-left"><p className="text-sm font-medium leading-none">{user.name}</p><p className="text-xs text-[#00D1C1] leading-none mt-0.5">{user.role}</p></div>
                  <span className="text-xs opacity-50 ml-1">▼</span>
                </button>
                <AnimatePresence>
                  {isProfileDropdownOpen && (
                    <motion.div initial={{ opacity:0,y:-8 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,y:-8 }} className="absolute top-12 right-0 bg-[#0C1635] border border-white/10 rounded-xl shadow-2xl p-2 z-30 w-52">
                      <button onClick={() => { setShowProfileModal(true); setIsProfileDropdownOpen(false); }} className="w-full text-left p-2.5 hover:bg-white/5 rounded-lg text-sm text-white/80 hover:text-white transition-colors">Gerenciar Perfis</button>
                      <div className="border-t border-white/10 my-1" />
                      <button onClick={logout} className="w-full text-left p-2.5 hover:bg-red-900/30 rounded-lg text-sm text-red-400 hover:text-red-300 transition-colors">Sair</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </nav>
            <main className={activeView === 'dashboard' ? '' : 'p-6'}>
              <AnimatePresence mode="wait">
                <motion.div key={activeView} variants={containerVariants} initial="hidden" animate="visible" exit="hidden">
                  {activeView !== 'dashboard' && (<motion.div variants={itemVariants} className="mb-6"><h2 className="text-2xl font-bold tracking-tight">{activeView === 'clientes' && 'Controle de Clientes'}{activeView === 'importar' && 'Importar Dispositivos'}{activeView === 'base-cliente' && 'Base do Cliente'}</h2></motion.div>)}
                  {activeView === 'dashboard' && (
                    <motion.div variants={itemVariants}>
                      {isUserAdmin && !hasSupabase && <div className="px-6 pt-4"><Alert type="warning">Banco de dados não configurado — dados salvos apenas no navegador.</Alert></div>}
                      {dataError && <div className="px-6 pt-4"><Alert type="error">{dataError} <button onClick={() => { setDataError(''); setDataLoading(true); dbGetDevices().then(setClients).catch(() => setDataError('Falha na reconexão.')).finally(() => setDataLoading(false)); }} className="underline ml-1 hover:no-underline">Tentar novamente</button></Alert></div>}
                      <TRX16Hero userName={user.name} />
                    </motion.div>
                  )}
                  {activeView === 'clientes' && (
                    <motion.div variants={itemVariants} className="bg-[#0C1635]/80 p-6 rounded-2xl border border-white/10">
                      {/* barra de busca + ações */}
                      <div className="mb-3 flex gap-3">
                        <input type="text" placeholder="Buscar por nome, ICCID, IMEI..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="flex-grow bg-[#080E24] border border-white/10 rounded-lg py-2 px-4 text-white placeholder-white/30 hover:border-white/20 focus:border-[#00AEEF] outline-none transition-colors text-sm" />
                        <button onClick={() => setShowFilters(v => !v)} className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${showFilters || filterCliente || filterCotacao || filterSimcard ? 'border-[#00AEEF]/60 text-[#00AEEF] bg-[#00AEEF]/10' : 'border-white/10 text-white/60 hover:text-white hover:border-white/20 bg-[#080E24]'}`}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
                          Filtros{(filterCliente || filterCotacao || filterSimcard) ? ` (${[filterCliente,filterCotacao,filterSimcard].filter(Boolean).length})` : ''}
                        </button>
                        <div className="relative">
                          <button onClick={() => setShowExportMenu(v => !v)} disabled={!clients.length} className="flex items-center gap-2 px-4 py-2 bg-[#00D1C1] text-[#0A1128] rounded-lg font-semibold hover:opacity-90 active:scale-95 transition text-sm disabled:opacity-40">
                            Exportar <span className="text-xs opacity-70">▼</span>
                          </button>
                          <AnimatePresence>
                            {showExportMenu && (
                              <motion.div initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}} className="absolute right-0 top-11 bg-[#0C1635] border border-white/10 rounded-xl shadow-2xl p-1.5 z-30 w-44">
                                <button onClick={() => { exportToExcel(); setShowExportMenu(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/></svg>
                                  Excel (.xlsx)
                                </button>
                                <button onClick={() => { exportToCSV(); setShowExportMenu(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
                                  CSV (.csv)
                                </button>
                                <div className="border-t border-white/10 my-1"/>
                                <p className="px-3 py-1 text-xs text-white/30">{getFilteredClients().length} registro(s)</p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                      {/* painel de filtros */}
                      <AnimatePresence>
                        {showFilters && (
                          <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}} className="overflow-hidden">
                            <div className="mb-4 p-4 bg-[#080E24] rounded-xl border border-white/5 grid grid-cols-3 gap-3">
                              <div>
                                <p className="text-xs text-white/40 mb-1.5 uppercase tracking-wider">Cliente</p>
                                <select value={filterCliente} onChange={e => setFilterCliente(e.target.value)} className="w-full bg-[#0C1635] border border-white/10 rounded-lg py-2 px-3 text-sm text-white hover:border-white/20 focus:border-[#00AEEF] outline-none transition-colors">
                                  <option value="">Todos</option>
                                  {[...new Set(clients.map(c => c.cliente).filter(Boolean))].sort().map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                              </div>
                              <div>
                                <p className="text-xs text-white/40 mb-1.5 uppercase tracking-wider">Cotação</p>
                                <select value={filterCotacao} onChange={e => setFilterCotacao(e.target.value)} className="w-full bg-[#0C1635] border border-white/10 rounded-lg py-2 px-3 text-sm text-white hover:border-white/20 focus:border-[#00AEEF] outline-none transition-colors">
                                  <option value="">Todas</option>
                                  {[...new Set(clients.map(c => c.cotacao).filter(Boolean))].sort().map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                              </div>
                              <div>
                                <p className="text-xs text-white/40 mb-1.5 uppercase tracking-wider">SIM Card</p>
                                <select value={filterSimcard} onChange={e => setFilterSimcard(e.target.value)} className="w-full bg-[#0C1635] border border-white/10 rounded-lg py-2 px-3 text-sm text-white hover:border-white/20 focus:border-[#00AEEF] outline-none transition-colors">
                                  <option value="">Todos</option>
                                  {[...new Set(clients.map(c => c.simcard).filter(Boolean))].sort().map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {/* tabela */}
                      {dataLoading ? (
                        <div className="space-y-2 py-4">{[...Array(5)].map((_,i) => (<div key={i} className="h-10 bg-white/5 rounded-lg animate-pulse" style={{opacity: 1 - i*0.15}} />))}</div>
                      ) : dataError ? (
                        <div className="py-10 text-center">
                          <p className="text-white/40 text-sm mb-3">Não foi possível carregar os dispositivos.</p>
                          <button onClick={() => { setDataError(''); setDataLoading(true); dbGetDevices().then(setClients).catch(() => setDataError('Falha na reconexão.')).finally(() => setDataLoading(false)); }} className="text-[#00AEEF] text-sm hover:underline">Tentar novamente</button>
                        </div>
                      ) : clients.length === 0 ? (<p className="text-white/40 text-sm py-8 text-center">Nenhum dispositivo. Acesse <strong className="text-white/60">Importar Dispositivos</strong>.</p>) : (
                        <div className="overflow-x-auto"><table className="w-full text-left border-collapse"><thead><tr className="border-b border-white/20 text-gray-400 text-xs uppercase tracking-wider"><th className="py-3 px-2">ICCID</th><th className="py-3 px-2">IMEI</th><th className="py-3 px-2">Cliente</th><th className="py-3 px-2">Cotação</th><th className="py-3 px-2">SIM Card</th><th className="py-3 px-2">Cód. Cliente</th></tr></thead>
                        <tbody className="text-sm">{getFilteredClients().map((c,i) => (<tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors"><td className="py-3 px-2 font-mono text-[#00AEEF] text-xs">{c.iccid}</td><td className="py-3 px-2 font-mono text-xs">{c.imei}</td><td className="py-3 px-2">{c.cliente}</td><td className="py-3 px-2 text-white/60">{c.cotacao}</td><td className="py-3 px-2"><span className="px-2 py-0.5 bg-[#00AEEF]/10 text-[#00AEEF] rounded text-xs">{c.simcard}</span></td><td className="py-3 px-2 text-white/60">{c.codigo_cliente || '—'}</td></tr>))}</tbody></table></div>
                      )}
                    </motion.div>
                  )}
                  {activeView === 'importar' && (
                    <motion.div variants={itemVariants} className="bg-[#0C1635]/80 p-6 rounded-2xl border border-white/10">
                      <div className="mb-6 p-4 bg-[#080E24] rounded-lg border border-white/5 flex items-center justify-between">
                        <p className="text-sm text-white/50">Formato: <code className="text-[#00D1C1]">iccid, imei, cliente, cotacao, simcard, codigo_cliente</code></p>
                        <button onClick={downloadTemplate} className="text-xs text-[#00AEEF] hover:underline ml-4">Baixar modelo CSV</button>
                      </div>
                      <input type="file" accept=".csv" onChange={handleFileUpload} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#00AEEF] file:text-[#0A1128] hover:file:bg-[#00D1C1] mb-4 cursor-pointer" />
                      {csvBuffer.length > 0 && <Alert type="info">📄 {csvBuffer.length} registro(s) prontos para salvar</Alert>}
                      {importStatus === 'erro_tamanho'         && <Alert type="error">Arquivo muito grande. Máximo 5 MB.</Alert>}
                      {importStatus === 'erro_tipo'            && <Alert type="error">Apenas arquivos .csv são aceitos.</Alert>}
                      {importStatus === 'duplicados'           && <Alert type="warning">Todos os registros já existem no banco.</Alert>}
                      {importStatus === 'erro'                 && <Alert type="error">Erro ao salvar. Verifique a conexão e tente novamente.</Alert>}
                      {importStatus.startsWith('sucesso:')     && <Alert type="success">{importStatus.split(':')[1]} dispositivo(s) gravados com sucesso.</Alert>}
                      {importStatus.startsWith('sucesso_dup:') && <Alert type="success">{importStatus.split(':')[1]} gravados · {importStatus.split(':')[2]} duplicados ignorados.</Alert>}
                      {importStatus.startsWith('erros:')       && <Alert type="warning">{importStatus.split(':')[1]} linha(s) com ICCID/IMEI inválido foram ignoradas.</Alert>}
                      <button onClick={handleSaveToDatabase} disabled={!csvBuffer.length || importLoading} className="w-full py-3 px-4 bg-gradient-to-r from-[#00AEEF] to-[#00D1C1] text-[#0A1128] rounded-lg hover:opacity-90 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#00AEEF]/60 focus-visible:outline-none transition font-bold disabled:opacity-40 flex items-center justify-center gap-2">
                        {importLoading && <Loader2 size={16} className="animate-spin" />}{importLoading ? 'Salvando...' : `Salvar (${csvBuffer.length} dispositivos)`}
                      </button>
                    </motion.div>
                  )}
                  {activeView === 'base-cliente' && (
                    <motion.div variants={itemVariants} className="bg-[#0C1635]/80 p-6 rounded-2xl border border-white/10">
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold">Base do Cliente</h2>
                        {isUserAdmin && (<button onClick={() => { setEditingBase(null); setNewBase({ cnpjCpf:'', razaoSocial:'', nomeFantasia:'', proprietario:'', codigoCliente:'' }); setIsBaseModalOpen(true); }} className="bg-gradient-to-r from-[#00AEEF] to-[#00D1C1] text-[#0A1128] px-4 py-2 rounded-lg font-semibold hover:opacity-90 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#00AEEF]/60 focus-visible:outline-none transition text-sm">+ Criar Nova Base</button>)}
                      </div>
                      <AnimatePresence>
                        {isBaseModalOpen && (
                          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <motion.div initial={{ scale:0.9,opacity:0 }} animate={{ scale:1,opacity:1 }} exit={{ scale:0.9,opacity:0 }} className="bg-[#0C1635] p-6 rounded-2xl border border-white/10 w-full max-w-sm">
                              <div className="flex justify-between items-center mb-6"><h4 className="font-semibold text-lg">{editingBase ? 'Editar Base' : 'Nova Base'}</h4><button onClick={() => setIsBaseModalOpen(false)} className="text-gray-400 hover:text-white">✕</button></div>
                              <div className="space-y-3 mb-6">{[{ k:'cnpjCpf', p:'CNPJ / CPF' }, { k:'razaoSocial', p:'Razão Social' }, { k:'nomeFantasia', p:'Nome Fantasia' }, { k:'proprietario', p:'Proprietário' }, { k:'codigoCliente', p:'Código do Cliente' }].map(f => (<input key={f.k} type="text" placeholder={f.p} value={(newBase as any)[f.k]} onChange={e => setNewBase({...newBase,[f.k]:e.target.value})} className="w-full bg-[#080E24] border border-white/10 rounded-lg py-2 px-4 text-white placeholder-white/30 hover:border-white/20 focus:border-[#00AEEF] outline-none transition-colors text-sm" />))}</div>
                              <div className="flex gap-2">{editingBase && (<button onClick={() => handleDeleteBase(editingBase.id)} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold transition">Remover</button>)}<button onClick={handleSaveBase} disabled={baseLoading} className={`${editingBase?'flex-1':'w-full'} bg-gradient-to-r from-[#00AEEF] to-[#00D1C1] text-[#0A1128] py-2 rounded-lg font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-70`}>{baseLoading && <Loader2 size={14} className="animate-spin"/>}{editingBase ? 'Salvar Alterações' : 'Criar Base'}</button></div>
                            </motion.div>
                          </div>
                        )}
                      </AnimatePresence>
                      <div className="space-y-4">{bases.length === 0 ? (<p className="text-white/40 text-sm py-8 text-center">Nenhuma base cadastrada.</p>) : bases.map(base => (
                        <div key={base.id} className="p-4 bg-[#080E24] rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                          <div className="flex justify-between items-start">
                            <div><h3 className="font-bold text-[#00D1C1]">{base.codigoCliente && <span className="text-white/40 mr-1">[{base.codigoCliente}]</span>}{base.razaoSocial}</h3><p className="text-sm text-white/60 mt-0.5">{base.cnpjCpf} · <span className={base.status==='Inadimplente'?'text-red-400':'text-green-400'}>{base.status}</span></p>{base.nomeFantasia && <p className="text-sm mt-0.5"><span className="text-white/40">Fantasia:</span> {base.nomeFantasia}</p>}<p className="text-sm flex items-center gap-1 mt-0.5"><Globe size={13} className="text-white/40"/><span className="text-white/40">Plataforma:</span> {base.plataforma}</p></div>
                            <div className="flex gap-2 flex-shrink-0 ml-4">
                              <button onClick={() => setSelectedClient(p => p===String(base.id)?null:String(base.id))} className="bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors"><Package size={13}/> Dispositivos</button>
                              {isUserAdmin && (<><button onClick={() => { setEditingBase(base); setNewBase({ cnpjCpf:base.cnpjCpf, razaoSocial:base.razaoSocial, nomeFantasia:base.nomeFantasia, proprietario:base.proprietario, codigoCliente:base.codigoCliente }); setIsBaseModalOpen(true); }} className="bg-[#1a4a8a] hover:bg-[#1e5aaa] text-white px-3 py-1.5 rounded-lg text-xs transition-colors">Config.</button><button onClick={() => { if (window.confirm(`Excluir a base "${base.razaoSocial}"? Esta ação não pode ser desfeita.`)) handleDeleteBase(base.id); }} className="bg-red-800 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs transition-colors">✕</button></>)}
                            </div>
                          </div>
                          <AnimatePresence>
                            {selectedClient === String(base.id) && (
                              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                                <motion.div initial={{ scale:0.9,opacity:0 }} animate={{ scale:1,opacity:1 }} exit={{ scale:0.9,opacity:0 }} className="bg-[#0C1635] p-6 rounded-2xl border border-white/10 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
                                  <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-semibold text-lg">Dispositivos — {base.razaoSocial}</h4>
                                    <div className="flex items-center gap-2">
                                      {(() => { const rows = clients.filter(c=>(c.codigo_cliente||'')===(base.codigoCliente||'')); return rows.length > 0 && (
                                        <>
                                          <button onClick={() => { const ws = XLSX.utils.json_to_sheet(rows.map(c=>({'ICCID':c.iccid,'IMEI':c.imei,'Cliente':c.cliente,'Cotação':c.cotacao,'SIM Card':c.simcard,'Cód. Cliente':c.codigo_cliente}))); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,'Dispositivos'); XLSX.writeFile(wb,`${base.razaoSocial}.xlsx`); }} className="text-xs px-3 py-1.5 rounded-lg bg-[#00D1C1]/10 border border-[#00D1C1]/20 text-[#00D1C1] hover:bg-[#00D1C1]/20 transition-colors font-medium">Excel</button>
                                          <button onClick={() => { const rows2 = clients.filter(c=>(c.codigo_cliente||'')===(base.codigoCliente||'')); const csv = ['ICCID,IMEI,Cliente,Cotação,SIM Card,Cód. Cliente',...rows2.map(c=>[c.iccid,c.imei,c.cliente,c.cotacao,c.simcard,c.codigo_cliente].map(v=>{ const s=String(v??''); return /[,"\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s; }).join(','))].join('\n'); const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download=`${base.razaoSocial}.csv`; a.click(); }} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors font-medium">CSV</button>
                                        </>
                                      ); })()}
                                      <button onClick={() => setSelectedClient(null)} className="text-gray-400 hover:text-white ml-1">✕</button>
                                    </div>
                                  </div>
                                  {clients.filter(c=>(c.codigo_cliente||'')===(base.codigoCliente||'')).length === 0 ? (<p className="text-white/40 text-sm text-center py-6">Nenhum dispositivo encontrado.</p>) : (
                                    <table className="w-full text-left text-sm border-collapse"><thead><tr className="border-b border-white/20 text-gray-400 text-xs uppercase"><th className="py-2 px-2">ICCID</th><th className="py-2 px-2">IMEI</th><th className="py-2 px-2">Cliente</th><th className="py-2 px-2">Cotação</th><th className="py-2 px-2">SIM Card</th></tr></thead>
                                    <tbody>{clients.filter(c=>(c.codigo_cliente||'')===(base.codigoCliente||'')).map((c,i)=>(<tr key={i} className="border-b border-white/5 hover:bg-white/5"><td className="py-2 px-2 font-mono text-[#00AEEF] text-xs">{c.iccid}</td><td className="py-2 px-2 font-mono text-xs">{c.imei}</td><td className="py-2 px-2">{c.cliente}</td><td className="py-2 px-2 text-white/60">{c.cotacao}</td><td className="py-2 px-2">{c.simcard}</td></tr>))}</tbody></table>
                                  )}
                                </motion.div>
                              </div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}</div>
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showProfileModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ scale:0.9,opacity:0 }} animate={{ scale:1,opacity:1 }} exit={{ scale:0.9,opacity:0 }}
              className="bg-[#0C1635] rounded-2xl border border-white/10 w-full max-w-lg flex flex-col max-h-[90vh]">

              {/* header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 flex-shrink-0">
                <div>
                  <h4 className="font-semibold text-lg">Gerenciar Perfis</h4>
                  <p className="text-xs text-white/40 mt-0.5">{registeredUsers.length} usuário{registeredUsers.length !== 1 ? 's' : ''} cadastrado{registeredUsers.length !== 1 ? 's' : ''}</p>
                </div>
                <button onClick={() => { setShowProfileModal(false); setAddUserError(''); setAddUserSuccess(''); setDeleteConfirmEmail(null); }} className="text-gray-400 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5">✕</button>
              </div>

              <div className="overflow-y-auto flex-1 p-6 space-y-6">

                {/* novo usuário — só ADM */}
                {isUserAdmin && (
                  <div className="space-y-3">
                    <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">Novo Usuário</p>
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder="Nome completo" value={newProfileName} onChange={e => setNewProfileName(e.target.value)}
                        className="col-span-2 bg-[#080E24] border border-white/10 rounded-lg py-2 px-3 text-white placeholder-white/30 hover:border-white/20 focus:border-[#00AEEF] outline-none transition-colors text-sm" />
                      <input type="email" placeholder="E-mail" value={newProfileEmail} onChange={e => setNewProfileEmail(e.target.value)}
                        className="col-span-2 bg-[#080E24] border border-white/10 rounded-lg py-2 px-3 text-white placeholder-white/30 hover:border-white/20 focus:border-[#00AEEF] outline-none transition-colors text-sm" />
                      <input type="password" placeholder="Senha" value={newProfilePassword} onChange={e => setNewProfilePassword(e.target.value)}
                        className="bg-[#080E24] border border-white/10 rounded-lg py-2 px-3 text-white placeholder-white/30 hover:border-white/20 focus:border-[#00AEEF] outline-none transition-colors text-sm" />
                      <select value={newProfileRole} onChange={e => setNewProfileRole(e.target.value as Role)}
                        className="bg-[#080E24] border border-white/10 rounded-lg py-2 px-3 text-white hover:border-white/20 focus:border-[#00AEEF] outline-none transition-colors text-sm">
                        <option value="Suporte">Suporte</option>
                        <option value="ADM">ADM</option>
                      </select>
                    </div>
                    {addUserError && <p className="text-xs text-red-400 bg-red-900/20 px-3 py-2 rounded-lg border border-red-800/40">{addUserError}</p>}
                    {addUserSuccess && <p className="text-xs text-[#00D1C1] bg-[#00D1C1]/10 px-3 py-2 rounded-lg border border-[#00D1C1]/20">{addUserSuccess}</p>}
                    <button onClick={handleAddUser}
                      className="w-full bg-gradient-to-r from-[#00AEEF] to-[#00D1C1] text-[#0A1128] py-2 rounded-lg font-semibold hover:opacity-90 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#00AEEF]/60 focus-visible:outline-none transition text-sm">
                      Adicionar Usuário
                    </button>
                  </div>
                )}

                {/* lista de usuários */}
                <div className="space-y-2">
                  <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">Usuários Cadastrados</p>
                  {(isUserAdmin ? registeredUsers : registeredUsers.filter(u => u.email === user?.email)).map((u: any) => (
                    <motion.div key={u.email} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                      className="flex items-center gap-3 bg-[#080E24] px-4 py-3 rounded-xl border border-white/5">
                      {/* avatar */}
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${u.role === 'ADM' ? 'bg-[#00AEEF]/20 text-[#00AEEF]' : 'bg-white/5 text-gray-400'}`}>
                        {(u.nome || u.email).charAt(0).toUpperCase()}
                      </div>
                      {/* info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{u.nome || u.email.split('@')[0]}</p>
                        <p className="text-xs text-white/40 truncate">{u.email}</p>
                      </div>
                      {/* role badge / toggle */}
                      {isUserAdmin ? (
                        <button onClick={() => handleToggleRole(u.email, u.role)}
                          title="Clique para alternar role"
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors flex-shrink-0 ${u.role === 'ADM' ? 'bg-[#00AEEF]/10 border-[#00AEEF]/30 text-[#00AEEF] hover:bg-[#00AEEF]/20' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20'}`}>
                          {u.role} ⇄
                        </button>
                      ) : (
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 ${u.role === 'ADM' ? 'bg-[#00AEEF]/10 border-[#00AEEF]/30 text-[#00AEEF]' : 'bg-white/5 border-white/10 text-gray-400'}`}>{u.role}</span>
                      )}
                      {/* delete */}
                      {isUserAdmin && u.email !== user?.email && (
                        deleteConfirmEmail === u.email ? (
                          <div className="flex gap-1 flex-shrink-0">
                            <button onClick={() => handleDeleteUser(u.email)} className="text-xs bg-red-900/40 hover:bg-red-900/70 text-red-400 px-2 py-1 rounded-lg border border-red-800/40 transition-colors">Confirmar</button>
                            <button onClick={() => setDeleteConfirmEmail(null)} className="text-xs bg-white/5 hover:bg-white/10 text-gray-400 px-2 py-1 rounded-lg border border-white/10 transition-colors">Cancelar</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteConfirmEmail(u.email)} className="text-gray-500 hover:text-red-400 transition-colors flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-900/20">✕</button>
                        )
                      )}
                    </motion.div>
                  ))}
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* confirmação de delete separada — já inline acima */}
    </div>
  );
}
