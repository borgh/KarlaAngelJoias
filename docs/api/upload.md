# API — Upload de imagens

| Método | Caminho | Permissão | Descrição |
|---|---|---|---|
| POST | `/api/upload` | `canCreate` | `multipart/form-data`, campo `file` → `{ url: "/uploads/xxxx.jpg" }` |

- Tipos aceitos: JPEG, PNG, WEBP, GIF, SVG.
- Tamanho máximo: 8MB (limite do `multer`) — mas o **Nginx** na frente também limita (`client_max_body_size 10M`, ver `admin/nginx.conf` e `deploy/docker/nginx.conf`) — se precisar aumentar, os dois limites precisam mudar juntos.
- Arquivos salvos em `/app/uploads` dentro do container, no volume nomeado `karlaangeljoias-uploads` (persistente entre deploys).
- Nome do arquivo gerado com `nanoid` — nunca reaproveita o nome original (evita colisão e problemas de encoding).
- Servido estaticamente pela própria API em `/uploads/:filename`, e proxiado pelo Nginx do site/admin no mesmo caminho.
