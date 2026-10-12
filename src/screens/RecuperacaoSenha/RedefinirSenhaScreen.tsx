import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/Button/Button';
import { Icon } from '../../components/Icon/Icon';
import { TextField } from '../../components/TextField/TextField';
import type { AuthStackParamList } from '../../navigation/types';
import { colors, fontSizes, fonts, gradients, spacing } from '../../theme';
import {
  maximo,
  minimo,
  obrigatorio,
  validarFormulario,
  type Rule,
  type Schema,
} from '../../utils/validation';

type Campos = 'codigo' | 'novaSenha' | 'confirmarSenha';

export const MENSAGEM_CODIGO_INVALIDO = 'O código deve ter 6 dígitos.';
export const MENSAGEM_SENHAS_DIFERENTES = 'As senhas não conferem.';

// A API ainda não tem rota de recuperação de senha (MIGRATION_PLAN, decisão 14).
export const MENSAGEM_RECUPERACAO_INDISPONIVEL =
  'A recuperação de senha ainda não está disponível. Procure o suporte da clínica.';

const seisDigitos: Rule = (v) =>
  v.length > 0 && !/^\d{6}$/.test(v) ? MENSAGEM_CODIGO_INVALIDO : null;

// Mesmas regras da senha no cadastro (`LoginScreen`).
const schema: Schema<Campos> = {
  codigo: [obrigatorio, seisDigitos],
  novaSenha: [obrigatorio, minimo(8), maximo(100)],
  confirmarSenha: [obrigatorio],
};

/** Segunda etapa da recuperação: código recebido por email e nova senha. */
export function RedefinirSenhaScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { email } = useRoute<RouteProp<AuthStackParamList, 'RedefinirSenha'>>().params;
  const novaSenhaRef = useRef<TextInput>(null);
  const confirmarSenhaRef = useRef<TextInput>(null);

  const [form, setForm] = useState<Record<Campos, string>>({
    codigo: '',
    novaSenha: '',
    confirmarSenha: '',
  });
  const [erros, setErros] = useState<Partial<Record<Campos, string>>>({});
  const [erro, setErro] = useState<string | null>(null);

  function redefinir() {
    const novosErros = validarFormulario({ ...form, codigo: form.codigo.trim() }, schema);
    if (!novosErros.confirmarSenha && form.confirmarSenha !== form.novaSenha) {
      novosErros.confirmarSenha = MENSAGEM_SENHAS_DIFERENTES;
    }
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) {
      return;
    }
    // Aqui entra a chamada à API com email, código e nova senha; por enquanto só avança.
    // Com sucesso, a confirmação fica direto sobre o Login: voltar não reabre o formulário.
    navigation.reset({ index: 1, routes: [{ name: 'Login' }, { name: 'SenhaRedefinida' }] });
  }

  function reenviarCodigo() {
    // Aqui entra a chamada à API que reenvia o código para o email.
    setErro(MENSAGEM_RECUPERACAO_INDISPONIVEL);
  }

  function alterar(campo: Campos, valor: string) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
    setErros((atual) => ({ ...atual, [campo]: undefined }));
    setErro(null);
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
              Redefinir senha
            </Text>
            <Text style={styles.subtitle}>
              Digite o código de 6 dígitos enviado para <Text style={styles.email}>{email}</Text>.
            </Text>

            <View style={styles.form}>
              <TextField
                label="Código"
                value={form.codigo}
                onChangeText={(v) => alterar('codigo', v)}
                error={erros.codigo}
                keyboardType="number-pad"
                maxLength={6}
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => novaSenhaRef.current?.focus()}
                testID="redefinir-codigo"
              />
              <TextField
                ref={novaSenhaRef}
                label="Nova senha"
                value={form.novaSenha}
                onChangeText={(v) => alterar('novaSenha', v)}
                error={erros.novaSenha}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => confirmarSenhaRef.current?.focus()}
                testID="redefinir-nova-senha"
              />
              <TextField
                ref={confirmarSenhaRef}
                label="Confirmar nova senha"
                value={form.confirmarSenha}
                onChangeText={(v) => alterar('confirmarSenha', v)}
                error={erros.confirmarSenha}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="go"
                onSubmitEditing={redefinir}
                testID="redefinir-confirmar-senha"
              />
              <Text style={styles.dica}>Mínimo de 8 caracteres.</Text>

              {erro ? (
                <Text style={styles.erro} accessibilityRole="alert" testID="redefinir-erro">
                  {erro}
                </Text>
              ) : null}

              <Button label="Redefinir senha" onPress={redefinir} testID="redefinir-enviar" />

              <Pressable
                onPress={reenviarCodigo}
                accessibilityRole="link"
                hitSlop={8}
                style={styles.link}
                testID="redefinir-reenviar"
              >
                <Text style={styles.linkTexto}>Reenviar código</Text>
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
  email: { fontFamily: fonts.semibold, color: colors.text },
  form: { gap: spacing.lg },
  dica: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.textTertiary },
  erro: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.danger,
  },
  link: { alignSelf: 'center' },
  linkTexto: { fontFamily: fonts.semibold, fontSize: fontSizes.md, color: colors.primary },
});
