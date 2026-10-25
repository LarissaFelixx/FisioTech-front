import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/Button/Button';
import { Icon } from '../../components/Icon/Icon';
import type { AuthStackParamList } from '../../navigation/types';
import { colors, fontSizes, fonts, spacing } from '../../theme';

/** Terceira etapa da recuperação: senha redefinida; o usuário volta ao login. */
export function SenhaRedefinidaScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.conteudo} testID="senha-redefinida">
        {/* Mesmo ícone de sucesso do `ConsultaWizardScreen`. */}
        <View style={styles.sucessoIcone}>
          <Icon name="check" color={colors.textInverse} size={44} />
        </View>
        <Text style={styles.title} accessibilityRole="header">
          Senha redefinida
        </Text>
        <Text style={styles.message}>
          Por segurança, você saiu de todos os dispositivos. Entre novamente com a nova senha.
        </Text>
        <View style={styles.acao}>
          <Button
            label="Ir para o login"
            onPress={() => navigation.popTo('Login')}
            testID="senha-redefinida-login"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  conteudo: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  sucessoIcone: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: fontSizes.xxl,
    letterSpacing: -0.5,
    color: colors.text,
    textAlign: 'center',
  },
  message: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  acao: { alignSelf: 'stretch', marginTop: spacing.sm },
});
