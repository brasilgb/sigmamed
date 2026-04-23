# Project Context — Health AI App

## Visão Geral

Aplicativo mobile focado em monitoramento doméstico de saúde com armazenamento local e análise inteligente.

## Objetivo MVP

Permitir registrar, acompanhar e analisar:

* Pressão arterial
* Glicose
* Peso
* Medicação

## Público Inicial

* Pessoas com hipertensão
* Pessoas com diabetes
* Usuários que desejam controle de peso
* Usuários com uso contínuo de medicamentos

## Stack Técnica

* React Native + Expo
* TypeScript
* SQLite local (offline first)
* Backend futuro: Laravel API
* IA futura: análise textual e insights

## Princípios do Produto

* Simples e rápido para registrar dados
* Funciona offline
* Dados locais primeiro
* IA apenas analisa dados confirmados
* Nunca inventar medições
* UX clara para público leigo

## Módulos MVP

### 1. Pressão

Campos:

* systolic
  n- diastolic
* pulse
* measured_at
* source (manual/photo/bluetooth)
* notes

### 2. Glicose

Campos:

* glicose_value
* unit (mg/dL)
* context (fasting/post_meal/random)
* measured_at
* source
* notes

### 3. Peso

Campos:

* weight
* unit (kg)
* measured_at
* notes

### 4. Medicação

Campos:

* name
* dosage
* instructions
* active

Logs:

* scheduled_at
* taken_at
* status (pending/taken/skipped)

## Banco de Dados

Tabelas iniciais:

* blood_pressure_readings
* glicose_readings
* weight_readings
* medications
* medication_logs
* ai_analyses (fase futura)

## Fluxos Principais

### Registrar dado

1. Usuário informa valor ou usa foto
2. Confirma leitura
3. Salva no SQLite
4. Exibe no histórico

### Analisar com IA

1. Usuário seleciona período
2. App agrega dados
3. IA gera resumo amigável
4. Exibe alertas e tendências

## IA (Fase 2+)

Pode analisar:

* Média semanal de pressão
* Tendência de glicose
* Variação de peso
* Adesão à medicação
* Correlação entre adesão e indicadores

Regras:

* Não diagnosticar
* Não substituir médico
* Explicar tendências com linguagem simples

## Roadmap

### Fase 1

* SQLite
* CRUD completo dos 4 módulos
* Histórico local
* Dashboard simples

### Fase 2

* Gráficos
* Lembretes de medicação
* OCR por foto para pressão/glicose

### Fase 3

* IA de insights
* Exportação PDF
* Sincronização com backend Laravel

### Fase 4

* Bluetooth com dispositivos compatíveis
* Multiusuário/família
* Compartilhamento com médico

## Regras de Código

* Clean code
* Components reutilizáveis
* Hooks por módulo
* Services para regras de negócio
* Repository para acesso SQLite
* Tipagem forte TypeScript

## Estrutura Sugerida

```txt
src/
  database/
  features/
    pressure/
    glicose/
    weight/
    medications/
  components/
  hooks/
  services/
  utils/
```

## Próxima Task Recomendada

Criar initDatabase(), migrations e repositories SQLite.
