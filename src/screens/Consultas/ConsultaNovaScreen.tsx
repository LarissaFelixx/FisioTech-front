import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Avatar } from '../../components/Avatar/Avatar';
import { Button } from '../../components/Button/Button';
import { ErrorState } from '../../components/ErrorState/ErrorState';
import { OptionChips } from '../../components/OptionChips/OptionChips';
import { SearchField } from '../../components/SearchField/SearchField';
import { Skeleton } from '../../components/Skeleton/Skeleton';
import { TextField } from '../../components/TextField/TextField';
import { useCriarConsulta } from '../../hooks/useConsultas';
import { useCriarPaciente, usePaciente, usePacientes } from '../../hooks/usePacientes';
import type { ProfissionalStackParamList } from '../../navigation/types';
import { colors, fontSizes, fonts, radius, shadows, spacing } from '../../theme';
import type { Paciente } from '../../types/paciente';
import { mascararData, mascararHora } from '../../utils/date';
import { email, maximo, minimo, obrigatorio, validarFormulario } from '../../utils/validation';
import {
  CONSULTA_VAZIA,
  TIPO_OPCOES,
  filtrarPorNome,
  mensagemErroCadastroRapido,
  mensagemErroCriarConsulta,
  montarConsulta,
  schemaConsulta,
  type ConsultaCampos,
} from './consultaLogic';

type Navigation = NativeStackNavigationProp<ProfissionalStackParamList, 'ConsultaNova'>;
type Rota = RouteProp<ProfissionalStackParamList, 'ConsultaNova'>;

type PacienteEscolhido = { id: number; nome: string };

/**
 * Origem: `features/consultas/consulta-form`. Vindo do cadastro do paciente, ele já chega
 * escolhido; senão, o profissional busca ou cadastra um paciente na hora.
 */
export function ConsultaNovaScreen() {
  const { params } = useRoute<Rota>();
  const pacienteId = params?.pacienteId;
  const [escolhido, setEscolhido] = useState<PacienteEscolhido | null>(null);

  if (pacienteId != null) {
    return <ComPacienteDefinido pacienteId={pacienteId} />;
  }
  if (!escolhido) {
    return <EscolherPaciente onEscolher={(p) => setEscolhido({ id: p.id, nome: p.nome })} />;
  }
  return <FormConsulta paciente={escolhido} onTrocar={() => setEscolhido(null)} />;
}

function ComPacienteDefinido({ pacienteId }: { pacienteId: number }) {
  const paciente = usePaciente(pacienteId);
  if (paciente.isPending) {
    return (
      <View style={styles.centro}>
        <Skeleton variant="form" count={4} />
      </View>
    );
  }
  if (paciente.isError) {
    return (
      <View style={styles.centro}>
        <ErrorState
          message="Paciente não encontrado."
          onRetry={() => void paciente.refetch()}
          retrying={paciente.isRefetching}
        />
      </View>
    );
  }
  return <FormConsulta paciente={{ id: paciente.data.id, nome: paciente.data.nome }} />;
}

