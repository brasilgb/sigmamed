# BACKEND MOBILE CONTRACT — SigmaMed

Este documento consolida o contrato final esperado pelo app mobile para autenticação, perfil, avatar e sincronização offline-first com a API Laravel.

## Base

Base URL em desenvolvimento:

```http
http://192.168.2.54:8000/api/v1
```

A URL base pode ser sobrescrita no app por `EXPO_PUBLIC_API_BASE_URL` ou `extra.apiBaseUrl` no Expo config. Em emulador Android, `localhost` e `127.0.0.1` sao convertidos pelo app para `10.0.2.2`.

Headers protegidos:

```http
Authorization: Bearer <token>
Accept: application/json
Content-Type: application/json
X-Tenant-Id: 1
```

`X-Tenant-Id` é opcional se o backend resolver o tenant ativo pelo usuário autenticado.
O app envia esse header somente depois que tiver persistido o tenant da resposta de auth ou de `GET /auth/me`.

## Auth

Regra de produto: cada instalacao do app trabalha com somente uma conta principal local. Essa conta pode ser de uso `personal` ou `family`, mas nao ha troca multiusuario dentro do mesmo app. Registros clinicos adicionais devem ser organizados por `profiles`, nao por novas contas de login.

Registro deve retornar `token`, `user`, `tenant` e, se disponivel, `profile` ou `profile_id` dentro de `data`.
Login deve retornar `token` e `user` dentro de `data`; `tenant`, `profile` ou `profile_id` tambem podem ser retornados para evitar chamadas extras.
No cadastro, o app envia também o tipo de uso escolhido:

- `personal`: uso pessoal. `age` e `height` representam o próprio usuário e o perfil inicial usa o nome da conta.
- `family`: uso familiar/cuidador. A conta é do responsável/cuidador e `patient_name` representa a primeira pessoa acompanhada. `height`, quando enviado, representa a altura dessa pessoa acompanhada.

`professional` pode ser mantido pelo backend apenas como compatibilidade com contas antigas, mas o cadastro mobile atual nao oferece essa opcao separada porque `family` e cuidador usam o mesmo fluxo.

Payload de registro esperado:

```json
{
  "account_usage": "personal",
  "name": "João Silva",
  "email": "joao@exemplo.com",
  "age": 35,
  "height": 170,
  "patient_name": null,
  "password": "secret123",
  "password_confirmation": "secret123"
}
```

Para `family`, `age` pode ser `null` no cadastro da conta e `height` e opcional. O backend deve criar a conta de login e criar ou preparar o primeiro perfil acompanhado com `patient_name`, gravando `height` nesse perfil quando informado.
No app atual, se ja existir uma conta principal local, cadastro de outro usuario e login que criaria outro usuario local devem ser bloqueados.
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

Login retorna um payload similar, mas pode vir sem o objeto `tenant`. Nesse caso, o app chama `GET /api/v1/auth/me` para resolver tenant e perfil remoto.

O app usa:

- `data.token` para `Authorization: Bearer`
- `data.tenant.id` para `X-Tenant-Id` quando o tenant estiver disponível
- `data.user.age` para exibir a idade do usuário
- `data.profile.id`, `data.profile_id` ou `data.user.profile_id` para mapear o primeiro perfil remoto, quando enviado
- `GET /api/v1/auth/me` para obter o tenant atual depois do login
- `GET /api/v1/profile` para obter `profile_id` nos payloads de sync
- `data.avatar_url` do upload de avatar para foto de perfil remota

Compatibilidade atual do app:

- Token tambem e aceito como `token`, `plainTextToken` ou `access_token`, no topo da resposta ou em `data`.
- Usuario tambem e aceito no topo da resposta ou diretamente em `data`.
- Foto remota do usuario pode vir como `avatar_url`, `photo_url` ou `photo_path`.
- O contrato preferencial continua sendo `{ "data": { ... } }`.

### Exclusão de Conta

Endpoint:

```http
DELETE /api/v1/auth/me
Authorization: Bearer <token>
Accept: application/json
X-Tenant-Id: 1
```

Comportamento esperado:

