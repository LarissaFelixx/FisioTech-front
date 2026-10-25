import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
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
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../../components/Button/Button';
import { TextField } from '../../../components/TextField/TextField';
import { VoltarLink } from '../../../components/VoltarLink/VoltarLink';
import { useAvaliarConsulta, useMinhaConsulta } from '../../../hooks/useMe';
import type { PacienteStackParamList } from '../../../navigation/types';
import { colors, fontSizes, fonts, radius, shadows, spacing } from '../../../theme';
import {
  MAX_COMENTARIO,
  mensagemErroAvaliar,
  montarAvaliacao,
  subtituloAvaliacao,
  textoNota,
} from './avaliacaoLogic';

type Rota = RouteProp<PacienteStackParamList, 'AvaliarConsulta'>;

/** Avaliar Atendimento (#43, Figma "20c Avaliar Atendimento"). */
export function AvaliarAtendimentoScreen() {
  const { params } = useRoute<Rota>();
  const navigation = useNavigation();
  // Já está em cache: a avaliação é aberta a partir do detalhe da consulta.
  const consulta = useMinhaConsulta(params.consultaId);
  const avaliar = useAvaliarConsulta();
  const [nota, setNota] = useState<number | null>(null);
  const [comentario, setComentario] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  async function enviar() {
    if (!nota) {
      return;
    }
    setErro(null);
    try {
      await avaliar.mutateAsync(montarAvaliacao(params.consultaId, nota, comentario));
      navigation.goBack();
    } catch (e) {
      setErro(mensagemErroAvaliar(e));
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <VoltarLink label="Consulta" onPress={() => navigation.goBack()} />
          <View>
            <Text style={styles.titulo} accessibilityRole="header">
              Avaliar atendimento
            </Text>
            {consulta.data ? (
              <Text style={styles.subtitulo}>{subtituloAvaliacao(consulta.data)}</Text>
            ) : null}
          </View>

          <View style={styles.card}>
            <View style={styles.estrelas} accessibilityRole="radiogroup" accessibilityLabel="Nota">
              {[1, 2, 3, 4, 5].map((n) => {
                const marcada = nota !== null && n <= nota;
                return (
                  <Pressable
                    key={n}
                    onPress={() => setNota(n)}
                    accessibilityRole="radio"
                    accessibilityLabel={`${n} de 5`}
                    accessibilityState={{ checked: nota === n }}
                    hitSlop={4}
                    testID={`estrela-${n}`}
                  >
                    <Text style={[styles.estrela, marcada && styles.estrelaMarcada]}>★</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.nota} testID="avaliacao-nota">
              {textoNota(nota)}
            </Text>
          </View>

          <TextField
            label="Comentário (opcional)"
            placeholder={`Conte como foi sua consulta (até ${MAX_COMENTARIO} caracteres)`}
            multiline
            numberOfLines={4}
            maxLength={MAX_COMENTARIO}
            value={comentario}
            onChangeText={setComentario}
            testID="avaliacao-comentario"
          />

          {erro ? (
            <Text style={styles.erro} accessibilityRole="alert" testID="avaliacao-erro">
              {erro}
            </Text>
          ) : null}
        </ScrollView>

        <View style={styles.rodape}>
          <Button
            label={avaliar.isPending ? 'Enviando...' : 'Enviar avaliação'}
            onPress={() => void enviar()}
            disabled={!nota}
            loading={avaliar.isPending}
            testID="avaliacao-enviar"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  content: { padding: spacing.xl, gap: spacing.lg },
  titulo: {
    fontFamily: fonts.extrabold,
    fontSize: fontSizes.xxl,
    letterSpacing: -0.5,
    color: colors.text,
  },
  subtitulo: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.textSecondary },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.card,
  },
  estrelas: { flexDirection: 'row', gap: spacing.md },
  estrela: { fontSize: 36, color: colors.border },
  estrelaMarcada: { color: colors.estrela },
  nota: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.textSecondary },
  erro: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.danger },
  rodape: {
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
});
