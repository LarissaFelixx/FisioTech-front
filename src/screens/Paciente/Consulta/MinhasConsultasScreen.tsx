import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorState } from '../../../components/ErrorState/ErrorState';
import { Icon } from '../../../components/Icon/Icon';
import { Segmentado } from '../../../components/Segmentado/Segmentado';
import { Skeleton } from '../../../components/Skeleton/Skeleton';
import { StatusBadge } from '../../../components/StatusBadge/StatusBadge';
import { useMinhasConsultas } from '../../../hooks/useMe';
import { useRefetchOnFocus } from '../../../hooks/useRefetchOnFocus';
import type { PacienteStackParamList } from '../../../navigation/types';
import { colors, fontSizes, fonts, radius, shadows, spacing } from '../../../theme';
import { clock } from '../../../utils/clock';
import {
  OPCOES_FILTRO,
  consultasDoFiltro,
  linhaConsulta,
  mensagemListaVazia,
  type FiltroConsultas,
} from './minhasConsultasLogic';

/**
 * Minhas Consultas (#39, Figma "18 Minhas Consultas"): botão "Marcar Consulta" e a lista das
 * consultas do paciente com o status; tocar numa consulta abre o detalhe. O filtro
 * "Todas | Próximas | Realizadas" (S5-04) não está no Figma.
 */
export function MinhasConsultasScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<PacienteStackParamList>>();
  const consultas = useMinhasConsultas();
  useRefetchOnFocus(consultas.refetch);

  const [filtro, setFiltro] = useState<FiltroConsultas>('todas');

  const lista = consultas.data ? consultasDoFiltro(consultas.data, filtro, clock.agora()) : [];

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

        <Pressable
          onPress={() => navigation.navigate('MarcarConsulta')}
          accessibilityRole="button"
          style={({ pressed }) => [styles.marcar, pressed && styles.pressed]}
          testID="consultas-marcar"
        >
          <Icon name="calendar-plus" size={18} color={colors.textInverse} />
          <Text style={styles.marcarTexto}>Marcar Consulta</Text>
        </Pressable>

        <Segmentado
          accessibilityLabel="Filtrar consultas"
          opcoes={OPCOES_FILTRO}
          valor={filtro}
          onChange={(valor) => setFiltro(valor as FiltroConsultas)}
          testID="consultas-filtro"
        />

        {consultas.isPending ? (
          <Skeleton variant="list" count={4} />
        ) : consultas.isError ? (
          <ErrorState
            message="Não foi possível carregar suas consultas."
            onRetry={() => void consultas.refetch()}
            retrying={consultas.isRefetching}
          />
        ) : lista.length === 0 ? (
          <Text style={styles.vazio} testID="consultas-vazio">
            {mensagemListaVazia(filtro)}
          </Text>
        ) : (
          <View style={styles.lista} testID="consultas-lista">
            {lista.map((c, i) => {
              const linha = linhaConsulta(c);
              return (
                <Pressable
                  key={c.id}
                  onPress={() => navigation.navigate('ConsultaDetalhe', { id: c.id })}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.linha,
                    i < lista.length - 1 && styles.divisor,
                    pressed && styles.pressed,
                  ]}
                  testID={`minha-consulta-${c.id}`}
                >
                  <View style={styles.info}>
                    <Text style={[styles.quando, linha.cancelada && styles.cancelada]}>
                      {linha.quando}
                    </Text>
                    {linha.convenio ? <Text style={styles.convenio}>{linha.convenio}</Text> : null}
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
  content: { padding: spacing.xl, gap: spacing.lg },
  titulo: {
    fontFamily: fonts.extrabold,
    fontSize: fontSizes.xxl,
    letterSpacing: -0.5,
    color: colors.text,
  },
  marcar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  marcarTexto: { fontFamily: fonts.bold, fontSize: fontSizes.base, color: colors.textInverse },
  vazio: {
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
  linha: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  divisor: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  info: { flex: 1, minWidth: 0, gap: 2 },
  quando: { fontFamily: fonts.semibold, fontSize: fontSizes.md, color: colors.text },
  cancelada: { color: colors.textTertiary, textDecorationLine: 'line-through' },
  convenio: { fontFamily: fonts.regular, fontSize: fontSizes.xs, color: colors.textTertiary },
  pressed: { opacity: 0.7 },
});
