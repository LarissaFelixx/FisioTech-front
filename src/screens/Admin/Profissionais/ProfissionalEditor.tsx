import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../../components/Button/Button';
import { useConfirm } from '../../../components/ConfirmDialog/ConfirmDialog';
import { useAtualizarProfissional, useDeletarProfissional } from '../../../hooks/useProfissionais';
import type { AdminStackParamList } from '../../../navigation/types';
import { colors, fontSizes, fonts, spacing } from '../../../theme';
import type { Profissional } from '../../../types/profissional';
import { formatDataBr, parseDataHora } from '../../../utils/date';
import { validarFormulario } from '../../../utils/validation';
import { ProfissionalFields } from './ProfissionalFields';
import {
  correcoesSensiveis,
  mensagemErroProfissional,
  montarAtualizacaoProfissional,
  schemaProfissional,
  valoresDoProfissional,
  type ProfissionalCampo,
} from './profissionalLogic';

type Navigation = NativeStackNavigationProp<AdminStackParamList>;

type Props = { profissional: Profissional };

/** Edição e exclusão de um profissional existente. */
export function ProfissionalEditor({ profissional }: Props) {
  const navigation = useNavigation<Navigation>();
  const confirmar = useConfirm();
  const atualizar = useAtualizarProfissional();
  const deletar = useDeletarProfissional();
  const [valores, setValores] = useState(() => valoresDoProfissional(profissional));
  const [erros, setErros] = useState<Partial<Record<ProfissionalCampo, string>>>({});
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
        senha: !valores.senha.trim() ? '' : valores.senha,
      },
      schemaProfissional(true),
    );
    setErros(errosAtuais);
    if (Object.keys(errosAtuais).length > 0) {
      return;
    }

    bloqueado.current = true;
    setOcupado(true);
    setErro(null);

    try {
      const correcoes = correcoesSensiveis(profissional, valores);
      if (correcoes.length > 0) {
        const confirmado = await confirmar({
          titulo: 'Confirmar correção administrativa',
          mensagem: `Você está alterando: ${correcoes.join(', ')}. Confirme a substituição dos dados de ${profissional.nome}.`,
          confirmarLabel: 'Aplicar correção',
          destrutivo: false,
        });
        if (!confirmado || !montado.current) {
          return;
        }
      }

      await atualizar.mutateAsync({
        id: profissional.id,
        request: montarAtualizacaoProfissional(valores),
      });
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
    if (bloqueado.current) {
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

  return (
    <SafeAreaView
      style={styles.flex}
      edges={['bottom', 'left', 'right']}
      testID="admin-editar-profissional"
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.meta}>
            ID {profissional.id} · Cadastrado em{' '}
            {formatDataBr(parseDataHora(profissional.dataCriacao))}
          </Text>

          <ProfissionalFields
            valores={valores}
            erros={erros}
            ocupado={ocupado}
            editando
            alterar={alterar}
          />

          {erro ? (
            <Text style={styles.error} accessibilityRole="alert" testID="admin-profissional-erro">
              {erro}
            </Text>
          ) : null}
          <Button
            label={ocupado ? 'Aguarde...' : 'Salvar alterações'}
            onPress={() => void salvar()}
            loading={ocupado}
            testID="admin-profissional-salvar"
          />
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.lg },
  meta: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.textSecondary },
  error: { fontFamily: fonts.medium, fontSize: fontSizes.md, color: colors.danger },
  delete: { paddingVertical: spacing.lg, alignItems: 'center' },
  deleteText: { fontFamily: fonts.bold, fontSize: fontSizes.md, color: colors.danger },
  pressed: { opacity: 0.7 },
});
