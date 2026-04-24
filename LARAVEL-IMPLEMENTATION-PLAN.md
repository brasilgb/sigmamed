# LARAVEL IMPLEMENTATION PLAN — SigmaMed Tenant Backend

## Objetivo

Transformar o contexto do backend SigmaMed em um plano prático de implementação para uma API Laravel multi-tenant, começando pelo menor caminho funcional.

Este plano assume:

* Laravel 12
* PHP 8.3+
* PostgreSQL
* Sanctum
* multi-tenancy por `tenant_id`
* app mobile offline first
* sincronização por `uuid`

## Estratégia de Build

Construir em camadas:

1. fundação do projeto
2. tenancy e autenticação
3. perfil do usuário
4. primeiro módulo clínico
5. sync offline first
6. demais módulos

Isso reduz risco e permite validar cedo a arquitetura principal.

## Fase 1 — Fundação do Projeto

## Setup inicial

Criar o projeto Laravel e configurar:

* PostgreSQL
* Sanctum
* timezone padrão
* queues
* CORS para app mobile
* versionamento de rotas em `/api/v1`

### Ajustes iniciais

No `.env`:

* `APP_TIMEZONE=UTC`
* `DB_CONNECTION=pgsql`
* `QUEUE_CONNECTION=redis`
* `SESSION_DRIVER=database` se desejar suporte web/admin depois

### Dependências mínimas

* `laravel/sanctum`
* `predis/predis` ou extensão Redis

## Estrutura sugerida

```txt
app/
  Actions/
  Enums/
  Http/
    Controllers/Api/V1/
    Middleware/
    Requests/
    Resources/
  Models/
  Policies/
  Scopes/
  Services/
  Support/
    Tenancy/
database/
  migrations/
  seeders/
routes/
  api.php
```

## Fase 2 — Tenancy e Auth

## Tabelas iniciais

Criar primeiro:

* `tenants`
* `users`
* `tenant_user`
* tokens do Sanctum

### Migration de tenants

Campos recomendados:

* `id`
* `uuid`
* `name`
* `slug`
* `status`
* `plan`
* `timezone`
* timestamps

### Migration de users

Campos recomendados:

* `id`
* `uuid`
* `name`
* `email`
* `password`
* `photo_path`
* `email_verified_at`
* `last_login_at`
* timestamps

### Migration de tenant_user

Campos recomendados:

* `id`
* `tenant_id`
* `user_id`
* `role`
* timestamps

Criar índice único para:

* `tenant_id + user_id`

## Models iniciais

Criar:

* `Tenant`
* `User`
* trait `BelongsToTenant`
* trait `HasPublicUuid`

## Trait `BelongsToTenant`

Responsabilidades:

* preencher `tenant_id` automaticamente quando possível
* aplicar `TenantScope`
* expor relacionamento `tenant()`

## Scope `TenantScope`

Responsabilidade:

* filtrar automaticamente modelos por `tenant_id` usando o tenant corrente do request

## Resolução do tenant

### Primeira versão recomendada

Resolver o tenant a partir do usuário autenticado.

Fluxo:

1. usuário autentica com e-mail e senha
2. carregar memberships em `tenant_user`
3. escolher tenant ativo
4. persistir tenant corrente no request

### Classe sugerida

* `App\Support\Tenancy\CurrentTenant`

Responsabilidades:

* armazenar tenant resolvido no ciclo da request
* fornecer `id()` e `tenant()`

### Middleware sugerido

* `SetCurrentTenant`

Esse middleware:

* exige usuário autenticado
* identifica o tenant principal do usuário
* aceita futuramente `X-Tenant-Id`

## Auth com Sanctum

## Endpoints

* `POST /api/v1/auth/register`
* `POST /api/v1/auth/login`
* `POST /api/v1/auth/logout`
* `GET /api/v1/auth/me`
* `PATCH /api/v1/auth/me`

## Fluxo de `register`

1. validar nome, e-mail e senha
2. criar usuário
3. criar tenant próprio do usuário
4. vincular em `tenant_user` com papel `owner`
5. criar token Sanctum
6. retornar usuário e tenant

## Fluxo de `login`

1. validar credenciais
2. buscar tenant principal
3. emitir token
4. retornar `user`, `tenant` e `token`

## Requests sugeridos

