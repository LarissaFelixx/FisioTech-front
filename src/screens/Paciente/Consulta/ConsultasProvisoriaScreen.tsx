import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorState } from '../../../components/ErrorState/ErrorState';
import { Skeleton } from '../../../components/Skeleton/Skeleton';
import { StatusBadge } from '../../../components/StatusBadge/StatusBadge';
import { useMinhasConsultas } from '../../../hooks/useMe';
import { useRefetchOnFocus } from '../../../hooks/useRefetchOnFocus';
import type { PacienteStackParamList } from '../../../navigation/types';
import { colors, fontSizes, fonts, radius, shadows, spacing } from '../../../theme';
import { metaConsulta } from './consultaPacienteLogic';

/**
 * Lista provisória das consultas do paciente, só para abrir o detalhe (#41). A tela "Minhas
 * Consultas" de verdade (busca, marcar consulta etc.) é a atividade #39.
 */
export function ConsultasProvisoriaScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<PacienteStackParamList>>();
  const consultas = useMinhasConsultas();
  useRefetchOnFocus(consultas.refetch);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={consultas.isRefetching}
            onRefresh={() => void consultas.refetch()}
            colors={[colors.primary]}
          />
        }
      >
        <Text style={styles.titulo} accessibilityRole="header">
          Minhas Consultas
        </Text>
        <Text style={styles.aviso}>
          Lista provisória: a tela completa chega com a atividade #39.
        </Text>

        {consultas.isPending ? (
          <Skeleton variant="list" count={4} />
        ) : consultas.isError ? (
          <ErrorState
            message="Não foi possível carregar suas consultas."
            onRetry={() => void consultas.refetch()}
            retrying={consultas.isRefetching}
          />
        ) : consultas.data.length === 0 ? (
          <Text style={styles.aviso}>Você ainda não tem consultas.</Text>
        ) : (
          <View style={styles.lista}>
            {consultas.data.map((c, i) => {
              const meta = metaConsulta(c);
              return (
                <Pressable
                  key={c.id}
                  onPress={() => navigation.navigate('ConsultaDetalhe', { id: c.id })}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.linha,
                    i < consultas.data.length - 1 && styles.divisor,
                    pressed && styles.pressed,
                  ]}
                  testID={`minha-consulta-${c.id}`}
                >
                  <View style={styles.info}>
                    <Text style={styles.quando}>
                      {meta.data} {meta.hora} · {meta.modalidade}
                    </Text>
                    <Text style={styles.detalhe}>{c.profissionalNome}</Text>
                  </View>
                  <StatusBadge status={c.status} />
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, gap: spacing.md },
  titulo: {
    fontFamily: fonts.extrabold,
    fontSize: fontSizes.xxl,
    letterSpacing: -0.5,
    color: colors.text,
  },
  aviso: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.textSecondary },
  lista: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
    ...shadows.card,
  },
  linha: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  divisor: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  info: { flex: 1, minWidth: 0, gap: 2 },
  quando: { fontFamily: fonts.semibold, fontSize: fontSizes.md, color: colors.text },
  detalhe: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.textSecondary },
  pressed: { opacity: 0.7 },
});
