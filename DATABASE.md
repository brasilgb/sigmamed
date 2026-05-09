# Banco local

Resumo das tabelas e campos usados no SQLite local do app. A fonte principal e `src/database/migrations.ts`; os campos abaixo consideram o estado final apos todas as migrations.

## Visao geral

- `schema_migrations`: controle interno das migrations aplicadas.
- `users`: conta local principal do app.
- `profiles`: pessoas acompanhadas, incluindo o proprio usuario em uso pessoal.
- `blood_pressure_readings`: leituras de pressao arterial.
- `glicose_readings`: leituras de glicose.
- `weight_readings`: leituras de peso.
- `medications`: cadastro de medicamentos.
- `medication_logs`: registros de tomada/pulo de medicamentos.

## Regras de perfil

O app separa conta de login e pessoa acompanhada:

- `users` guarda a conta local/autenticacao.
- `profiles` guarda os dados clinicos/demograficos da pessoa acompanhada.
- Em uso `personal`, tambem existe um registro em `profiles` para o proprio usuario.
- Em uso `family`, os acompanhados ficam em `profiles` e a conta principal continua em `users`.
- Registros clinicos usam `profile_id` apontando para `profiles.id`.
- `remote_profile_id` guarda o ID do perfil correspondente na nuvem.

## schema_migrations

| Campo | Tipo | Uso |
| --- | --- | --- |
| `version` | INTEGER PRIMARY KEY NOT NULL | Versao da migration aplicada. |

## users

| Campo | Tipo | Uso |
| --- | --- | --- |
| `id` | INTEGER PRIMARY KEY AUTOINCREMENT | ID local da conta. |
| `name` | TEXT NOT NULL | Nome da conta principal. |
| `email` | TEXT UNIQUE | E-mail da conta. |
| `age` | INTEGER | Idade da conta principal, quando aplicavel. |
| `account_usage` | TEXT NOT NULL DEFAULT `'personal'` | Tipo de uso: pessoal, familiar/cuidador etc. |
| `photo_uri` | TEXT | Foto local da conta. |
| `password_hash` | TEXT | Hash da senha local. |
| `pin_hash` | TEXT | Hash do PIN local. |
| `use_biometric` | INTEGER NOT NULL DEFAULT `0` | Preferencia de biometria. |
| `created_at` | TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP | Criacao local. |
| `updated_at` | TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP | Ultima atualizacao local. |

## profiles

| Campo | Tipo | Uso |
| --- | --- | --- |
| `id` | INTEGER PRIMARY KEY AUTOINCREMENT | ID local do perfil acompanhado. |
| `remote_profile_id` | INTEGER | ID do perfil na nuvem. |
| `user_id` | INTEGER NOT NULL | Conta local dona do perfil. |
| `full_name` | TEXT | Nome completo do acompanhado. |
| `age` | INTEGER | Idade do acompanhado. |
| `birth_date` | TEXT | Data de nascimento, quando disponivel. |
| `sex` | TEXT | Sexo informado no perfil. |
| `height` | REAL | Altura em centimetros. |
| `target_weight` | REAL | Peso alvo, quando informado. |
| `has_diabetes` | INTEGER NOT NULL DEFAULT `0` | Marcador de diabetes. |
| `has_hypertension` | INTEGER NOT NULL DEFAULT `0` | Marcador de hipertensao. |
| `notes` | TEXT | Observacoes do perfil. |
| `created_at` | TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP | Criacao local. |
| `updated_at` | TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP | Ultima atualizacao local. |

## blood_pressure_readings

| Campo | Tipo | Uso |
| --- | --- | --- |
| `id` | INTEGER PRIMARY KEY AUTOINCREMENT | ID local da leitura. |
| `uuid` | TEXT | UUID usado na sincronizacao. |
| `profile_id` | INTEGER | Perfil acompanhado da leitura. |
| `systolic` | INTEGER NOT NULL | Pressao sistolica. |
| `diastolic` | INTEGER NOT NULL | Pressao diastolica. |
| `pulse` | INTEGER | Pulso em bpm. |
| `measured_at` | TEXT NOT NULL | Data/hora da medicao. |
| `source` | TEXT NOT NULL | Origem da leitura. Hoje normalizado para `manual`. |
| `notes` | TEXT | Observacoes. |
| `created_at` | TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP | Criacao local. |
| `updated_at` | TEXT | Ultima atualizacao para sync. |
| `synced_at` | TEXT | Ultima sincronizacao concluida. |
| `deleted_at` | TEXT | Exclusao logica para sync. |

## glicose_readings

