# Tela — Login (`/login`)

`admin/src/pages/Login.tsx`. Formulário simples (e-mail + senha) sobre fundo escuro (`bg-ink`), identidade visual da marca. Chama `POST /api/auth/login` via `AuthContext`. Em caso de sucesso, redireciona pra rota que o usuário tentou acessar antes de cair no login (`location.state.from`), ou `/` por padrão.
