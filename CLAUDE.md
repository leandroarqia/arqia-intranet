# Arqia Intranet — Guia do Projeto

## Setup Local (VS Code)
```bash
# 1. Clonar
git clone https://github.com/leandroarqia/arqia-intranet
cd arqia-intranet
npm install

# 2. Variáveis de ambiente
cp .env.example .env.local
# Preencher VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY

# 3. Rodar
npm run dev
```

### Claude Code no VS Code
1. Instalar extensão **Claude Code** no VS Code (marketplace Anthropic)
2. Fazer login com a mesma conta Anthropic
3. Abrir o projeto e usar `Ctrl+Shift+C` para abrir o chat
4. Todo o histórico de contexto e CLAUDE.md são preservados

### Próximos passos — Backend
- [ ] Configurar RLS policies no painel Supabase
- [ ] Hash de senhas com bcrypt (Supabase Edge Function ou migrar auth para Supabase Auth nativo)
- [ ] Rate limiting server-side (substituir o client-side atual)
- [ ] Variável `VITE_SUPABASE_ANON_KEY` continua no bundle — considerar proxy via Edge Function para queries sensíveis

## Stack
- React 18 + TypeScript + Vite + Tailwind CSS + Framer Motion
- Supabase (banco de dados + auth)
- Vercel (deploy) — branch `claude/admiring-ptolemy-QozDT` → force push para `main`
- `vercel.json`: rewrites SPA, `.nvmrc`: Node 20

## Deploy
```bash
npm run build
git add .
git commit -m "mensagem"
git push -u origin claude/admiring-ptolemy-QozDT
git push origin claude/admiring-ptolemy-QozDT:main --force
```

## Estrutura de Arquivos
```
src/
  App.tsx          — componente principal, toda a UI e lógica
  db.ts            — todas as funções de banco (Supabase + localStorage fallback)
  components/
    TRX16Hero.tsx  — hero animado da home com scroll-wheel capture
    TRX16Animation.tsx — versão antiga, não usada
public/
  trx16_0.png      — imagem frente do device
  trx16_1.png      — imagem traseira do device
  logo.png         — logo Arqia
  favicon.png      — ícone do browser
index.html         — tem CSP meta tag
tailwind.config.js — cores semânticas: primary, accent, surface, base, bg
```

## Agentes do Projeto
| Nome | Função |
|------|--------|
| **Mestre** | Desenvolvedor principal (este agente) |
| **Chefe** | Testador — verifica o site pelo Vercel |
| **Qla** | Qualidade — sugere melhorias de UX/visual |
| **Policia** | Segurança — audita vulnerabilidades |
| **Ladrão** | Pentest — tenta atacar o sistema |

## Versões Salvas
- `v50` — tag git, estado estável com hero animado + melhorias Qla + filtros export

## Funcionalidades Implementadas
### Dashboard (home)
- `TRX16Hero` — hero com device TRX-16, animação por scroll wheel
  - Saudação (Bom dia/tarde/noite + nome) em fluxo normal acima do hero
  - Hero altura fixa 480px, captura wheel para animar
  - Cards "Sempre online" e "Robusto. Inteligente." aparecem ao rolar
  - Device vira da frente para traseira ao rolar

### Controle de Clientes
- Tabela: ICCID, IMEI, Cliente, Cotação, SIM Card, Cód. Cliente
- Busca por texto livre
- Filtros por: Cliente, Cotação, SIM Card (dropdowns com valores únicos)
- Export: Excel (.xlsx) e CSV (.csv) — exporta apenas os filtrados
- Loading skeleton animado

### Importar Dispositivos
- Upload CSV (máx 5MB, máx 10.000 linhas, só .csv)
- Validação ICCID (15-22 dígitos) e IMEI (15 dígitos) ANTES de sanitizar
- Template CSV: `iccid,imei,cliente,cotacao,simcard,codigo_cliente`
- Feedback: duplicados, erros de validação, sucesso

### Base do Cliente
- CRUD completo de bases
- Confirmação antes de excluir
- Modal com campos: CNPJ/CPF, Razão Social, Nome Fantasia, Proprietário, Código Cliente
- Visualizar dispositivos vinculados por código_cliente

### Nav
- Logo Arqia (logo.png)
- Menu Ferramentas com dropdown
- Avatar com inicial do nome, role, dropdown com Gerenciar Perfis e Sair

### Gerenciar Perfis (modal)
- Criar usuário (ADM só) — valida força de senha (8+ chars, 1 letra, 1 número)
- Toggle role ADM ↔ Suporte
- Deletar usuário

## Segurança (Policia + Ladrão)
- ✅ Credenciais hardcoded removidas — login só via Supabase
- ✅ Rate limiting: 5 tentativas / 15 min por email (client-side)
- ✅ Sanitização: remove `<>"'\`=+@%` de todos os campos
- ✅ Validação CSV: validate antes de sanitize
- ✅ Formula injection no export: células com `=+@%` recebem prefixo `'`
- ✅ Limite: CSV máx 5MB e 10k linhas
- ✅ Força de senha ao criar usuário
- ✅ localStorage limpo no logout
- ✅ CSP header no index.html
- ⚠️ Rate limiting bypassável via múltiplas abas (precisa backend)
- ⚠️ ANON_KEY Supabase exposta no bundle (arquitetura SPA — inevitável sem backend)
- ⚠️ RLS policies no Supabase não configuradas (fazer no painel Supabase)

## Cores do Projeto
```
#0A1128  bg principal
#0C1635  surface (cards)
#080E24  base (inputs)
#00AEEF  primary (azul)
#00D1C1  accent (ciano)
#21C8D4  accent hero TRX-16
```

## Padrões de Código
- Inputs: `bg-[#080E24] border border-white/10 hover:border-white/20 focus:border-[#00AEEF] outline-none transition-colors text-sm`
- Botão primário: `bg-gradient-to-r from-[#00AEEF] to-[#00D1C1] text-[#0A1128] ... active:scale-95 focus-visible:ring-2`
- Cards: `bg-[#0C1635]/80 p-6 rounded-2xl border border-white/10`
- Modais: `fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4`

## Banco de Dados (Supabase)
Tabelas: `usuarios`, `devices`, `bases`
- `usuarios`: id, email, senha, nome, role ('ADM' | 'Suporte')
- `devices`: id, iccid, imei, cliente, cotacao, simcard, codigo_cliente, criado_em
- `bases`: id, cnpj_cpf, razao_social, nome_fantasia, proprietario, codigo_cliente, status, plataforma, ultima_alteracao, criado_em
