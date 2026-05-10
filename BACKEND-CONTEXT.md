# BACKEND CONTEXT — Meu Controle Laravel Tenant API

## Objetivo

Definir o contexto técnico para construir o backend do Meu Controle em Laravel com arquitetura multi-tenant.

Esse backend deve servir como camada de autenticação online, sincronização de dados, backup, notificações futuras e suporte a múltiplos dispositivos por usuário, sem quebrar o modelo atual offline first do app mobile.

## Decisão Arquitetural Obrigatória

O backend do Meu Controle será implementado em **Laravel**, expondo uma **camada de API HTTP versionada** para o app mobile.

Essa API será responsável por:

* autenticação online
* emissão e revogação de tokens
* identificação do usuário autenticado
* resolução do tenant ativo
* sincronização dos dados locais do app
* backup e restauração entre dispositivos
* endpoints futuros para IA, relatórios e integrações

Além da API mobile, o projeto poderá ter uma **camada frontend web** associada ao backend.

Essa camada frontend não substitui o app Expo/React Native. Ela deve servir para:

* painel administrativo
* suporte operacional
* gestão de usuários e tenants
* acompanhamento de métricas não clínicas
* revisão de logs, auditoria e eventos de sincronização
* configuração de planos, limites e integrações futuras
* eventual portal web do usuário, se fizer sentido comercialmente

Para o MVP, a prioridade continua sendo a API para o app mobile. O frontend web deve ser considerado uma camada incremental, construída depois da autenticação, tenancy e sincronização mínima.

Decisão preferencial para essa camada:

* Inertia.js com React
* Vite como bundler
* componentes React organizados por domínio
* rotas web protegidas por autenticação Laravel
* painel renderizado pelo Laravel, consumindo dados via controllers/actions do próprio backend

Alternativas aceitáveis apenas se houver motivo técnico forte:

* Laravel Blade com Vite para painel muito simples
* frontend separado em Next.js consumindo a API Laravel

Recomendação inicial:

* começar com API Laravel bem estruturada
* quando o painel web for necessário, implementar com Inertia.js + React
* adicionar painel web apenas quando houver necessidade real de operação, suporte ou administração

Para autenticação, a base inicial será:

* Laravel Sanctum
* tokens pessoais para o app mobile
* rotas protegidas por `auth:sanctum`
* rate limit nas rotas públicas de autenticação
* separação clara entre autenticação local do app e autenticação online da API

Portanto, o backend não será apenas um banco remoto. Ele será uma **API Laravel com camada própria de auth, tenancy, sincronização e segurança**.

## Papel do Backend

O app atual funciona com:

* Expo + React Native
* SQLite local
* autenticação local
* dados de saúde armazenados no dispositivo

O backend Laravel entra para adicionar:

* conta online
* sincronização entre dispositivos
* backup seguro
* isolamento de dados por tenant
* base para time clínico, família ou operação B2B no futuro
* trilha para analytics, integrações e IA backend no futuro

## Princípios

* offline first continua sendo obrigatório
* app local nunca depende 100% da API para funcionar
* backend é source of truth de sincronização, não de uso diário imediato
* todo registro pertence a um tenant
* todo registro de saúde pertence a um usuário dentro do tenant
* API simples, previsível e versionada
* segurança e auditoria acima de conveniência

## Estratégia de Multi-Tenancy

### Recomendação para o MVP

Usar tenancy por coluna compartilhada:

* banco único
* tabelas compartilhadas
* coluna `tenant_id` em todas as tabelas de negócio
* escopo global por tenant no backend

Essa abordagem é a mais pragmática para o estágio atual porque:

* reduz custo operacional
* simplifica deploy
* facilita consultas administrativas
* acelera desenvolvimento do MVP

## Evolução futura

Se houver exigência contratual forte de isolamento, o projeto pode migrar depois para:

* database per tenant
* schema per tenant

Mas isso não deve ser a escolha inicial.

## Conceito de Tenant no Meu Controle

No Meu Controle, tenant não precisa significar apenas empresa.

Pode representar:

* um usuário individual no modelo B2C
* uma família com múltiplos perfis
* uma clínica
* uma operadora/parceiro corporativo

### Recomendação prática

Para o MVP:

* cada conta criada gera um tenant próprio
* o primeiro usuário é `owner` do tenant
* no futuro outros usuários podem ser convidados para o mesmo tenant

Assim o modelo já nasce pronto para crescer sem complicar o app agora.

## Stack Recomendada

