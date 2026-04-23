# AUTH CONTEXT — Health AI App

## Objetivo

Definir a estratégia de autenticação e controle de acesso do aplicativo de saúde.

O módulo de autenticação deve proteger dados sensíveis do usuário e, ao mesmo tempo, manter uma experiência simples no uso diário.

## Escopo do MVP

O app deve permitir:

* cadastro local de usuário
* login com e-mail e senha
* desbloqueio rápido por PIN
* biometria opcional
* funcionamento offline
* proteção local dos dados de saúde

## Princípios

* offline first
* segurança local antes de sincronização
* desbloqueio rápido no dia a dia
* credenciais sensíveis fora do SQLite puro
* medições e históricos armazenados localmente
* futura sincronização com backend Laravel

## Estratégia de Acesso

Separar autenticação em 3 camadas:

### 1. Conta do usuário

Responsável por identificar o dono da conta.

Campos principais:

* nome
* e-mail
* senha

### 2. Desbloqueio local

Responsável por abrir o app rapidamente no uso diário.

Métodos:

* PIN de 4 ou 6 dígitos
* biometria opcional

### 3. Sessão

Responsável por manter o usuário autenticado no dispositivo.

## Fluxo Recomendado

### Primeiro acesso

1. usuário abre o app
2. cria conta com nome, e-mail e senha
3. cria PIN
4. escolhe se deseja ativar biometria
5. entra no app

### Próximos acessos

1. app verifica sessão local
2. se houver sessão ativa, solicita biometria ou PIN
3. ao validar, desbloqueia a home

### Recuperação local

Se biometria falhar:

* pedir PIN

Se PIN for esquecido:

* pedir senha da conta

## Modos de uso

### Modo local

* conta armazenada localmente
* sem sincronização online obrigatória
* ideal para MVP

### Modo conta online (futuro)

* autenticação via backend
* backup
* sincronização entre dispositivos
* recuperação de senha online

## Armazenamento

### SQLite

Usar para:

* usuários locais
* perfil do usuário
* preferências não críticas
* vínculos com dados de saúde

### Secure Store

Usar para:

* indicadores de sessão
* chaves locais
* segredos sensíveis
* flags de desbloqueio

### Biometria

Usar recursos nativos do dispositivo para:

* impressão digital
* reconhecimento facial quando disponível

## Estrutura de Dados

### Tabela users

```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  password_hash TEXT,
  pin_hash TEXT,
  use_biometric INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### Tabela profiles

```sql
CREATE TABLE IF NOT EXISTS profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  full_name TEXT,
  birth_date TEXT,
  sex TEXT,
  height REAL,
  target_weight REAL,
  has_diabetes INTEGER DEFAULT 0,
  has_hypertension INTEGER DEFAULT 0,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## Campos e Regras

### Usuário

* name: obrigatório
* email: único
* password_hash: obrigatório no cadastro com conta
* pin_hash: obrigatório para desbloqueio rápido
* use_biometric: opcional

### Perfil

* vinculado a 1 usuário
* pode evoluir no futuro para múltiplos perfis por conta

## Regras de Segurança

* nunca armazenar senha em texto puro
* nunca armazenar PIN em texto puro
* usar hash para senha e PIN
* usar secure storage para dados de sessão
* exigir autenticação ao reabrir o app após bloqueio
* ocultar dados sensíveis até desbloqueio
* permitir logout manual

## Regras de UX

* login inicial com e-mail e senha
* desbloqueio cotidiano com PIN ou biometria
* opção clara de ativar ou desativar biometria
* feedback visual simples em caso de erro
* mensagens amigáveis para público leigo

## Telas do Módulo Auth

* WelcomeScreen
* RegisterScreen
* LoginScreen
* CreatePinScreen
* EnableBiometricScreen
* UnlockScreen
* ForgotPasswordScreen (futuro)
* ProfileSetupScreen

## Fluxos do Módulo

### Cadastro

* informar nome
* informar e-mail
* criar senha
* confirmar senha
* criar PIN
* optar por biometria
* criar perfil inicial

### Login

* informar e-mail e senha
* iniciar sessão local
* redirecionar para desbloqueio ou home

### Desbloqueio

* tentar biometria se ativa
* fallback para PIN
* fallback para senha se necessário

### Logout

* limpar sessão local
* manter dados locais salvos, salvo decisão do usuário

## Estrutura Técnica Sugerida

```txt
src/
  features/
    auth/
      screens/
      components/
      hooks/
      services/
      repositories/
      schemas/
      types/
```

## Serviços Recomendados

### authService

Responsável por:

* registrar usuário
* validar login
* criar sessão
* encerrar sessão

### pinService

Responsável por:

* criar PIN
* validar PIN
* alterar PIN

### biometricService

Responsável por:

* verificar suporte do dispositivo
* solicitar autenticação biométrica
* ativar/desativar biometria

### sessionService

Responsável por:

* persistir sessão local
* verificar sessão ativa
* bloquear/desbloquear app

## Repositórios

### userRepository

* createUser
* findUserByEmail
* findUserById
* updateUser

### profileRepository

* createProfile
* getProfileByUserId
* updateProfile

## Validações

### Cadastro

* nome obrigatório
* e-mail válido
* senha mínima de 8 caracteres
* confirmação de senha deve coincidir
* PIN com 4 ou 6 dígitos

### Login

* e-mail obrigatório
* senha obrigatória

### Desbloqueio

* PIN obrigatório quando biometria indisponível

## Dependências sugeridas

* expo-sqlite
* expo-secure-store
* expo-local-authentication
* react-hook-form
* zod

## Backend Futuro

Integração prevista com Laravel para:

* autenticação online
* sincronização de dados
* recuperação de senha
* backup em nuvem
* múltiplos dispositivos

## Estratégia futura de sincronização

* SQLite continua como banco local principal
* API Laravel sincroniza alterações
* app deve continuar funcional offline
* sincronização deve ser assíncrona

## Roadmap do Auth

### Fase 1

* cadastro local
* login local
* PIN
* biometria
* sessão local

### Fase 2

* perfil do usuário
* preferências de segurança
* timeout de sessão

### Fase 3

* backend Laravel
* autenticação online
* recuperação de senha
* sincronização

### Fase 4

* múltiplos perfis por conta
* cuidador/família
* compartilhamento seguro

## Decisões do MVP

* 1 conta = 1 perfil
* login principal por e-mail e senha
* desbloqueio diário por PIN ou biometria
* dados clínicos protegidos localmente
* sem dependência obrigatória de internet

## Próxima Task Recomendada

Criar o módulo `auth` com:

* tipos TypeScript
* schemas zod
* tabela users
* tabela profiles
* authService
* sessionService
* fluxo Register -> PIN -> Biometria -> Home
