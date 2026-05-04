# CONNECT EXAMPLES — Meu Controle API

Este documento apresenta exemplos práticos de requests e responses para o app conectar ao backend Laravel do Meu Controle.

## 1) Login

### Request

POST `/api/v1/auth/login`

Headers:

```http
Accept: application/json
Content-Type: application/json
```

Body:

```json
{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

### Response (exemplo)

```json
{
  "data": {
    "user": {
      "id": 1,
      "name": "João Silva",
      "email": "joao@exemplo.com",
      "created_at": "2026-04-25T10:00:00Z",
      "updated_at": "2026-04-25T10:00:00Z"
    },
    "token": "1|abcdefg1234567890..."
  },
  "meta": {},
  "message": "Login successful."
}
```

> Use o token no header `Authorization: Bearer <token>` para chamadas protegidas.

---

## 2) Registrar novo usuário

### Request

POST `/api/v1/auth/register`

Headers:

```http
Accept: application/json
Content-Type: application/json
```

Body:

```json
{
  "name": "João Silva",
  "email": "joao@exemplo.com",
  "password": "senha123",
  "password_confirmation": "senha123"
}
```

### Response (exemplo)

```json
{
  "data": {
    "user": {
      "id": 1,
      "name": "João Silva",
      "email": "joao@exemplo.com",
      "created_at": "2026-04-25T10:00:00Z",
      "updated_at": "2026-04-25T10:00:00Z"
    },
    "tenant": {
      "id": 1,
      "name": "João Silva",
      "slug": "joao-silva",
      "owner_id": 1,
      "uuid": "...",
      "created_at": "2026-04-25T10:00:00Z",
      "updated_at": "2026-04-25T10:00:00Z"
    },
    "token": "1|abcdefg1234567890..."
  },
  "meta": {},
  "message": "Registration successful."
}
```

---

## 3) Ver perfil autenticado

### Request

GET `/api/v1/auth/me`

Headers:

```http
Authorization: Bearer <token>
Accept: application/json
```

### Response (exemplo)

```json
{
  "id": 1,
  "name": "João Silva",
  "email": "joao@exemplo.com",
  "created_at": "2026-04-25T10:00:00Z",
  "updated_at": "2026-04-25T10:00:00Z"
}
```

---

## 4) Upload de avatar

### Request

POST `/api/v1/auth/me/avatar`

Headers:

```http
Authorization: Bearer <token>
Accept: application/json
Content-Type: multipart/form-data
X-Tenant-Id: 1
```

Body:

- `avatar`: arquivo de imagem (`jpg`, `jpeg`, `png`, `webp`)

### Response (exemplo)

```json
{
  "data": {
    "photo_path": "avatars/abc123def456.png",
    "avatar_url": "http://localhost/storage/avatars/abc123def456.png"
  },
  "message": "Avatar uploaded."
}
```

### Delete

DELETE `/api/v1/auth/me/avatar`

Headers:

```http
Authorization: Bearer <token>
Accept: application/json
X-Tenant-Id: 1
```

### Response (exemplo)

```json
{
  "data": {},
  "message": "Avatar removed."
}
```

---

## 5) Sync Push genérico

### Request

POST `/api/v1/sync/push`

Headers:

```http
Authorization: Bearer <token>
Accept: application/json
Content-Type: application/json
X-Tenant-Id: 1
```

### Body exemplo para `blood-pressure`

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

### Body exemplo para `glicose`

```json
{
  "resource": "glicose",
  "items": [
    {
      "uuid": "d5b1c2e3-4567-4f8d-9c01-abcdef012345",
      "profile_id": 1,
      "glicose_value": 95,
      "unit": "mg/dL",
      "context": "before_meal",
      "measured_at": "2026-04-25T08:30:00Z",
      "source": "manual",
      "notes": "Jejum",
      "updated_at": "2026-04-25T08:30:00Z"
    }
  ]
}
```

### Response (exemplo)

```json
{
  "success": true,
  "message": "Blood-pressure push completed.",
  "data": [
    {
      "id": 1,
      "uuid": "c4a0b1b8-1234-4d2f-9f3e-abcdef012345",
      "profile_id": 1,
      "systolic": 120,
      "diastolic": 80,
      "pulse": 70,
      "measured_at": "2026-04-25T12:00:00Z",
      "source": "manual",
      "notes": "Pressão normal",
      "created_at": "2026-04-25T12:00:00Z",
      "updated_at": "2026-04-25T12:00:00Z"
    }
  ]
}
```

---

## 5) Sync Pull genérico

### Request

POST `/api/v1/sync/pull`

Headers:

```http
Authorization: Bearer <token>
Accept: application/json
Content-Type: application/json
X-Tenant-Id: 1
```

### Body exemplo

```json
{
  "resource": "blood-pressure",
  "since": "2026-04-25T00:00:00Z"
}
```

### Response (exemplo)

```json
{
  "success": true,
  "message": "Blood-pressure pull completed.",
  "data": [
    {
      "id": 1,
      "uuid": "c4a0b1b8-1234-4d2f-9f3e-abcdef012345",
      "profile_id": 1,
      "systolic": 120,
      "diastolic": 80,
      "pulse": 70,
      "measured_at": "2026-04-25T12:00:00Z",
      "source": "manual",
      "notes": "Pressão normal",
      "created_at": "2026-04-25T12:00:00Z",
      "updated_at": "2026-04-25T12:00:00Z"
    }
  ]
}
```

---

## 6) Regras de payload por recurso

### `blood-pressure`

Campos obrigatórios:

- `uuid`
- `profile_id`
- `systolic`
- `diastolic`
- `pulse`
- `measured_at`
- `source`

Campos opcionais:

- `notes`
- `updated_at`

### `glicose`

Campos obrigatórios:

- `uuid`
- `profile_id`
- `glicose_value`
- `unit`
- `measured_at`
- `source`

Campos opcionais:

- `context`
- `notes`
- `updated_at`

### `weight`

Campos obrigatórios:

- `uuid`
- `profile_id`
- `weight`
- `unit`
- `measured_at`

Campos opcionais:

- `height`
- `notes`
- `updated_at`

### `medications`

Campos obrigatórios:

- `uuid`
- `profile_id`
- `name`
- `active`
- `reminder_enabled`
- `repeat_reminder_every_five_minutes`

Campos opcionais:

- `dosage`
- `instructions`
- `scheduled_time`
- `reminder_minutes_before`
- `notes`
- `updated_at`

### `medication-logs`

Campos obrigatórios:

- `uuid`
- `profile_id`
- `taken_at`
- `medication_id` ou `medication_uuid`

Campos opcionais:

- `notes`
- `updated_at`
- `deleted_at`

---

## 7) Rotas específicas de sync

O app também pode usar rotas por recurso:

- POST `/api/v1/blood-pressure/sync`
- POST `/api/v1/glicose/sync`
- POST `/api/v1/weight/sync`
- POST `/api/v1/medications/sync`
- POST `/api/v1/medication-logs/sync`

Essas rotas usam a mesma autenticação e o mesmo middleware de tenancy.

---

## 8) Dicas úteis

- Use `uuid` do app para sincronização offline/online segura.
- Envie `updated_at` sempre que possível para resolver conflitos de dados.
- Se o app tiver múltiplos tenants, inclua `X-Tenant-Id` em cada request.
- Se o token expirar, o app deve reenviar o usuário para login.
