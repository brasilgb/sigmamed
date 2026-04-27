# BACKEND MOBILE CONTRACT — SigmaMed

Este documento consolida o contrato final esperado pelo app mobile para autenticação, perfil, avatar e sincronização offline-first com a API Laravel.

## Base

Base URL em desenvolvimento:

```http
http://192.168.2.54:8000/api/v1
```

Headers protegidos:

```http
Authorization: Bearer <token>
Accept: application/json
Content-Type: application/json
X-Tenant-Id: 1
```

`X-Tenant-Id` é opcional se o backend resolver o tenant ativo pelo usuário autenticado.

## Auth

Registro retorna `token`, `user` e `tenant` dentro de `data`.
Login retorna `token` e `user` dentro de `data`.
O tenant atual pode ser obtido em:

```http
GET /api/v1/auth/me
Authorization: Bearer <token>
Accept: application/json
```

```json
{
  "data": {
    "user": {
      "id": 1,
      "name": "João Silva",
      "email": "joao@exemplo.com",
      "age": 35,
      "created_at": "2026-04-25T10:00:00Z",
      "updated_at": "2026-04-25T10:00:00Z"
    },
    "tenant": {
      "id": 1,
      "name": "João Silva",
      "slug": "joao-silva",
      "uuid": "tenant-uuid"
    },
    "token": "1|abcdefg1234567890"
  },
  "meta": {},
  "message": "Registration successful."
}
```

Login retorna um payload similar, mas sem o objeto `tenant`.

O app usa:

- `data.token` para `Authorization: Bearer`
- `data.tenant.id` para `X-Tenant-Id` quando o tenant estiver disponível
- `data.user.age` para exibir a idade do usuário
- `GET /api/v1/auth/me` para obter o tenant atual depois do login
- `GET /api/v1/profile` para obter `profile_id` nos payloads de sync
- `data.avatar_url` do upload de avatar para foto de perfil remota

## Profile

Endpoint:

```http
GET /api/v1/profile
Authorization: Bearer <token>
Accept: application/json
```

Response esperado:

```json
{
  "data": {
    "id": 1,
    "uuid": "profile-uuid",
    "tenant_id": 1,
    "user_id": 1,
    "name": "João Silva",
    "photo_path": null,
    "height": null,
    "target_weight": null,
    "has_diabetes": false,
    "has_hypertension": false,
    "created_at": "2026-04-25T10:00:00Z",
    "updated_at": "2026-04-25T10:00:00Z"
  },
  "meta": {},
  "message": "Profile loaded."
}
```

Ponto crítico: `data.id` precisa ser um perfil válido para o usuário e tenant autenticados. O app usa esse valor como `profile_id` no sync.

## Avatar

Upload:

```http
POST /api/v1/auth/me/avatar
Authorization: Bearer <token>
Accept: application/json
Content-Type: multipart/form-data
X-Tenant-Id: 1
```

Body multipart:

- `avatar`: arquivo `jpg`, `jpeg`, `png` ou `webp`

Response:

```json
{
  "data": {
    "photo_path": "avatars/abc123def456.png",
    "avatar_url": "http://localhost/storage/avatars/abc123def456.png"
  },
  "meta": {},
  "message": "Avatar uploaded."
}
```

Delete:

```http
DELETE /api/v1/auth/me/avatar
Authorization: Bearer <token>
Accept: application/json
X-Tenant-Id: 1
```

Response:

```json
{
  "data": {},
  "meta": {},
  "message": "Avatar removed."
}
```

## Sync Push

Endpoint:

```http
POST /api/v1/sync/push
```

Regra geral:

- `resource` define a tabela/recurso de destino.
- `items` contém os registros.
- O backend deve fazer upsert por `tenant_id + uuid`.
- `updated_at` resolve conflito: o mais recente vence.
- `deleted_at` indica soft delete.
- `profile_id` deve pertencer ao tenant e usuário autenticados.

