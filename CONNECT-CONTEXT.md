# CONNECT CONTEXT — Meu Controle Laravel API

## Objetivo

Documentar como o app deve se conectar ao backend Laravel do Meu Controle.

O foco é oferecer:

- autenticação com Laravel Sanctum
- resolução de tenant ativa
- endpoints de sync padrão
- payloads e headers necessários

## Base da Conexão

A API expõe rotas versionadas em `/api/v1`.

A autenticação é feita via token Bearer gerado por Laravel Sanctum.

Todas as chamadas protegidas devem enviar:

- `Authorization: Bearer <token>`
- `Accept: application/json`

Opcionalmente:

- `X-Tenant-Id: <tenant_id>`

Se `X-Tenant-Id` não for enviado, o backend usa o primeiro tenant associado ao usuário autenticado.

## Fluxo de Conexão do App

### 1) Registrar (caso não tenha usuário)

POST `/api/v1/auth/register`

Body JSON mínimo:

```json
{
  "name": "Nome do usuário",
  "email": "usuario@exemplo.com",
  "password": "senha123",
  "password_confirmation": "senha123"
}
```

### 2) Login

POST `/api/v1/auth/login`

Body JSON:

```json
{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

Resposta esperada:

- token de autenticação (personal access token ou `plainTextToken`)

Use esse token para chamadas protegidas:

```http
Authorization: Bearer <token>
Accept: application/json
```

## Tenant e Tenancy

O backend usa multi-tenancy por coluna (`tenant_id`).

Para permitir que o app envie explicitamente qual tenant usar, inclua:

```http
X-Tenant-Id: 1
```

Se o header não existir, o middleware resolve o tenant ativo automaticamente usando o primeiro tenant vinculado ao usuário.

## Endpoints de Sync

### Sync genérico push

POST `/api/v1/sync/push`

Body exemplo para `blood-pressure`:

```json
{
  "resource": "blood-pressure",
  "items": [
    {
      "uuid": "c4a0b1b8-1234-4d2f-9f3e-abcdef012345",
      "profile_id": 1,
      "systolic": 120,
      "diastolic": 80,
      "pulse": 70,
      "measured_at": "2026-04-25T12:00:00Z",
      "source": "manual",
      "notes": "Pressão normal",
      "updated_at": "2026-04-25T12:00:00Z"
    }
  ]
}
```

### Sync genérico pull

POST `/api/v1/sync/pull`

Body exemplo:

```json
{
  "resource": "blood-pressure",
  "since": "2026-04-25T00:00:00Z"
}
```

- `since` é opcional
- se omitido, retorna todos os registros do tenant

## Recursos suportados

O servidor aceita os seguintes valores em `resource`:

- `blood-pressure`
- `glicose`
- `weight`
- `medications`
- `medication-logs`

## Regras de validação principais

### `SyncPushRequest`

Campos comuns:

- `resource` — nome do recurso
- `items` — array de registros
- `items.*.uuid` — UUID obrigatório
- `items.*.profile_id` — ID de perfil obrigatório
- `items.*.updated_at` — opcional, data ISO

Campos adicionais por recurso:

- `blood-pressure`: `systolic`, `diastolic`, `pulse`, `measured_at`, `source`
- `glicose`: `glicose_value`, `unit`, `measured_at`, `source`
- `weight`: `weight`, `unit`, `measured_at`
- `medications`: `name`, `active`, `reminder_enabled`, `repeat_reminder_every_five_minutes`
- `medication-logs`: `medication_id` ou `medication_uuid`, `taken_at`, `deleted_at`

## Rotas específicas de sync

Além das rotas genéricas, existem rotas de sync independentes por recurso:

- POST `/api/v1/blood-pressure/sync`
- POST `/api/v1/glicose/sync`
- POST `/api/v1/weight/sync`
- POST `/api/v1/medications/sync`
- POST `/api/v1/medication-logs/sync`

No entanto, o app pode preferir usar os endpoints genéricos `/sync/push` e `/sync/pull`.

## Exemplo de headers para chamadas protegidas

```http
Authorization: Bearer <token>
Accept: application/json
Content-Type: application/json
X-Tenant-Id: 1
```

## Observações finais

- O backend já está configurado para MySQL conforme o ambiente.
- A API está pronta para ser usada pelo app mobile.
- O `updated_at` do item é usado para resolver conflitos de sincronização e evitar sobrescrever registros mais recentes do servidor.
