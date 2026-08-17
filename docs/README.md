# Documentação — Karla Angel Joias

Documentação viva, mantida junto com o código — toda mudança relevante no sistema deve manter essa pasta atualizada (ver regra completa em `ai-context/README.md`, seção final).

## Por onde começar

**Trabalhando no código pela primeira vez? Leia [ai-context/README.md](./ai-context/README.md) primeiro.** Stack, arquitetura, convenções e uma lista de problemas já resolvidos que não devem se repetir.

## Índice completo

| Área | Documento |
|---|---|
| **Orientação rápida** | [ai-context/README.md](./ai-context/README.md) |
| **Arquitetura** | [architecture/overview.md](./architecture/overview.md) — visão geral, os 3 projetos, deploy, rede |
| **API** | [api/README.md](./api/README.md) — índice de todas as rotas, por domínio |
| **Telas do admin** | [screens/README.md](./screens/README.md) — índice de todas as telas, por rota |
| **Funcionalidades** | [features/README.md](./features/README.md) — como os sistemas complexos funcionam de verdade |
| **Desenvolvimento** | [development/environment-variables.md](./development/environment-variables.md) — todas as env vars |
| | [development/local-setup.md](./development/local-setup.md) — rodar os 3 projetos localmente |
| **Troubleshooting** | [troubleshooting.md](./troubleshooting.md) — problemas reais já resolvidos, formato problema/causa/solução |
| **Changelog** | [../CHANGELOG.md](../CHANGELOG.md) — histórico de mudanças, por data |

## Estrutura de pastas

```
docs/
  ai-context/README.md   — orientação rápida (leia primeiro)
  architecture/overview.md
  api/                    — rotas por domínio (9 documentos + índice)
  screens/                — telas do admin por rota (10 documentos + índice)
  features/               — sistemas complexos (8 documentos + índice)
  development/            — env vars, como rodar localmente
  troubleshooting.md
```

## Manutenção

Estrutura criada em 2026-08-17, cobrindo o sistema completo desde a fundação (site institucional + painel admin + API + estoque + notificações + PWA). A partir daqui, qualquer mudança relevante no sistema deve atualizar o documento correspondente como parte da própria implementação, não depois — ver a regra completa em `ai-context/README.md`.