* Laravel 12
* PHP 8.3+
* PostgreSQL
* Laravel Sanctum para autenticação por token
* Queues com Redis
* Jobs para sync assíncrono e notificações
* Storage S3 compatível para avatar e anexos futuros
* Pest ou PHPUnit para testes

## Pacotes Recomendados

Se quiser pacote de tenancy:

* `stancl/tenancy`

Se quiser começar mais simples:

* tenancy própria via `tenant_id` + middleware + scopes

### Recomendação

Para este projeto, começar sem pacote pesado é aceitável se o time dominar bem:

* middleware de resolução do tenant
* `TenantScope`
* policies
* traits como `BelongsToTenant`

Se a intenção já for vender como SaaS B2B com onboarding de tenants, domínios e administração forte, então `stancl/tenancy` passa a fazer mais sentido.

## Modelo Conceitual

### Núcleo de tenancy

Tabelas base:

* `tenants`
* `users`
* `tenant_user`

### Domínio de saúde

Tabelas principais:

* `profiles`
* `blood_pressure_readings`
* `glicose_readings`
* `weight_readings`
* `medications`
* `medication_logs`

### Suporte operacional

Tabelas futuras:

* `devices`
* `sync_batches`
* `audit_logs`
* `notification_deliveries`
* `ai_analyses`

## Regras de Modelagem

Toda tabela de negócio deve ter:

* `id`
* `tenant_id`
* `user_id` quando fizer sentido
* `created_at`
* `updated_at`
* `deleted_at` quando a exclusão lógica for útil
* `external_id` ou `uuid` para sincronização segura entre offline e online

### Recomendação importante

Não usar o `id` inteiro do SQLite como chave principal de sync.

Usar também um identificador estável gerado no cliente, por exemplo:

* `uuid`
* `client_record_id`

Isso evita colisão entre dispositivos diferentes.

## Entidades Recomendadas

### tenants

Campos:

* `id`
* `uuid`
* `name`
* `slug`
* `status`
* `plan`
* `timezone`
* `created_at`
* `updated_at`

### users

Campos:

* `id`
* `uuid`
* `name`
* `email`
* `password`
* `email_verified_at`
* `photo_path`
* `last_login_at`
* `created_at`
* `updated_at`

### tenant_user

Pivot entre usuário e tenant.

Campos:

* `id`
* `tenant_id`
* `user_id`
* `role` (`owner`, `admin`, `member`, `viewer`)
* `created_at`
* `updated_at`

### profiles

Perfil clínico ou pessoal dentro do tenant.

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
* `created_at`
* `updated_at`

### blood_pressure_readings

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
* `source` (`manual`)
* `notes`
* `synced_at`
* `created_at`
* `updated_at`

### glicose_readings

Campos:

* `id`
* `uuid`
* `tenant_id`
* `user_id`
* `profile_id`
* `glicose_value`
* `unit`
* `context` (`fasting`, `post_meal`, `random`)
* `measured_at`
* `source`
* `notes`
* `synced_at`
* `created_at`
* `updated_at`

### weight_readings

Campos:

* `id`
* `uuid`
* `tenant_id`
* `user_id`
* `profile_id`
* `weight`
* `height`
* `unit`
* `measured_at`
* `notes`
* `synced_at`
* `created_at`
* `updated_at`

### medications

Campos:

* `id`
* `uuid`
* `tenant_id`
* `user_id`
* `profile_id`
* `name`
* `dosage`
* `instructions`
* `active`
* `scheduled_time`
* `reminder_enabled`
* `repeat_reminder_every_five_minutes`
* `reminder_minutes_before`
* `created_at`
* `updated_at`

### medication_logs

Campos:

* `id`
* `uuid`
* `tenant_id`
* `user_id`
* `profile_id`
* `medication_id`
* `scheduled_at`
* `taken_at`
* `status` (`pending`, `taken`, `skipped`)
* `created_at`
* `updated_at`

## Mapeamento com o App Atual

O backend deve refletir o domínio já existente no app mobile:

* `blood_pressure_readings`
* `glicose_readings`
* `weight_readings`
* `medications`
* `medication_logs`
* `users`
* `profiles`

Campos atuais do app que precisam existir na API:

* pressão: `systolic`, `diastolic`, `pulse`, `measured_at`, `source`, `notes`
* glicose: `glicose_value`, `unit`, `context`, `measured_at`, `source`, `notes`
* peso: `weight`, `height`, `unit`, `measured_at`, `notes`
* medicação: `name`, `dosage`, `instructions`, `active`, `scheduled_time`, `reminder_enabled`, `repeat_reminder_every_five_minutes`, `reminder_minutes_before`
* usuário: `name`, `email`, `photo_path`
* perfil: `height`, `target_weight`, `has_diabetes`, `has_hypertension`

