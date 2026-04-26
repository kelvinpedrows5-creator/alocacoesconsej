---
name: Visual Identity (Editorial Indigo)
description: Identidade Editorial Corporativo — paleta Indigo Profundo, tipografia Urbanist/Epilogue, mesh gradients e mobile com FAB
type: design
---
# Identidade Visual — Editorial Corporativo (Indigo Profundo)

## Paleta (HSL via tokens em index.css)
- background: 240 30% 4% (quase preto azulado)
- card: 240 28% 7%
- primary (indigo elétrico): 243 75% 59%
- accent (violeta): 250 80% 65%
- muted-foreground: 220 12% 60%
- border: 240 20% 14%

## Tipografia
- Display/Headings: **Urbanist** (700–900, tracking -0.025em a -0.045em)
- Body: **Epilogue** (400–500)
- Mono (chips, ciclos, footers): **JetBrains Mono**
- Classes utilitárias: `.display`, `.eyebrow` (uppercase letter-spacing 0.18em), `.mono`
- Tailwind: `font-display`, `font-body`, `font-mono`

## Componentes-chave
- **Hero editorial** em cada tela: `.editorial-divider` + `.eyebrow` + título `.display` + label do ciclo em mono.
- **Header** usa `glass-card-strong` com logo + eyebrow "CONSEJ · Gestão" e nome "Alocações 360°".
- **Footer** mostra "CONSEJ · MMXXVI" em mono + autoria.
- **Mesh ambient** fixo no fundo (`bg-mesh` + `bg-noise`) para profundidade discreta.
- **`.editorial-card`** (cards com borda sutil + highlight no topo) substitui o glassmorphism puro.

## Mobile
- Sidebar funciona como drawer (collapsible="icon", off-canvas no mobile).
- **`QuickActionsFab`** (botão flutuante visível só em `md:hidden`) abre leque de atalhos contextuais conforme o papel: Registrar demanda, Nova oportunidade, Passagem de Bastão, Central de Ajuda.
- Padding inferior do main `pb-28 md:pb-10` para não cobrir conteúdo com o FAB.
- `.safe-bottom` respeita safe-area do iOS.

## Regras
- Nunca usar cores hex em componentes — apenas tokens semânticos.
- Headings sempre `font-display`; nunca usar `font-bold` em texto sem definir família.
- Labels de seção usam `.eyebrow`; números/códigos usam `font-mono`.
