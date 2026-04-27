import { router } from 'expo-router';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { HistoryList } from '@/components/dashboard/history-list';
import { SummaryCard } from '@/components/dashboard/summary-card';
import { TrendCard } from '@/components/dashboard/trend-card';
import { ProfileAvatar } from '@/components/profile-avatar';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { SectionHeader } from '@/components/ui/section-header';
import { Screen } from '@/components/ui/screen';
import { BrandPalette, Colors, ModulePalette, Radius, Space } from '@/constants/theme';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useDashboardData } from '@/hooks/use-dashboard-data';

const modules = [
  {
    key: 'pressure',
    title: 'Pressão',
    description: 'Leituras e último registro em um fluxo único.',
    route: '/(tabs)/pressure' as const,
    color: ModulePalette.pressure.base,
    icon: 'waveform.path.ecg' as const,
  },
  {
    key: 'glicose',
    title: 'Glicose',
    description: 'Contexto da medição e histórico rápido no mesmo módulo.',
    route: '/(tabs)/glicose' as const,
    color: ModulePalette.glicose.base,
    icon: 'drop.fill' as const,
  },
  {
    key: 'weight',
    title: 'Peso',
    description: 'Pesagens e IMC em um acompanhamento mais simples da rotina.',
    route: '/(tabs)/weight' as const,
    color: ModulePalette.weight.base,
    icon: 'scalemass.fill' as const,
  },
  {
    key: 'medications',
    title: 'Medicação',
    description: 'Tratamentos ativos, registro diário e ajustes no mesmo lugar.',
    route: '/(tabs)/medications' as const,
    color: ModulePalette.medication.base,
    icon: 'pills.fill' as const,
  },
];

const quickActions = [
  {
    key: 'new-pressure',
    title: 'Nova pressão',
    description: 'Registrar leitura manual',
    route: '/pressure-form' as const,
    color: ModulePalette.pressure.base,
    soft: ModulePalette.pressure.soft,
    icon: 'waveform.path.ecg' as const,
  },
  {
    key: 'new-glicose',
    title: 'Nova glicose',
    description: 'Salvar valor com contexto',
    route: '/glicose-form' as const,
    color: ModulePalette.glicose.base,
    soft: ModulePalette.glicose.soft,
    icon: 'drop.fill' as const,
  },
  {
    key: 'new-weight',
    title: 'Novo peso',
    description: 'Atualizar pesagem',
    route: '/weight-form' as const,
    color: ModulePalette.weight.base,
    soft: ModulePalette.weight.soft,
    icon: 'scalemass.fill' as const,
  },
  {
    key: 'new-medication',
    title: 'Nova medicação',
    description: 'Cadastrar tratamento',
    route: '/medication-form' as const,
    color: ModulePalette.medication.base,
    soft: ModulePalette.medication.soft,
    icon: 'pills.fill' as const,
  },
];