### Observação sobre origem da leitura

No estado atual do app:

* `source` está restrito a `manual`

O backend deve refletir isso no MVP e não precisa expor `bluetooth` agora.

## Autenticação e Sessão

### Recomendação

Usar:

* login com e-mail e senha
* Laravel Sanctum com personal access tokens
* refresh controlado por expiração e reemissão de token

### Endpoints base

* `POST /api/v1/auth/register`
* `POST /api/v1/auth/login`
* `POST /api/v1/auth/forgot-password`
* `POST /api/v1/auth/reset-password`
* `POST /api/v1/auth/logout`
* `GET /api/v1/auth/me`
* `PATCH /api/v1/auth/me`

### Recuperação de senha

O backend deve oferecer recuperação de senha online por e-mail:

* `POST /api/v1/auth/forgot-password`: recebe `email`, gera código temporário e envia por e-mail.
* `POST /api/v1/auth/reset-password`: recebe `email`, `code`, `password` e `password_confirmation`.

Regras:

* senha mínima de 6 caracteres
* código temporário, de uso único, vinculado ao e-mail e com expiração curta
* e-mail de recuperação deve usar `Meu Controle` como título/assunto principal e também na assinatura
* rate limit nas rotas públicas de recuperação
* resposta genérica em `forgot-password`, sem revelar se o e-mail existe
* invalidar códigos pendentes após sucesso
* PIN local e biometria do app não participam desse fluxo

### Tipo de conta no login

O backend deve retornar o tipo de conta do usuário em `POST /api/v1/auth/login` e `GET /api/v1/auth/me`.

Campo esperado:

* `account_usage`: `personal` ou `family`

Esse campo é obrigatório para o app restaurar corretamente o modo da conta após reinstalação ou troca de aparelho. Sem ele, o mobile precisa inferir pelo perfil remoto e pode errar em cenários familiares/cuidador.

## Resolução do Tenant

### Estratégia recomendada para mobile

Resolver tenant pelo usuário autenticado.

Fluxo:

1. usuário faz login
2. backend identifica memberships em `tenant_user`
3. tenant ativo entra no contexto da request
4. queries ficam automaticamente escopadas

### Header opcional

Se o usuário puder alternar tenant no futuro:

* `X-Tenant-Id`
* ou `X-Tenant-Slug`

Mas no MVP isso pode ficar invisível para o app.

## Sync Offline First

Esse é o ponto mais importante do backend.

O mobile já salva localmente. A API deve sincronizar sem exigir conectividade imediata.

### Regras

* o cliente cria registro local primeiro
* cada registro recebe `uuid`
* quando houver internet, o cliente envia lote pendente
* o backend faz upsert por `uuid + tenant_id`
* o backend devolve estado final do servidor

### Estratégia recomendada

Criar endpoints de sync por recurso ou por lote.

Exemplo:

* `POST /api/v1/sync/pull`
* `POST /api/v1/sync/push`

Ou mais explícito:

* `POST /api/v1/blood-pressure/sync`
* `POST /api/v1/glicose/sync`
* `POST /api/v1/weight/sync`
* `POST /api/v1/medications/sync`

### Regra de conflito

No MVP:

* `updated_at` mais recente vence

Desde que:

* a mudança seja do mesmo registro identificado por `uuid`

### Melhorias futuras

* versionamento por registro
* merge inteligente por campo
* soft delete sincronizado

## API Resources

### Recursos principais

* `/api/v1/profile`
* `/api/v1/blood-pressure-readings`
* `/api/v1/glicose-readings`
* `/api/v1/weight-readings`
* `/api/v1/medications`
* `/api/v1/medication-logs`
* `/api/v1/dashboard/summary`
* `/api/v1/dashboard/trends`
* `/api/v1/dashboard/alerts`

### Padrão de resposta

Preferir JSON simples:

```json
{
  "data": {},
  "meta": {},
  "message": "ok"
}
```

