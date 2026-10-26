import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdminOnly } from '../../../components/AdminOnly/AdminOnly';
import { Button } from '../../../components/Button/Button';
import { useConfirm } from '../../../components/ConfirmDialog/ConfirmDialog';
import { ErrorState } from '../../../components/ErrorState/ErrorState';
import { Skeleton } from '../../../components/Skeleton/Skeleton';
import { TextField } from '../../../components/TextField/TextField';
import { useAtualizarPacienteAdmin, usePacienteAdmin } from '../../../hooks/usePacientes';
import { useProfissionais } from '../../../hooks/useProfissionais';
import type { AdminStackParamList } from '../../../navigation/types';
import { colors, fontSizes, fonts, radius, spacing } from '../../../theme';
import type { Paciente } from '../../../types/paciente';
import type { Profissional } from '../../../types/profissional';
import { formatDataBr, isoParaDataBr, parseDataHora } from '../../../utils/date';
import { validarFormulario } from '../../../utils/validation';
import { ProfissionalResponsavelField } from './ProfissionalResponsavelField';
import {
  correcoesPacienteAdmin,
  mensagemErroPacienteAdmin,
  montarAtualizacaoPacienteAdmin,
  schemaPacienteAdmin,
  valoresPacienteAdmin,
  type PacienteAdminCampo,
} from './pacienteAdminLogic';

export function EditarPacienteAdminScreen() {
  return (
    <AdminOnly>
      <EditarPacienteRoute />
    </AdminOnly>
  );
}

function EditarPacienteRoute() {
  const { params } = useRoute<RouteProp<AdminStackParamList, 'EditarPaciente'>>();
  const id = params?.id;
  if (!Number.isSafeInteger(id) || id <= 0) {
    return (
      <View style={styles.state}>
        <ErrorState message="Paciente inválido. Volte à lista." />
      </View>
    );
  }
  return <CarregarPaciente id={id} />;
}

function CarregarPaciente({ id }: { id: number }) {
  const paciente = usePacienteAdmin(id);
  const profissionais = useProfissionais();

  // Falhas de autorização ocultam inclusive dados de consultas anteriores em cache.
  if (paciente.isError) {
    return (
      <View style={styles.state}>
        <ErrorState
          message={mensagemErroPacienteAdmin(paciente.error)}
          onRetry={() => void paciente.refetch()}
          retrying={paciente.isRefetching}
        />
      </View>
    );
  }
  if (profissionais.isError) {
    return (
      <View style={styles.state}>
        <ErrorState
          message="Não foi possível carregar os profissionais responsáveis."
          onRetry={() => void profissionais.refetch()}
          retrying={profissionais.isRefetching}
        />
      </View>
    );
  }
  if (paciente.isPending || profissionais.isPending) {
    return (
      <View style={styles.state}>
        <Skeleton variant="form" count={4} />
      </View>
    );
  }

  return (
    <EditarPacienteForm
      key={paciente.data.id}
      paciente={paciente.data}
      profissionais={profissionais.data}
    />
  );
}

