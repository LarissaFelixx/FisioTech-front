import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../../components/Button/Button';
import { ErrorState } from '../../../components/ErrorState/ErrorState';
import { OptionChips } from '../../../components/OptionChips/OptionChips';
import { Skeleton } from '../../../components/Skeleton/Skeleton';
import { TextField } from '../../../components/TextField/TextField';
import { useAuth } from '../../../hooks/useAuth';
import { useAtualizarMeuPerfil, useMeuPerfil } from '../../../hooks/useMe';
import { colors, fontSizes, fonts, shadows, spacing } from '../../../theme';
import type { Paciente } from '../../../types/paciente';
import { mascararData } from '../../../utils/date';
import { validarFormulario } from '../../../utils/validation';
import { SEXO_OPCOES } from '../../Pacientes/pacienteLogic';
import {
  MENSAGEM_PERFIL_SALVO,
  cadastradoEm,
  mensagemErroPerfil,
  montarPerfil,
  schemaPerfil,
  valoresDoPerfil,
  type PerfilCampos,
} from './perfilLogic';

/** Meu Perfil (#44, Figma "23 Meu Perfil"): aba Perfil do paciente. */
export function MeuPerfilScreen() {
  const perfil = useMeuPerfil();

  let conteudo;
  if (perfil.data) {
    conteudo = <FormPerfil key={perfil.data.id} perfil={perfil.data} />;
  } else if (perfil.isError) {
    conteudo = (
      <View style={styles.centro}>
        <ErrorState
          message="Não foi possível carregar seu perfil."
          onRetry={() => void perfil.refetch()}
          retrying={perfil.isRefetching}
        />
      </View>
    );
  } else {
    conteudo = (
      <View style={styles.centro}>
        <Skeleton variant="form" count={6} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {conteudo}
    </SafeAreaView>
  );
}

function FormPerfil({ perfil }: { perfil: Paciente }) {
  const atualizar = useAtualizarMeuPerfil();
  const { recarregarUsuario } = useAuth();
  const [valores, setValores] = useState(() => valoresDoPerfil(perfil));
  const [erros, setErros] = useState<Partial<Record<PerfilCampos, string>>>({});
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  function alterar(campo: PerfilCampos, valor: string) {
    setValores((a) => ({ ...a, [campo]: valor }));
    setErros((a) => ({ ...a, [campo]: undefined }));
    setSucesso(false);
  }

  async function salvar() {
    const novosErros = validarFormulario(valores, schemaPerfil);
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) {
      return;
    }
    setErro(null);
    setSucesso(false);
    try {
      await atualizar.mutateAsync(montarPerfil(valores, perfil));
      setSucesso(true);
      // Nome e email aparecem em outras telas (saudação, menu, troca de senha).
      await recarregarUsuario().catch(() => undefined);
    } catch (e) {
      setErro(mensagemErroPerfil(e));
    }
  }

  const campo = (nome: PerfilCampos) => ({
    value: valores[nome],
    onChangeText: (v: string) => alterar(nome, v),
    error: erros[nome],
    testID: `perfil-${nome}`,
  });

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View>
          <Text style={styles.titulo} accessibilityRole="header">
            Meu Perfil
          </Text>
          <Text style={styles.subtitulo}>{cadastradoEm(perfil)}</Text>
        </View>

        <View style={styles.campos}>
          <TextField label="Nome" autoCapitalize="words" {...campo('nome')} />
          <TextField
            label="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            {...campo('email')}
          />
          <TextField
            label="Nascimento"
            placeholder="DD/MM/AAAA"
            keyboardType="number-pad"
            maxLength={10}
            {...campo('dataNascimento')}
            onChangeText={(v) => alterar('dataNascimento', mascararData(v))}
          />
          <OptionChips
            label="Sexo"
            opcoes={SEXO_OPCOES}
            valor={valores.sexo}
            onChange={(v) => alterar('sexo', v)}
            testID="perfil-sexo"
          />
          <TextField label="Profissão" {...campo('profissao')} />
          <TextField label="Telefone" keyboardType="phone-pad" {...campo('telefone')} />
          <TextField label="Endereço" {...campo('endereco')} />
        </View>
      </ScrollView>

      {/* Retorno no rodapé, junto do botão: no fim do formulário ele ficaria fora da tela. */}
      <View style={styles.rodape} testID="perfil-rodape">
        {erro ? (
          <Text style={styles.erro} accessibilityRole="alert" testID="perfil-erro">
            {erro}
          </Text>
        ) : null}
        {sucesso ? (
          <Text style={styles.sucesso} accessibilityLiveRegion="polite" testID="perfil-sucesso">
            {MENSAGEM_PERFIL_SALVO}
          </Text>
        ) : null}
        <Button
          label={atualizar.isPending ? 'Salvando...' : 'Salvar'}
          onPress={() => void salvar()}
          loading={atualizar.isPending}
          testID="perfil-salvar"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  centro: { flex: 1, padding: spacing.xl },
  content: { padding: spacing.xl, gap: spacing.lg },
  titulo: {
    fontFamily: fonts.extrabold,
    fontSize: fontSizes.xxl,
    letterSpacing: -0.5,
    color: colors.text,
  },
  subtitulo: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.textSecondary },
  // No Figma os campos ficam direto sobre o fundo, sem cartão em volta.
  campos: { gap: spacing.lg },
  erro: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.danger },
  sucesso: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.success },
  rodape: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
});
