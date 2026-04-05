

# Plano: Recuperação de Senha + Redesign Visual

## 1. Recuperação de Senha

### 1a. Adicionar link "Esqueci minha senha" na tela de login (`Auth.tsx`)
- Adicionar um estado `forgotPassword` para alternar entre login e formulário de recuperação
- No modo de recuperação: campo de email + botão "Enviar link de recuperação"
- Chamar `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset-password' })`
- Mostrar mensagem de sucesso após envio

### 1b. Criar página `/reset-password` (`src/pages/ResetPassword.tsx`)
- Detectar token de recovery na URL (hash params `type=recovery`)
- Formulário com nova senha + confirmação (reutilizar `PasswordStrengthIndicator`)
- Chamar `supabase.auth.updateUser({ password })` para definir nova senha
- Redirecionar para `/auth` após sucesso

### 1c. Registrar rota em `App.tsx`
- Adicionar rota pública `/reset-password` com o novo componente

---

## 2. Redesign Visual — Interface mais original

O objetivo é sair da aparência genérica mantendo o tema escuro com azul. As mudanças:

### 2a. Tela de Login/Auth (`Auth.tsx`)
- Adicionar fundo com padrão geométrico sutil (grid de pontos ou linhas usando CSS)
- Adicionar efeito de glow/blur atrás do card principal (blob gradiente animado)
- Logo maior com animação de entrada mais elaborada
- Card com borda gradiente (azul para transparente) e glassmorphism (`backdrop-blur`, `bg-opacity`)
- Botões com gradiente primário ao invés de cor sólida
- Inputs com fundo mais escuro e borda mais sutil

### 2b. CSS Global (`index.css`)
- Mover o `@import` do Google Fonts para antes dos `@tailwind` (fix de HMR)
- Adicionar classe `.glass-card` com `backdrop-blur-xl`, `bg-white/5`, `border border-white/10`
- Adicionar `.gradient-border` para bordas com gradiente
- Adicionar animação de fundo com partículas/dots pattern
- Adicionar variáveis para gradientes secundários (azul → roxo)

### 2c. Componentes globais
- Atualizar `card.tsx` com opção de variante glass
- Adicionar sombras com cor (glow azul sutil) nos cards ao hover

---

## Arquivos a serem criados/editados

| Arquivo | Ação |
|---|---|
| `src/pages/Auth.tsx` | Adicionar "Esqueci senha" + redesign visual |
| `src/pages/ResetPassword.tsx` | **Criar** — página de redefinição de senha |
| `src/App.tsx` | Adicionar rota `/reset-password` |
| `src/index.css` | Novos utilitários CSS, fix @import, padrões visuais |

