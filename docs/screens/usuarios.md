# Tela — Usuários (`/usuarios`)

`admin/src/pages/Users.tsx`. Exige `canManageUsers`. Tabela + modal de formulário (nome, e-mail, senha — em branco ao editar mantém a atual —, 4 checkboxes de permissão). Não é possível excluir o próprio usuário logado (botão de excluir some na própria linha). Ver a regra de "não pode remover a última permissão de gestão de usuários" em `docs/api/users.md`.