| Campo | Tipo | Uso |
| --- | --- | --- |
| `id` | INTEGER PRIMARY KEY AUTOINCREMENT | ID local da leitura. |
| `uuid` | TEXT | UUID usado na sincronizacao. |
| `profile_id` | INTEGER | Perfil acompanhado da leitura. |
| `glicose_value` | REAL NOT NULL | Valor da glicose. |
| `unit` | TEXT NOT NULL DEFAULT `'mg/dL'` | Unidade da glicose. |
| `context` | TEXT NOT NULL | Contexto: jejum, pos-refeicao ou aleatorio. |
| `measured_at` | TEXT NOT NULL | Data/hora da medicao. |
| `source` | TEXT NOT NULL | Origem da leitura. Hoje normalizado para `manual`. |
| `notes` | TEXT | Observacoes. |
| `created_at` | TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP | Criacao local. |
| `updated_at` | TEXT | Ultima atualizacao para sync. |
| `synced_at` | TEXT | Ultima sincronizacao concluida. |
| `deleted_at` | TEXT | Exclusao logica para sync. |

## weight_readings

| Campo | Tipo | Uso |
| --- | --- | --- |
| `id` | INTEGER PRIMARY KEY AUTOINCREMENT | ID local da pesagem. |
| `uuid` | TEXT | UUID usado na sincronizacao. |
| `profile_id` | INTEGER | Perfil acompanhado da pesagem. |
| `weight` | REAL NOT NULL | Peso. |
| `height` | REAL | Altura usada no registro, normalmente vinda do perfil ativo. |
| `unit` | TEXT NOT NULL DEFAULT `'kg'` | Unidade do peso. |
| `measured_at` | TEXT NOT NULL | Data/hora da medicao. |
| `notes` | TEXT | Observacoes. |
| `created_at` | TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP | Criacao local. |
| `updated_at` | TEXT | Ultima atualizacao para sync. |
| `synced_at` | TEXT | Ultima sincronizacao concluida. |
| `deleted_at` | TEXT | Exclusao logica para sync. |

## medications

| Campo | Tipo | Uso |
| --- | --- | --- |
| `id` | INTEGER PRIMARY KEY AUTOINCREMENT | ID local da medicacao. |
| `uuid` | TEXT | UUID usado na sincronizacao. |
| `profile_id` | INTEGER | Perfil acompanhado da medicacao. |
| `name` | TEXT NOT NULL | Nome do medicamento. |
| `dosage` | TEXT NOT NULL | Dose descrita. |
| `instructions` | TEXT | Instrucoes de uso. |
| `active` | INTEGER NOT NULL DEFAULT `1` | Medicacao ativa/inativa. |
| `scheduled_time` | TEXT | Horario previsto da primeira dose no formato `HH:mm`. |
| `dose_interval` | TEXT | Intervalo entre doses no formato `HH:mm`, por exemplo `12:00` para repetir a cada 12 horas. Quando vier vazio/nulo, o app usa `24:00`. Nao e data. |
| `reminder_enabled` | INTEGER NOT NULL DEFAULT `0` | Lembrete habilitado. |
| `reminder_minutes_before` | INTEGER NOT NULL DEFAULT `5` | Antecedencia do lembrete. |
| `repeat_reminder_every_five_minutes` | INTEGER NOT NULL DEFAULT `0` | Repetir lembrete a cada 5 minutos. |
| `created_at` | TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP | Criacao local. |
| `updated_at` | TEXT | Ultima atualizacao para sync. |
| `synced_at` | TEXT | Ultima sincronizacao concluida. |
| `deleted_at` | TEXT | Exclusao logica para sync. |

## medication_logs

| Campo | Tipo | Uso |
| --- | --- | --- |
| `id` | INTEGER PRIMARY KEY AUTOINCREMENT | ID local do registro de tomada. |
| `uuid` | TEXT | UUID usado na sincronizacao. |
| `profile_id` | INTEGER | Perfil acompanhado do registro. |
| `medication_id` | INTEGER NOT NULL | Medicacao relacionada. |
| `scheduled_at` | TEXT NOT NULL | Data/hora prevista. |
| `taken_at` | TEXT | Data/hora em que foi tomada. |
| `status` | TEXT NOT NULL | Status: tomado, pulado ou pendente. |
| `created_at` | TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP | Criacao local. |
| `updated_at` | TEXT | Ultima atualizacao para sync. |
| `synced_at` | TEXT | Ultima sincronizacao concluida. |
| `deleted_at` | TEXT | Exclusao logica para sync. |

## Campos de sincronizacao

As tabelas clinicas sincronizaveis usam um conjunto comum de campos:

- `uuid`: identificador estavel para sync.
- `profile_id`: perfil local dono do registro.
- `updated_at`: data da ultima alteracao local.
- `synced_at`: data em que o registro foi enviado/recebido com sucesso.
- `deleted_at`: exclusao logica para propagar remocoes.

Esses campos aparecem em:

- `blood_pressure_readings`
- `glicose_readings`
- `weight_readings`
- `medications`
- `medication_logs`

`profiles` tambem participa do contexto de sync por meio de `remote_profile_id`, mas nao entra no sync generico de registros clinicos.
