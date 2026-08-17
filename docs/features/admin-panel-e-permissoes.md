# Painel admin e sistema de permissões

## Armazenamento: JSON puro, de propósito

`server/src/db/store.js` é um arquivo JSON único (`/data/karlaangel.json`), com uma API de coleções em memória (carregada uma vez no boot, cada escrita reescreve o arquivo inteiro de forma síncrona). Não é SQLite, não é Postgres — decisão deliberada depois de `better-sqlite3` causar Segmentation Fault consistente em produção (ver `troubleshooting.md` pro relato completo do diagnóstico, que levou várias tentativas até a solução definitiva).

Para a escala de um catálogo de loja pequena (algumas dezenas de produtos, poucos administradores, baixa frequência de escrita), isso é robusto o suficiente e elimina de vez uma classe inteira de bug (incompatibilidade de binário nativo entre ambientes).

Escrita é sempre "arquivo temporário + rename" (`store.js`, função `save()`) — evita corromper o arquivo principal se o processo for interrompido no meio de uma escrita.

## Permissões: 4 flags, não "roles"

Cada usuário tem 4 flags booleanas independentes: `canCreate`, `canEdit`, `canDelete`, `canManageUsers`. Não existe um enum de "papéis" (admin/editor/etc) — qualquer combinação é válida, decidida na hora de criar/editar o usuário (checkboxes na tela `/usuarios`).

Middleware em `server/src/auth.js`:
```js
requireAuth        // exige cookie de sessão válido, popula req.user
requirePermission('canX')  // exige que req.user[permission] seja true
```

Toda rota administrativa da API usa os dois em sequência: `router.post('/admin', requireAuth, requirePermission('canCreate'), handler)`.

## Migração de dados em produção

Como o "banco" é um arquivo JSON sem schema, adicionar um campo novo a um dos tipos (produto, categoria, usuário) não afeta registros já existentes automaticamente. `server/src/db/seed.js` roda em **todo boot do container** (não só na primeira vez) e inclui uma seção de migração: percorre os registros existentes e preenche campos que ainda não existem com um valor padrão sensato. Ver o próprio arquivo pros exemplos reais (campos de estoque, `bottomNavConfig`, etc.).

Isso é o equivalente funcional de uma migration de banco relacional, só que em JavaScript simples em vez de SQL.
