import { useRoute, type RouteProp } from '@react-navigation/native';
import { StyleSheet, View } from 'react-native';

import { AdminOnly } from '../../../components/AdminOnly/AdminOnly';
import { ErrorState } from '../../../components/ErrorState/ErrorState';
import { Skeleton } from '../../../components/Skeleton/Skeleton';
import { useProfissional } from '../../../hooks/useProfissionais';
import type { AdminStackParamList } from '../../../navigation/types';
import { colors, spacing } from '../../../theme';
import { ProfissionalEditor } from './ProfissionalEditor';
import { mensagemErroProfissional } from './profissionalLogic';

/** Edição administrativa de um profissional existente, com id obrigatório. */
export function EditarProfissionalScreen() {
  return (
    <AdminOnly>
      <EditarProfissionalRoute />
    </AdminOnly>
  );
}

function EditarProfissionalRoute() {
  const { params } = useRoute<RouteProp<AdminStackParamList, 'EditarProfissional'>>();
  const id = params?.id;

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

  return <ProfissionalEditor key={query.data.id} modo="edicao" profissional={query.data} />;
}

const styles = StyleSheet.create({
  state: { flex: 1, backgroundColor: colors.bg, padding: spacing.xl },
});
