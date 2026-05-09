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

- `personal`: uso pessoal. `age`, `sex` e `height` representam o próprio usuário e o backend deve criar tambem um registro em `profiles` para esse usuario.
- `family`: uso familiar/cuidador. A conta é do responsável/cuidador. Pessoas acompanhadas são cadastradas depois, em `/profiles`.

`professional` pode ser mantido pelo backend apenas como compatibilidade com contas antigas, mas o cadastro mobile atual nao oferece essa opcao separada porque `family` e cuidador usam o mesmo fluxo.

Payload de registro esperado:

```json
{
  "account_usage": "personal",
  "name": "João Silva",
  "email": "joao@exemplo.com",
  "age": 35,
  "sex": "Masculino",
  "height": 170,
  "password": "123456",
  "password_confirmation": "123456"
}
```

Senha deve ter no mínimo 6 caracteres.

Para `personal`, o backend deve criar `users` e `profiles` no mesmo cadastro, mesmo sem plano de nuvem/sincronizacao ativo. O `profiles` inicial deve usar:

- `name`: mesmo nome enviado no cadastro.
- `age`: idade enviada no cadastro.
- `sex`: sexo enviado no cadastro.
- `height`: altura enviada no cadastro.
- `user_id` e `tenant_id`: vinculados ao usuario/tenant criados.

Esse perfil inicial deve ser retornado preferencialmente em `data.profile` ou como `data.profile_id`, porque o app usa esse ID remoto como `profiles.remote_profile_id` local.

Para `family`, `age`, `sex` e `height` podem ser `null` no cadastro da conta. O backend deve criar a conta principal, tenant e cliente SaaS, mas nao precisa criar pessoa acompanhada nesse endpoint. Depois do cadastro, o app apenas informa que os acompanhados devem ser cadastrados em Configurações > Acompanhados, tela que chama `POST /profiles`.
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
  "message": "Cadastro realizado com sucesso."
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

Regra SaaS: o backend deve persistir o cliente principal no cadastro mesmo sem plano ativo. Esse cadastro precisa criar `user`, `tenant`, perfil inicial para `personal` e um registro de cliente/assinatura em status `inactive` ou equivalente. Isso permite gerenciar no SaaS quem se cadastrou, qual `account_usage` foi escolhido e se a conta ja aderiu ou nao a algum plano. A falta de plano ativo bloqueia apenas sincronizacao em nuvem e recursos pagos, nao o cadastro da conta nem o cadastro do perfil principal.
O app atual exige sucesso em `POST /auth/register` para concluir o cadastro. Se a API estiver indisponivel ou retornar erro, a conta local nao e criada, para evitar cadastro apenas no aparelho sem registro no SaaS.

Compatibilidade atual do app:

- Token tambem e aceito como `token`, `plainTextToken` ou `access_token`, no topo da resposta ou em `data`.
- Usuario tambem e aceito no topo da resposta ou diretamente em `data`.
- Foto remota do usuario pode vir como `avatar_url`, `photo_url` ou `photo_path`.
- O contrato preferencial continua sendo `{ "data": { ... } }`.

### Recuperação de Senha

Fluxo esperado para usuário que esqueceu a senha:

1. O usuário informa o e-mail na tela de login.
2. O app chama `POST /api/v1/auth/forgot-password`.
3. O backend gera um código temporário de recuperação e envia por e-mail.
4. O usuário informa o código, a nova senha e a confirmação da senha.
5. O app chama `POST /api/v1/auth/reset-password`.
6. Em sucesso, o app volta para o login e o próximo login atualiza o hash local da senha no SQLite.

Solicitar recuperação:

```http
POST /api/v1/auth/forgot-password
Accept: application/json
Content-Type: application/json
```

Body:

```json
{
  "email": "usuario@exemplo.com"
}
```

Response esperado:

```json
{
  "data": {
    "sent": true
  },
  "meta": {},
  "message": "Enviamos as instruções de recuperação para o e-mail informado."
}
```

Redefinir senha:

```http
POST /api/v1/auth/reset-password
Accept: application/json
Content-Type: application/json
```

Body:

```json
{
  "email": "usuario@exemplo.com",
  "code": "123456",
  "password": "novaSenha123",
  "password_confirmation": "novaSenha123"
}
```

Response esperado:

```json
{
  "data": {
    "reset": true
  },
  "meta": {},
  "message": "Senha alterada com sucesso."
}
```

Regras esperadas no backend:

- `email` deve ser obrigatório e válido.
- `password` deve ter no mínimo 6 caracteres e ser confirmado por `password_confirmation`.
- `code` deve ser obrigatório, temporário, de uso único e vinculado ao e-mail.
- O código deve expirar, sugestão: 10 a 30 minutos.
- Aplicar rate limit em `forgot-password` e `reset-password`.
- Não revelar se o e-mail existe ou não no response de `forgot-password`; retornar mensagem genérica para evitar enumeração de contas.
- Ao redefinir senha com sucesso, invalidar códigos pendentes e revogar tokens ativos da conta, se essa for a política escolhida.