export default function HomeTabScreen() {
  const { biometricAvailable, lock, logout, updateBiometric, user } = useAuth();
  const { history, isLoading, refresh, summary, trends } = useDashboardData(7);
  const firstName = user?.name.split(' ')[0] ?? 'Paciente';
  const accountMeta = user?.age ? `${user.email} · ${user.age} anos` : user?.email;

  return (
    <Screen isRefreshing={isLoading} onRefresh={refresh}>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.brandBadge}>
            <ThemedText style={styles.brandBadgeText}>SigmaMed</ThemedText>
          </View>
          <View style={styles.heroActions}>
            <Pressable style={styles.iconButton} onPress={() => router.push('/settings')}>
              <IconSymbol name="gearshape.fill" size={18} color={BrandPalette.navy} />
            </Pressable>
            <Pressable style={styles.iconButton} onPress={lock}>
              <IconSymbol name="lock.fill" size={18} color={BrandPalette.navy} />
            </Pressable>
            <Pressable style={styles.iconButton} onPress={() => void logout()}>
              <IconSymbol name="rectangle.portrait.and.arrow.right.fill" size={18} color={BrandPalette.navy} />
            </Pressable>
          </View>
        </View>

        <View style={styles.heroCopy}>
          <ThemedText type="title" style={styles.heroTitle}>
            {firstName}, cada cuidado agora tem seu próprio lugar.
          </ThemedText>
          <ThemedText style={styles.heroDescription}>
            Veja seus totais, acompanhe os últimos registros e acesse rapidamente pressão, glicose, peso e medicação.
          </ThemedText>
        </View>

        {user ? (
          <View style={styles.accountCard}>
            <ProfileAvatar name={user.name} photoUri={user.photoUri} size={58} />
            <View style={styles.accountCopy}>
              <ThemedText style={styles.accountTitle}>{user.name}</ThemedText>
              <ThemedText style={styles.accountMeta}>{accountMeta}</ThemedText>
            </View>
            <View style={styles.biometricWrap}>
              <ThemedText style={styles.biometricLabel}>Biometria</ThemedText>
              <Switch
                disabled={!biometricAvailable}
                value={user.useBiometric}
                onValueChange={(value) => {
                  void updateBiometric(value);
                }}
              />
            </View>
          </View>
        ) : null}
      </View>

      <Card style={styles.reportCard}>
        <Pressable style={styles.reportPressable} onPress={() => router.push('/report')}>
          <View style={styles.reportCopy}>
            <View style={styles.reportIconWrap}>
              <IconSymbol name="list.bullet.rectangle.fill" size={20} color={BrandPalette.navy} />
            </View>
            <View style={styles.reportTextWrap}>
              <ThemedText style={styles.reportTitle}>Relatório do período</ThemedText>
              <ThemedText style={styles.reportText}>
                Organize leituras, tendências e medicações em um resumo pronto para compartilhar.
              </ThemedText>
            </View>
          </View>
          <View style={styles.reportAction}>
            <ThemedText style={styles.reportActionText}>Abrir relatório</ThemedText>
          </View>
        </Pressable>
      </Card>

      {summary ? (
        <>
          <View style={styles.summaryGrid}>
            <SummaryCard label="Registros salvos" value={String(summary.totalReadings)} tone="default" />
            <SummaryCard label="Adesão hoje" value={`${summary.adherenceToday}%`} tone="accent" />
          </View>

          <View style={styles.summaryGrid}>
            <SummaryCard label="Pressão em 7 dias" value={String(summary.pressureLastSevenDays)} tone="success" />
            <SummaryCard label="Medicações ativas" value={String(summary.activeMedications)} tone="default" />
          </View>
        </>
      ) : null}

      <View style={styles.moduleGrid}>
        {modules.map((module) => (
          <Card key={module.key} style={styles.moduleCard}>
            <Pressable style={styles.moduleCardPressable} onPress={() => router.push(module.route)}>
              <View style={styles.moduleHeader}>
                <View style={[styles.moduleIcon, { backgroundColor: `${module.color}18` }]}>
                  <IconSymbol name={module.icon} size={20} color={module.color} />
                </View>
                <ThemedText style={styles.moduleTitle}>{module.title}</ThemedText>
              </View>
              <ThemedText style={styles.moduleText}>{module.description}</ThemedText>
            </Pressable>
          </Card>
        ))}
      </View>

      <View style={styles.quickGrid}>
        {quickActions.map((action) => (
          <Card key={action.key} style={styles.quickCard}>
            <Pressable style={styles.quickCardPressable} onPress={() => router.push(action.route)}>
              <View style={[styles.quickCardIcon, { backgroundColor: action.soft }]}>
                <IconSymbol name={action.icon} size={18} color={action.color} />
              </View>
              <ThemedText style={styles.quickCardTitle}>{action.title}</ThemedText>
              <ThemedText style={styles.quickCardText}>{action.description}</ThemedText>
            </Pressable>
          </Card>
        ))}
      </View>

      {trends ? (
        <View style={styles.section}>
          <SectionHeader title="Tendencias" hint="Ultimos 7 dias" />
          <TrendCard metric={trends.pressure} onPress={() => router.push('/(tabs)/pressure')} actionLabel="Abrir módulo" />
          <TrendCard metric={trends.glicose} onPress={() => router.push('/(tabs)/glicose')} actionLabel="Abrir módulo" />
          <TrendCard metric={trends.weight} onPress={() => router.push('/(tabs)/weight')} actionLabel="Abrir módulo" />
        </View>
      ) : null}

      {history.length > 0 ? (
        <View style={styles.section}>
          <SectionHeader title="Atividade recente" hint="Ultimos registros" />
          <HistoryList items={history.slice(0, 6)} />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: Radius.xl,
    backgroundColor: Colors.light.surfaceMuted,
    padding: Space.xl,
    gap: 18,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  brandBadge: {
    borderRadius: Radius.pill,
    backgroundColor: BrandPalette.navy,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  brandBadgeText: {
    color: BrandPalette.white,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 10,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: {
    gap: 10,
  },
  heroTitle: {
    color: Colors.light.text,
    lineHeight: 36,
  },
  heroDescription: {
    color: Colors.light.textMuted,
    lineHeight: 22,
  },
  accountCard: {
    borderRadius: Radius.lg,
    backgroundColor: Colors.light.surface,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: '#E2ECEF',
  },
  accountCopy: {
    flex: 1,
    gap: 2,
  },
  accountTitle: {
    color: Colors.light.text,
    fontWeight: '800',
    fontSize: 18,
  },
  accountMeta: {
    color: Colors.light.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  biometricWrap: {
    alignItems: 'center',
    gap: 6,
  },
  biometricLabel: {
    color: Colors.light.textSoft,
    fontSize: 12,
    fontWeight: '700',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  moduleGrid: {
    gap: 12,
  },
  moduleCard: {
    padding: 0,
  },
  moduleCardPressable: {
    padding: Space.md,
    gap: 12,
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  moduleIcon: {
    width: 42,
    height: 42,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleTitle: {
    flex: 1,
    color: Colors.light.text,
    fontSize: 18,
    fontWeight: '800',
  },
  moduleText: {
    color: Colors.light.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  reportCard: {
    padding: 0,
    backgroundColor: '#EEF7F4',
    borderColor: '#CFE5DF',
  },
  reportPressable: {
    padding: Space.lg,
    gap: 16,
  },
  reportCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  reportIconWrap: {
    width: 46,
    height: 46,
    borderRadius: Radius.md,
    backgroundColor: '#D7ECE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportTextWrap: {
    flex: 1,
    gap: 4,
  },
  reportTitle: {
    color: Colors.light.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  reportText: {
    color: Colors.light.textMuted,
    lineHeight: 20,
  },
  reportAction: {
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: BrandPalette.navy,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  reportActionText: {
    color: BrandPalette.white,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickCard: {
    width: '48%',
    padding: 0,
  },
  quickCardPressable: {
    minHeight: 136,
    padding: Space.md,
    gap: 10,
  },
  quickCardIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickCardTitle: {
    color: Colors.light.text,
    fontWeight: '800',
    fontSize: 16,
    lineHeight: 22,
  },
  quickCardText: {
    color: Colors.light.textMuted,
    lineHeight: 19,
  },
  section: {
    gap: 14,
  },
});
