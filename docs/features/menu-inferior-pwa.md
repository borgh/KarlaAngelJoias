# Menu Inferior Mobile (PWA)

Barra de navegação fixa na parte de baixo da tela quando o admin é acessado pelo celular — como um aplicativo de verdade — com até 4 atalhos configuráveis + um botão fixo de "Menu" (abre a gaveta lateral completa). **Mesmo padrão já implementado no VBMA Sistemas** (`frontend/src/components/layout/AppLayout.tsx` de lá).

## Onde fica o código

- Renderização: `admin/src/components/Layout.tsx` (bloco `<nav className="fixed inset-x-0 bottom-0 ...">`)
- Configuração: `admin/src/pages/MobileNavSettings.tsx` (rota `/menu-inferior`)
- Lista de opções disponíveis (compartilhada entre as duas): `admin/src/config/mobileNavOptions.ts`
- Persistência: campo `User.bottomNavConfig` (array de até 4 caminhos, ex: `["/", "/produtos", "/estoque"]`) + rota `PUT /api/auth/bottom-nav-config`

## É preferência pessoal, não uma tela administrativa

Cada usuário escolhe os próprios atalhos — não afeta os outros. Por isso a rota de configuração fica **fora** do bloqueio de permissão `canManageUsers` — qualquer usuário logado pode acessar, mesmo sem nenhuma permissão administrativa. Existe um item de menu direto na gaveta lateral (só visível no celular, `lg:hidden`) justamente pra isso ficar descobrível.

## Comportamento

- Vazio (`bottomNavConfig = []`, padrão de um usuário que nunca configurou) → usa `DEFAULT_BOTTOM_NAV` (`["/", "/produtos", "/estoque"]`).
- As opções disponíveis pra adicionar são filtradas pela permissão real do usuário (`!option.requires || user[option.requires]`) — não adianta oferecer fixar um atalho pra "Usuários" se a pessoa não tem `canManageUsers`.
- A grade da barra é dinâmica (`gridTemplateColumns: repeat(N+1, 1fr)`, onde N = número de atalhos escolhidos) — se o usuário escolher menos de 4, os ícones se distribuem por igual em vez de ficar espremidos à esquerda.
- Reordenar é feito com botões de seta (▲▼) na tela de configuração, não drag-and-drop.
