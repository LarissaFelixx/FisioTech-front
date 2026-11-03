import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../../components/Button/Button';
import { TextField } from '../../../components/TextField/TextField';
import { useAlterarSenha } from '../../../hooks/useAlterarSenha';
import { useAuth } from '../../../hooks/useAuth';
import { colors, fontSizes, fonts, radius, spacing } from '../../../theme';
import { ROLES } from '../../../types/auth';
import { mensagemDeErro } from '../../../utils/mensagensErro';
import { maximo, minimo, obrigatorio, validarFormulario } from '../../../utils/validation';

const VAZIO = { senhaAtual: '', novaSenha: '', confirmacao: '' };
type Campo = keyof typeof VAZIO;

export function AlterarSenhaPacienteScreen() {
  const { status, user } = useAuth();
  if (status !== 'signedIn' || user?.role !== ROLES.paciente) {
    return <Text>Acesso exclusivo para pacientes.</Text>;
  }
  return <FormularioSenha key={user.id} />;
}

function FormularioSenha() {
  const { mutateAsync, isPending, reset } = useAlterarSenha();
  const [valores, setValores] = useState(VAZIO);
  const [erros, setErros] = useState<Partial<Record<Campo, string>>>({});
  const [mensagem, setMensagem] = useState<{ sucesso: boolean; texto: string } | null>(null);
  const enviando = useRef(false);

  async function salvar() {
    if (enviando.current) {
      return;
    }
    setMensagem(null);
    const validacao = validarFormulario(valores, {
      senhaAtual: [obrigatorio],
      novaSenha: [obrigatorio, minimo(8), maximo(100)],
      confirmacao: [
        obrigatorio,
        (valor) => (valor === valores.novaSenha ? null : 'As senhas devem ser iguais.'),
      ],
    });
    setErros(validacao);
    if (Object.keys(validacao).length > 0) {
      return;
    }

    enviando.current = true;
    try {
      const resultado = await mutateAsync({
        senhaAtual: valores.senhaAtual,
        novaSenha: valores.novaSenha,
      });
      setValores(VAZIO);
      if (resultado === 'relogado') {
        setMensagem({ sucesso: true, texto: 'Senha alterada com sucesso.' });
      }
    } catch (error) {
      setMensagem({
        sucesso: false,
        texto: mensagemDeErro(
          error,
          {
            400: 'Confira a senha atual e os requisitos da nova senha.',
            403: 'Você não tem permissão para alterar esta senha.',
          },
          'Não foi possível alterar a senha. Tente novamente.',
        ),
      });
    } finally {
      reset();
      enviando.current = false;
    }
  }

  const campo = (nome: Campo) => ({
    value: valores[nome],
    error: erros[nome],
    onChangeText: (valor: string) => {
      setValores((atual) => ({ ...atual, [nome]: valor }));
      setErros({});
      setMensagem(null);
    },
    secureTextEntry: true,
    autoCapitalize: 'none' as const,
    autoCorrect: false,
    editable: !isPending,
    testID: `paciente-senha-${nome}`,
  });

  return (
    <SafeAreaView style={styles.flex} edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <TextField
              label="Senha atual"
              autoComplete="current-password"
              {...campo('senhaAtual')}
            />
            <TextField
              label="Nova senha"
              autoComplete="new-password"
              maxLength={100}
              {...campo('novaSenha')}
            />
            <TextField
              label="Confirmar nova senha"
              autoComplete="new-password"
              maxLength={100}
              {...campo('confirmacao')}
            />
            <Text style={styles.hint}>
              Use de 8 a 100 caracteres. A alteração encerra as sessões em outros dispositivos.
            </Text>
            {mensagem ? (
              <Text
                accessibilityRole="alert"
                style={mensagem.sucesso ? styles.success : styles.error}
              >
                {mensagem.texto}
              </Text>
            ) : null}
            <Button
              label="Alterar senha"
              loading={isPending}
              onPress={() => void salvar()}
              testID="paciente-senha-salvar"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: radius.md,
    gap: spacing.lg,
  },
  hint: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: fontSizes.sm },
  success: { color: colors.success, fontFamily: fonts.medium },
  error: { color: colors.danger, fontFamily: fonts.medium },
});
