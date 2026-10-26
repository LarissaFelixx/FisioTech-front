import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
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
import { ErrorState } from '../../../components/ErrorState/ErrorState';
import { Skeleton } from '../../../components/Skeleton/Skeleton';
import { TextField } from '../../../components/TextField/TextField';
import {
  useAtualizarProfissional,
  useCriarProfissional,
  useDeletarProfissional,
  useProfissional,
} from '../../../hooks/useProfissionais';
import type { AdminStackParamList } from '../../../navigation/types';
import { colors, fontSizes, fonts, radius, spacing } from '../../../theme';
import type { Profissional } from '../../../types/profissional';
import { formatDataBr, mascararData, parseDataHora } from '../../../utils/date';
import { validarFormulario } from '../../../utils/validation';
import {
  PROFISSIONAL_VAZIO,
  correcoesSensiveis,
  mensagemErroProfissional,
  montarAtualizacaoProfissional,
  montarCriacaoProfissional,
  schemaProfissional,
  valoresDoProfissional,
  type ProfissionalCampo,
  type ProfissionalFormValues,
} from './profissionalLogic';

type Navigation = NativeStackNavigationProp<AdminStackParamList>;

export function ProfissionalFormScreen() {
  return (
    <AdminOnly>
      <ProfissionalFormRoute />
    </AdminOnly>
  );
}

function ProfissionalFormRoute() {
  const navigation = useNavigation<Navigation>();
  const { params } = useRoute<RouteProp<AdminStackParamList, 'ProfissionalForm'>>();
  const id = params?.id;

  useLayoutEffect(() => {
    navigation.setOptions({ title: id == null ? 'Novo profissional' : 'Editar profissional' });
  }, [navigation, id]);

  if (id == null) {
    return <ProfissionalEditor inicial={PROFISSIONAL_VAZIO} />;
  }
  if (!Number.isSafeInteger(id) || id <= 0) {
    return (
      <View style={styles.state}>
        <ErrorState message="Profissional inválido. Volte à lista." />
      </View>
    );
  }
  return <CarregarProfissional id={id} />;
}

function CarregarProfissional({ id }: { id: number }) {
  const query = useProfissional(id);

  if (query.isPending) {
    return (
      <View style={styles.state}>
        <Skeleton variant="form" count={6} />
      </View>
    );
  }
  if (query.isError) {
    return (
      <View style={styles.state}>
        <ErrorState
          message={mensagemErroProfissional(query.error, 'carregar')}
          onRetry={() => void query.refetch()}
          retrying={query.isRefetching}
        />
      </View>
    );
  }

  return (
    <ProfissionalEditor
      key={query.data.id}
      inicial={valoresDoProfissional(query.data)}
      profissional={query.data}
    />
  );
}