* `RegisterRequest`
* `LoginRequest`
* `UpdateMeRequest`

## Resources sugeridos

* `AuthUserResource`
* `TenantResource`

## Fase 3 — Perfil

## Migration `profiles`

Campos:

* `id`
* `uuid`
* `tenant_id`
* `user_id`
* `full_name`
* `birth_date`
* `sex`
* `height`
* `target_weight`
* `has_diabetes`
* `has_hypertension`
* `notes`
* timestamps

Índices:

* `tenant_id`
* `user_id`
* `uuid`

## Endpoints

* `GET /api/v1/profile`
* `PUT /api/v1/profile`

## Regras

* no MVP, um perfil por usuário por tenant
* o dono do perfil é o único que edita

## Fase 4 — Primeiro Módulo Clínico

Começar por `blood_pressure_readings`.

Esse é o módulo ideal porque:

* já existe no app
* tem estrutura simples
* valida sync offline first rapidamente

## Migration `blood_pressure_readings`

Campos:

* `id`
* `uuid`
* `tenant_id`
* `user_id`
* `profile_id`
* `systolic`
* `diastolic`
* `pulse`
* `measured_at`
* `source`
* `notes`
* `synced_at`
* timestamps
* `deleted_at`

Índices:

* `tenant_id`
* `user_id`
* `profile_id`
* `uuid`
* `measured_at`
* `tenant_id + uuid`
* `tenant_id + measured_at`

## Model

Criar `BloodPressureReading` com:

* trait `BelongsToTenant`
* `SoftDeletes`
* casts para datas
* casts numéricos

## Enum sugerido

* `EntrySourceEnum`

Valores:

* `manual`
* `bluetooth`

## Requests

* `StoreBloodPressureReadingRequest`
* `UpdateBloodPressureReadingRequest`
* `SyncBloodPressureReadingRequest`

## Resource

* `BloodPressureReadingResource`

## Rotas CRUD

* `GET /api/v1/blood-pressure-readings`
* `POST /api/v1/blood-pressure-readings`
* `GET /api/v1/blood-pressure-readings/{uuid}`
* `PUT /api/v1/blood-pressure-readings/{uuid}`
* `DELETE /api/v1/blood-pressure-readings/{uuid}`

## Controller

Criar `BloodPressureReadingController` com:

* `index`
* `store`
* `show`
* `update`
* `destroy`

## Fase 5 — Sync Offline First

## Regra central

O app mobile salva primeiro localmente.

O backend precisa aceitar lotes e reconciliar por `uuid`.

## Estratégia do MVP

Implementar sync primeiro só para pressão.

### Endpoint inicial

* `POST /api/v1/sync/blood-pressure-readings`

### Payload sugerido

```json
{
  "items": [
    {
      "uuid": "6f6de4d8-4c4f-486e-a518-9ca2dc4d2301",
      "systolic": 120,
      "diastolic": 80,
      "pulse": 72,
      "measured_at": "2026-04-24T09:00:00Z",
      "source": "manual",
      "notes": "medicao matinal",
      "updated_at_client": "2026-04-24T09:01:00Z",
      "deleted_at_client": null
    }
  ]
}
```

### Regra de reconciliação

Para cada item:

1. localizar registro por `tenant_id + uuid`
2. se não existir, criar
3. se existir, comparar timestamps
4. o mais recente vence
5. se houver `deleted_at_client`, aplicar soft delete

### Resposta sugerida

```json
{
  "data": {
    "created": ["uuid-1"],
    "updated": ["uuid-2"],
    "deleted": ["uuid-3"],
    "conflicts": []
  }
}
```

## Serviço de sync

Criar:

* `App\Services\Sync\BloodPressureSyncService`

Responsabilidades:

* validar lote
* resolver upsert
* aplicar soft delete
* devolver resultado consolidado

## Escolha de timestamps

No backend usar:

* `created_at`
* `updated_at`
* `deleted_at`

No payload do cliente aceitar:

* `updated_at_client`
* `deleted_at_client`

Isso evita misturar tempo de persistência local com tempo do servidor.

## Fase 6 — Expandir para os demais módulos

Depois de pressão, repetir o mesmo padrão para:

* `glicose_readings`
* `weight_readings`
* `medications`
* `medication_logs`

## Ordem recomendada

1. `glicose_readings`
2. `weight_readings`
3. `medications`
4. `medication_logs`

