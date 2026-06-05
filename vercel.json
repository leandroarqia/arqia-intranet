# 🚀 Deploy no Vercel — Arqia Intranet

## 1. Configurar Supabase (banco de dados)

1. Acesse https://supabase.com e crie uma conta
2. Clique em **New Project**
3. Vá em **SQL Editor → New Query**
4. Cole o conteúdo de `/supabase/schema.sql` e clique em **Run**
5. Vá em **Project Settings → API** e copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

## 2. Deploy no Vercel

1. Faça upload deste projeto no GitHub
2. Acesse https://vercel.com → **New Project** → importe o repositório
3. Em **Environment Variables**, adicione:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJxxxx...
   ```
4. Clique em **Deploy** — o Vercel detecta automaticamente as configurações

## 3. Rodar localmente

```bash
# 1. Copie o arquivo de variáveis
cp .env.example .env
# Edite .env com suas credenciais do Supabase

# 2. Instale as dependências
npm install

# 3. Rode o servidor de desenvolvimento
npm run dev
```

## Credenciais padrão

| E-mail | Senha | Perfil |
|---|---|---|
| leandro.palma@arqia.com.br | 5656 | ADM |
| devices.fulfillment@arqia.com.br | 142536 | Suporte |
| gustavo.holanda@arqia.com.br | 142536 | Suporte |
| suporte@arqia.com.br | 142536 | Suporte |

## Sem Supabase configurado

O sistema funciona em **modo local (localStorage)** — dados ficam apenas no navegador de quem está usando.

## Mudanças feitas para o deploy funcionar

- Substituído `motion/react` por `framer-motion` (pacote correto)
- Adicionado `@types/react` e `@types/react-dom` como devDependencies
- Corrigido `vercel.json` com `installCommand` e `buildCommand`
- Corrigido `vite.config.ts` para não usar alias `@` com `path` (evita erros no build)
- Corrigido `tsconfig.json` para compatibilidade total com Vite 5 + React 18
- Downgrade para React 18 e Vite 5 (versões estáveis e amplamente suportadas no Vercel)
