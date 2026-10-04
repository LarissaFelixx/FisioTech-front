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
import { CadastroSemLoginError } from '../../contexts/AuthContext';
import { useAuth } from '../../hooks/useAuth';
import { colors, fontSizes, fonts, gradients, radius, shadows, spacing } from '../../theme';
import {
  email,
  maximo,
  minimo,
  obrigatorio,
  validarFormulario,
  type Schema,
} from '../../utils/validation';
import { mensagemErroCadastro, mensagemErroLogin } from './loginMessages';

type Aba = 'login' | 'cadastro';

type LoginCampos = 'email' | 'senha';
type CadastroCampos = 'nome' | 'email' | 'senha';

// Mesmos validadores dos formulários do `login.ts` do Angular.
const loginSchema: Schema<LoginCampos> = {
  email: [obrigatorio, email],
  senha: [obrigatorio],
};

const cadastroSchema: Schema<CadastroCampos> = {
  nome: [obrigatorio, maximo(120)],
  email: [obrigatorio, email, maximo(120)],
  senha: [obrigatorio, minimo(8), maximo(100)],
};

/** Origem: `features/login` (abas Login e Cadastrar, este só para pacientes). */
export function LoginScreen() {
  const { login, cadastrar } = useAuth();
  const [aba, setAba] = useState<Aba>('login');
  const loginSenhaRef = useRef<TextInput>(null);
  const cadastroEmailRef = useRef<TextInput>(null);
  const cadastroSenhaRef = useRef<TextInput>(null);

  const [loginForm, setLoginForm] = useState<Record<LoginCampos, string>>({ email: '', senha: '' });
  const [loginErros, setLoginErros] = useState<Partial<Record<LoginCampos, string>>>({});
  const [entrando, setEntrando] = useState(false);
  const [loginErro, setLoginErro] = useState<string | null>(null);

  const [cadastroForm, setCadastroForm] = useState<Record<CadastroCampos, string>>({
    nome: '',
    email: '',
    senha: '',
  });
  const [cadastroErros, setCadastroErros] = useState<Partial<Record<CadastroCampos, string>>>({});
  const [cadastrando, setCadastrando] = useState(false);
  const [cadastroErro, setCadastroErro] = useState<string | null>(null);

  function selecionarAba(nova: Aba) {
    setAba(nova);
    setLoginErro(null);
    setCadastroErro(null);
  }

  async function entrar() {
    // Espaços nas pontas do email (comuns no autocompletar do teclado) são descartados.
    const erros = validarFormulario({ ...loginForm, email: loginForm.email.trim() }, loginSchema);
    setLoginErros(erros);
    if (Object.keys(erros).length > 0) {
      return;
    }
    setEntrando(true);
    setLoginErro(null);
    try {
      await login(loginForm.email.trim(), loginForm.senha);
      // Sucesso: o RootNavigator troca para a área do perfil do usuário.
    } catch (error) {
      setLoginErro(mensagemErroLogin(error));
      setEntrando(false);
    }
  }

  async function criarConta() {
    const erros = validarFormulario(
      { ...cadastroForm, email: cadastroForm.email.trim() },
      cadastroSchema,
    );
    setCadastroErros(erros);
    if (Object.keys(erros).length > 0) {
      return;
    }
    setCadastrando(true);
    setCadastroErro(null);
    try {
      await cadastrar({
        nome: cadastroForm.nome.trim(),
        email: cadastroForm.email.trim(),
        senha: cadastroForm.senha,
      });
    } catch (error) {
      setCadastrando(false);
      if (error instanceof CadastroSemLoginError) {
        // Como no Angular: a conta existe, então volta para a aba Login com o aviso.
        setAba('login');
        setLoginForm({ email: cadastroForm.email.trim(), senha: '' });
        setLoginErro(mensagemErroCadastro(error));
        return;
      }
      setCadastroErro(mensagemErroCadastro(error));
    }
  }

  function alterarLogin(campo: LoginCampos, valor: string) {
    setLoginForm((atual) => ({ ...atual, [campo]: valor }));
    setLoginErros((atual) => ({ ...atual, [campo]: undefined }));
  }

  function alterarCadastro(campo: CadastroCampos, valor: string) {
    setCadastroForm((atual) => ({ ...atual, [campo]: valor }));
    setCadastroErros((atual) => ({ ...atual, [campo]: undefined }));
  }

  return (
    <LinearGradient colors={['#d7f2f5', colors.bg]} locations={[0, 0.45]} style={styles.fundo}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            testID="login-scroll"
          >
            <View style={styles.card}>
              <LinearGradient
                colors={gradients.hero.colors}
                start={gradients.hero.start}
                end={gradients.hero.end}
                style={styles.logo}
              >
                <Icon name="heart" size={26} color={colors.textInverse} />
              </LinearGradient>

              <View style={styles.tabs} accessibilityRole="tablist">
                <AbaBotao
                  label="Login"
                  ativa={aba === 'login'}
                  onPress={() => selecionarAba('login')}
                />
                <AbaBotao
                  label="Cadastrar"
                  ativa={aba === 'cadastro'}
                  onPress={() => selecionarAba('cadastro')}
                />
              </View>

              {aba === 'login' ? (
                <>
                  <Text style={styles.title} accessibilityRole="header">
                    Entrar
                  </Text>
                  <Text style={styles.subtitle}>Acesse sua conta</Text>

                  <View style={styles.form}>
                    <TextField
                      label="Email"
                      value={loginForm.email}
                      onChangeText={(v) => alterarLogin('email', v)}
                      error={loginErros.email}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="email"
                      textContentType="username"
                      returnKeyType="next"
                      submitBehavior="submit"
                      onSubmitEditing={() => loginSenhaRef.current?.focus()}
                      testID="login-email"
                    />
                    <TextField
                      ref={loginSenhaRef}
                      label="Senha"
                      value={loginForm.senha}
                      onChangeText={(v) => alterarLogin('senha', v)}
                      error={loginErros.senha}
                      secureTextEntry
                      autoCapitalize="none"
                      autoComplete="current-password"
                      textContentType="password"
                      returnKeyType="go"
                      onSubmitEditing={entrar}
                      testID="login-senha"
                    />

                    {loginErro ? (
                      <Text style={styles.erro} accessibilityRole="alert" testID="login-erro">
                        {loginErro}
                      </Text>
                    ) : null}

                    <Button
                      label={entrando ? 'Entrando...' : 'Entrar'}
                      onPress={entrar}
                      loading={entrando}
                      testID="login-entrar"
                    />
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.title} accessibilityRole="header">
                    Criar conta
                  </Text>
                  <Text style={styles.subtitle}>Cadastro de paciente</Text>

                  <View style={styles.form}>
                    <TextField
                      label="Nome"
                      value={cadastroForm.nome}
                      onChangeText={(v) => alterarCadastro('nome', v)}
                      error={cadastroErros.nome}
                      autoComplete="name"
                      returnKeyType="next"
                      submitBehavior="submit"
                      onSubmitEditing={() => cadastroEmailRef.current?.focus()}
                      testID="cadastro-nome"
                    />
                    <TextField
                      ref={cadastroEmailRef}
                      label="Email"
                      value={cadastroForm.email}
                      onChangeText={(v) => alterarCadastro('email', v)}
                      error={cadastroErros.email}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="email"
                      returnKeyType="next"
                      submitBehavior="submit"
                      onSubmitEditing={() => cadastroSenhaRef.current?.focus()}
                      testID="cadastro-email"
                    />
                    <TextField
                      ref={cadastroSenhaRef}
                      label="Senha"
                      value={cadastroForm.senha}
                      onChangeText={(v) => alterarCadastro('senha', v)}
                      error={cadastroErros.senha}
                      secureTextEntry
                      autoCapitalize="none"
                      autoComplete="new-password"
                      textContentType="newPassword"
                      returnKeyType="go"
                      onSubmitEditing={criarConta}
                      testID="cadastro-senha"
                    />

                    {cadastroErro ? (
                      <Text style={styles.erro} accessibilityRole="alert" testID="cadastro-erro">
                        {cadastroErro}
                      </Text>
                    ) : null}

                    <Button
                      label={cadastrando ? 'Criando conta...' : 'Cadastrar'}
                      onPress={criarConta}
                      loading={cadastrando}
                      testID="cadastro-enviar"
                    />
                  </View>
                </>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function AbaBotao({
  label,
  ativa,
  onPress,
}: {
  label: string;
  ativa: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: ativa }}
      onPress={onPress}
      style={[styles.tab, ativa && styles.tabAtiva]}
      testID={`aba-${label.toLowerCase()}`}
    >
      <Text style={[styles.tabTexto, ativa && styles.tabTextoAtiva]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fundo: { flex: 1 },
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.xxxl,
    paddingHorizontal: 28,
    ...shadows.card,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.bg,
    borderRadius: radius.pill,
    padding: spacing.xs,
    marginBottom: spacing.xl,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  tabAtiva: {
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  tabTexto: {
    fontFamily: fonts.semibold,
    fontSize: fontSizes.md,
    color: colors.textSecondary,
  },
  tabTextoAtiva: { color: colors.primary },
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
  erro: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    color: colors.danger,
  },
});