- Excluir de forma definitiva a conta autenticada no backend.
- Excluir ou anonimizar definitivamente os dados vinculados ao usuário/tenant conforme a política do backend.
- Revogar tokens ativos da conta.
- Remover ou invalidar avatar/foto remota.
- Retornar erro claro se a exclusão não puder ser concluída.

Response esperado:

```json
{
  "data": {},
  "meta": {},
  "message": "Account deleted."
}
```

Regra mobile: se houver token remoto, o app tenta `DELETE /auth/me` antes da limpeza local. Se a API retornar sucesso, o SQLite local e limpo em seguida. Se não houver token remoto, ou se a API responder `401`/`404` indicando que a conta nao existe mais na nuvem, o app ainda exclui a conta local. Para falhas de rede ou erro de servidor, a exclusão local e bloqueada para evitar estado incerto. Antes da confirmação, o usuário recebe aviso de que a exclusão remove dados do banco da nuvem e do aparelho e que não há retorno.

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
O app tambem aceita, por compatibilidade, respostas no formato `data.profile.id`, `data.profile_id`, `profile.id`, `profile_id` ou um array `data` cujo primeiro item tenha `id`. O formato recomendado e o exemplo acima.

## Perfis Acompanhados

As pessoas acompanhadas ficam em `profiles`. A conta autenticada continua sendo a conta principal do app.

Regra de criação de perfis extras:

- `personal`: pode criar perfis adicionais dentro da mesma conta, alem do perfil do proprio usuario.
- `family`: pode criar perfis adicionais para familiares, pessoas da casa ou pessoas cuidadas.
- `professional`: nao cria perfis extras no app atual; usa somente o paciente principal informado no cadastro.

Listar perfis:

```http
GET /api/v1/profiles
Authorization: Bearer <token>
Accept: application/json
X-Tenant-Id: 1
```

Response esperado:

```json
{
  "data": [
    {
      "id": 1,
      "uuid": "profile-uuid",
      "tenant_id": 1,
      "user_id": 1,
      "name": "Maria Silva",
      "photo_path": null,
      "height": 165,
      "target_weight": null,
      "has_diabetes": false,
      "has_hypertension": false,
      "notes": "Acompanhamento familiar",
      "created_at": "2026-04-25T10:00:00Z",
      "updated_at": "2026-04-25T10:00:00Z"
    }
  ],
  "meta": {},
  "message": "Profiles loaded."
}
```

Criar perfil acompanhado:

```http
POST /api/v1/profiles
Authorization: Bearer <token>
Accept: application/json
Content-Type: application/json
X-Tenant-Id: 1
```

Body:

```json
{
  "name": "Maria Silva",
  "height": 165,
  "notes": "Acompanhamento familiar"
}
```

Response esperado:

```json
{
  "data": {
    "id": 2,
    "uuid": "profile-uuid-2",
    "tenant_id": 1,
    "user_id": 1,
    "name": "Maria Silva",
    "height": 165,
    "notes": "Acompanhamento familiar",
    "created_at": "2026-04-25T10:00:00Z",
    "updated_at": "2026-04-25T10:00:00Z"
  },
  "meta": {},
  "message": "Profile created."
}
```

Regra: paciente/acompanhado não precisa ter login próprio. O login continua sendo da conta principal, e os registros clínicos devem usar o `profile_id` do perfil selecionado.
O app armazena esse identificador remoto como `profiles.remote_profile_id` no SQLite. Ao sincronizar registros clinicos, o `profile_id` enviado para a API e sempre o ID remoto do perfil selecionado, nao o ID local do SQLite.

## Avatar

Upload:

```http
POST /api/v1/auth/me/avatar
Authorization: Bearer <token>
Accept: application/json
Content-Type: multipart/form-data; boundary=<gerado pelo runtime>
X-Tenant-Id: 1
```

Na implementacao mobile, o `Content-Type` multipart nao e definido manualmente para permitir que o runtime inclua o `boundary`. O backend deve aceitar a requisicao multipart padrao com o campo abaixo.

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

No app atual, o formulario de peso nao pede altura manualmente. A altura usada para calcular IMC e preencher `height` vem do perfil ativo (`profiles.height`) e e salva no registro em metros.

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
No push de `medication-logs`, o app envia `taken_at` como `takenAt ?? scheduledAt`. Logs marcados como pulados sao enviados atualmente com `notes: "Dose marcada como pulada."`; o backend pode aceitar um campo opcional `status` no futuro, mas nao deve exigir esse campo do app atual.

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