Para listas:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 100
  }
}
```

## Dashboard Backend

O app já trabalha com:

* resumo
* tendências
* alertas
* relatório por período
* exportação em PDF

O backend pode replicar isso para:

* sincronizar dashboards entre dispositivos
* reduzir custo de processamento no mobile
* preparar exportação e IA futura

### Endpoints sugeridos

* `GET /api/v1/dashboard/summary?period=7d`
* `GET /api/v1/dashboard/trends?period=7d`
* `GET /api/v1/dashboard/alerts`
* `GET /api/v1/reports/summary?period=7d`
* `GET /api/v1/reports/summary?period=30d`
* `GET /api/v1/reports/summary?period=90d`
* `GET /api/v1/reports/pdf?period=30d`

## Relatórios

O app já possui um fluxo de relatório com:

* períodos de `7`, `30` e `90` dias
* resumo consolidado
* tendências textuais
* alertas
* detalhamento recente
* exportação em PDF

O backend pode futuramente assumir esse processamento para:

* padronizar o relatório entre dispositivos
* permitir geração server-side de PDF
* facilitar compartilhamento externo
* preparar envio para profissionais de saúde

### Estrutura sugerida para relatório

Incluir:

* identificação do paciente
* totais por módulo
* adesão à medicação
* últimas leituras
* alertas resumidos
* tabelas por módulo

### Formatos recomendados

* JSON para leitura no app
* PDF para compartilhamento/download

## Upload de Avatar

### Endpoints

* `POST /api/v1/auth/me/avatar`
* `DELETE /api/v1/auth/me/avatar`

### Regras

* validar mime type
* redimensionar no backend ou pipeline
* armazenar em storage externo
* persistir caminho em `photo_path`

### Alinhamento com o app atual

Hoje, no app local:

* o banco salva apenas a referência da foto
* a imagem fica persistida no armazenamento do app

No backend:

* manter a mesma filosofia
* nunca salvar o binário da imagem diretamente no banco relacional
* salvar apenas `photo_path` ou `photo_url`

## Segurança

### Regras obrigatórias

* toda query filtrada por tenant
* policies por usuário e papel
* rate limit em auth
* validação forte de payload
* logs de auditoria para ações sensíveis
* criptografia em trânsito com HTTPS
* segredos fora do código
* backups com retenção controlada

### Dados sensíveis

Dados de saúde devem ser tratados como sensíveis.

Portanto:

* evitar logs com payload completo
* mascarar dados em observabilidade quando possível
* registrar acessos críticos

## Estrutura Laravel Sugerida

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
  Support/Tenancy/
database/
  factories/
  migrations/
  seeders/
routes/
  api_v1.php
```

## Componentes Importantes

### Middleware

* `AuthenticateTenantRequest`
* `EnsureTenantAccess`

### Traits

* `BelongsToTenant`
* `HasPublicUuid`

### Scopes

* `TenantScope`

### Policies

* `ProfilePolicy`
* `BloodPressureReadingPolicy`
* `GlicoseReadingPolicy`
* `WeightReadingPolicy`
* `MedicationPolicy`

## Índices Recomendados

Criar índices para:

* `tenant_id`
* `user_id`
* `profile_id`
* `uuid`
* `measured_at`
* `scheduled_at`
* pares como `tenant_id + measured_at`
* pares como `tenant_id + uuid`

## Seed Inicial

Criar seed para:

* tenant demo
* owner demo
* perfil demo
* leituras demo
* medicações demo

Isso acelera integração com o app e testes E2E.

## Roadmap de Backend

### Fase 1

* autenticação online
* tenants
* users
* profiles
* CRUD dos módulos de saúde
* sync básico por `uuid`

### Fase 2

* avatar upload
* dashboard calculado no backend
* relatório JSON por período
* geração de PDF server-side
* notificações e agendamentos
* soft delete sincronizado

### Fase 3

* compartilhamento com família ou profissional
* múltiplos perfis por tenant
* exportação
* web admin

### Fase 4

* IA backend
* integrações clínicas
* auditoria avançada
* billing por tenant

## Prompt de Implementação

Se este documento for usado como contexto para gerar o backend, assumir:

* Laravel API versionada em `/api/v1`
* PostgreSQL
* multi-tenant por `tenant_id`
* Sanctum
* UUID público para sync
* arquitetura offline first compatível com o app Meu Controle atual
* domínio inicial: pressão, glicose, peso, medicação, perfil e autenticação

## Decisões Fechadas

* o app continua local first
* o backend será Laravel API
* tenancy inicial por coluna `tenant_id`
* cada conta pode nascer com um tenant próprio
* sync deve usar identificador estável por registro
* backend deve refletir o schema funcional já existente no app
* `source` das leituras permanece `manual` no MVP atual
* avatar no backend deve salvar caminho/URL, não arquivo binário em coluna SQL
* relatórios devem considerar períodos de `7`, `30` e `90` dias

## Próxima Task Recomendada

Criar o projeto Laravel com:

1. migrations de `tenants`, `tenant_user`, `profiles` e tabelas de saúde
2. Sanctum configurado
3. middleware de tenant
4. CRUD de autenticação e perfil
5. primeiro endpoint de sync para `blood_pressure_readings`
