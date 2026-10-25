import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/Button/Button';
import { ErrorState } from '../../components/ErrorState/ErrorState';
import { Icon } from '../../components/Icon/Icon';
import { OptionChips } from '../../components/OptionChips/OptionChips';
import { Skeleton } from '../../components/Skeleton/Skeleton';
import { TextField } from '../../components/TextField/TextField';
import { ToggleChips } from '../../components/ToggleChips/ToggleChips';
import { useAtualizarConsulta, useConsulta } from '../../hooks/useConsultas';
import type { ProfissionalStackParamList } from '../../navigation/types';
import { colors, fontSizes, fonts, radius, shadows, spacing } from '../../theme';
import type { Consulta } from '../../types/consulta';
import {
  MAX_TEXTO,
  MENSAGEM_ERRO_CARREGAR,
  OPCOES_HISTORICO,
  TITULOS,
  TOTAL_ETAPAS,
  alternarOpcao,
  etapaAnterior,
  etapaParaRetomar,
  formsDaConsulta,
  limiteOutras,
  mensagemErroSalvar,
  montarAtualizacao,
  numeroDaEtapa,
  podeIrPara,
  proximaEtapa,
  type Etapa,
  type WizardForms,
} from './wizardLogic';

type Navigation = NativeStackNavigationProp<ProfissionalStackParamList, 'ConsultaWizard'>;
type Rota = RouteProp<ProfissionalStackParamList, 'ConsultaWizard'>;

const OUTRAS = 'Outras';
const CHIPS_HISTORICO = [...OPCOES_HISTORICO, OUTRAS].map((o) => ({ valor: o, label: o }));
const SIM_NAO = [
  { valor: 'sim', label: 'Sim' },
  { valor: 'nao', label: 'Não' },
];
const simNao = (v: boolean) => (v ? 'sim' : 'nao');

/** Origem: `features/consultas/consulta-wizard` (registro clínico em 4 etapas). */
export function ConsultaWizardScreen() {
  const { params } = useRoute<Rota>();
  const consulta = useConsulta(params.id);
  // Os formulários partem de uma leitura feita agora (não do cache) e não são refeitos quando a
  // consulta é recarregada depois de cada etapa salva.
  const [inicial, setInicial] = useState<Consulta | null>(null);
  if (!inicial && consulta.isSuccess && consulta.isFetchedAfterMount) {
    setInicial(consulta.data);
  }

  if (inicial) {
    return <Wizard consulta={inicial} />;
  }
  if (consulta.isError) {
    return (
      <View style={styles.centro}>
        <ErrorState
          message={MENSAGEM_ERRO_CARREGAR}
          onRetry={() => void consulta.refetch()}
          retrying={consulta.isRefetching}
        />
      </View>
    );
  }
  return (
    <View style={styles.centro}>
      <Skeleton variant="form" count={4} />
    </View>
  );
}

