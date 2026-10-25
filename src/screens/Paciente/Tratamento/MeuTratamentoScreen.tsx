import { useNavigation } from '@react-navigation/native';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorState } from '../../../components/ErrorState/ErrorState';
import { Skeleton } from '../../../components/Skeleton/Skeleton';
import { VoltarLink } from '../../../components/VoltarLink/VoltarLink';
import { useMeusPlanos, useMinhasEvolucoes } from '../../../hooks/useMe';
import { useRefetchOnFocus } from '../../../hooks/useRefetchOnFocus';
import { colors, fontSizes, fonts, radius, shadows, spacing, statusColors } from '../../../theme';
import type { EvolucaoClinica, PlanoTerapeutico } from '../../../types/prontuario';
import {
  MENSAGEM_SEM_REGISTROS,
  STATUS_PLANO,
  dataEvolucao,
  detalhesEvolucao,
  periodoPlano,
  planosAtuais,
} from './tratamentoLogic';

/** Meu Tratamento (#47, Figma "T1 Meu Tratamento"): plano terapêutico e evoluções. */
export function MeuTratamentoScreen() {
  const navigation = useNavigation();
  const planos = useMeusPlanos();
  const evolucoes = useMinhasEvolucoes();
  const atualizar = () => {
    void planos.refetch();
    void evolucoes.refetch();
  };
  useRefetchOnFocus(atualizar);

  let conteudo;
  if (planos.isPending || evolucoes.isPending) {
    conteudo = <Skeleton variant="lines" count={6} />;
  } else if (planos.isError || evolucoes.isError) {
    conteudo = (
      <ErrorState
        message="Não foi possível carregar seu tratamento."
        onRetry={atualizar}
        retrying={planos.isRefetching || evolucoes.isRefetching}
      />
    );
  } else {
    const atuais = planosAtuais(planos.data);
    conteudo =
      atuais.length === 0 && evolucoes.data.length === 0 ? (
        <Text style={styles.vazio}>{MENSAGEM_SEM_REGISTROS}</Text>
      ) : (
        <>
          {atuais.map((p) => (
            <CartaoPlano key={p.id} plano={p} />
          ))}
          {evolucoes.data.length > 0 ? (
            <View style={styles.secao}>
              <Text style={styles.secaoTitulo}>Evoluções</Text>
              {evolucoes.data.map((e) => (
                <CartaoEvolucao key={e.id} evolucao={e} />
              ))}
            </View>
          ) : null}
        </>
      );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={planos.isRefetching || evolucoes.isRefetching}
            onRefresh={atualizar}
            colors={[colors.primary]}
          />
        }
      >
        <VoltarLink label="Home" onPress={() => navigation.goBack()} />
        <View>
          <Text style={styles.titulo} accessibilityRole="header">
            Meu tratamento
          </Text>
          <Text style={styles.subtitulo}>
            Registros que sua fisioterapeuta compartilhou com você
          </Text>
        </View>
        {conteudo}
      </ScrollView>
    </SafeAreaView>
  );
}

function CartaoPlano({ plano: p }: { plano: PlanoTerapeutico }) {
  const ativo = p.status === 'ATIVO';
  return (
    <View style={styles.card} testID={`plano-${p.id}`}>
      <View style={styles.cardTopo}>
        <Text style={styles.cardTitulo}>Plano terapêutico</Text>
        <Text
          style={[
            styles.selo,
            ativo
              ? { backgroundColor: statusColors.confirmada.bg, color: statusColors.confirmada.fg }
              : { backgroundColor: statusColors.agendada.bg, color: statusColors.agendada.fg },
          ]}
        >
          {STATUS_PLANO[p.status]}
        </Text>
      </View>
      <View style={styles.bloco}>
        <Text style={styles.rotulo}>Objetivos</Text>
        <Text style={styles.texto}>{p.objetivos}</Text>
      </View>
      <View style={styles.bloco}>
        <Text style={styles.rotulo}>Condutas</Text>
        <Text style={styles.texto}>{p.condutas}</Text>
      </View>
      <Text style={styles.rodape}>{periodoPlano(p)}</Text>
    </View>
  );
}

function CartaoEvolucao({ evolucao: e }: { evolucao: EvolucaoClinica }) {
  return (
    <View style={styles.card} testID={`evolucao-${e.id}`}>
      <View style={styles.cardTopo}>
        <Text style={styles.cardTitulo}>{dataEvolucao(e)}</Text>
        <Text style={styles.profissional}>{e.profissionalNome}</Text>
      </View>
      <Text style={styles.texto}>{e.observacoes}</Text>
      {detalhesEvolucao(e).map((l) => (
        <Text key={l.rotulo} style={styles.texto}>
          <Text style={styles.negrito}>{l.rotulo}: </Text>
          {l.valor}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, gap: spacing.lg },
  titulo: {
    fontFamily: fonts.extrabold,
    fontSize: fontSizes.xxl,
    letterSpacing: -0.5,
    color: colors.text,
  },
  subtitulo: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.textSecondary },
  vazio: { fontFamily: fonts.regular, fontSize: fontSizes.md, color: colors.textSecondary },
  secao: { gap: spacing.md },
  secaoTitulo: { fontFamily: fonts.bold, fontSize: fontSizes.base, color: colors.text },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.card,
  },
  cardTopo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitulo: { fontFamily: fonts.bold, fontSize: fontSizes.base, color: colors.text },
  selo: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xs,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  bloco: { gap: 2 },
  rotulo: { fontFamily: fonts.semibold, fontSize: fontSizes.xs, color: colors.textSecondary },
  texto: { fontFamily: fonts.regular, fontSize: fontSizes.md, color: colors.text, lineHeight: 20 },
  negrito: { fontFamily: fonts.bold },
  rodape: { fontFamily: fonts.regular, fontSize: fontSizes.xs, color: colors.textTertiary },
  profissional: { fontFamily: fonts.regular, fontSize: fontSizes.xs, color: colors.textTertiary },
});