Regra mobile: recuperação de senha é online-only e altera apenas a senha da conta na nuvem. PIN local e biometria não são alterados por esse fluxo. Depois que o usuário fizer login com a nova senha, o app atualiza o `password_hash` local automaticamente.

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
  "data": {
    "deleted": true,
    "clear_local_data": true
  },
  "meta": {},
  "message": "Conta excluída."
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
  "message": "Perfil carregado."
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
      "age": 68,
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
  "message": "Perfis carregados."
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
  "age": 68,
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
    "age": 68,
    "height": 165,
    "notes": "Acompanhamento familiar",
    "created_at": "2026-04-25T10:00:00Z",
    "updated_at": "2026-04-25T10:00:00Z"
  },
  "meta": {},
  "message": "Perfil criado."
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
  "message": "Avatar enviado."
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
  "message": "Avatar removido."
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
- Nas medições (`blood-pressure`, `glicose`, `weight`), `measured_at` é sempre um timestamp completo com data e hora. O app exibe a data como `DD/MM/AAAA` e permite editar a hora separadamente, mas sincroniza tudo neste mesmo campo ISO.

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
  "message": "Envio de pressão arterial concluído.",
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
  "message": "Recebimento de pressão arterial concluído.",
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

O app pode funcionar apenas localmente. A sincronização com a nuvem deve ser liberada pelo backend somente para contas com `sync_enabled = true`.

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
    "plan": null,
    "cycle": null,
    "expires_at": null,
    "provider": "mercado_pago",
    "paid_at": null
  },
  "meta": {},
  "message": "Acesso à sincronização carregado."
}
```

Regra de status do sync: `status` reflete somente `tenant.sync_enabled`.

- `active`: sync na nuvem liberado.
- `inactive`: sync na nuvem nao liberado.

`expires_at` nessa resposta deve ser `null`. O tenant/acesso local nao expira por data; a conta e gratuita sem nuvem ou tem sync habilitado. O app nao deve exibir popup de "plano expirado" com base em `GET /billing/sync-access`.

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
  "plan": "personal_monthly"
}
```

Valores suportados em `plan`:

- `personal_monthly`: uso pessoal, ciclo mensal.
- `personal_annual`: uso pessoal, ciclo anual.
- `family_caregiver_monthly`: familiar/cuidador, ciclo mensal.
- `family_caregiver_annual`: familiar/cuidador, ciclo anual.

Nomes comerciais sugeridos para exibição:

- `personal_monthly`: Pessoal mensal.
- `personal_annual`: Pessoal anual.
- `family_caregiver_monthly`: Familiar/acompanhante mensal.
- `family_caregiver_annual`: Familiar/acompanhante anual.

Valores sugeridos:

- `personal_monthly`: R$ 9,90/mês.
- `personal_annual`: R$ 99,90/ano.
- `family_caregiver_monthly`: R$ 19,90/mês.
- `family_caregiver_annual`: R$ 199,90/ano.

O backend continua sendo a fonte final dos valores cobrados e deve retornar o valor efetivo em `data.amount`.

Regra de compatibilidade: contas `account_usage = personal` devem usar planos `personal_*`. Contas `family` ou `professional` devem usar planos `family_caregiver_*`. O backend deve validar essa combinacao antes de criar o pagamento.
Os valores finais ficam no backend e devem retornar em `data.amount`; o app nao depende de preco hardcoded para confirmar o pagamento.

Response esperado:

```json
{
  "data": {
    "payment_id": "123456789",
    "status": "pending",
    "raw_status": "pending",
    "plan": "family_caregiver_monthly",
    "amount": 19.9,
    "currency": "BRL",
    "qr_code": "000201...",
    "qr_code_base64": "iVBORw0KGgo...",
    "checkout_url": null,
    "expires_at": "2026-04-25T12:30:00Z"
  },
  "meta": {},
  "message": "Pagamento Pix criado."
}
```

`status` no retorno do checkout e o status de exibicao do Pix/pagamento. Valores esperados:

- `pending`: Pix pendente e ainda dentro do vencimento.
- `expired`: Pix pendente com `expires_at` vencido.
- `approved`: pagamento aprovado.
- `rejected`: pagamento rejeitado.
- `cancelled`: pagamento cancelado.
- `inactive`: pagamento/assinatura inicial inativa.

`raw_status` e o status persistido pelo backend/provedor. Exemplo: um Pix vencido pode retornar `status = expired` e `raw_status = pending`.

`expires_at` no checkout representa apenas o vencimento do QR Code Pix. Nao representa vencimento do tenant nem vencimento do acesso local.

Quando o checkout Pix for criado, o backend deve registrar a tentativa de pagamento vinculada ao tenant/cliente, com `plan_type`, `payment_id`, `amount`, `status = pending` e vencimento do Pix em `expires_at`.

Se ja existir um Pix `pending` para o mesmo plano, com `expires_at` futuro e QR Code salvo, o backend deve reutilizar esse pagamento e retornar o mesmo QR Code em vez de criar outra cobranca no Mercado Pago. Se o Pix estiver vencido, aprovado, rejeitado, cancelado ou for de outro plano, o backend pode criar uma nova cobranca.

Descricao enviada ao Mercado Pago:

