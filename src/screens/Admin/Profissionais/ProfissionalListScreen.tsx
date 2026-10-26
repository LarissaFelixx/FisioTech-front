import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { toApiError } from '../../../api/errors';
import { AdminOnly } from '../../../components/AdminOnly/AdminOnly';
import { Avatar } from '../../../components/Avatar/Avatar';
import { Button } from '../../../components/Button/Button';
import { ErrorState } from '../../../components/ErrorState/ErrorState';
import { Icon } from '../../../components/Icon/Icon';
import { SearchField } from '../../../components/SearchField/SearchField';
import { Skeleton } from '../../../components/Skeleton/Skeleton';
import { useProfissionais } from '../../../hooks/useProfissionais';
import { useRefetchOnFocus } from '../../../hooks/useRefetchOnFocus';
import type { AdminStackParamList } from '../../../navigation/types';
import { colors, fontSizes, fonts, radius, spacing } from '../../../theme';
import { formatMoeda } from '../../../utils/moeda';
import { filtrarProfissionais, mensagemErroProfissional } from './profissionalLogic';

export function ProfissionalListScreen() {
  return (
    <AdminOnly>
      <ListaProfissionais />
    </AdminOnly>
  );
}

function ListaProfissionais() {
  const navigation = useNavigation<NativeStackNavigationProp<AdminStackParamList>>();
  const query = useProfissionais();
  const [busca, setBusca] = useState('');
  useRefetchOnFocus(query.refetch);

  const erroApi = toApiError(query.error);
  const acessoNegado = erroApi.kind === 'http' && erroApi.status === 403;
  const profissionais = useMemo(
    () => (acessoNegado ? [] : filtrarProfissionais(query.data ?? [], busca)),
    [query.data, busca, acessoNegado],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Profissionais
        </Text>
        <Text style={styles.subtitle}>Administração de perfis</Text>
        {!acessoNegado ? (
          <>
            <Button
              label="Novo profissional"
              onPress={() => navigation.navigate('ProfissionalForm', {})}
              testID="admin-profissional-novo"
            />
            <SearchField
              value={busca}
              onChangeText={setBusca}
              placeholder="Buscar nome, email, registro ou especialidade"
              testID="admin-profissional-busca"
            />
            {query.data ? (
              <Text style={styles.subtitle} testID="admin-profissionais-total">
                {profissionais.length} de {query.data.length} profissionais
              </Text>
            ) : null}
          </>
        ) : null}
        {query.isError ? (
          <ErrorState
            message={mensagemErroProfissional(query.error, 'carregar')}
            onRetry={() => void query.refetch()}
            retrying={query.isRefetching}
          />
        ) : null}
      </View>
      <FlatList
        testID="admin-profissionais-lista"
        data={profissionais}
        keyExtractor={(profissional) => String(profissional.id)}
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
                ? 'Nenhum profissional encontrado para esta busca.'
                : 'Nenhum profissional cadastrado.'}
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            testID={`admin-profissional-${item.id}`}
            accessibilityRole="button"
            accessibilityLabel={`Editar ${item.nome}, ${item.registroProfissional}`}
            onPress={() => navigation.navigate('ProfissionalForm', { id: item.id })}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          >
            <Avatar nome={item.nome} />
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={2}>
                {item.nome}
              </Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {item.especialidade}
              </Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {item.registroProfissional}
              </Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {item.email}
              </Text>
              <Text style={styles.price}>
                {item.valorConsultaParticular === null
                  ? 'Valor não informado'
                  : formatMoeda(item.valorConsultaParticular)}
                {' · '}
                {item.conveniosAceitos.length}{' '}
                {item.conveniosAceitos.length === 1 ? 'convênio' : 'convênios'}
              </Text>
            </View>
            <Icon name="chevron-right" color={colors.textSecondary} size={20} />
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  price: { fontFamily: fonts.medium, fontSize: fontSizes.sm, color: colors.primaryDark },
  empty: {
    paddingVertical: spacing.xxxl,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
  },
  pressed: { opacity: 0.7 },
});
