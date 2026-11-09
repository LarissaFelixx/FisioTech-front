import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/Button/Button';
import { ErrorState } from '../../components/ErrorState/ErrorState';
import { Skeleton } from '../../components/Skeleton/Skeleton';
import { VoltarLink } from '../../components/VoltarLink/VoltarLink';
import { useConsulta, useConsultas } from '../../hooks/useConsultas';
import { useEvolucoes } from '../../hooks/useEvolucoes';
import { usePlanos } from '../../hooks/usePlanos';
import { useRefetchOnFocus } from '../../hooks/useRefetchOnFocus';
import type { ProfissionalStackParamList } from '../../navigation/types';
import { colors, fontSizes, fonts, radius, shadows, spacing, statusColors } from '../../theme';
import type { Consulta } from '../../types/consulta';
import type { EvolucaoClinica, PlanoTerapeutico } from '../../types/prontuario';
import { detalhesEvolucao } from '../Paciente/Tratamento/tratamentoLogic';
import { planoParaPreencher } from '../Plano/planoLogic';
import {
  AVISOS,
  MENSAGEM_ERRO_CARREGAR,
  MENSAGEM_PACIENTE_NAO_ENCONTRADO,
  MENSAGEM_SEM_EVOLUCOES,
  MENSAGEM_SEM_PLANO,
  cabecalhoEvolucao,
  consultasPorId,
  pacienteNaoEncontrado,
  rodapePlano,
  seloEvolucao,
  seloPlano,
  versoesAnteriores,
  type AvisoProntuario,
} from './prontuarioLogic';

type Navigation = NativeStackNavigationProp<ProfissionalStackParamList, 'Prontuario'>;
type Rota = RouteProp<ProfissionalStackParamList, 'Prontuario'>;

/**
 * Prontuário do paciente (S5-07, Figma "P1 Prontuário"), aberto pela consulta realizada: plano
 * terapêutico em vigor com as versões anteriores e o histórico de evoluções.
 */
export function ProntuarioScreen() {
  const { params } = useRoute<Rota>();
  const navigation = useNavigation<Navigation>();
  const consulta = useConsulta(params.id);

  let conteudo;
  if (consulta.isPending) {
    conteudo = (
      <View style={styles.centro}>
        <Skeleton variant="lines" count={6} />
      </View>
    );
  } else if (consulta.isError) {
    conteudo = (
      <View style={styles.centro}>
        <ErrorState
          message={MENSAGEM_ERRO_CARREGAR}
          onRetry={() => void consulta.refetch()}
          retrying={consulta.isRefetching}
        />
      </View>
    );
  } else {
    conteudo = <Conteudo consulta={consulta.data} aviso={params.aviso} />;
  }

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.voltar}>
        <VoltarLink
          label="Consulta"
          onPress={() => navigation.goBack()}
          testID="prontuario-voltar"
        />
      </View>
      {conteudo}
    </SafeAreaView>
  );
}

function Conteudo({ consulta, aviso }: { consulta: Consulta; aviso?: AvisoProntuario }) {
  const navigation = useNavigation<Navigation>();
  const planos = usePlanos(consulta.pacienteId);
  const evolucoes = useEvolucoes(consulta.pacienteId);
  // Só para o horário da consulta no cabeçalho das evoluções; se falhar, usa a data do registro.
  const consultas = useConsultas(consulta.pacienteId);
  const atualizar = () => {
    void planos.refetch();
    void evolucoes.refetch();
    void consultas.refetch();
  };
  useRefetchOnFocus(atualizar);

  let corpo;
  if (planos.isPending || evolucoes.isPending) {
    corpo = <Skeleton variant="lines" count={6} />;
  } else if (planos.isError || evolucoes.isError) {
    const naoEncontrado =
      pacienteNaoEncontrado(planos.error) || pacienteNaoEncontrado(evolucoes.error);
    corpo = (
      <ErrorState
        message={naoEncontrado ? MENSAGEM_PACIENTE_NAO_ENCONTRADO : MENSAGEM_ERRO_CARREGAR}
        onRetry={naoEncontrado ? undefined : atualizar}
        retrying={planos.isRefetching || evolucoes.isRefetching}
      />
    );
  } else {
    const atual = planoParaPreencher(planos.data);
    const mapa = consultasPorId(consultas.data);
    corpo = (
      <>
        {atual ? (
          <CartaoPlano plano={atual} destaque />
        ) : (
          <Text style={styles.vazio} testID="prontuario-sem-plano">
            {MENSAGEM_SEM_PLANO}
          </Text>
        )}
        <VersoesAnteriores versoes={versoesAnteriores(planos.data, atual)} />

        <View style={styles.secao}>
          <Text style={styles.secaoTitulo} accessibilityRole="header">
            Evoluções
          </Text>
          {evolucoes.data.length === 0 ? (
            <Text style={styles.vazio} testID="prontuario-sem-evolucoes">
              {MENSAGEM_SEM_EVOLUCOES}
            </Text>
          ) : (
            evolucoes.data.map((e) => (
              <CartaoEvolucao key={e.id} evolucao={e} cabecalho={cabecalhoEvolucao(e, mapa)} />
            ))
          )}
        </View>
      </>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={planos.isRefetching || evolucoes.isRefetching}
            onRefresh={atualizar}
            colors={[colors.primary]}
          />
        }
      >
        <View>
          <Text style={styles.titulo} accessibilityRole="header">
            Prontuário
          </Text>
          <Text style={styles.subtitulo} testID="prontuario-paciente">
            {consulta.pacienteNome}
          </Text>
        </View>
        {aviso ? (
          <Text style={styles.sucesso} accessibilityLiveRegion="polite" testID="prontuario-aviso">
            {AVISOS[aviso]}
          </Text>
        ) : null}
        {corpo}
      </ScrollView>

      <View style={styles.acoes}>
        <View style={styles.acao}>
          <Button
            label="Revisar plano"
            variant="secondary"
            onPress={() =>
              navigation.navigate('RevisarPlano', {
                pacienteId: consulta.pacienteId,
                consultaId: consulta.id,
              })
            }
            testID="prontuario-revisar-plano"
          />
        </View>
        <View style={styles.acao}>
          <Button
            label="Nova evolução"
            onPress={() => navigation.navigate('NovaEvolucao', { id: consulta.id })}
            testID="prontuario-nova-evolucao"
          />
        </View>
      </View>
    </>
  );
}