function Wizard({ consulta }: { consulta: Consulta }) {
  const navigation = useNavigation<Navigation>();
  const atualizar = useAtualizarConsulta();
  const scroll = useRef<ScrollView>(null);
  const [base, setBase] = useState(consulta);
  const [etapa, setEtapa] = useState<Etapa>(() => etapaParaRetomar(consulta));
  const [forms, setForms] = useState<WizardForms>(() => formsDaConsulta(consulta));
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, [etapa]);

  function irPara(destino: Etapa) {
    if (!podeIrPara(etapa, destino)) {
      return;
    }
    setErro(null);
    setEtapa(destino);
  }

  function voltar() {
    const anterior = etapaAnterior(etapa);
    if (anterior) {
      irPara(anterior);
    }
  }

  async function avancar() {
    setErro(null);
    try {
      await atualizar.mutateAsync({
        id: consulta.id,
        request: montarAtualizacao(base, etapa, forms),
      });
      if (etapa === 'diagnostico') {
        setBase((b) => ({ ...b, status: 'REALIZADA' }));
      }
      setEtapa(proximaEtapa(etapa));
    } catch (e) {
      setErro(mensagemErroSalvar(e));
    }
  }

  /** Volta ao prontuário se veio dele; senão, abre o prontuário no lugar do wizard. */
  function abrirProntuario() {
    const { routes, index } = navigation.getState();
    const anterior = routes[index - 1];
    if (
      anterior?.name === 'ConsultaDetalhe' &&
      (anterior.params as { id?: number } | undefined)?.id === consulta.id
    ) {
      navigation.goBack();
    } else {
      navigation.replace('ConsultaDetalhe', { id: consulta.id });
    }
  }

  function alterar<K extends keyof WizardForms>(bloco: K, mudanca: Partial<WizardForms[K]>) {
    setForms((f) => ({ ...f, [bloco]: { ...f[bloco], ...mudanca } }));
  }

  if (etapa === 'sucesso') {
    return (
      <View style={styles.sucesso} testID="wizard-sucesso">
        <View style={styles.sucessoIcone}>
          <Icon name="check" color={colors.textInverse} size={44} />
        </View>
        <Text style={[styles.titulo, styles.centralizado]} accessibilityRole="header">
          {TITULOS.sucesso}
        </Text>
        <View style={styles.sucessoAcao}>
          <Button label="Visualizar" onPress={abrirProntuario} testID="wizard-visualizar" />
        </View>
      </View>
    );
  }

  const numero = numeroDaEtapa(etapa);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        ref={scroll}
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.passo} testID="wizard-passo">
          Passo {numero} de {TOTAL_ETAPAS}
        </Text>
        <View
          style={styles.progresso}
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={`Passo ${numero} de ${TOTAL_ETAPAS}`}
          accessibilityValue={{ min: 0, max: TOTAL_ETAPAS, now: numero }}
        >
          {Array.from({ length: TOTAL_ETAPAS }, (_, i) => (
            <View key={i} style={[styles.barra, i < numero && styles.barraCheia]} />
          ))}
        </View>
        <Text style={styles.paciente}>{base.pacienteNome}</Text>
        <Text style={styles.titulo} accessibilityRole="header" testID="wizard-titulo">
          {TITULOS[etapa]}
        </Text>

        <View style={styles.card}>
          {etapa === 'quadro-clinico' ? (
            <EtapaQuadro forms={forms} alterar={alterar} />
          ) : etapa === 'habitos-vida' ? (
            <EtapaHabitos forms={forms} alterar={alterar} />
          ) : etapa === 'exame-fisico' ? (
            <EtapaExame forms={forms} alterar={alterar} />
          ) : (
            <EtapaDiagnostico forms={forms} alterar={alterar} />
          )}
        </View>

        {erro ? (
          <Text style={styles.erro} accessibilityRole="alert" testID="wizard-erro">
            {erro}
          </Text>
        ) : null}
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.rodape}>
        {etapa !== 'quadro-clinico' ? (
          <Pressable
            onPress={voltar}
            disabled={atualizar.isPending}
            accessibilityRole="button"
            style={({ pressed }) => [styles.voltar, pressed && styles.pressed]}
            testID="wizard-voltar"
          >
            <Text style={styles.voltarTexto}>Voltar</Text>
          </Pressable>
        ) : null}
        <View style={styles.grow}>
          <Button
            label={atualizar.isPending ? 'Salvando...' : 'Próximo'}
            onPress={() => void avancar()}
            loading={atualizar.isPending}
            testID="wizard-proximo"
          />
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

type EtapaProps = {
  forms: WizardForms;
  alterar: <K extends keyof WizardForms>(bloco: K, mudanca: Partial<WizardForms[K]>) => void;
};

/** Props comuns dos campos de texto livre (`<textarea>` no Angular). */
const areaDeTexto = (linhas = 2) => ({
  multiline: true,
  numberOfLines: linhas,
  maxLength: MAX_TEXTO,
});

function EtapaQuadro({ forms, alterar }: EtapaProps) {
  const q = forms.quadro;
  const h = q.historico;
  const selecionados = h.outrasAtivo ? [...h.opcoes, OUTRAS] : h.opcoes;

  function alternarHistorico(valor: string) {
    const historico =
      valor === OUTRAS ? { ...h, outrasAtivo: !h.outrasAtivo } : alternarOpcao(h, valor);
    alterar('quadro', { historico });
  }

  return (
    <>
      <TextField
        label="Queixa principal"
        {...areaDeTexto(3)}
        value={q.queixaPrincipal}
        onChangeText={(v) => alterar('quadro', { queixaPrincipal: v })}
        testID="wizard-queixa"
      />
      <TextField
        label="História da doença atual"
        {...areaDeTexto(3)}
        value={q.historiaDoencaAtual}
        onChangeText={(v) => alterar('quadro', { historiaDoencaAtual: v })}
        testID="wizard-historia"
      />
      <ToggleChips
        label="Histórico de saúde"
        opcoes={CHIPS_HISTORICO}
        selecionados={selecionados}
        onToggle={alternarHistorico}
        testID="wizard-historico"
      />
      {h.outrasAtivo ? (
        <TextField
          label="Outras condições"
          placeholder="Quais outras?"
          maxLength={limiteOutras(h)}
          value={h.outras}
          onChangeText={(v) => alterar('quadro', { historico: { ...h, outras: v } })}
          testID="wizard-outras"
        />
      ) : null}
      <OptionChips
        label="Já realizou cirurgias?"
        opcoes={SIM_NAO}
        valor={simNao(q.cirurgias)}
        onChange={(v) => alterar('quadro', { cirurgias: v === 'sim' })}
        testID="wizard-cirurgias"
      />
      {q.cirurgias ? (
        <TextField
          label="Quais cirurgias?"
          maxLength={MAX_TEXTO}
          value={q.cirurgiasDescricao}
          onChangeText={(v) => alterar('quadro', { cirurgiasDescricao: v })}
          testID="wizard-cirurgias-descricao"
        />
      ) : null}
      <OptionChips
        label="Possui lesões anteriores?"
        opcoes={SIM_NAO}
        valor={simNao(q.lesoesAnteriores)}
        onChange={(v) => alterar('quadro', { lesoesAnteriores: v === 'sim' })}
        testID="wizard-lesoes"
      />
      {q.lesoesAnteriores ? (
        <TextField
          label="Quais lesões?"
          maxLength={MAX_TEXTO}
          value={q.lesoesAnterioresDescricao}
          onChangeText={(v) => alterar('quadro', { lesoesAnterioresDescricao: v })}
          testID="wizard-lesoes-descricao"
        />
      ) : null}
      <TextField
        label="Medicamentos em uso"
        {...areaDeTexto()}
        value={q.medicamentos}
        onChangeText={(v) => alterar('quadro', { medicamentos: v })}
        testID="wizard-medicamentos"
      />
    </>
  );
}