## Assinatura e Sincronização na Nuvem

O app pode funcionar apenas localmente. A sincronização com a nuvem deve ser liberada pelo backend somente para contas com assinatura ativa.

Status da assinatura/sync:

```http
GET /api/v1/billing/sync-access
Authorization: Bearer <token>
Accept: application/json
X-Tenant-Id: 1
```

Response esperado:

```json
{
  "data": {
    "sync_enabled": false,
    "status": "inactive",
    "expires_at": null,
    "provider": "mercado_pago"
  },
  "meta": {},
  "message": "Sync access loaded."
}
```

Criar cobrança Pix:

```http
POST /api/v1/billing/sync-access/checkout
Authorization: Bearer <token>
Accept: application/json
Content-Type: application/json
X-Tenant-Id: 1
```

Body:

```json
{
  "plan": "personal" 
}
```

Valores suportados em `plan`:
- `personal`: R$ 9,90 (uso individual)
- `family`: R$ 19,90 (familiar/cuidador)

Response esperado:

```json
{
  "data": {
    "payment_id": "123456789",
    "status": "pending",
    "amount": 19.9,
    "currency": "BRL",
    "qr_code": "000201...",
    "qr_code_base64": "iVBORw0KGgo...",
    "expires_at": "2026-04-25T12:30:00Z"
  },
  "meta": {},
  "message": "Pix payment created."
}
```

Quando o pagamento for aprovado pelo Mercado Pago (via Webhook), o backend ativa `sync_enabled = true` e preenche `paid_at`.

Quando o pagamento for confirmado pelo provedor, o backend deve marcar `sync_enabled = true` para o tenant/usuário autenticado. Enquanto `sync_enabled` for `false`, endpoints de `sync/push` e `sync/pull` devem retornar erro claro de acesso não liberado.

Observacao de status mobile: a tela atual de nuvem ainda e informativa e nao chama esses endpoints de billing. O contrato acima representa a API esperada para habilitar a proxima etapa de checkout Pix e controle de acesso ao sync.

## SQLite Sync Readiness

As tabelas locais sincronizaveis no SQLite sao:

- `blood_pressure_readings`
- `glicose_readings`
- `weight_readings`
- `medications`
- `medication_logs`

Todas devem manter os campos de controle:

- `uuid`: identificador estavel para upsert remoto.
- `profile_id`: perfil acompanhado ao qual o registro pertence.
- `updated_at`: referencia de conflito; o registro mais recente vence.
- `synced_at`: controle local para saber se a alteracao ja foi enviada.
- `deleted_at`: soft delete para sincronizar exclusoes.

Regra local:

- Criacao local gera `uuid` e define `updated_at`.
- Criacao local grava o `profile_id` ativo no momento do registro.
- Listas, dashboard, relatorios e medicações filtram pelo `profile_id` ativo.
- Atualizacao local redefine `updated_at` e limpa `synced_at`.
- Exclusao local preenche `deleted_at`, redefine `updated_at` e limpa `synced_at`.
- Pull remoto faz upsert por `uuid` e marca `synced_at`.

`users` e `profiles` nao entram nesse sync generico. Eles continuam sendo tratados pelos endpoints de auth/profile, porque representam identidade, sessao e escopo remoto do usuario.
Antes de puxar os registros clinicos, o app chama `GET /profiles` e faz upsert local dos perfis remotos por `remote_profile_id`.

## Observações de Implementação

- Login remoto é online-only.
- Registro pode criar conta local mesmo sem API; nesse caso a sincronização fica pendente até autenticar/liberar a nuvem.
- Depois do login, o app opera offline-first com SQLite.
- Quando o backend estiver disponível, o app tenta `sync/push` dos pendentes.
- Em outro celular, o app faz login online e depois `sync/pull`.
- `sync/push` e `sync/pull` só devem aceitar contas com sincronização liberada.
- Nunca validar `profile_id` apenas por existência global. Validar por usuário/tenant autenticado.
- Se `profile_id` não for enviado ou for inválido, retornar erro de validação claro.
- `deleted_at` deve aplicar soft delete, não remoção física imediata.
