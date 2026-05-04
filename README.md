# Meu Controle

Aplicativo mobile em Expo/React Native para monitoramento domestico de saude com foco em:

- pressao arterial
- glicose
- peso
- medicacoes

## Estrutura

O projeto usa `expo-router` com rotas em `src/app`.

```txt
src/
  app/
  components/
  constants/
  database/
  features/
  hooks/
  services/
  types/
  utils/
```

## Desenvolvimento

Instale as dependencias:

```bash
npm install
```

Inicie o projeto:

```bash
npx expo start
```

## Modulos ja iniciados

- dashboard local com historico unificado
- SQLite com migrations e seed inicial
- autenticacao local com e-mail e senha
- desbloqueio por PIN
- biometria opcional
- sessao protegida com Secure Store

## Documentacao interna

- [PROJECT-CONTEXT.md](./PROJECT-CONTEXT.md)
- [AUTH-CONTEXT.md](./AUTH-CONTEXT.md)
- [BACKEND-CONTEXT.md](./BACKEND-CONTEXT.md)
- [LARAVEL-IMPLEMENTATION-PLAN.md](./LARAVEL-IMPLEMENTATION-PLAN.md)
