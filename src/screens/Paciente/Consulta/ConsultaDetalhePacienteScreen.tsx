import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../../components/Button/Button';
import { useConfirm } from '../../../components/ConfirmDialog/ConfirmDialog';
import { ErrorState } from '../../../components/ErrorState/ErrorState';
import { Icon, type IconName } from '../../../components/Icon/Icon';
import { SeletorHorario } from '../../../components/SeletorHorario/SeletorHorario';
import { Skeleton } from '../../../components/Skeleton/Skeleton';
import { StatusBadge } from '../../../components/StatusBadge/StatusBadge';
import { VoltarLink } from '../../../components/VoltarLink/VoltarLink';
import {
  useCancelarConsulta,
  useDisponibilidade,
  useMinhaConsulta,
  useRemarcarConsulta,
} from '../../../hooks/useMe';
import { useRefetchOnFocus } from '../../../hooks/useRefetchOnFocus';
import type { PacienteStackParamList } from '../../../navigation/types';
import { colors, fontSizes, fonts, radius, shadows, spacing, statusColors } from '../../../theme';
import type { Consulta } from '../../../types/consulta';
import { clock } from '../../../utils/clock';
import { formatMoeda } from '../../../utils/moeda';
import {
  MENSAGEM_ERRO_CARREGAR,
  horaCurta,
  mensagemErroCancelar,
  mensagemErroRemarcar,
  metaConsulta,
  novaDataHora,
  podeAlterar,
  proximosDias,
  rotuloConfirmar,
  secoesClinicas,
  slotEscolhivel,
} from './consultaPacienteLogic';

type Rota = RouteProp<PacienteStackParamList, 'ConsultaDetalhe'>;

/** Consulta Detalhe do Paciente (#41, Figma "20 Consulta Detalhe (Pac.)"). */
export function ConsultaDetalhePacienteScreen() {
  const { params } = useRoute<Rota>();
  const navigation = useNavigation();
  const consulta = useMinhaConsulta(params.id);
  useRefetchOnFocus(consulta.refetch);

  let conteudo;
  if (consulta.data) {
    conteudo = (
      <Detalhe
        consulta={consulta.data}
        atualizando={consulta.isRefetching}
        onAtualizar={() => void consulta.refetch()}
      />
    );
  } else if (consulta.isError) {
    conteudo = (
      <View style={styles.content}>
        <ErrorState
          message={MENSAGEM_ERRO_CARREGAR}
          onRetry={() => void consulta.refetch()}
          retrying={consulta.isRefetching}
        />
      </View>
    );
  } else {
    conteudo = (
      <View style={styles.content}>
        <Skeleton variant="lines" count={6} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.topo}>
        <VoltarLink label="Minhas Consultas" onPress={() => navigation.goBack()} />
      </View>
      {conteudo}
    </SafeAreaView>
  );
}

function Detalhe(props: { consulta: Consulta; atualizando: boolean; onAtualizar: () => void }) {
  const { consulta: c } = props;
  const confirmar = useConfirm();
  const cancelar = useCancelarConsulta();
  const [erro, setErro] = useState<string | null>(null);
  const [remarcando, setRemarcando] = useState(false);
  const meta = metaConsulta(c);

  async function cancelarConsulta() {
    const confirmado = await confirmar({
      titulo: 'Cancelar consulta',
      mensagem: 'Cancelar esta consulta? Essa ação não pode ser desfeita.',
      cancelarLabel: 'Voltar',
      confirmarLabel: 'Cancelar consulta',
    });
    if (!confirmado) {
      return;
    }
    setErro(null);
    try {
      await cancelar.mutateAsync(c.id);
    } catch (e) {
      setErro(mensagemErroCancelar(e));
    }
  }

  const itensMeta: { icon: IconName; texto: string }[] = [
    { icon: 'calendar', texto: meta.data },
    { icon: 'clock', texto: meta.hora },
    { icon: c.tipo === 'ONLINE' ? 'monitor' : 'map-pin', texto: meta.modalidade },
  ];

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={props.atualizando}
          onRefresh={props.onAtualizar}
          colors={[colors.primary]}
        />
      }
      testID="consulta-paciente"
    >
      <View style={styles.status}>
        <StatusBadge status={c.status} />
      </View>

      <View style={styles.meta}>
        {itensMeta.map((m) => (
          <View key={m.icon} style={styles.metaItem}>
            <Icon name={m.icon} size={14} color={colors.danger} />
            <Text style={styles.metaTexto}>{m.texto}</Text>
          </View>
        ))}
        {meta.convenio ? <Text style={styles.metaTexto}>{meta.convenio}</Text> : null}
      </View>
      {c.valor !== null ? (
        <Text style={styles.valor} testID="consulta-paciente-valor">
          {formatMoeda(c.valor)}
        </Text>
      ) : null}

      {secoesClinicas(c).map((s) => (
        <View key={s.titulo} style={styles.secao} testID={`secao-${s.titulo}`}>
          <Text style={styles.secaoTitulo}>{s.titulo}</Text>
          <View style={styles.card}>
            {s.linhas.map((l) => (
              <Text key={l.rotulo} style={styles.linha}>
                <Text style={styles.rotulo}>{l.rotulo}: </Text>
                {l.valor}
              </Text>
            ))}
          </View>
        </View>
      ))}

      {podeAlterar(c) ? (
        <View style={styles.acoes}>
          <Pressable
            onPress={() => {
              setErro(null);
              setRemarcando((r) => !r);
            }}
            accessibilityRole="button"
            style={({ pressed }) => [styles.acao, styles.remarcar, pressed && styles.pressed]}
            testID="consulta-remarcar"
          >
            <Text style={styles.remarcarTexto}>Remarcar</Text>
          </Pressable>
          <Pressable
            onPress={() => void cancelarConsulta()}
            disabled={cancelar.isPending}
            accessibilityRole="button"
            style={({ pressed }) => [styles.acao, styles.cancelar, pressed && styles.pressed]}
            testID="consulta-cancelar"
          >
            <Text style={styles.cancelarTexto}>
              {cancelar.isPending ? 'Cancelando...' : 'Cancelar Consulta'}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {remarcando && podeAlterar(c) ? (
        <Remarcar consulta={c} onFechar={() => setRemarcando(false)} onErro={setErro} />
      ) : null}

      {erro ? (
        <Text style={styles.erro} accessibilityRole="alert" testID="consulta-paciente-erro">
          {erro}
        </Text>
      ) : null}
    </ScrollView>
  );
}