### Blood Pressure

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
      "updated_at": "2026-04-25T12:00:00Z",
      "deleted_at": null
    }
  ]
}
```

### Glicose

```json
{
  "resource": "glicose",
  "items": [
    {
      "uuid": "d5b1c2e3-4567-4f8d-9c01-abcdef012345",
      "profile_id": 1,
      "glicose_value": 95,
      "unit": "mg/dL",
      "context": "fasting",
      "measured_at": "2026-04-25T08:30:00Z",
      "source": "manual",
      "notes": "Jejum",
      "updated_at": "2026-04-25T08:30:00Z",
      "deleted_at": null
    }
  ]
}
```

### Weight

```json
{
  "resource": "weight",
  "items": [
    {
      "uuid": "f6c2d3e4-4567-4f8d-9c01-abcdef012345",
      "profile_id": 1,
      "weight": 78.4,
      "height": 1.72,
      "unit": "kg",
      "measured_at": "2026-04-25T08:30:00Z",
      "notes": "Pesagem matinal",
      "updated_at": "2026-04-25T08:30:00Z",
      "deleted_at": null
    }
  ]
}
```

### Medications

```json
{
  "resource": "medications",
  "items": [
    {
      "uuid": "m6c2d3e4-4567-4f8d-9c01-abcdef012345",
      "profile_id": 1,
      "name": "Losartana",
      "dosage": "50 mg",
      "instructions": "Tomar após o café",
      "active": true,
      "scheduled_time": "2026-04-25 08:00:00",
      "reminder_enabled": true,
      "reminder_minutes_before": 5,
      "repeat_reminder_every_five_minutes": false,
      "updated_at": "2026-04-25T08:30:00Z",
      "deleted_at": null
    }
  ]
}
```

### Medication Logs

```json
{
  "resource": "medication-logs",
  "items": [
    {
      "uuid": "l6c2d3e4-4567-4f8d-9c01-abcdef012345",
      "profile_id": 1,
      "medication_uuid": "m6c2d3e4-4567-4f8d-9c01-abcdef012345",
      "medication_id": 10,
      "taken_at": "2026-04-25T08:30:00Z",
      "notes": null,
      "updated_at": "2026-04-25T08:30:00Z",
      "deleted_at": null
    }
  ]
}
```

Preferir `medication_uuid` para resolver a medicação no backend. `medication_id` pode ser aceito como fallback quando já for um ID remoto válido.
O app continua tratando o horario da medicacao como `HH:mm` localmente, mas no sync envia `scheduled_time` como `YYYY-MM-DD HH:mm:ss`, combinando a hora local com a data de `updated_at`, para compatibilidade com backend que persiste esse campo em coluna `DATETIME`.

## Sync Push Response

O backend deve retornar os itens persistidos.

```json
{
  "success": true,
  "message": "Blood-pressure push completed.",
  "meta": {},
  "data": [
    {
      "id": 123,
      "uuid": "c4a0b1b8-1234-4d2f-9f3e-abcdef012345",
      "tenant_id": 1,
      "profile_id": 1,
      "systolic": 120,
      "diastolic": 80,
      "pulse": 70,
      "measured_at": "2026-04-25T12:00:00Z",
      "source": "manual",
      "notes": "Pressão normal",
      "created_at": "2026-04-25T12:00:00Z",
      "updated_at": "2026-04-25T12:00:00Z",
      "deleted_at": null
    }
  ]
}
```

## Sync Pull

Endpoint:

```http
POST /api/v1/sync/pull
```

Request:

```json
{
  "resource": "blood-pressure",
  "since": "2026-04-25T00:00:00Z"
}
```

`since` é opcional. Se omitido, o backend pode retornar todos os registros do tenant/usuário.

Response:

```json
{
  "success": true,
  "message": "Blood-pressure pull completed.",
  "meta": {},
  "data": [
    {
      "id": 123,
      "uuid": "c4a0b1b8-1234-4d2f-9f3e-abcdef012345",
      "tenant_id": 1,
      "profile_id": 1,
      "systolic": 120,
      "diastolic": 80,
      "pulse": 70,
      "measured_at": "2026-04-25T12:00:00Z",
      "source": "manual",
      "notes": "Pressão normal",
      "created_at": "2026-04-25T12:00:00Z",
      "updated_at": "2026-04-25T12:00:00Z",
      "deleted_at": null
    }
  ]
}
```

## Recursos Suportados

Valores aceitos em `resource`:

- `blood-pressure`
- `glicose`
- `weight`
- `medications`
- `medication-logs`

## Observações de Implementação

- Login e registro são online-only.
- Depois do login, o app opera offline-first com SQLite.
- Quando o backend estiver disponível, o app tenta `sync/push` dos pendentes.
- Em outro celular, o app faz login online e depois `sync/pull`.
- Nunca validar `profile_id` apenas por existência global. Validar por usuário/tenant autenticado.
- Se `profile_id` não for enviado ou for inválido, retornar erro de validação claro.
- `deleted_at` deve aplicar soft delete, não remoção física imediata.
