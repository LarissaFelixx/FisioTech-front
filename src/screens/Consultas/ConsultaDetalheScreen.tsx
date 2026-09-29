import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components/Button/Button';
import { useConfirm } from '../../components/ConfirmDialog/ConfirmDialog';
import { ErrorState } from '../../components/ErrorState/ErrorState';
import { Skeleton } from '../../components/Skeleton/Skeleton';
import { StatusBadge } from '../../components/StatusBadge/StatusBadge';
import { useAvaliacaoDaConsulta } from '../../hooks/useAvaliacoes';
import { useConsulta, useDeletarConsulta } from '../../hooks/useConsultas';
import { useRefetchOnFocus } from '../../hooks/useRefetchOnFocus';
import type { ProfissionalStackParamList } from '../../navigation/types';
import { colors, fontSizes, fonts, radius, shadows, spacing } from '../../theme';
import type { Consulta } from '../../types/consulta';
import { formatDiaMesHora, parseDataHora } from '../../utils/date';
import { formatMoeda } from '../../utils/moeda';
import {
  estrelas,
  mensagemErroExcluirConsulta,
  secoesProntuario,
  tipoLabel,
} from './consultaLogic';

type Navigation = NativeStackNavigationProp<ProfissionalStackParamList, 'ConsultaDetalhe'>;
type Rota = RouteProp<ProfissionalStackParamList, 'ConsultaDetalhe'>;

/** Origem: `features/consultas/consulta-detail` (prontuário da consulta). */
export function ConsultaDetalheScreen() {
  const { params } = useRoute<Rota>();
  const consulta = useConsulta(params.id);
  useRefetchOnFocus(consulta.refetch);

  if (consulta.isPending) {
    return (
      <View style={styles.centro}>
        <Skeleton variant="lines" count={5} />
      </View>
    );
  }
  if (consulta.isError) {
    return (
      <View style={styles.centro}>
        <ErrorState
          message="Não foi possível carregar a consulta."
          onRetry={() => void consulta.refetch()}
          retrying={consulta.isRefetching}
        />
      </View>
    );
  }
  return (
    <Prontuario
      consulta={consulta.data}
      atualizando={consulta.isRefetching}
      onAtualizar={() => void consulta.refetch()}
    />
  );
}

function Prontuario(props: { consulta: Consulta; atualizando: boolean; onAtualizar: () => void }) {
  const { consulta: c } = props;
  const navigation = useNavigation<Navigation>();
  const confirmar = useConfirm();
  const deletar = useDeletarConsulta();
  const [erro, setErro] = useState<string | null>(null);
  const realizada = c.status === 'REALIZADA';
  const avaliacao = useAvaliacaoDaConsulta(c.id, { enabled: realizada });

  async function excluir() {
    const confirmado = await confirmar({
      titulo: 'Excluir consulta',
      mensagem: 'Excluir esta consulta? Essa ação não pode ser desfeita.',
      confirmarLabel: 'Excluir',
    });
    if (!confirmado) {
      return;
    }
    setErro(null);
    try {
      await deletar.mutateAsync(c.id);
      navigation.goBack();
    } catch (e) {
      setErro(mensagemErroExcluirConsulta(e));
    }
  }

  const meta = [
    { rotulo: 'Data', valor: formatDiaMesHora(parseDataHora(c.dataHora)) },
    { rotulo: 'Modalidade', valor: tipoLabel(c.tipo) },
    { rotulo: 'Convênio', valor: c.convenio ?? 'Particular' },
    { rotulo: 'Valor', valor: c.valor !== null ? formatMoeda(c.valor) : '—', destaque: true },
  ];

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={props.atualizando}
          onRefresh={props.onAtualizar}
          colors={[colors.primary]}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.paciente} accessibilityRole="header" testID="consulta-detalhe-paciente">
          {c.pacienteNome}
        </Text>
        <StatusBadge status={c.status} />
      </View>

      <View style={styles.meta}>
        {meta.map((m) => (
          <View key={m.rotulo} style={styles.metaItem}>
            <Text style={styles.metaRotulo}>{m.rotulo}</Text>
            <Text style={[styles.metaValor, m.destaque && styles.metaDestaque]}>{m.valor}</Text>
          </View>
        ))}
      </View>

      {!realizada ? (
        <Button
          label="Continuar preenchimento clínico"
          onPress={() => navigation.navigate('ConsultaWizard', { id: c.id })}
          testID="consulta-continuar-registro"
        />
      ) : null}

      {secoesProntuario(c).map((secao) => (
        <View key={secao.titulo} style={styles.secao} testID={`secao-${secao.titulo}`}>
          <Text style={styles.secaoTitulo}>{secao.titulo}</Text>
          {secao.linhas.map((l) => (
            <Text key={l.rotulo} style={styles.linha}>
              <Text style={styles.rotulo}>{l.rotulo}: </Text>
              {l.valor}
            </Text>
          ))}
        </View>
      ))}

      {realizada && !avaliacao.isPending ? (
        <View style={styles.secao} testID="consulta-avaliacao">
          <Text style={styles.secaoTitulo}>Avaliação do paciente</Text>
          {avaliacao.isError ? (
            <Text style={styles.dica}>Não foi possível carregar a avaliação.</Text>
          ) : avaliacao.data ? (
            <>
              <Text style={styles.nota} accessibilityLabel={`Nota ${avaliacao.data.nota} de 5`}>
                {estrelas(avaliacao.data.nota)}
              </Text>
              {avaliacao.data.comentario ? (
                <Text style={styles.linha}>{avaliacao.data.comentario}</Text>
              ) : null}
            </>
          ) : (
            <Text style={styles.dica}>O paciente ainda não avaliou esta consulta.</Text>
          )}
        </View>
      ) : null}

      {erro ? (
        <Text style={styles.erro} accessibilityRole="alert" testID="consulta-detalhe-erro">
          {erro}
        </Text>
      ) : null}

      <Pressable
        onPress={() => void excluir()}
        disabled={deletar.isPending}
        accessibilityRole="button"
        style={({ pressed }) => [styles.excluir, pressed && styles.pressed]}
        testID="consulta-excluir"
      >
        <Text style={styles.excluirTexto}>
          {deletar.isPending ? 'Excluindo...' : 'Excluir Consulta'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  centro: { flex: 1, backgroundColor: colors.bg, padding: spacing.xl },
  content: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.xxxl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  paciente: {
    flex: 1,
    fontFamily: fonts.extrabold,
    fontSize: fontSizes.xxl,
    letterSpacing: -0.5,
    color: colors.text,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    rowGap: spacing.lg,
    ...shadows.card,
  },
  metaItem: { width: '50%', gap: 2 },
  metaRotulo: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xs,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textTertiary,
  },
  metaValor: { fontFamily: fonts.semibold, fontSize: fontSizes.base, color: colors.text },
  metaDestaque: { color: colors.primary, fontFamily: fonts.bold },
  secao: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.card,
  },
  secaoTitulo: { fontFamily: fonts.bold, fontSize: fontSizes.lg, color: colors.text },
  linha: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.base,
    color: colors.text,
    lineHeight: 22,
  },
  rotulo: { fontFamily: fonts.semibold },
  nota: { fontSize: 20, color: colors.estrela, letterSpacing: 2 },
  dica: { fontFamily: fonts.regular, fontSize: fontSizes.md, color: colors.textSecondary },
  erro: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.danger },
  excluir: {
    paddingVertical: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.danger,
    alignItems: 'center',
  },
  excluirTexto: { fontFamily: fonts.bold, fontSize: fontSizes.md, color: colors.danger },
  pressed: { opacity: 0.7 },
});