function EtapaHabitos({ forms, alterar }: EtapaProps) {
  const h = forms.habitos;
  return (
    <>
      <TextField
        label="Atividade física"
        {...areaDeTexto()}
        value={h.atividadeFisica}
        onChangeText={(v) => alterar('habitos', { atividadeFisica: v })}
        testID="wizard-atividade"
      />
      <TextField
        label="Rotina de trabalho"
        {...areaDeTexto()}
        value={h.rotinaTrabalho}
        onChangeText={(v) => alterar('habitos', { rotinaTrabalho: v })}
        testID="wizard-rotina"
      />
      <OptionChips
        label="Tabagismo"
        opcoes={SIM_NAO}
        valor={simNao(h.tabagismo)}
        onChange={(v) => alterar('habitos', { tabagismo: v === 'sim' })}
        testID="wizard-tabagismo"
      />
      <OptionChips
        label="Consumo de álcool"
        opcoes={SIM_NAO}
        valor={simNao(h.consumoAlcool)}
        onChange={(v) => alterar('habitos', { consumoAlcool: v === 'sim' })}
        testID="wizard-alcool"
      />
    </>
  );
}

function EtapaExame({ forms, alterar }: EtapaProps) {
  const e = forms.exame;
  return (
    <>
      <TextField
        label="Postura"
        {...areaDeTexto()}
        value={e.postura}
        onChangeText={(v) => alterar('exame', { postura: v })}
        testID="wizard-postura"
      />
      <TextField
        label="Amplitude do movimento"
        {...areaDeTexto()}
        value={e.amplitudeMovimento}
        onChangeText={(v) => alterar('exame', { amplitudeMovimento: v })}
        testID="wizard-amplitude"
      />
      <TextField
        label="Palpação"
        {...areaDeTexto()}
        value={e.palpacao}
        onChangeText={(v) => alterar('exame', { palpacao: v })}
        testID="wizard-palpacao"
      />
      <TextField
        label="Força muscular"
        {...areaDeTexto()}
        value={e.forcaMuscular}
        onChangeText={(v) => alterar('exame', { forcaMuscular: v })}
        testID="wizard-forca"
      />
    </>
  );
}

function EtapaDiagnostico({ forms, alterar }: EtapaProps) {
  const d = forms.diagnostico;
  return (
    <>
      <TextField
        label="Plano de tratamento"
        {...areaDeTexto(3)}
        value={d.planoTratamento}
        onChangeText={(v) => alterar('diagnostico', { planoTratamento: v })}
        testID="wizard-plano"
      />
      <TextField
        label="Objetivos do tratamento"
        {...areaDeTexto(3)}
        value={d.objetivosTratamento}
        onChangeText={(v) => alterar('diagnostico', { objetivosTratamento: v })}
        testID="wizard-objetivos"
      />
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  grow: { flex: 1 },
  centro: { flex: 1, backgroundColor: colors.bg, padding: spacing.xl },
  content: { padding: spacing.xl, gap: spacing.md, paddingBottom: spacing.xxl },
  passo: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.sm,
    color: colors.textTertiary,
    alignSelf: 'flex-end',
  },
  progresso: { flexDirection: 'row', gap: 6 },
  barra: { flex: 1, height: 4, borderRadius: radius.pill, backgroundColor: colors.border },
  barraCheia: { backgroundColor: colors.primary },
  paciente: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.textSecondary },
  titulo: {
    fontFamily: fonts.extrabold,
    fontSize: fontSizes.xxl,
    letterSpacing: -0.5,
    color: colors.text,
  },
  centralizado: { textAlign: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.xl,
    gap: spacing.lg,
    ...shadows.card,
  },
  erro: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.danger },
  rodape: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: spacing.xl,
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  voltar: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: 14,
    paddingHorizontal: spacing.xxl,
    justifyContent: 'center',
  },
  voltarTexto: { fontFamily: fonts.bold, fontSize: fontSizes.md, color: colors.text },
  pressed: { opacity: 0.7 },
  sucesso: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    padding: spacing.xxl,
  },
  sucessoIcone: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sucessoAcao: { alignSelf: 'stretch' },
});
