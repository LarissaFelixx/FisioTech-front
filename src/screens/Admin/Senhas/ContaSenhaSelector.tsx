import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '../../../components/Avatar/Avatar';
import { ErrorState } from '../../../components/ErrorState/ErrorState';
import { SearchField } from '../../../components/SearchField/SearchField';
import { Skeleton } from '../../../components/Skeleton/Skeleton';
import { queryKeys } from '../../../hooks/queryKeys';
import { pacienteAdminService } from '../../../services/pacienteService';
import { profissionalService } from '../../../services/profissionalService';
import { colors, fontSizes, fonts, radius, spacing } from '../../../theme';
import type { Paciente } from '../../../types/paciente';
import type { Profissional } from '../../../types/profissional';
import { mensagemErroSenhaAdmin, type ContaSenha, type TipoContaSenha } from './senhaAdminLogic';

export function ContaSenhaSelector({
  tipo,
  onSelect,
}: {
  tipo: TipoContaSenha;
  onSelect: (conta: ContaSenha) => void;
}) {
  const [busca, setBusca] = useState('');
  const query = useQuery<Paciente[] | Profissional[]>({
    queryKey:
      tipo === 'paciente' ? queryKeys.adminPacientes.lista() : queryKeys.profissionais.lista(),
    queryFn: () =>
      tipo === 'paciente' ? pacienteAdminService.listarTodos() : profissionalService.listarTodos(),
  });
  const contas = useMemo(() => {
    const normalizar = (texto: string) =>
      texto
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
    const termo = normalizar(busca.trim());
    return (query.data ?? []).filter((conta) =>
      normalizar(`${conta.nome} ${conta.email}`).includes(termo),
    );
  }, [query.data, busca]);

  if (query.isError) {
    return (
      <ErrorState
        message={mensagemErroSenhaAdmin(query.error)}
        onRetry={() => void query.refetch()}
        retrying={query.isRefetching}
      />
    );
  }

  return (
    <View style={styles.flex}>
      <SearchField
        value={busca}
        onChangeText={setBusca}
        placeholder="Buscar nome ou email"
        testID="admin-senha-busca"
      />
      <FlatList
        testID="admin-senha-contas"
        data={contas}
        keyExtractor={(conta) => String(conta.id)}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        refreshing={query.isRefetching && !query.isPending}
        onRefresh={() => void query.refetch()}
        ListEmptyComponent={
          query.isPending ? (
            <Skeleton variant="list" count={4} />
          ) : (
            <Text style={styles.subtitle}>
              {busca.trim()
                ? 'Nenhuma conta encontrada para esta busca.'
                : 'Nenhuma conta disponível.'}
            </Text>
          )
        }
        renderItem={({ item }) => (
          <Pressable
            testID={`admin-senha-conta-${item.id}`}
            accessibilityRole="button"
            accessibilityLabel={`Definir senha de ${item.nome}, ${item.email}`}
            onPress={() => onSelect({ tipo, id: item.id, nome: item.nome, email: item.email })}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          >
            <Avatar nome={item.nome} />
            <View style={styles.info}>
              <Text style={styles.name}>{item.nome}</Text>
              <Text style={styles.subtitle}>{item.email}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: spacing.lg },
  content: { flexGrow: 1, paddingBottom: spacing.xxxl, gap: spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  info: { flex: 1, gap: spacing.sm },
  name: { fontFamily: fonts.semibold, fontSize: fontSizes.base, color: colors.text },
  subtitle: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.textSecondary },
  pressed: { opacity: 0.7 },
});
