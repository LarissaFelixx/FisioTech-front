import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackLink } from '../../components/BackLink/BackLink';
import { Button } from '../../components/Button/Button';
import { ErrorState } from '../../components/ErrorState/ErrorState';
import { Skeleton } from '../../components/Skeleton/Skeleton';
import { SwitchCard } from '../../components/SwitchCard/SwitchCard';
import { TextField } from '../../components/TextField/TextField';
import { usePlanos, useRevisarPlano } from '../../hooks/usePlanos';
import type { ProfissionalStackParamList } from '../../navigation/types';
import { colors, fontSizes, fonts, spacing } from '../../theme';
import type { PlanoTerapeutico } from '../../types/plano';
import { clock } from '../../utils/clock';
import { mascararData } from '../../utils/date';
import {
  MAX_TEXTO,
  MENSAGEM_ERRO_CARREGAR,
  formDoPlano,
  mensagemErroSalvar,
  montarPlano,
  planoParaPreencher,
  validarPlano,
  type ErrosPlano,
  type PlanoForm,
} from './planoLogic';

type Navigation = NativeStackNavigationProp<ProfissionalStackParamList, 'RevisarPlano'>;
type Rota = RouteProp<ProfissionalStackParamList, 'RevisarPlano'>;

/** Nova revisão do plano terapêutico do paciente, aberta pelo prontuário. */
export function RevisarPlanoScreen() {
  const { params } = useRoute<Rota>();
  const navigation = useNavigation<Navigation>();
  const planos = usePlanos(params.pacienteId);

  return (
    <SafeAreaView edges={['top']} style={styles.flex}>
      <BackLink label="Prontuário" onPress={() => navigation.goBack()} testID="plano-voltar" />
      {planos.isPending ? (
        <View style={styles.centro}>
          <Skeleton variant="form" count={4} />
        </View>
      ) : planos.isError ? (
        <View style={styles.centro}>
          <ErrorState
            message={MENSAGEM_ERRO_CARREGAR}
            onRetry={() => void planos.refetch()}
            retrying={planos.isRefetching}
          />
        </View>
      ) : (
        <Formulario pacienteId={params.pacienteId} atual={planoParaPreencher(planos.data)} />
      )}
    </SafeAreaView>
  );
}

function Formulario({ pacienteId, atual }: { pacienteId: number; atual: PlanoTerapeutico | null }) {
  const navigation = useNavigation<Navigation>();
  const revisar = useRevisarPlano();
  // Parte do plano lido ao abrir; não é refeito quando a lista é recarregada.
  const [form, setForm] = useState<PlanoForm>(() => formDoPlano(atual, clock.agora()));
  const [erros, setErros] = useState<ErrosPlano>({});
  const [erro, setErro] = useState<string | null>(null);

  function alterar<K extends keyof PlanoForm>(campo: K, valor: PlanoForm[K]) {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErros((e) => ({ ...e, [campo]: undefined }));
  }

  async function salvar() {
    const errosValidacao = validarPlano(form);
    setErros(errosValidacao);
    setErro(null);
    if (Object.keys(errosValidacao).length > 0) {
      return;
    }
    try {
      await revisar.mutateAsync({ pacienteId, request: montarPlano(form) });
      navigation.goBack();
    } catch (e) {
      setErro(mensagemErroSalvar(e));
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
            Revisar plano terapêutico
          </Text>
          <Text style={styles.subtitulo}>Ao salvar, a versão atual passa a ser substituída.</Text>
        </View>

        <TextField
          label="Objetivos"
          multiline
          numberOfLines={2}
          maxLength={MAX_TEXTO}
          value={form.objetivos}
          onChangeText={(v) => alterar('objetivos', v)}
          error={erros.objetivos}
          testID="plano-objetivos"
        />
        <TextField
          label="Condutas"
          multiline
          numberOfLines={2}
          maxLength={MAX_TEXTO}
          value={form.condutas}
          onChangeText={(v) => alterar('condutas', v)}
          error={erros.condutas}
          testID="plano-condutas"
        />
        <View style={styles.linha}>
          <View style={styles.coluna}>
            <TextField
              label="Início"
              placeholder="DD/MM/AAAA"
              keyboardType="number-pad"
              maxLength={10}
              value={form.dataInicio}
              onChangeText={(v) => alterar('dataInicio', mascararData(v))}
              error={erros.dataInicio}
              testID="plano-inicio"
            />
          </View>
          <View style={styles.coluna}>
            <TextField
              label="Previsão de término"
              placeholder="DD/MM/AAAA"
              keyboardType="number-pad"
              maxLength={10}
              value={form.dataFimPrevista}
              onChangeText={(v) => alterar('dataFimPrevista', mascararData(v))}
              error={erros.dataFimPrevista}
              testID="plano-fim"
            />
          </View>
        </View>

        <SwitchCard
          label="Visível para o paciente"
          value={form.visivelPaciente}
          onValueChange={(v) => alterar('visivelPaciente', v)}
          testID="plano-visivel"
        />

        {erro ? (
          <Text style={styles.erro} accessibilityRole="alert" testID="plano-erro">
            {erro}
          </Text>
        ) : null}
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.rodape}>
        <Button
          label={revisar.isPending ? 'Salvando...' : 'Salvar nova versão'}
          onPress={() => void salvar()}
          loading={revisar.isPending}
          testID="plano-salvar"
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  centro: { flex: 1, padding: spacing.xl },
  content: { padding: spacing.xl, paddingTop: spacing.sm, gap: spacing.lg },
  cabecalho: { gap: spacing.xxs },
  titulo: {
    fontFamily: fonts.extrabold,
    fontSize: fontSizes.xxl,
    letterSpacing: -0.5,
    color: colors.text,
  },
  subtitulo: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.textSecondary },
  linha: { flexDirection: 'row', gap: spacing.md },
  // Colunas de mesma largura, que encolhem em telas estreitas.
  coluna: { flex: 1, minWidth: 0 },
  erro: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.danger },
  // Mesma margem lateral do formulário: o botão ocupa a largura disponível, sem passar da tela.
  rodape: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.bg,
  },
});