Medicação deve vir depois porque tem mais regra de negócio.

## Fase 7 — Dashboard

Depois que os módulos estiverem sincronizando:

* criar query services de resumo
* criar tendência por período
* criar alertas simples no backend

## Endpoints

* `GET /api/v1/dashboard/summary`
* `GET /api/v1/dashboard/trends`
* `GET /api/v1/dashboard/alerts`

## Fase 8 — Upload e Dispositivos

## Avatar

Implementar:

* `POST /api/v1/auth/me/avatar`
* `DELETE /api/v1/auth/me/avatar`

## Devices

Criar tabela `devices` para:

* nome do dispositivo
* plataforma
* app version
* push token
* last_seen_at

Isso será útil para:

* notificação push
* rastreio de sync
* gestão de múltiplos dispositivos

## Políticas e Segurança

## Policies mínimas

Criar:

* `ProfilePolicy`
* `BloodPressureReadingPolicy`

Depois expandir para os outros modelos.

## Regras mínimas

* usuário nunca acessa dados fora do próprio tenant
* usuário comum só acessa seus próprios registros no MVP
* owner pode ganhar privilégios extras depois

## Observabilidade

Adicionar desde cedo:

* request id
* logs estruturados
* tratamento central de exceptions

Nunca logar:

* senha
* tokens
* payload sensível completo de saúde sem necessidade

## Seeders

Criar:

* `TenantSeeder`
* `UserSeeder`
* `ProfileSeeder`
* `BloodPressureReadingSeeder`

Objetivo:

* facilitar testes manuais
* acelerar integração mobile

## Testes

## Prioridade de testes

1. auth register/login/logout
2. resolução de tenant
3. CRUD de perfil
4. CRUD de pressão
5. sync de pressão
6. isolamento entre tenants

## Casos críticos

* usuário A não acessa tenant B
* sync cria registro novo
* sync atualiza registro existente
* sync ignora payload mais antigo
* sync aplica soft delete

## Ordem de Implementação

## Sprint 1

* projeto Laravel
* Sanctum
* migrations de `tenants`, `users`, `tenant_user`
* register/login/me
* middleware `SetCurrentTenant`

## Sprint 2

* migration e CRUD de `profiles`
* migration e CRUD de `blood_pressure_readings`
* policies e resources

## Sprint 3

* endpoint `sync/blood-pressure-readings`
* serviço de sync
* testes de conflito e soft delete

## Sprint 4

* glicose
* peso
* medicação
* medication logs

## Rotas Sugeridas

```php
Route::prefix('v1')->group(function () {
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::patch('/auth/me', [AuthController::class, 'updateMe']);

        Route::get('/profile', [ProfileController::class, 'show']);
        Route::put('/profile', [ProfileController::class, 'update']);

        Route::apiResource('blood-pressure-readings', BloodPressureReadingController::class)
            ->parameters(['blood-pressure-readings' => 'bloodPressureReading:uuid']);

        Route::post('/sync/blood-pressure-readings', [BloodPressureSyncController::class, 'store']);
    });
});
```

## Primeiros Arquivos a Criar

1. `database/migrations/...create_tenants_table.php`
2. `database/migrations/...create_tenant_user_table.php`
3. `app/Models/Tenant.php`
4. `app/Support/Tenancy/CurrentTenant.php`
5. `app/Http/Middleware/SetCurrentTenant.php`
6. `app/Scopes/TenantScope.php`
7. `app/Traits/BelongsToTenant.php`
8. `app/Http/Controllers/Api/V1/AuthController.php`
9. `app/Models/Profile.php`
10. `app/Models/BloodPressureReading.php`
11. `app/Services/Sync/BloodPressureSyncService.php`

## Critério de Pronto do Backend MVP Inicial

O backend inicial pode ser considerado pronto quando:

* usuário registra conta e recebe tenant próprio
* login retorna token válido
* perfil pode ser salvo e lido
* pressão pode ser criada por CRUD
* pressão pode ser sincronizada por lote com `uuid`
* isolamento por tenant está coberto por teste

## Próxima Task Recomendada

Gerar o esqueleto inicial do backend Laravel com:

1. migrations
2. models
3. middleware de tenant
4. AuthController
5. ProfileController
6. BloodPressureReadingController
7. BloodPressureSyncController
