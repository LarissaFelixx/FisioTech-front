import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useLayoutEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Button } from '../../components/Button/Button';
import { useConfirm } from '../../components/ConfirmDialog/ConfirmDialog';
import { ErrorState } from '../../components/ErrorState/ErrorState';
import { Icon } from '../../components/Icon/Icon';
import { OptionChips } from '../../components/OptionChips/OptionChips';
import { Skeleton } from '../../components/Skeleton/Skeleton';
import { TextField } from '../../components/TextField/TextField';
import { useConsultas } from '../../hooks/useConsultas';
import {
  useAtualizarPaciente,
  useCriarPaciente,
  useDeletarPaciente,
  usePaciente,
} from '../../hooks/usePacientes';
import type { ProfissionalStackParamList } from '../../navigation/types';
import { colors, fontSizes, fonts, radius, shadows, spacing } from '../../theme';
import type { Paciente } from '../../types/paciente';
import { STATUS_LABEL } from '../../utils/consulta';
import { formatDataBr, formatDataHoraBr, mascararData, parseDataHora } from '../../utils/date';
import { validarFormulario } from '../../utils/validation';
import {
  SEXO_OPCOES,
  VALORES_VAZIOS,
  mensagemErroExcluir,
  mensagemErroSalvar,
  montarAtualizacao,
  montarCriacao,
  schemaPaciente,
  valoresDoPaciente,
  type PacienteCampos,
  type PacienteFormValues,
} from './pacienteLogic';

type Navigation = NativeStackNavigationProp<ProfissionalStackParamList, 'PacienteForm'>;
type Rota = RouteProp<ProfissionalStackParamList, 'PacienteForm'>;

/** Origem: `features/pacientes/paciente-form` (cadastro e edição de paciente do profissional). */
export function PacienteFormScreen() {
  const navigation = useNavigation<Navigation>();
  const { params } = useRoute<Rota>();
  const pacienteId = params?.id;
  const editando = pacienteId != null;

  useLayoutEffect(() => {
    navigation.setOptions({ title: editando ? 'Editar Paciente' : 'Novo Paciente' });
  }, [navigation, editando]);

  if (!editando) {
    return <Formulario inicial={VALORES_VAZIOS} />;
  }
  return <Edicao pacienteId={pacienteId} />;
}

function Edicao({ pacienteId }: { pacienteId: number }) {
  const paciente = usePaciente(pacienteId);

  if (paciente.isPending) {
    return (
      <View style={styles.carregando}>
        <Skeleton variant="form" count={6} />
      </View>
    );
  }
  if (paciente.isError) {
    return (
      <View style={styles.carregando}>
        <ErrorState
          message="Não foi possível carregar o paciente."
          onRetry={() => void paciente.refetch()}
          retrying={paciente.isRefetching}
        />
      </View>
    );
  }
  // `key`: se o paciente mudar, o formulário recomeça com os dados dele.
  return (
    <Formulario
      key={paciente.data.id}
      inicial={valoresDoPaciente(paciente.data)}
      paciente={paciente.data}
    />
  );
}

