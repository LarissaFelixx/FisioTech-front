import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../../components/Button/Button';
import { AdminOnly } from '../../../components/AdminOnly/AdminOnly';
import { useCriarProfissional } from '../../../hooks/useProfissionais';
import type { AdminStackParamList } from '../../../navigation/types';
import { colors, fontSizes, fonts, spacing } from '../../../theme';
import { validarFormulario } from '../../../utils/validation';
import { ProfissionalFields } from './ProfissionalFields';
import {
  PROFISSIONAL_VAZIO,
  mensagemErroProfissional,
  montarCriacaoProfissional,
  schemaProfissional,
  type ProfissionalCampo,
} from './profissionalLogic';

type Navigation = NativeStackNavigationProp<AdminStackParamList>;

/** O acesso é verificado antes de montar o formulário e seus hooks. */
export function NovoProfissionalScreen() {
  return (
    <AdminOnly>
      <NovoProfissionalForm />
    </AdminOnly>
  );
}

function NovoProfissionalForm() {
  const navigation = useNavigation<Navigation>();
  const criar = useCriarProfissional();
  const [valores, setValores] = useState(() => ({ ...PROFISSIONAL_VAZIO }));
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
      },
      schemaProfissional(false),
    );
    setErros(errosAtuais);
    if (Object.keys(errosAtuais).length > 0) {
      return;
    }

    bloqueado.current = true;
    setOcupado(true);
    setErro(null);

    try {
      await criar.mutateAsync(montarCriacaoProfissional(valores));
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

  return (
    <SafeAreaView
      style={styles.flex}
      edges={['bottom', 'left', 'right']}
      testID="admin-novo-profissional"
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ProfissionalFields
            valores={valores}
            erros={erros}
            ocupado={ocupado}
            editando={false}
            alterar={alterar}
          />
          {erro ? (
            <Text style={styles.error} accessibilityRole="alert" testID="admin-profissional-erro">
              {erro}
            </Text>
          ) : null}
          <Button
            label={ocupado ? 'Aguarde...' : 'Cadastrar profissional'}
            onPress={() => void salvar()}
            loading={ocupado}
            testID="admin-profissional-salvar"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl, gap: spacing.lg },
  error: { fontFamily: fonts.medium, fontSize: fontSizes.md, color: colors.danger },
});