function Remarcar(props: {
  consulta: Consulta;
  onFechar: () => void;
  onErro: (mensagem: string | null) => void;
}) {
  const { consulta: c } = props;
  const [agora] = useState(() => clock.agora());
  const [dias] = useState(() => proximosDias(agora));
  const [dia, setDia] = useState(dias[0].iso);
  const [horario, setHorario] = useState<string | null>(null);
  const disponibilidade = useDisponibilidade(c.profissionalId, dia);
  const remarcar = useRemarcarConsulta();

  async function confirmar() {
    if (!horario) {
      return;
    }
    props.onErro(null);
    try {
      await remarcar.mutateAsync({ id: c.id, novaDataHora: novaDataHora(dia, horario) });
      props.onFechar();
    } catch (e) {
      props.onErro(mensagemErroRemarcar(e));
      setHorario(null);
      void disponibilidade.refetch();
    }
  }

  const horarios = (disponibilidade.data?.horarios ?? []).map((slot) => ({
    valor: slot.horario,
    label: horaCurta(slot.horario),
    habilitado: slotEscolhivel(slot, dia, agora),
  }));

  return (
    <View style={styles.secao} testID="consulta-remarcar-painel">
      <Text style={styles.secaoTitulo}>Remarcar consulta</Text>
      <SeletorHorario
        dias={dias}
        diaSelecionado={dia}
        onSelecionarDia={(d) => {
          setDia(d);
          setHorario(null);
        }}
        horarios={horarios}
        horarioSelecionado={horario}
        onSelecionarHorario={setHorario}
        carregando={disponibilidade.isPending}
        aviso={disponibilidade.isError ? 'Não foi possível carregar os horários deste dia.' : null}
      />
      <Button
        label={
          remarcar.isPending
            ? 'Remarcando...'
            : horario
              ? rotuloConfirmar(dia, horario)
              : 'Escolha um horário'
        }
        onPress={() => void confirmar()}
        disabled={!horario}
        loading={remarcar.isPending}
        testID="consulta-remarcar-confirmar"
      />
      <Pressable
        onPress={props.onFechar}
        accessibilityRole="button"
        style={({ pressed }) => [styles.link, pressed && styles.pressed]}
        testID="consulta-remarcar-fechar"
      >
        <Text style={styles.linkTexto}>Cancelar remarcação</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  topo: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  content: { padding: spacing.xl, paddingTop: spacing.sm, gap: spacing.md },
  status: { alignItems: 'flex-end' },
  meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  metaTexto: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.textSecondary },
  valor: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.textSecondary },
  secao: { gap: spacing.sm, marginTop: spacing.sm },
  secaoTitulo: { fontFamily: fonts.bold, fontSize: fontSizes.base, color: colors.text },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.card,
  },
  linha: { fontFamily: fonts.regular, fontSize: fontSizes.md, color: colors.text, lineHeight: 20 },
  rotulo: { fontFamily: fonts.bold },
  acoes: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  acao: { flex: 1, paddingVertical: 14, borderRadius: radius.pill, alignItems: 'center' },
  remarcar: { backgroundColor: colors.surface, ...shadows.card },
  remarcarTexto: { fontFamily: fonts.bold, fontSize: fontSizes.md, color: colors.text },
  cancelar: { backgroundColor: statusColors.cancelada.bg },
  cancelarTexto: { fontFamily: fonts.bold, fontSize: fontSizes.md, color: colors.danger },
  erro: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.danger },
  link: { paddingVertical: spacing.md, alignItems: 'center' },
  linkTexto: { fontFamily: fonts.semibold, fontSize: fontSizes.md, color: colors.primary },
  pressed: { opacity: 0.7 },
});