function Formulario({ inicial, paciente }: { inicial: PacienteFormValues; paciente?: Paciente }) {
  const navigation = useNavigation<Navigation>();
  const confirmar = useConfirm();
  const editando = paciente != null;

  const criar = useCriarPaciente();
  const atualizar = useAtualizarPaciente();
  const deletar = useDeletarPaciente();

  const [valores, setValores] = useState(inicial);
  const [erros, setErros] = useState<Partial<Record<PacienteCampos, string>>>({});
  const [erro, setErro] = useState<string | null>(null);

  const salvando = criar.isPending || atualizar.isPending;

  function alterar(campo: PacienteCampos, valor: string) {
    setValores((atual) => ({ ...atual, [campo]: valor }));
    setErros((atual) => ({ ...atual, [campo]: undefined }));
  }

  async function salvar() {
    const novosErros = validarFormulario(valores, schemaPaciente(editando));
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) {
      return;
    }
    setErro(null);
    try {
      if (paciente) {
        await atualizar.mutateAsync({ id: paciente.id, request: montarAtualizacao(valores) });
      } else {
        await criar.mutateAsync(montarCriacao(valores));
      }
      navigation.goBack();
    } catch (e) {
      setErro(mensagemErroSalvar(e));
    }
  }

  async function excluir() {
    if (!paciente) {
      return;
    }
    const confirmado = await confirmar({
      titulo: 'Excluir paciente',
      mensagem: 'Excluir este paciente? Essa ação não pode ser desfeita.',
      confirmarLabel: 'Excluir',
    });
    if (!confirmado) {
      return;
    }
    setErro(null);
    try {
      await deletar.mutateAsync(paciente.id);
      navigation.goBack();
    } catch (e) {
      setErro(mensagemErroExcluir(e));
    }
  }

  const campo = (nome: PacienteCampos) => ({
    value: valores[nome],
    onChangeText: (v: string) => alterar(nome, v),
    error: erros[nome],
    testID: `paciente-${nome}`,
  });

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {paciente ? (
          <>
            <Text style={styles.meta}>
              Paciente desde {formatDataBr(parseDataHora(paciente.dataCriacao))}
            </Text>
            <View style={styles.atalhos}>
              <Atalho
                label="+ Nova Consulta"
                onPress={() => navigation.navigate('ConsultaNova', { pacienteId: paciente.id })}
                testID="paciente-nova-consulta"
              />
              <Atalho
                label="Mensagens"
                icone="chat"
                onPress={() =>
                  navigation.navigate('MensagemThread', {
                    pacienteId: paciente.id,
                    nome: paciente.nome,
                  })
                }
                testID="paciente-mensagens"
              />
            </View>
          </>
        ) : null}

        <View style={styles.card}>
          <TextField label="Nome" autoComplete="name" {...campo('nome')} />
          <TextField
            label="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            {...campo('email')}
          />
          <TextField
            label={editando ? 'Nova senha' : 'Senha'}
            placeholder={editando ? 'Deixe em branco para manter a senha atual' : undefined}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            {...campo('senha')}
          />

          {editando ? (
            <>
              <TextField
                label="Data de nascimento"
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
                testID="paciente-sexo"
              />
              <TextField label="Profissão" {...campo('profissao')} />
              <TextField label="Telefone" keyboardType="phone-pad" {...campo('telefone')} />
              <TextField label="Endereço" {...campo('endereco')} />
              <TextField label="Bairro" {...campo('bairro')} />
              <TextField
                label="Foto (URL)"
                placeholder="https://..."
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
                {...campo('foto')}
              />
            </>
          ) : (
            <Text style={styles.dica}>
              Os demais dados (nascimento, contato, endereço) podem ser preenchidos depois, na
              edição do paciente.
            </Text>
          )}

          {erro ? (
            <Text style={styles.erro} accessibilityRole="alert" testID="paciente-erro">
              {erro}
            </Text>
          ) : null}

          <Button
            label={salvando ? 'Salvando...' : 'Salvar'}
            onPress={() => void salvar()}
            loading={salvando}
            testID="paciente-salvar"
          />
          {editando ? (
            <Pressable
              onPress={() => void excluir()}
              disabled={deletar.isPending}
              accessibilityRole="button"
              style={({ pressed }) => [styles.excluir, pressed && styles.pressed]}
              testID="paciente-excluir"
            >
              <Text style={styles.excluirTexto}>
                {deletar.isPending ? 'Excluindo...' : 'Excluir Paciente'}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {paciente ? <HistoricoConsultas pacienteId={paciente.id} /> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Atalho(props: { label: string; icone?: 'chat'; onPress: () => void; testID: string }) {
  return (
    <Pressable
      onPress={props.onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.atalho, pressed && styles.pressed]}
      testID={props.testID}
    >
      {props.icone ? <Icon name={props.icone} size={18} color={colors.primary} /> : null}
      <Text style={styles.atalhoTexto}>{props.label}</Text>
    </Pressable>
  );
}

function HistoricoConsultas({ pacienteId }: { pacienteId: number }) {
  const navigation = useNavigation<Navigation>();
  const { data } = useConsultas(pacienteId);

  // Como no Angular: a seção só aparece quando há consultas (erro aqui não bloqueia o formulário).
  if (!data || data.length === 0) {
    return null;
  }
  return (
    <View style={styles.historico} testID="paciente-consultas">
      <Text style={styles.historicoTitulo}>Consultas</Text>
      <View style={styles.card}>
        {data.map((consulta) => (
          <Pressable
            key={consulta.id}
            onPress={() => navigation.navigate('ConsultaDetalhe', { id: consulta.id })}
            accessibilityRole="link"
            style={({ pressed }) => [styles.consultaLinha, pressed && styles.pressed]}
          >
            <Text style={styles.consultaTexto}>
              {formatDataHoraBr(parseDataHora(consulta.dataHora))} — {STATUS_LABEL[consulta.status]}
            </Text>
            <Icon name="chevron-right" size={18} color={colors.textTertiary} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  carregando: { flex: 1, backgroundColor: colors.bg, padding: spacing.xl },
  content: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.xxxl },
  meta: { fontFamily: fonts.regular, fontSize: fontSizes.md, color: colors.textSecondary },
  atalhos: { flexDirection: 'row', gap: spacing.sm },
  atalho: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  atalhoTexto: { fontFamily: fonts.semibold, fontSize: fontSizes.md, color: colors.primary },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.xl,
    gap: spacing.lg,
    ...shadows.card,
  },
  dica: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.textTertiary },
  erro: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.danger },
  excluir: {
    paddingVertical: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.danger,
    alignItems: 'center',
  },
  excluirTexto: { fontFamily: fonts.bold, fontSize: fontSizes.md, color: colors.danger },
  historico: { gap: spacing.sm },
  historicoTitulo: { fontFamily: fonts.bold, fontSize: fontSizes.xl, color: colors.text },
  consultaLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  consultaTexto: { fontFamily: fonts.regular, fontSize: fontSizes.base, color: colors.text },
  pressed: { opacity: 0.7 },
});