function CartaoPlano({
  plano: p,
  destaque = false,
}: {
  plano: PlanoTerapeutico;
  destaque?: boolean;
}) {
  const ativo = p.status === 'ATIVO';
  return (
    <View style={[styles.card, !destaque && styles.cardVersao]} testID={`plano-${p.id}`}>
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
          {seloPlano(p)}
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
      <Text style={styles.rodape}>{rodapePlano(p)}</Text>
    </View>
  );
}

/** Revisões substituídas, recolhidas por padrão (o Figma só mostra a versão em vigor). */
function VersoesAnteriores({ versoes }: { versoes: PlanoTerapeutico[] }) {
  const [aberto, setAberto] = useState(false);
  if (versoes.length === 0) {
    return null;
  }
  const rotulo =
    versoes.length === 1 ? '1 versão anterior' : `${versoes.length} versões anteriores`;
  return (
    <View style={styles.secao}>
      <Pressable
        onPress={() => setAberto((a) => !a)}
        accessibilityRole="button"
        accessibilityState={{ expanded: aberto }}
        style={({ pressed }) => [styles.alternar, pressed && styles.pressed]}
        testID="prontuario-versoes"
      >
        <Text style={styles.alternarTexto}>{aberto ? `Ocultar ${rotulo}` : `Ver ${rotulo}`}</Text>
      </Pressable>
      {aberto ? versoes.map((p) => <CartaoPlano key={p.id} plano={p} />) : null}
    </View>
  );
}

function CartaoEvolucao({
  evolucao: e,
  cabecalho,
}: {
  evolucao: EvolucaoClinica;
  cabecalho: string;
}) {
  return (
    <View style={styles.card} testID={`evolucao-${e.id}`}>
      <View style={styles.cardTopo}>
        <Text style={styles.cardTitulo}>{cabecalho}</Text>
        <Text
          style={[
            styles.selo,
            e.visivelPaciente
              ? { backgroundColor: statusColors.confirmada.bg, color: statusColors.confirmada.fg }
              : { backgroundColor: statusColors.agendada.bg, color: statusColors.agendada.fg },
          ]}
        >
          {seloEvolucao(e)}
        </Text>
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
  flex: { flex: 1, backgroundColor: colors.bg },
  voltar: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  centro: { flex: 1, padding: spacing.xl },
  content: { padding: spacing.xl, paddingTop: spacing.sm, gap: spacing.lg },
  titulo: {
    fontFamily: fonts.extrabold,
    fontSize: fontSizes.xxl,
    letterSpacing: -0.5,
    color: colors.text,
  },
  subtitulo: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.textSecondary },
  sucesso: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.success },
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
  cardVersao: { opacity: 0.85 },
  cardTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardTitulo: {
    flexShrink: 1,
    fontFamily: fonts.bold,
    fontSize: fontSizes.base,
    color: colors.text,
  },
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
  alternar: { alignSelf: 'flex-start', paddingVertical: spacing.xs },
  alternarTexto: { fontFamily: fonts.semibold, fontSize: fontSizes.sm, color: colors.primary },
  pressed: { opacity: 0.7 },
  acoes: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.bg,
  },
  acao: { flex: 1 },
});