function EditarPacienteForm({
  paciente,
  profissionais,
}: {
  paciente: Paciente;
  profissionais: Profissional[];
}) {
  const navigation = useNavigation<NativeStackNavigationProp<AdminStackParamList>>();
  const confirmar = useConfirm();
  const atualizar = useAtualizarPacienteAdmin();
  const [valores, setValores] = useState(() => valoresPacienteAdmin(paciente));
  const [erros, setErros] = useState<Partial<Record<PacienteAdminCampo, string>>>({});
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const bloqueado = useRef(false);
  const montado = useRef(true);

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  function alterar(campo: PacienteAdminCampo, valor: string) {
    setValores((atual) => ({ ...atual, [campo]: valor }));
    setErros((atual) => ({ ...atual, [campo]: undefined }));
  }

  async function salvar() {
    if (bloqueado.current) {
      return;
    }
    const errosAtuais = validarFormulario(
      {
        ...valores,
        email: valores.email.trim(),
        senha: valores.senha.trim() ? valores.senha : '',
      },
      schemaPacienteAdmin(profissionais),
    );
    setErros(errosAtuais);
    if (Object.keys(errosAtuais).length > 0) {
      return;
    }

    bloqueado.current = true;
    setOcupado(true);
    setErro(null);
    try {
      const correcoes = correcoesPacienteAdmin(paciente, valores);
      if (correcoes.length > 0) {
        const confirmado = await confirmar({
          titulo: 'Confirmar correção administrativa',
          mensagem: `Você está alterando: ${correcoes.join(', ')}. Confirme a substituição dos dados de ${paciente.nome}.`,
          confirmarLabel: 'Aplicar correção',
          destrutivo: false,
        });
        if (!confirmado || !montado.current) {
          return;
        }
      }
      await atualizar.mutateAsync({
        id: paciente.id,
        request: montarAtualizacaoPacienteAdmin(valores),
      });
      if (montado.current) {
        navigation.goBack();
      }
    } catch (error) {
      if (montado.current) {
        setErro(mensagemErroPacienteAdmin(error));
      }
    } finally {
      bloqueado.current = false;
      if (montado.current) {
        setOcupado(false);
      }
    }
  }

  const campo = (nome: PacienteAdminCampo) => ({
    value: valores[nome],
    onChangeText: (valor: string) => alterar(nome, valor),
    error: erros[nome],
    editable: !ocupado,
    testID: `admin-paciente-${nome}`,
  });

  return (
    <SafeAreaView
      style={styles.flex}
      edges={['bottom', 'left', 'right']}
      testID="admin-editar-paciente"
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.hint}>
            ID {paciente.id} · Cadastrado em {formatDataBr(parseDataHora(paciente.dataCriacao))}
          </Text>
          <View style={styles.card}>
            <Text style={styles.title} accessibilityRole="header">
              Identificação e acesso
            </Text>
            <TextField label="Nome" autoComplete="name" maxLength={120} {...campo('nome')} />
            <TextField
              label="Email de acesso"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={120}
              {...campo('email')}
            />
            <TextField
              label="Nova senha"
              placeholder="Em branco mantém a senha atual"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              maxLength={100}
              {...campo('senha')}
            />
            <Text style={styles.hint}>
              O ADM pode redefinir a senha sem informar a anterior. A redefinição encerra as sessões
              do paciente.
            </Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.title} accessibilityRole="header">
              Vínculo profissional
            </Text>
            <ProfissionalResponsavelField
              profissionais={profissionais}
              valor={valores.profissionalId}
              onChange={(id) => alterar('profissionalId', id)}
              disabled={ocupado}
              erro={erros.profissionalId}
            />
            {profissionais.length === 0 ? (
              <Text style={styles.hint}>
                Nenhum profissional disponível. Cadastre um profissional na área administrativa para
                salvar o vínculo.
              </Text>
            ) : null}
            <Text style={styles.hint}>
              O profissional responsável é obrigatório para salvar as alterações.
            </Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.title} accessibilityRole="header">
              Dados de perfil
            </Text>
            <Text style={styles.hint}>
              Informações para consulta; a edição administrativa disponível permite corrigir
              identificação, acesso e vínculo.
            </Text>
            <Text style={styles.hint}>
              Nascimento: {isoParaDataBr(paciente.dataNascimento) || 'Não informado'}
            </Text>
            {(
              [
                ['Sexo', paciente.sexo],
                ['Profissão', paciente.profissao],
                ['Telefone', paciente.telefone],
                ['Endereço', paciente.endereco],
                ['Bairro', paciente.bairro],
                ['Foto (URL)', paciente.foto],
              ] as const
            ).map(([label, valor]) => (
              <Text key={label} style={styles.hint}>
                {label}: {valor || 'Não informado'}
              </Text>
            ))}
          </View>
          {erro ? (
            <Text style={styles.error} accessibilityRole="alert" testID="admin-paciente-erro">
              {erro}
            </Text>
          ) : null}
          <Button
            label={ocupado ? 'Aguarde...' : 'Salvar alterações'}
            loading={ocupado}
            onPress={() => void salvar()}
            testID="admin-paciente-salvar"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  state: { flex: 1, padding: spacing.xl, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.lg },
  card: {
    padding: spacing.xl,
    gap: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  title: { fontFamily: fonts.bold, fontSize: fontSizes.xl, color: colors.text },
  hint: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  error: { fontFamily: fonts.medium, fontSize: fontSizes.md, color: colors.danger },
});
