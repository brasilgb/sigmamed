import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { AuthButton } from '@/components/auth/auth-button';
import { RecordInput } from '@/components/forms/record-input';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Screen } from '@/components/ui/screen';
import { BrandPalette, Colors, ModulePalette } from '@/constants/theme';
import { useAuth } from '@/features/auth/hooks/use-auth';

export default function SettingsScreen() {
  const { biometricAvailable, lock, logout, updateAccount, updateBiometric, user } = useAuth();
  const emailRef = useRef<TextInput>(null);
  const currentPasswordRef = useRef<TextInput>(null);
  const newPasswordRef = useRef<TextInput>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    setName(user.name);
    setEmail(user.email);
    setPhotoUri(user.photoUri);
  }, [user]);

  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'SM';

  async function handleTakePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      setError('Permita o uso da camera para atualizar a foto de perfil.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0]?.uri ?? null);
      setError(null);
    }
  }

  async function handleChooseFromLibrary() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setError('Permita acesso a galeria para escolher a foto de perfil.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0]?.uri ?? null);
      setError(null);
    }
  }

  async function handleSave() {
    if (!user) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccessMessage(null);
      await updateAccount({
        name,
        email,
        photoUri,
        currentPassword,
        newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setSuccessMessage('Configuracoes atualizadas com sucesso.');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Falha ao atualizar configuracoes.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ThemedText style={styles.backText}>Voltar</ThemedText>
        </Pressable>
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.headerBadge}>
              <IconSymbol name="gearshape.fill" size={18} color={ModulePalette.medication.base} />
            </View>
            <ThemedText style={styles.headerEyebrow}>Configuracoes</ThemedText>
          </View>
          <ThemedText type="title" style={styles.title}>
            Conta, seguranca e sessao no mesmo lugar.
          </ThemedText>
          <ThemedText style={styles.description}>
            Atualize seus dados, ajuste a biometria e controle a sessao do app com menos atrito.
          </ThemedText>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <ThemedText style={styles.sectionEyebrow}>Conta</ThemedText>
        <ThemedText style={styles.sectionTitle}>Dados principais</ThemedText>
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <ThemedText style={styles.avatarInitials}>{initials}</ThemedText>
              </View>
            )}
          </View>
          <View style={styles.profileActions}>
            <AuthButton label="Tirar foto" variant="secondary" onPress={() => void handleTakePhoto()} />
            <AuthButton label="Escolher da galeria" variant="secondary" onPress={() => void handleChooseFromLibrary()} />
            {photoUri ? <AuthButton label="Remover foto" onPress={() => setPhotoUri(null)} /> : null}
          </View>
        </View>
        <RecordInput
          label="Nome"
          value={name}
          onChangeText={setName}
          placeholder="Seu nome"
          returnKeyType="next"
          textContentType="name"
          autoComplete="name"
          onSubmitEditing={() => emailRef.current?.focus()}
        />
        <RecordInput
          ref={emailRef}
          label="E-mail"
          value={email}
          onChangeText={setEmail}
          placeholder="voce@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
          textContentType="emailAddress"
          autoComplete="email"
          onSubmitEditing={() => currentPasswordRef.current?.focus()}
        />
      </View>

      <View style={styles.sectionCard}>
        <ThemedText style={styles.sectionEyebrow}>Seguranca</ThemedText>
        <ThemedText style={styles.sectionTitle}>Senha e biometria</ThemedText>
        <RecordInput
          ref={currentPasswordRef}
          label="Senha atual"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Obrigatoria para trocar e-mail ou senha"
          secureTextEntry
          returnKeyType="next"
          textContentType="password"
          autoComplete="current-password"
          onSubmitEditing={() => newPasswordRef.current?.focus()}
        />
        <RecordInput
          ref={newPasswordRef}
          label="Nova senha"
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Minimo de 6 caracteres"
          secureTextEntry
          returnKeyType="done"
          textContentType="newPassword"
          autoComplete="password-new"
          onSubmitEditing={() => void handleSave()}
          hint="Deixe em branco se quiser manter a senha atual."
        />

        <View style={styles.biometricCard}>
          <View style={styles.biometricCopy}>
            <ThemedText style={styles.biometricTitle}>Biometria</ThemedText>
            <ThemedText style={styles.biometricText}>
              {biometricAvailable
                ? user?.useBiometric
                  ? 'Ativa para desbloqueio rapido.'
                  : 'Desativada no momento.'
                : 'Biometria indisponivel neste dispositivo.'}
            </ThemedText>
          </View>
          <AuthButton
            label={user?.useBiometric ? 'Desativar' : 'Ativar'}
            variant="secondary"
            disabled={!biometricAvailable || !user}
            onPress={() => {
              if (!user) {
                return;
              }

              void updateBiometric(!user.useBiometric);
            }}
          />
        </View>
      </View>

      <View style={styles.sectionCard}>
        <ThemedText style={styles.sectionEyebrow}>Sessao</ThemedText>
        <ThemedText style={styles.sectionTitle}>Acoes rapidas</ThemedText>
        <View style={styles.sessionRow}>
          <AuthButton label="Bloquear app" variant="secondary" onPress={lock} style={styles.sessionButton} />
          <AuthButton label="Sair da conta" onPress={() => void logout()} style={styles.sessionButton} />
        </View>
      </View>

      {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}
      {successMessage ? <ThemedText style={styles.successText}>{successMessage}</ThemedText> : null}

      <AuthButton
        label={isSubmitting ? 'Salvando...' : 'Salvar configuracoes'}
        disabled={isSubmitting}
        onPress={handleSave}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 10,
  },
  backButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  backText: {
    color: Colors.light.text,
    fontWeight: '700',
  },
  headerCard: {
    borderRadius: 30,
    backgroundColor: ModulePalette.medication.soft,
    padding: 22,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E3D8F6',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.light.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerEyebrow: {
    color: ModulePalette.medication.base,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: {
    color: Colors.light.text,
    lineHeight: 36,
  },
  description: {
    color: Colors.light.textMuted,
    lineHeight: 22,
  },
  sectionCard: {
    borderRadius: 28,
    backgroundColor: Colors.light.surface,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: '#E2ECEF',
    shadowColor: BrandPalette.navy,
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 2,
  },
  sectionEyebrow: {
    color: Colors.light.textSoft,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    color: Colors.light.text,
    fontSize: 20,
    fontWeight: '800',
  },
  profileCard: {
    borderRadius: 20,
    backgroundColor: Colors.light.surfaceMuted,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  avatarWrap: {
    alignItems: 'center',
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: ModulePalette.medication.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: Colors.light.surface,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '800',
  },
  profileActions: {
    gap: 10,
  },
  biometricCard: {
    borderRadius: 20,
    backgroundColor: Colors.light.surfaceMuted,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  biometricCopy: {
    gap: 4,
  },
  biometricTitle: {
    color: Colors.light.text,
    fontWeight: '700',
  },
  biometricText: {
    color: Colors.light.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  sessionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  sessionButton: {
    flex: 1,
  },
  errorText: {
    color: Colors.light.danger,
    lineHeight: 20,
  },
  successText: {
    color: '#0F8A6A',
    lineHeight: 20,
    fontWeight: '700',
  },
});
