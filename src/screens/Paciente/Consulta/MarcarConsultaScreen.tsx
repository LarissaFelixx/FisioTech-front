import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { toApiError } from '../../../api/errors';
import { Button } from '../../../components/Button/Button';
import { useConfirm } from '../../../components/ConfirmDialog/ConfirmDialog';
import { ErrorState } from '../../../components/ErrorState/ErrorState';
import { Icon } from '../../../components/Icon/Icon';
import { OptionChips } from '../../../components/OptionChips/OptionChips';
import { SearchField } from '../../../components/SearchField/SearchField';
import { Segmentado } from '../../../components/Segmentado/Segmentado';
import { SeletorHorario } from '../../../components/SeletorHorario/SeletorHorario';
import { Skeleton } from '../../../components/Skeleton/Skeleton';
import { VoltarLink } from '../../../components/VoltarLink/VoltarLink';
import {
  useBuscarProfissionais,
  useDisponibilidade,
  useMarcarConsulta,
  useMeuPerfil,
  useProfissionalPublico,
} from '../../../hooks/useMe';
import type { PacienteStackParamList } from '../../../navigation/types';
import type { TipoConsulta } from '../../../types/consulta';
import type { ProfissionalBusca } from '../../../types/consultaBooking';
import { colors, fontSizes, fonts, radius, shadows, spacing } from '../../../theme';
import { clock } from '../../../utils/clock';
import { formatMoeda } from '../../../utils/moeda';
import {
  filtrarProfissionais,
  horariosDoDia,
  mensagemErroMarcar,
  pedidoConsulta,
  podeConfirmar,
  proximosDias,
  quandoCurto,
  type FormaPagamento,
} from './marcarConsultaLogic';

type Navegacao = NativeStackNavigationProp<PacienteStackParamList>;

/**
 * Marcar consulta (#40, Figma "19 Marcar Consulta"). Quem já tem profissional vai direto para a
 * escolha de dia, horário, pagamento e tipo com ele; quem ainda não tem (autocadastro) escolhe
 * o profissional antes, como no Angular. Marcar a primeira consulta vincula o profissional.
 */