- Planos pessoais: `Assinatura Meu Controle - Plano Pessoal`.
- Planos familiares/cuidador: `Assinatura Meu Controle - Plano Familiar/Acompanhante`.

Quando o pagamento for aprovado pelo Mercado Pago ou outro provedor, o backend ativa `sync_enabled = true`, preenche `paid_at` no pagamento e atualiza o status do pagamento para `approved`. Essa atualizacao pode ocorrer via webhook ou por reconciliacao quando o app consultar `GET /billing/sync-access` ou quando o admin abrir a tela de pagamentos.

Quando o pagamento for confirmado pelo provedor, o backend deve marcar `sync_enabled = true` para o tenant/usuário autenticado. Enquanto `sync_enabled` for `false`, endpoints de `sync/push` e `sync/pull` devem retornar erro claro de acesso não liberado.

Observacao de status mobile: a tela de nuvem consulta `GET /billing/sync-access` para decidir se a nuvem esta ativa/inativa. Ela chama `POST /billing/sync-access/checkout` enviando `plan` para exibir Pix e status de pagamento. O app deve tratar `status = expired` no retorno do checkout como Pix vencido e oferecer gerar/reabrir nova cobranca, mas nao como plano/tenant expirado.

## Feedback do Usuário

A home do app possui um card de opinião que abre um modal com nota em estrelas e comentário/sugestão. No mobile atual, o envio é apenas visual/local até existir endpoint no backend.

Endpoint sugerido:

```http
POST /api/v1/feedback
Authorization: Bearer <token>
Accept: application/json
Content-Type: application/json
X-Tenant-Id: 1
```

Body:

```json
{
  "rating": 5,
  "comment": "Gostaria de uma tela para comparar evolução por mês.",
  "source": "home",
  "app_version": "1.0.0",
  "platform": "android"
}
```

Campos:

- `rating`: inteiro opcional de 1 a 5. Pode ser `null` se o usuário enviar apenas comentário.
- `comment`: texto opcional com comentário ou sugestão. Pode ser `null` se o usuário enviar apenas nota.
- `source`: origem do feedback no app. Valor inicial esperado: `home`.
- `app_version`: versão do app, quando disponível.
- `platform`: plataforma do app, quando disponível (`ios`, `android` ou `web`).

Regra de validação:

- Exigir ao menos um entre `rating` e `comment`.
- Se `rating` for enviado, aceitar apenas valores inteiros entre 1 e 5.
- Vincular o feedback ao usuário autenticado e ao tenant atual.

Response esperado:

```json
{
  "data": {
    "id": 123,
    "rating": 5,
    "comment": "Gostaria de uma tela para comparar evolução por mês.",
    "source": "home",
    "created_at": "2026-05-02T12:00:00Z"
  },
  "meta": {},
  "message": "Feedback recebido."
}
```

### Ajustes Necessários no Front

Mobile:

- Trocar o envio visual/local do modal de opinião por chamada real para `POST /api/v1/feedback`.
- Enviar `Authorization`, `Accept`, `Content-Type` e, quando disponível, `X-Tenant-Id`.
- Enviar `rating` quando o usuário selecionar estrelas e `comment` quando preencher comentário/sugestão.
- Enviar `source: "home"` para o card atual da home.
- Enviar `app_version` e `platform` quando esses dados estiverem disponíveis no app.
- Bloquear o envio se `rating` e `comment` estiverem vazios.
- Exibir estado de carregamento durante o envio.
- Em sucesso, fechar o modal, limpar os campos e mostrar confirmação simples ao usuário.
- Em erro de validação, informar que é necessário preencher uma nota ou comentário.
- Em erro de rede ou servidor, manter o conteúdo digitado no modal para o usuário tentar novamente.
- Não incluir feedback no fluxo de sincronização offline genérico. Feedback é envio online autenticado e vinculado ao tenant atual.

Painel admin web:

- Criar tela protegida para análise de feedbacks em `/admin/feedbacks`.
- Exibir cards de resumo com total de feedbacks, nota média, quantidade com comentário e último envio.
- Exibir distribuição por nota de 1 a 5 estrelas.
- Listar feedbacks recentes com usuário, email, tenant, nota, comentário, origem, versão do app, plataforma e data de criação.
- Adicionar navegação para Feedbacks no dashboard admin e nas telas administrativas relacionadas.
- A tela deve ser somente para usuários admin/root e não deve ficar disponível para usuários comuns do app.

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
- Registro exige API disponivel e resposta de sucesso para gravar o cliente no SaaS; o app nao cria mais conta local quando `POST /auth/register` falha.
- Depois do login, o app opera offline-first com SQLite.
- Quando o backend estiver disponível, o app tenta `sync/push` dos pendentes.
- Em outro celular, o app faz login online e depois `sync/pull`.
- `sync/push` e `sync/pull` só devem aceitar contas com sincronização liberada.
- Nunca validar `profile_id` apenas por existência global. Validar por usuário/tenant autenticado.
- Se `profile_id` não for enviado ou for inválido, retornar erro de validação claro.
- `deleted_at` deve aplicar soft delete, não remoção física imediata.