function ProfissionalEditor({
  inicial,
  profissional,
}: {
  inicial: ProfissionalFormValues;
  profissional?: Profissional;
}) {
  const navigation = useNavigation<Navigation>();
  const confirmar = useConfirm();
  const criar = useCriarProfissional();
  const atualizar = useAtualizarProfissional();
  const deletar = useDeletarProfissional();
  const [valores, setValores] = useState(inicial);
  const [erros, setErros] = useState<Partial<Record<ProfissionalCampo, string>>>({});
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const bloqueado = useRef(false);
  const montado = useRef(true);
  const editando = profissional !== undefined;

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  function alterar(campo: ProfissionalCampo, valor: string) {
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
        senha: editando && !valores.senha.trim() ? '' : valores.senha,
      },
      schemaProfissional(editando),
    );
    setErros(errosAtuais);
    if (Object.keys(errosAtuais).length > 0) {
      return;
    }

    bloqueado.current = true;
    setOcupado(true);
    setErro(null);

    try {
      const correcoes = profissional ? correcoesSensiveis(profissional, valores) : [];
      if (correcoes.length > 0) {
        const confirmado = await confirmar({
          titulo: 'Confirmar correção administrativa',
          mensagem: `Você está alterando: ${correcoes.join(', ')}. Confirme a substituição dos dados de ${profissional?.nome}.`,
          confirmarLabel: 'Aplicar correção',
          destrutivo: false,
        });
        if (!confirmado || !montado.current) {
          return;
        }
      }

      if (profissional) {
        await atualizar.mutateAsync({
          id: profissional.id,
          request: montarAtualizacaoProfissional(valores),
        });
      } else {
        await criar.mutateAsync(montarCriacaoProfissional(valores));
      }
      if (montado.current) {
        navigation.goBack();
      }
    } catch (error) {
      if (montado.current) {
        setErro(mensagemErroProfissional(error, 'salvar'));
      }
    } finally {
      bloqueado.current = false;
      if (montado.current) {
        setOcupado(false);
      }
    }
  }

  async function excluir() {
    if (!profissional || bloqueado.current) {
      return;
    }
    bloqueado.current = true;
    setOcupado(true);
    setErro(null);

    try {
      const confirmado = await confirmar({
        titulo: 'Excluir profissional',
        mensagem: `Excluir o perfil de ${profissional.nome}? Essa ação não pode ser desfeita. Registros vinculados impedem a exclusão.`,
        confirmarLabel: 'Excluir',
      });
      if (!confirmado || !montado.current) {
        return;
      }
      await deletar.mutateAsync(profissional.id);
      if (montado.current) {
        navigation.goBack();
      }
    } catch (error) {
      if (montado.current) {
        setErro(mensagemErroProfissional(error, 'excluir'));
      }
    } finally {
      bloqueado.current = false;
      if (montado.current) {
        setOcupado(false);
      }
    }
  }

  const campo = (nome: ProfissionalCampo) => ({
    value: valores[nome],
    onChangeText: (valor: string) => alterar(nome, valor),
    error: erros[nome],
    editable: !ocupado,
    testID: `admin-profissional-${nome}`,
  });

  return (
    <SafeAreaView style={styles.flex} edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {profissional ? (
            <Text style={styles.meta}>
              ID {profissional.id} · Cadastrado em{' '}
              {formatDataBr(parseDataHora(profissional.dataCriacao))}
            </Text>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.section} accessibilityRole="header">
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
              label="Registro profissional"
              maxLength={20}
              autoCapitalize="characters"
              {...campo('registroProfissional')}
            />
            <TextField label="Especialidade" maxLength={120} {...campo('especialidade')} />
            <TextField
              label={editando ? 'Nova senha' : 'Senha inicial'}
              placeholder={editando ? 'Em branco mantém a senha atual' : 'Pelo menos 8 caracteres'}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              maxLength={100}
              {...campo('senha')}
            />
            {editando ? (
              <Text style={styles.hint}>
                O ADM pode definir uma nova senha sem informar a anterior. A redefinição encerra as
                sessões do profissional.
              </Text>
            ) : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.section} accessibilityRole="header">
              Atendimento
            </Text>
            <TextField
              label="Valor da consulta particular (R$)"
              placeholder="Ex.: 150,00"
              keyboardType="decimal-pad"
              {...campo('valorConsultaParticular')}
            />
            <TextField
              label="Convênios aceitos"
              placeholder="Um convênio por linha"
              multiline
              numberOfLines={4}
              {...campo('conveniosAceitos')}
            />
            <Text style={styles.hint}>
              Deixe os convênios em branco para remover todos. Valor zero é aceito; em branco, fica
              não informado.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.section} accessibilityRole="header">
              Dados pessoais e contato
            </Text>
            <TextField
              label="Data de nascimento"
              placeholder="DD/MM/AAAA"
              keyboardType="number-pad"
              maxLength={10}
              {...campo('dataNascimento')}
              onChangeText={(valor) => alterar('dataNascimento', mascararData(valor))}
            />
            <TextField label="Sexo" {...campo('sexo')} />
            <TextField label="Telefone" keyboardType="phone-pad" {...campo('telefone')} />
            <TextField
              label="Foto (URL)"
              placeholder="https://..."
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
              {...campo('foto')}
            />
          </View>

          {erro ? (
            <Text style={styles.error} accessibilityRole="alert" testID="admin-profissional-erro">
              {erro}
            </Text>
          ) : null}
          <Button
            label={ocupado ? 'Aguarde...' : 'Salvar profissional'}
            onPress={() => void salvar()}
            loading={ocupado}
            testID="admin-profissional-salvar"
          />
          {profissional ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Excluir profissional"
              accessibilityState={{ disabled: ocupado }}
              disabled={ocupado}
              testID="admin-profissional-excluir"
              onPress={() => void excluir()}
              style={({ pressed }) => [styles.delete, pressed && styles.pressed]}
            >
              <Text style={styles.deleteText}>Excluir profissional</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  state: { flex: 1, backgroundColor: colors.bg, padding: spacing.xl },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.lg },
  card: {
    padding: spacing.xl,
    gap: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  section: { fontFamily: fonts.bold, fontSize: fontSizes.xl, color: colors.text },
  meta: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.textSecondary },
  hint: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  error: { fontFamily: fonts.medium, fontSize: fontSizes.md, color: colors.danger },
  delete: { paddingVertical: spacing.lg, alignItems: 'center' },
  deleteText: { fontFamily: fonts.bold, fontSize: fontSizes.md, color: colors.danger },
  pressed: { opacity: 0.7 },
});