export function MarcarConsultaScreen() {
  const navigation = useNavigation<Navegacao>();
  const perfil = useMeuPerfil();
  const [escolhido, setEscolhido] = useState<ProfissionalBusca | null>(null);

  const vinculadoId = perfil.data?.profissionalId ?? null;
  const vinculado = useProfissionalPublico(vinculadoId ?? 0, { enabled: vinculadoId != null });
  const profissional = escolhido ?? (vinculadoId != null ? (vinculado.data ?? null) : null);

  const voltar = <VoltarLink label="Voltar" onPress={() => navigation.goBack()} />;

  let conteudo: ReactNode;
  if (perfil.isPending || (vinculadoId != null && vinculado.isPending)) {
    conteudo = (
      <View style={styles.content}>
        {voltar}
        <Skeleton variant="form" />
      </View>
    );
  } else if (perfil.isError || (vinculadoId != null && vinculado.isError)) {
    conteudo = (
      <View style={styles.content}>
        {voltar}
        <ErrorState
          message="Não foi possível carregar os dados para marcar a consulta."
          onRetry={() => void (perfil.isError ? perfil.refetch() : vinculado.refetch())}
          retrying={perfil.isRefetching || vinculado.isRefetching}
        />
      </View>
    );
  } else if (!profissional) {
    conteudo = <EscolhaProfissional voltar={voltar} onEscolher={setEscolhido} />;
  } else {
    conteudo = (
      <Agendamento
        key={profissional.id}
        voltar={voltar}
        profissional={profissional}
        onTrocar={escolhido ? () => setEscolhido(null) : undefined}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      {conteudo}
    </SafeAreaView>
  );
}

function Titulo({ subtitulo }: { subtitulo?: string }) {
  return (
    <View>
      <Text style={styles.titulo} accessibilityRole="header">
        Marcar consulta
      </Text>
      {subtitulo ? <Text style={styles.subtitulo}>{subtitulo}</Text> : null}
    </View>
  );
}

// ---------- Etapa 1: profissional (só para quem ainda não tem) ----------

function EscolhaProfissional({
  voltar,
  onEscolher,
}: {
  voltar: ReactNode;
  onEscolher: (p: ProfissionalBusca) => void;
}) {
  const profissionais = useBuscarProfissionais();
  const [busca, setBusca] = useState('');
  const lista = profissionais.data ? filtrarProfissionais(profissionais.data, busca) : [];

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {voltar}
      <Titulo subtitulo="Escolha o profissional" />
      <SearchField
        value={busca}
        onChangeText={setBusca}
        placeholder="Nome ou especialidade"
        testID="marcar-busca"
      />
      {profissionais.isPending ? (
        <Skeleton variant="list" count={3} />
      ) : profissionais.isError ? (
        <ErrorState
          message="Não foi possível carregar os profissionais."
          onRetry={() => void profissionais.refetch()}
          retrying={profissionais.isRefetching}
        />
      ) : lista.length === 0 ? (
        <Text style={styles.aviso}>Nenhum profissional encontrado.</Text>
      ) : (
        <View style={styles.cartao}>
          {lista.map((p, i) => (
            <Pressable
              key={p.id}
              onPress={() => onEscolher(p)}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.profissional,
                i < lista.length - 1 && styles.divisor,
                pressed && styles.pressed,
              ]}
              testID={`marcar-profissional-${p.id}`}
            >
              <View style={styles.flex}>
                <Text style={styles.profissionalNome}>{p.nome}</Text>
                <Text style={styles.profissionalEspecialidade}>{p.especialidade}</Text>
              </View>
              <Icon name="chevron-right" size={18} color={colors.textTertiary} />
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

// ---------- Etapa 2: dia, horário, pagamento e tipo ----------

const PAGAMENTOS = [
  { valor: 'particular', label: 'Particular' },
  { valor: 'convenio', label: 'Convênio' },
];

const TIPOS = [
  { valor: 'PRESENCIAL', label: 'Presencial' },
  { valor: 'ONLINE', label: 'Online' },
];

function Agendamento({
  voltar,
  profissional,
  onTrocar,
}: {
  voltar: ReactNode;
  profissional: ProfissionalBusca;
  /** Só quando o profissional foi escolhido na lista (quem já tem vínculo não troca aqui). */
  onTrocar?: () => void;
}) {
  const navigation = useNavigation<Navegacao>();
  const confirmar = useConfirm();
  const marcar = useMarcarConsulta();
  const dias = useMemo(() => proximosDias(clock.agora()), []);

  const [dia, setDia] = useState(dias[0].iso);
  const [horario, setHorario] = useState<string | null>(null);
  const [tipo, setTipo] = useState<TipoConsulta>('PRESENCIAL');
  const [forma, setForma] = useState<FormaPagamento>('particular');
  const [convenio, setConvenio] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const disponibilidade = useDisponibilidade(profissional.id, dia);
  const horarios = disponibilidade.data
    ? horariosDoDia(disponibilidade.data, dia, clock.agora())
    : [];
  const escolha = { dia, horario, tipo, forma, convenio };
  const convenios = profissional.conveniosAceitos;

  const escolherDia = (iso: string) => {
    setDia(iso);
    setHorario(null);
  };

  const escolherForma = (valor: string) => {
    setForma(valor as FormaPagamento);
    setConvenio(null);
  };

  async function onConfirmar() {
    if (!horario || !podeConfirmar(escolha)) {
      return;
    }
    const sim = await confirmar({
      titulo: 'Marcar consulta',
      mensagem: `Confirmar consulta com ${profissional.nome} em ${quandoCurto(dia, horario)}?`,
      confirmarLabel: 'Sim',
      cancelarLabel: 'Não',
      destrutivo: false,
    });
    if (!sim) {
      return;
    }
    setErro(null);
    try {
      const consulta = await marcar.mutateAsync(
        pedidoConsulta(profissional.id, { ...escolha, horario }),
      );
      navigation.replace('ConsultaDetalhe', { id: consulta.id });
    } catch (error) {
      setErro(mensagemErroMarcar(error));
      const apiError = toApiError(error);
      if (apiError.kind === 'http' && apiError.status === 409) {
        // Alguém ocupou o horário: limpa a escolha e atualiza a grade.
        setHorario(null);
        void disponibilidade.refetch();
      }
    }
  }

  return (
    <>
      <ScrollView contentContainerStyle={styles.content}>
        {voltar}
        <Titulo subtitulo={`com ${profissional.nome} · ${profissional.especialidade}`} />
        {onTrocar ? (
          <Pressable
            onPress={onTrocar}
            accessibilityRole="button"
            hitSlop={8}
            style={styles.trocar}
            testID="marcar-trocar-profissional"
          >
            <Text style={styles.trocarTexto}>Trocar profissional</Text>
          </Pressable>
        ) : null}

        <SeletorHorario
          dias={dias}
          diaSelecionado={dia}
          onSelecionarDia={escolherDia}
          horarios={horarios}
          horarioSelecionado={horario}
          onSelecionarHorario={setHorario}
          carregando={disponibilidade.isPending}
          aviso={
            disponibilidade.isError
              ? 'Não foi possível carregar os horários.'
              : horarios.length > 0 && !horarios.some((h) => h.habilitado)
                ? 'Nenhum horário livre neste dia.'
                : null
          }
        />

        <View style={styles.secao}>
          <Text style={styles.rotulo}>Pagamento</Text>
          <Segmentado
            accessibilityLabel="Pagamento"
            opcoes={PAGAMENTOS}
            valor={forma}
            onChange={escolherForma}
            testID="marcar-pagamento"
          />
          {forma === 'particular' ? (
            profissional.valorConsultaParticular != null ? (
              <View style={[styles.cartao, styles.valor]}>
                <Text style={styles.valorRotulo}>Valor da sessão</Text>
                <Text style={styles.valorNumero}>
                  {formatMoeda(profissional.valorConsultaParticular)}
                </Text>
              </View>
            ) : (
              <Text style={styles.aviso}>
                Este profissional ainda não definiu um valor particular.
              </Text>
            )
          ) : convenios.length > 0 ? (
            <OptionChips
              accessibilityLabel="Convênio"
              opcoes={convenios.map((c) => ({ valor: c, label: c }))}
              valor={convenio ?? ''}
              onChange={setConvenio}
              testID="marcar-convenio"
            />
          ) : (
            <Text style={styles.aviso}>Este profissional não tem convênios cadastrados.</Text>
          )}
        </View>

        <View style={styles.secao}>
          <Text style={styles.rotulo}>Tipo</Text>
          <Segmentado
            accessibilityLabel="Tipo"
            opcoes={TIPOS}
            valor={tipo}
            onChange={(valor) => setTipo(valor as TipoConsulta)}
            testID="marcar-tipo"
          />
        </View>
      </ScrollView>

      <View style={styles.rodape}>
        {erro ? (
          <Text style={styles.erro} accessibilityRole="alert">
            {erro}
          </Text>
        ) : null}
        <Button
          label={horario ? `Confirmar ${quandoCurto(dia, horario)}` : 'Escolha um horário'}
          onPress={() => void onConfirmar()}
          disabled={!podeConfirmar(escolha)}
          loading={marcar.isPending}
          testID="marcar-confirmar"
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, gap: spacing.lg },
  flex: { flex: 1, minWidth: 0 },
  titulo: {
    fontFamily: fonts.extrabold,
    fontSize: fontSizes.xxl,
    letterSpacing: -0.5,
    color: colors.text,
  },
  subtitulo: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.textSecondary },
  trocar: { alignSelf: 'flex-start', marginTop: -spacing.sm },
  trocarTexto: { fontFamily: fonts.semibold, fontSize: fontSizes.sm, color: colors.primary },
  aviso: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.textSecondary },
  cartao: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
    ...shadows.card,
  },
  profissional: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  profissionalNome: { fontFamily: fonts.semibold, fontSize: fontSizes.base, color: colors.text },
  profissionalEspecialidade: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  divisor: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  secao: { gap: spacing.md },
  rotulo: { fontFamily: fonts.semibold, fontSize: fontSizes.sm, color: colors.textSecondary },
  valor: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  valorRotulo: { fontFamily: fonts.regular, fontSize: fontSizes.md, color: colors.textSecondary },
  valorNumero: { fontFamily: fonts.extrabold, fontSize: fontSizes.xl, color: colors.primaryDark },
  rodape: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, gap: spacing.sm },
  erro: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.danger },
  pressed: { opacity: 0.7 },
});
