import { useQueryClient } from '@tanstack/react-query';
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

import { AdminOnly } from '../../../components/AdminOnly/AdminOnly';
import { Button } from '../../../components/Button/Button';
import { useConfirm } from '../../../components/ConfirmDialog/ConfirmDialog';
import { TextField } from '../../../components/TextField/TextField';
import { queryKeys } from '../../../hooks/queryKeys';
import { pacienteAdminService } from '../../../services/pacienteService';
import { profissionalService } from '../../../services/profissionalService';
import { colors, fontSizes, fonts, radius, spacing } from '../../../theme';
import { validarFormulario } from '../../../utils/validation';
import { ContaSenhaSelector } from './ContaSenhaSelector';
import {
  mensagemErroSenhaAdmin,
  schemaSenhaAdmin,
  senhaPacienteRequest,
  senhaProfissionalRequest,
  type ContaSenha,
  type SenhaAdminCampo,
  type TipoContaSenha,
} from './senhaAdminLogic';

export function CriacaoSenhaAdminScreen() {
  return (
    <AdminOnly>
      <CriacaoSenhaAdmin />
    </AdminOnly>
  );
}

function CriacaoSenhaAdmin() {
  const [tipo, setTipo] = useState<TipoContaSenha>('paciente');
  const [conta, setConta] = useState<ContaSenha | null>(null);

  return (
    <SafeAreaView
      style={styles.safe}
      edges={['bottom', 'left', 'right']}
      testID="admin-criacao-senha"
    >
      {conta ? (
        <FormularioSenha
          key={`${conta.tipo}:${conta.id}`}
          conta={conta}
          onVoltar={() => setConta(null)}
        />
      ) : (
        <View style={styles.selection}>
          <Text style={styles.title} accessibilityRole="header">
            Criação de senha
          </Text>
          <Text style={styles.hint}>
            Selecione a conta de paciente ou profissional para definir uma nova senha.
          </Text>
          <View
            style={styles.tabs}
            accessibilityRole="radiogroup"
            accessibilityLabel="Categoria da conta"
          >
            {(['paciente', 'profissional'] as const).map((categoria) => (
              <Pressable
                key={categoria}
                accessibilityRole="radio"
                accessibilityState={{ checked: tipo === categoria }}
                testID={`admin-senha-tipo-${categoria}`}
                onPress={() => setTipo(categoria)}
                style={[styles.tab, tipo === categoria && styles.activeTab]}
              >
                <Text style={[styles.tabText, tipo === categoria && styles.activeText]}>
                  {categoria === 'paciente' ? 'Pacientes' : 'Profissionais'}
                </Text>
              </Pressable>
            ))}
          </View>
          <ContaSenhaSelector key={tipo} tipo={tipo} onSelect={setConta} />
        </View>
      )}
    </SafeAreaView>
  );
}

