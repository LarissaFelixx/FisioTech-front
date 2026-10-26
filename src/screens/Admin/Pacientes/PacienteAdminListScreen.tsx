import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { toApiError } from '../../../api/errors';
import { AdminOnly } from '../../../components/AdminOnly/AdminOnly';
import { Avatar } from '../../../components/Avatar/Avatar';
import { ErrorState } from '../../../components/ErrorState/ErrorState';
import { Icon } from '../../../components/Icon/Icon';
import { SearchField } from '../../../components/SearchField/SearchField';
import { Skeleton } from '../../../components/Skeleton/Skeleton';
import { usePacientesAdmin } from '../../../hooks/usePacientes';
import { useRefetchOnFocus } from '../../../hooks/useRefetchOnFocus';
import type { AdminStackParamList } from '../../../navigation/types';
import { colors, fontSizes, fonts, radius, spacing } from '../../../theme';
import { filtrarPacientesAdmin, mensagemErroPacienteAdmin } from './pacienteAdminLogic';

export function PacienteAdminListScreen() {
  return (
    <AdminOnly>
      <ListaPacientesAdmin />
    </AdminOnly>
  );
}

function ListaPacientesAdmin() {
  const navigation = useNavigation<NativeStackNavigationProp<AdminStackParamList>>();
  const query = usePacientesAdmin();
  const [busca, setBusca] = useState('');
  useRefetchOnFocus(query.refetch);

  const erroApi = toApiError(query.error);
  const acessoNegado = erroApi.kind === 'http' && erroApi.status === 403;
  const pacientes = useMemo(
    () => (acessoNegado ? [] : filtrarPacientesAdmin(query.data ?? [], busca)),
    [query.data, busca, acessoNegado],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Pacientes
        </Text>
        <Text style={styles.subtitle}>Administração de perfis</Text>
        {!acessoNegado ? (
          <>
            <SearchField
              value={busca}
              onChangeText={setBusca}
              placeholder="Buscar nome, email ou profissional"
              testID="admin-paciente-busca"
            />
            {query.data ? (
              <Text style={styles.subtitle} testID="admin-pacientes-total">
                {pacientes.length} de {query.data.length} pacientes
              </Text>
            ) : null}
          </>
        ) : null}
        {query.isError ? (
          <ErrorState
            message={mensagemErroPacienteAdmin(query.error)}
            onRetry={() => void query.refetch()}
            retrying={query.isRefetching}
          />
        ) : null}
      </View>
      <FlatList
        testID="admin-pacientes-lista"
        data={pacientes}
        keyExtractor={(paciente) => String(paciente.id)}
        contentContainerStyle={styles.content}
        refreshing={query.isRefetching && !query.isPending}
        onRefresh={() => void query.refetch()}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListEmptyComponent={
          query.isPending ? (
            <Skeleton variant="list" count={4} />
          ) : !query.isError ? (
            <Text style={styles.empty}>
              {busca.trim()
                ? 'Nenhum paciente encontrado para esta busca.'
                : 'Nenhum paciente cadastrado.'}
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            testID={`admin-paciente-${item.id}`}
            accessibilityRole="button"
            accessibilityLabel={`Editar paciente ${item.nome}`}
            onPress={() => navigation.navigate('EditarPaciente', { id: item.id })}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          >
            <Avatar nome={item.nome} />
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={2}>
                {item.nome}
              </Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {item.email}
              </Text>
              <Text style={styles.subtitle} numberOfLines={2}>
                Profissional: {item.profissionalNome ?? 'Não vinculado'}
              </Text>
              {item.telefone ? <Text style={styles.subtitle}>{item.telefone}</Text> : null}
            </View>
            <Icon name="chevron-right" color={colors.textSecondary} size={20} />
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.7 },
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { padding: spacing.xl, gap: spacing.md },
  title: { fontFamily: fonts.extrabold, fontSize: fontSizes.xxl, color: colors.text },
  subtitle: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.textSecondary },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  info: { flex: 1, gap: spacing.xs },
  name: { fontFamily: fonts.semibold, fontSize: fontSizes.base, color: colors.text },
  empty: {
    paddingVertical: spacing.xxxl,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
  },
});
