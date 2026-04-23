import { StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AuthButton } from '@/components/auth/auth-button';
import { HistoryList } from '@/components/dashboard/history-list';
import { Screen } from '@/components/ui/screen';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useDashboardData } from '@/hooks/use-dashboard-data';

const moduleCards = [
  {
    title: 'Pressao',
    description: 'Registra sistolica, diastolica, pulso, horario e origem da leitura.',
  },
  {
    title: 'Glicose',
    description: 'Mantem contexto da medicao para separar jejum, pos-refeicao e aleatoria.',
  },
  {
    title: 'Peso',
    description: 'Acompanha variacao corporal e deixa pronto o terreno para graficos.',
  },
  {
    title: 'Medicacao',
    description: 'Organiza cadastro ativo e logs de adesao para futuras notificacoes.',
  },
];

export default function HistoryScreen() {
  const { biometricAvailable, lock, logout, updateBiometric, user } = useAuth();
  const { history, isLoading, refresh, summary } = useDashboardData();

  return (
    <Screen isRefreshing={isLoading} onRefresh={refresh}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          MVP estruturado para evoluir.
        </ThemedText>
        <ThemedText style={styles.description}>
          O app ja possui banco local, migrations, seed inicial e repositories por modulo.
        </ThemedText>
      </View>

      <View style={styles.moduleList}>
        {moduleCards.map((module) => (
          <View key={module.title} style={styles.moduleCard}>
            <ThemedText style={styles.moduleTitle}>{module.title}</ThemedText>
            <ThemedText style={styles.moduleDescription}>{module.description}</ThemedText>
          </View>
        ))}
      </View>

      <View style={styles.roadmapCard}>
        <ThemedText style={styles.roadmapTitle}>Proximo passo sugerido</ThemedText>
        <ThemedText style={styles.roadmapText}>
          Criar formularios reais de cadastro e CRUD por modulo usando os repositories ja prontos.
        </ThemedText>
        {summary ? (
          <ThemedText style={styles.roadmapMeta}>
            Base atual: {summary.totalReadings} registros e {summary.activeMedications} medicacoes ativas.
          </ThemedText>
        ) : null}
      </View>

      {user ? (
        <View style={styles.accountCard}>
          <ThemedText style={styles.accountTitle}>Conta local protegida</ThemedText>
          <ThemedText style={styles.accountMeta}>{user.name}</ThemedText>
          <ThemedText style={styles.accountMeta}>{user.email}</ThemedText>
          <View style={styles.preferenceRow}>
            <View style={styles.preferenceText}>
              <ThemedText style={styles.preferenceTitle}>Biometria</ThemedText>
              <ThemedText style={styles.preferenceDescription}>
                {biometricAvailable
                  ? 'Ative para desbloqueio rapido no dia a dia.'
                  : 'Biometria nao disponivel neste dispositivo.'}
              </ThemedText>
            </View>
            <Switch
              disabled={!biometricAvailable}
              value={user.useBiometric}
              onValueChange={(value) => {
                updateBiometric(value).catch(() => null);
              }}
            />
          </View>
          <View style={styles.actionRow}>
            <AuthButton label="Bloquear app" variant="secondary" onPress={lock} style={styles.actionButton} />
            <AuthButton label="Logout" onPress={() => void logout()} style={styles.actionButton} />
          </View>
        </View>
      ) : null}

      <View style={styles.sectionHeader}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Timeline unificada
        </ThemedText>
        <ThemedText style={styles.sectionHint}>Dados locais</ThemedText>
      </View>

      <HistoryList items={history} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 8,
  },
  title: {
    color: '#17303a',
    lineHeight: 38,
  },
  description: {
    color: '#56707a',
  },
  moduleList: {
    gap: 12,
  },
  moduleCard: {
    borderRadius: 24,
    backgroundColor: '#ffffff',
    padding: 18,
    gap: 6,
  },
  moduleTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: '#17303a',
  },
  moduleDescription: {
    color: '#5a6f76',
    fontSize: 14,
    lineHeight: 20,
  },
  roadmapCard: {
    borderRadius: 28,
    backgroundColor: '#dff4ec',
    padding: 20,
    gap: 8,
  },
  roadmapTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: '#0f6c4d',
  },
  roadmapText: {
    color: '#275847',
  },
  roadmapMeta: {
    color: '#346454',
    fontSize: 14,
    lineHeight: 20,
  },
  accountCard: {
    borderRadius: 28,
    backgroundColor: '#ffffff',
    padding: 20,
    gap: 12,
  },
  accountTitle: {
    color: '#17303a',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  },
  accountMeta: {
    color: '#5a6f76',
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: '#f4f8f9',
    padding: 16,
  },
  preferenceText: {
    flex: 1,
    gap: 4,
  },
  preferenceTitle: {
    color: '#17303a',
    fontWeight: '700',
  },
  preferenceDescription: {
    color: '#57717a',
    fontSize: 14,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#17303a',
  },
  sectionHint: {
    color: '#6a8089',
    fontSize: 13,
    lineHeight: 18,
  },
});