function FormularioSenha({ conta, onVoltar }: { conta: ContaSenha; onVoltar: () => void }) {
  const queryClient = useQueryClient();
  const confirmar = useConfirm();
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erros, setErros] = useState<Partial<Record<SenhaAdminCampo, string>>>({});
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const bloqueado = useRef(false);
  const montado = useRef(true);

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  async function salvar() {
    if (bloqueado.current) {
      return;
    }
    const novosErros = validarFormulario({ senha, confirmacao }, schemaSenhaAdmin(senha));
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) {
      return;
    }
    bloqueado.current = true;
    setOcupado(true);
    setErro(null);

    try {
      // O PUT exige os demais campos. Buscar novamente evita reenviar o retrato antigo da lista.
      let gravar: () => Promise<void>;
      let identidade: { nome: string; email: string };
      if (conta.tipo === 'paciente') {
        const paciente = await pacienteAdminService.buscarPorId(conta.id);
        const request = senhaPacienteRequest(paciente, senha);
        identidade = paciente;
        gravar = () => pacienteAdminService.atualizar(conta.id, request);
      } else {
        const profissional = await profissionalService.buscarPorId(conta.id);
        const request = senhaProfissionalRequest(profissional, senha);
        identidade = profissional;
        gravar = () => profissionalService.atualizar(conta.id, request);
      }
      if (!montado.current) {
        return;
      }
      const confirmado = await confirmar({
        titulo: 'Confirmar criação de senha',
        mensagem: `Definir uma nova senha para ${identidade.nome} (${identidade.email}), ${conta.tipo} ID ${conta.id}? A senha anterior será substituída e as sessões dessa conta serão encerradas.`,
        confirmarLabel: 'Definir senha',
        destrutivo: false,
      });
      if (!confirmado || !montado.current) {
        return;
      }
      await gravar();
      if (montado.current) {
        setSenha('');
        setConfirmacao('');
        setSucesso(true);
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.adminPacientes.todos }),
        ...(conta.tipo === 'profissional'
          ? [queryClient.invalidateQueries({ queryKey: queryKeys.profissionais.todos })]
          : []),
      ]);
    } catch (error) {
      if (montado.current) {
        setErro(mensagemErroSenhaAdmin(error));
      }
    } finally {
      bloqueado.current = false;
      if (montado.current) {
        setOcupado(false);
      }
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title} accessibilityRole="header">
            {conta.nome}
          </Text>
          <Text style={styles.hint}>{conta.email}</Text>
          <Text style={styles.hint}>
            {conta.tipo === 'paciente' ? 'Paciente' : 'Profissional'} · ID {conta.id}
          </Text>
        </View>
        {sucesso ? (
          <Text style={styles.message} accessibilityRole="alert" testID="admin-senha-sucesso">
            Senha definida com sucesso. A conta deverá usar a nova senha no próximo acesso.
          </Text>
        ) : (
          <View style={styles.card}>
            <Text style={styles.hint}>
              Defina uma senha de 8 a 100 caracteres. Não é necessário informar a senha anterior.
            </Text>
            <TextField
              label="Nova senha"
              value={senha}
              onChangeText={(valor) => {
                setSenha(valor);
                setErros({});
              }}
              error={erros.senha}
              secureTextEntry
              autoComplete="new-password"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={100}
              editable={!ocupado}
              testID="admin-senha-nova"
            />
            <TextField
              label="Confirmar nova senha"
              value={confirmacao}
              onChangeText={(valor) => {
                setConfirmacao(valor);
                setErros((atual) => ({ ...atual, confirmacao: undefined }));
              }}
              error={erros.confirmacao}
              secureTextEntry
              autoComplete="new-password"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={100}
              editable={!ocupado}
              testID="admin-senha-confirmacao"
            />
            <Text style={styles.hint}>A redefinição encerra as sessões da conta selecionada.</Text>
            {erro ? (
              <Text style={styles.error} accessibilityRole="alert" testID="admin-senha-erro">
                {erro}
              </Text>
            ) : null}
            <Button
              label={ocupado ? 'Aguarde...' : 'Definir senha'}
              loading={ocupado}
              onPress={() => void salvar()}
              testID="admin-senha-salvar"
            />
          </View>
        )}
        <Button
          label={sucesso ? 'Definir senha de outra conta' : 'Escolher outra conta'}
          variant="secondary"
          disabled={ocupado}
          onPress={onVoltar}
          testID="admin-senha-outra-conta"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  selection: { flex: 1, padding: spacing.xl, gap: spacing.lg },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.lg },
  card: {
    padding: spacing.xl,
    gap: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  title: { fontFamily: fonts.bold, fontSize: fontSizes.xl, color: colors.text },
  hint: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  error: { fontFamily: fonts.medium, fontSize: fontSizes.md, color: colors.danger },
  message: { fontFamily: fonts.medium, fontSize: fontSizes.md, color: colors.text, lineHeight: 24 },
  tabs: { flexDirection: 'row', gap: spacing.sm },
  tab: {
    padding: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeTab: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontFamily: fonts.semibold, color: colors.text },
  activeText: { color: colors.textInverse },
});
