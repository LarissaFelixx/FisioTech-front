import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '../../components/Avatar/Avatar';
import { ErrorState } from '../../components/ErrorState/ErrorState';
import { Icon } from '../../components/Icon/Icon';
import { SearchField } from '../../components/SearchField/SearchField';
import { Skeleton } from '../../components/Skeleton/Skeleton';
import { usePacientes } from '../../hooks/usePacientes';
import { useRefetchOnFocus } from '../../hooks/useRefetchOnFocus';
import type { ProfissionalStackParamList } from '../../navigation/types';
import { colors, fontSizes, fonts, radius, shadows, spacing } from '../../theme';
import type { Paciente } from '../../types/paciente';
import { filtrarPacientes } from './pacienteLogic';

type Navigation = NativeStackNavigationProp<ProfissionalStackParamList>;

/** Origem: `features/pacientes/paciente-list` (aba Pacientes do profissional). */
export function PacienteListScreen() {
  const navigation = useNavigation<Navigation>();
  const { data, isPending, isError, isRefetching, refetch } = usePacientes();
  const [filtro, setFiltro] = useState('');
  useRefetchOnFocus(refetch);

  const filtrados = useMemo(() => filtrarPacientes(data ?? [], filtro), [data, filtro]);

  const abrir = (paciente: Paciente) => navigation.navigate('PacienteForm', { id: paciente.id });

  const cabecalho = (
    <View style={styles.cabecalho}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Pacientes
        </Text>
        <Pressable
          onPress={() => navigation.navigate('PacienteForm', {})}
          accessibilityRole="button"
          accessibilityLabel="Novo paciente"
          style={({ pressed }) => [styles.novo, pressed && styles.pressed]}
          testID="paciente-novo"
        >
          <Icon name="plus" size={22} color={colors.textInverse} />
        </Pressable>
      </View>
      <SearchField
        value={filtro}
        onChangeText={setFiltro}
        placeholder="Buscar por nome ou email"
        testID="paciente-busca"
      />
    </View>
  );

  const vazio = isPending ? (
    <Skeleton variant="list" count={4} />
  ) : isError ? (
    <ErrorState
      message="Não foi possível carregar os pacientes."
      onRetry={() => void refetch()}
      retrying={isRefetching}
    />
  ) : (
    <Text style={styles.state}>Nenhum paciente encontrado.</Text>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <FlatList
        data={isPending || isError ? [] : filtrados}
        keyExtractor={(p) => String(p.id)}
        ListHeaderComponent={cabecalho}
        ListEmptyComponent={vazio}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isPending}
            onRefresh={() => void refetch()}
            colors={[colors.primary]}
          />
        }
        renderItem={({ item, index }) => (
          <Pressable
            onPress={() => abrir(item)}
            accessibilityRole="button"
            accessibilityLabel={`${item.nome}, ${item.email}`}
            style={({ pressed }) => [
              styles.card,
              index === 0 && styles.primeiro,
              index === filtrados.length - 1 && styles.ultimo,
              index < filtrados.length - 1 && styles.divisor,
              pressed && styles.pressed,
            ]}
            testID={`paciente-${item.id}`}
          >
            <Avatar nome={item.nome} />
            <View style={styles.info}>
              <Text style={styles.nome} numberOfLines={1}>
                {item.nome}
              </Text>
              <Text style={styles.email} numberOfLines={1}>
                {item.email}
              </Text>
            </View>
            <Icon name="chevron-right" size={20} color={colors.textTertiary} />
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  cabecalho: { gap: spacing.lg, marginBottom: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: fontSizes.xxl,
    letterSpacing: -0.5,
    color: colors.text,
  },
  novo: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  state: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.xxxl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: 14,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  primeiro: { borderTopLeftRadius: radius.md, borderTopRightRadius: radius.md },
  ultimo: { borderBottomLeftRadius: radius.md, borderBottomRightRadius: radius.md },
  divisor: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  info: { flex: 1, minWidth: 0 },
  nome: { fontFamily: fonts.semibold, fontSize: fontSizes.base, color: colors.text },
  email: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.textSecondary },
  pressed: { opacity: 0.7 },
});
