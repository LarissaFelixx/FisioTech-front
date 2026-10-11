import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/Button/Button';
import { Icon } from '../../components/Icon/Icon';
import { TextField } from '../../components/TextField/TextField';
import type { AuthStackParamList } from '../../navigation/types';
import { colors, fontSizes, fonts, gradients, spacing } from '../../theme';
import { email, maximo, obrigatorio, validar } from '../../utils/validation';

// Mesmas regras do email no cadastro (`LoginScreen`).
const emailRegras = [obrigatorio, email, maximo(120)];

/** Primeira etapa da recuperação: pede o email da conta para enviar o código. */
export function RecuperacaoSenhaScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [valor, setValor] = useState('');
  const [erroCampo, setErroCampo] = useState<string | null>(null);

  function enviarCodigo() {
    const erroEmail = validar(valor.trim(), emailRegras);
    setErroCampo(erroEmail);
    if (erroEmail) {
      return;
    }
    // Aqui entra a chamada à API que envia o código; por enquanto só avança para a etapa 2.
    navigation.navigate('RedefinirSenha', { email: valor.trim() });
  }

  function alterar(texto: string) {
    setValor(texto);
    setErroCampo(null);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.conteudo}>
            <LinearGradient
              colors={gradients.hero.colors}
              start={gradients.hero.start}
              end={gradients.hero.end}
              style={styles.logo}
            >
              <Icon name="heart" size={26} color={colors.textInverse} />
            </LinearGradient>

            <Text style={styles.title} accessibilityRole="header">
              Recuperar senha
            </Text>
            <Text style={styles.subtitle}>
              Informe o email da sua conta. Enviaremos um código de 6 dígitos para você criar uma
              nova senha.
            </Text>

            <View style={styles.form}>
              <TextField
                label="Email"
                value={valor}
                onChangeText={alterar}
                error={erroCampo}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="username"
                returnKeyType="send"
                onSubmitEditing={enviarCodigo}
                testID="recuperacao-email"
              />

              <Button label="Enviar código" onPress={enviarCodigo} testID="recuperacao-enviar" />

              <Pressable
                onPress={() => navigation.goBack()}
                accessibilityRole="link"
                hitSlop={8}
                style={styles.voltar}
                testID="recuperacao-voltar"
              >
                <Text style={styles.voltarTexto}>Voltar para o login</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    padding: spacing.xxl,
    paddingTop: spacing.xxxl,
  },
  conteudo: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: fontSizes.xxl,
    letterSpacing: -0.5,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.xxl,
  },
  form: { gap: spacing.lg },
  voltar: { alignSelf: 'center' },
  voltarTexto: { fontFamily: fonts.semibold, fontSize: fontSizes.md, color: colors.primary },
});