function EscolherPaciente({ onEscolher }: { onEscolher: (p: Paciente) => void }) {
  const pacientes = usePacientes();
  const [busca, setBusca] = useState('');
  const [cadastrando, setCadastrando] = useState(false);

  if (cadastrando) {
    return (
      <CadastroRapido
        onVoltar={() => setCadastrando(false)}
        onCadastrado={(p) => {
          setCadastrando(false);
          onEscolher(p);
        }}
      />
    );
  }

  const lista = filtrarPorNome(pacientes.data ?? [], busca);

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <SearchField
        value={busca}
        onChangeText={setBusca}
        placeholder="Buscar paciente pelo nome"
        testID="consulta-busca-paciente"
      />
      <Pressable
        onPress={() => setCadastrando(true)}
        accessibilityRole="button"
        style={({ pressed }) => [styles.linkBotao, pressed && styles.pressed]}
        testID="consulta-cadastrar-paciente"
      >
        <Text style={styles.linkBotaoTexto}>+ Cadastrar novo paciente</Text>
      </Pressable>

      {pacientes.isPending ? (
        <Skeleton variant="list" count={4} />
      ) : pacientes.isError ? (
        <ErrorState
          message="Não foi possível carregar os pacientes."
          onRetry={() => void pacientes.refetch()}
          retrying={pacientes.isRefetching}
        />
      ) : lista.length === 0 ? (
        <Text style={styles.state}>Nenhum paciente encontrado.</Text>
      ) : (
        <View style={styles.lista}>
          {lista.map((p, i) => (
            <Pressable
              key={p.id}
              onPress={() => onEscolher(p)}
              accessibilityRole="button"
              accessibilityLabel={`Escolher ${p.nome}`}
              style={({ pressed }) => [
                styles.pacienteLinha,
                i < lista.length - 1 && styles.divisor,
                pressed && styles.pressed,
              ]}
              testID={`consulta-escolher-${p.id}`}
            >
              <Avatar nome={p.nome} />
              <View style={styles.info}>
                <Text style={styles.nome}>{p.nome}</Text>
                <Text style={styles.email}>{p.email}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

type CadastroCampos = 'nome' | 'email' | 'senha';

function CadastroRapido(props: { onVoltar: () => void; onCadastrado: (p: Paciente) => void }) {
  const criar = useCriarPaciente();
  const pacientes = usePacientes();
  const [valores, setValores] = useState<Record<CadastroCampos, string>>({
    nome: '',
    email: '',
    senha: '',
  });
  const [erros, setErros] = useState<Partial<Record<CadastroCampos, string>>>({});
  const [erro, setErro] = useState<string | null>(null);

  async function cadastrar() {
    const novosErros = validarFormulario(valores, {
      nome: [obrigatorio, maximo(120)],
      email: [obrigatorio, email, maximo(120)],
      senha: [obrigatorio, minimo(8), maximo(100)],
    });
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) {
      return;
    }
    setErro(null);
    const request = {
      nome: valores.nome.trim(),
      email: valores.email.trim(),
      senha: valores.senha,
    };
    try {
      await criar.mutateAsync(request);
      // Como no Angular: o POST não devolve o paciente, então ele é achado pelo email.
      const { data } = await pacientes.refetch();
      const criado = data?.find((p) => p.email.toLowerCase() === request.email.toLowerCase());
      if (criado) {
        props.onCadastrado(criado);
      }
    } catch (e) {
      setErro(mensagemErroCadastroRapido(e));
    }
  }

  const campo = (nome: CadastroCampos) => ({
    value: valores[nome],
    onChangeText: (v: string) => {
      setValores((a) => ({ ...a, [nome]: v }));
      setErros((a) => ({ ...a, [nome]: undefined }));
    },
    error: erros[nome],
    testID: `rapido-${nome}`,
  });

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.subtitulo}>Cadastrar novo paciente</Text>
          <TextField label="Nome" {...campo('nome')} />
          <TextField
            label="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            {...campo('email')}
          />
          <TextField
            label="Senha"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="new-password"
            {...campo('senha')}
          />
          {erro ? (
            <Text style={styles.erro} accessibilityRole="alert">
              {erro}
            </Text>
          ) : null}
          <Button
            label={criar.isPending ? 'Cadastrando...' : 'Cadastrar'}
            onPress={() => void cadastrar()}
            loading={criar.isPending || pacientes.isRefetching}
            testID="rapido-cadastrar"
          />
          <Pressable
            onPress={props.onVoltar}
            accessibilityRole="button"
            style={({ pressed }) => [styles.linkBotao, pressed && styles.pressed]}
          >
            <Text style={styles.linkBotaoTexto}>Voltar pra busca</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function FormConsulta({
  paciente,
  onTrocar,
}: {
  paciente: PacienteEscolhido;
  onTrocar?: () => void;
}) {
  const navigation = useNavigation<Navigation>();
  const criar = useCriarConsulta();
  const [valores, setValores] = useState(CONSULTA_VAZIA);
  const [erros, setErros] = useState<Partial<Record<ConsultaCampos, string>>>({});
  const [erro, setErro] = useState<string | null>(null);

  function alterar(campo: ConsultaCampos, valor: string) {
    setValores((a) => ({ ...a, [campo]: valor }));
    setErros((a) => ({ ...a, [campo]: undefined }));
  }

  async function iniciar() {
    const novosErros = validarFormulario(valores, schemaConsulta);
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) {
      return;
    }
    setErro(null);
    try {
      const id = await criar.mutateAsync(montarConsulta(paciente.id, valores));
      // Como no Angular: a consulta criada abre direto no registro clínico.
      navigation.replace('ConsultaWizard', { id });
    } catch (e) {
      setErro(mensagemErroCriarConsulta(e));
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.pacienteEscolhido}>
          <Text style={styles.meta} testID="consulta-paciente">
            Paciente: {paciente.nome}
          </Text>
          {onTrocar ? (
            <Pressable onPress={onTrocar} accessibilityRole="button" hitSlop={8}>
              <Text style={styles.trocar}>Trocar</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.card}>
          <View style={styles.linha}>
            <View style={styles.flex}>
              <TextField
                label="Data"
                placeholder="DD/MM/AAAA"
                keyboardType="number-pad"
                maxLength={10}
                value={valores.data}
                onChangeText={(v) => alterar('data', mascararData(v))}
                error={erros.data}
                testID="consulta-data"
              />
            </View>
            <View style={styles.hora}>
              <TextField
                label="Hora"
                placeholder="HH:MM"
                keyboardType="number-pad"
                maxLength={5}
                value={valores.hora}
                onChangeText={(v) => alterar('hora', mascararHora(v))}
                error={erros.hora}
                testID="consulta-hora"
              />
            </View>
          </View>
          <OptionChips
            label="Tipo"
            opcoes={TIPO_OPCOES}
            valor={valores.tipo}
            onChange={(v) => alterar('tipo', v)}
            testID="consulta-tipo"
          />
          <TextField
            label="Convênio"
            placeholder="Ex: Particular, Unimed"
            value={valores.convenio}
            onChangeText={(v) => alterar('convenio', v)}
            testID="consulta-convenio"
          />
          <TextField
            label="Valor (R$)"
            placeholder="Ex: 150,00"
            keyboardType="decimal-pad"
            value={valores.valor}
            onChangeText={(v) => alterar('valor', v)}
            error={erros.valor}
            testID="consulta-valor"
          />
          {erro ? (
            <Text style={styles.erro} accessibilityRole="alert" testID="consulta-erro">
              {erro}
            </Text>
          ) : null}
          <Button
            label={criar.isPending ? 'Iniciando...' : 'Iniciar Consulta'}
            onPress={() => void iniciar()}
            loading={criar.isPending}
            testID="consulta-iniciar"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centro: { flex: 1, backgroundColor: colors.bg, padding: spacing.xl },
  content: {
    padding: spacing.xl,
    gap: spacing.lg,
    paddingBottom: spacing.xxxl,
    backgroundColor: colors.bg,
    flexGrow: 1,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.xl,
    gap: spacing.lg,
    ...shadows.card,
  },
  subtitulo: { fontFamily: fonts.bold, fontSize: fontSizes.xl, color: colors.text },
  linha: { flexDirection: 'row', gap: spacing.md },
  hora: { width: 110 },
  pacienteEscolhido: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  meta: { fontFamily: fonts.semibold, fontSize: fontSizes.base, color: colors.text, flex: 1 },
  trocar: { fontFamily: fonts.semibold, fontSize: fontSizes.md, color: colors.primary },
  linkBotao: { paddingVertical: spacing.md, alignItems: 'center' },
  linkBotaoTexto: { fontFamily: fonts.semibold, fontSize: fontSizes.md, color: colors.primary },
  state: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.xxl,
  },
  lista: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
    ...shadows.card,
  },
  pacienteLinha: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: 14 },
  divisor: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  info: { flex: 1, minWidth: 0 },
  nome: { fontFamily: fonts.semibold, fontSize: fontSizes.base, color: colors.text },
  email: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.textSecondary },
  erro: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.danger },
  pressed: { opacity: 0.7 },
});
