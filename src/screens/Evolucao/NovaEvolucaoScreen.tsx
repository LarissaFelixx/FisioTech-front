import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/Button/Button';
import { ErrorState } from '../../components/ErrorState/ErrorState';
import { Icon } from '../../components/Icon/Icon';
import { Skeleton } from '../../components/Skeleton/Skeleton';
import { TextField } from '../../components/TextField/TextField';
import { useConsulta } from '../../hooks/useConsultas';
import { useCriarEvolucao } from '../../hooks/useEvolucoes';
import type { ProfissionalStackParamList } from '../../navigation/types';
import { colors, fontSizes, fonts, radius, spacing } from '../../theme';
import type { Consulta } from '../../types/consulta';
import {
  FORM_VAZIO,
  MAX_TEXTO,
  erroObservacoes,
  mensagemErroRegistrar,
  montarEvolucao,
  subtituloEvolucao,
  type EvolucaoForm,
} from './evolucaoLogic';

type Navigation = NativeStackNavigationProp<ProfissionalStackParamList, 'NovaEvolucao'>;
type Rota = RouteProp<ProfissionalStackParamList, 'NovaEvolucao'>;

/** Registro de uma evolução clínica a partir do prontuário da consulta. */
export function NovaEvolucaoScreen() {
  const { params } = useRoute<Rota>();
  const consulta = useConsulta(params.id);

  return (
    <SafeAreaView edges={['top']} style={styles.flex}>
      <VoltarProntuario />
      {consulta.isPending ? (
        <View style={styles.centro}>
          <Skeleton variant="form" count={4} />
        </View>
      ) : consulta.isError ? (
        <View style={styles.centro}>
          <ErrorState
            message="Não foi possível carregar a consulta."
            onRetry={() => void consulta.refetch()}
            retrying={consulta.isRefetching}
          />
        </View>
      ) : (
        <Formulario consulta={consulta.data} />
      )}
    </SafeAreaView>
  );
}

function VoltarProntuario() {
  const navigation = useNavigation<Navigation>();
  return (
    <Pressable
      onPress={() => navigation.goBack()}
      accessibilityRole="link"
      hitSlop={8}
      style={({ pressed }) => [styles.voltar, pressed && styles.pressed]}
      testID="evolucao-voltar"
    >
      <Icon name="chevron-left" size={18} color={colors.primary} />
      <Text style={styles.voltarTexto}>Prontuário</Text>
    </Pressable>
  );
}

function Formulario({ consulta }: { consulta: Consulta }) {
  const navigation = useNavigation<Navigation>();
  const criar = useCriarEvolucao();
  const [form, setForm] = useState<EvolucaoForm>(FORM_VAZIO);
  const [erroCampo, setErroCampo] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  function alterar(mudanca: Partial<EvolucaoForm>) {
    setForm((f) => ({ ...f, ...mudanca }));
  }

  async function registrar() {
    const erroValidacao = erroObservacoes(form);
    setErroCampo(erroValidacao);
    setErro(null);
    if (erroValidacao) {
      return;
    }
    try {
      await criar.mutateAsync({
        pacienteId: consulta.pacienteId,
        request: montarEvolucao(consulta.id, form),
      });
      navigation.goBack();
    } catch (e) {
      setErro(mensagemErroRegistrar(e));
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.cabecalho}>
          <Text style={styles.titulo} accessibilityRole="header">
            Nova evolução
          </Text>
          <Text style={styles.subtitulo} testID="evolucao-subtitulo">
            {subtituloEvolucao(consulta)}
          </Text>
        </View>

        <TextField
          label="Observações"
          multiline
          numberOfLines={2}
          maxLength={MAX_TEXTO}
          value={form.observacoes}
          onChangeText={(v) => {
            alterar({ observacoes: v });
            setErroCampo(null);
          }}
          error={erroCampo}
          testID="evolucao-observacoes"
        />
        <TextField
          label="Procedimentos"
          placeholder="Técnicas e exercícios aplicados"
          multiline
          numberOfLines={2}
          maxLength={MAX_TEXTO}
          value={form.procedimentos}
          onChangeText={(v) => alterar({ procedimentos: v })}
          testID="evolucao-procedimentos"
        />
        <TextField
          label="Resposta do paciente"
          placeholder="Como o paciente respondeu"
          multiline
          numberOfLines={2}
          maxLength={MAX_TEXTO}
          value={form.respostaPaciente}
          onChangeText={(v) => alterar({ respostaPaciente: v })}
          testID="evolucao-resposta"
        />
        <TextField
          label="Conduta"
          placeholder="Próximos passos"
          multiline
          numberOfLines={2}
          maxLength={MAX_TEXTO}
          value={form.conduta}
          onChangeText={(v) => alterar({ conduta: v })}
          testID="evolucao-conduta"
        />

        <View style={styles.visivel}>
          <Text style={styles.visivelTexto}>Visível para o paciente</Text>
          <Switch
            value={form.visivelPaciente}
            onValueChange={(v) => alterar({ visivelPaciente: v })}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.surface}
            ios_backgroundColor={colors.border}
            accessibilityLabel="Visível para o paciente"
            testID="evolucao-visivel"
          />
        </View>

        {erro ? (
          <Text style={styles.erro} accessibilityRole="alert" testID="evolucao-erro">
            {erro}
          </Text>
        ) : null}
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.rodape}>
        <Button
          label={criar.isPending ? 'Registrando...' : 'Registrar evolução'}
          onPress={() => void registrar()}
          loading={criar.isPending}
          testID="evolucao-registrar"
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  centro: { flex: 1, padding: spacing.xl },
  voltar: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xxs,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs,
  },
  voltarTexto: { fontFamily: fonts.semibold, fontSize: fontSizes.md, color: colors.primary },
  pressed: { opacity: 0.7 },
  content: { padding: spacing.xl, paddingTop: spacing.sm, gap: spacing.lg },
  cabecalho: { gap: spacing.xxs },
  titulo: {
    fontFamily: fonts.extrabold,
    fontSize: fontSizes.xxl,
    letterSpacing: -0.5,
    color: colors.text,
  },
  subtitulo: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.textSecondary },
  visivel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: 14,
  },
  visivelTexto: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: fontSizes.base,
    color: colors.text,
  },
  erro: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.danger },
  // Mesma margem lateral do formulário: o botão ocupa a largura disponível, sem passar da tela.
  rodape: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.bg,
  },
});
