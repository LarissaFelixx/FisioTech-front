import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../../components/Button/Button';
import { TextField } from '../../../components/TextField/TextField';
import { VoltarLink } from '../../../components/VoltarLink/VoltarLink';
import { useAlterarSenha } from '../../../hooks/useAlterarSenha';
import { useAuth } from '../../../hooks/useAuth';
import { colors, fontSizes, fonts, shadows, spacing } from '../../../theme';
import {
  MENSAGEM_SENHA_ALTERADA,
  SENHA_VAZIA,
  mensagemErroSenha,
  validarSenha,
  type SenhaCampos,
} from './senhaLogic';

/**
 * Alterar Senha do paciente (#45, Figma "24 Alterar Senha (Pac.)"). O backend encerra todas as
 * sessões ao trocar a senha; o app entra de novo sozinho com a nova senha neste aparelho
 * (`useAlterarSenha`) e só manda para o login se esse novo login falhar.
 */
export function AlterarSenhaScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const alterar = useAlterarSenha();
  const [valores, setValores] = useState(SENHA_VAZIA);
  const [erros, setErros] = useState<Partial<Record<SenhaCampos, string>>>({});
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  function alterarCampo(campo: SenhaCampos, valor: string) {
    setValores((a) => ({ ...a, [campo]: valor }));
    setErros((a) => ({ ...a, [campo]: undefined }));
    setSucesso(false);
  }

  async function enviar() {
    const novosErros = validarSenha(valores);
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) {
      return;
    }
    setErro(null);
    try {
      const resultado = await alterar.mutateAsync({
        senhaAtual: valores.senhaAtual,
        novaSenha: valores.novaSenha,
      });
      if (resultado === 'relogado') {
        setValores(SENHA_VAZIA);
        setSucesso(true);
      }
      // 'deslogado': a sessão acabou e o app já voltou para o login.
    } catch (e) {
      setErro(mensagemErroSenha(e));
    }
  }

  const campo = (nome: SenhaCampos) => ({
    value: valores[nome],
    onChangeText: (v: string) => alterarCampo(nome, v),
    error: erros[nome],
    secureTextEntry: true,
    autoCapitalize: 'none' as const,
    autoCorrect: false,
    testID: `senha-${nome}`,
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <VoltarLink label="Home" onPress={() => navigation.goBack()} />
          <View>
            <Text style={styles.titulo} accessibilityRole="header">
              Alterar Senha
            </Text>
            <Text style={styles.subtitulo}>{user?.nome} · Paciente</Text>
          </View>

          <TextField label="Senha atual" autoComplete="current-password" {...campo('senhaAtual')} />
          <TextField label="Nova senha" autoComplete="new-password" {...campo('novaSenha')} />
          <TextField
            label="Confirmar nova senha"
            autoComplete="new-password"
            {...campo('confirmarNovaSenha')}
          />

          <Text style={styles.aviso}>
            Por segurança, ao alterar a senha você sai de todos os outros dispositivos e precisa
            entrar novamente neles.
          </Text>

          {erro ? (
            <Text style={styles.erro} accessibilityRole="alert" testID="senha-erro">
              {erro}
            </Text>
          ) : null}
          {sucesso ? (
            <Text style={styles.sucesso} accessibilityLiveRegion="polite" testID="senha-sucesso">
              {MENSAGEM_SENHA_ALTERADA}
            </Text>
          ) : null}
        </ScrollView>

        <View style={styles.rodape}>
          <Button
            label={alterar.isPending ? 'Alterando...' : 'Alterar Senha'}
            onPress={() => void enviar()}
            loading={alterar.isPending}
            testID="senha-enviar"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  content: { padding: spacing.xl, gap: spacing.lg },
  titulo: {
    fontFamily: fonts.extrabold,
    fontSize: fontSizes.xxl,
    letterSpacing: -0.5,
    color: colors.text,
  },
  subtitulo: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.textSecondary },
  aviso: { fontFamily: fonts.regular, fontSize: fontSizes.xs, color: colors.textTertiary },
  erro: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.danger },
  sucesso: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.success },
  rodape: {
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
});
