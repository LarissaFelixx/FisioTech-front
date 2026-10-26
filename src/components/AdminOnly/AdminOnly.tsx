import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useAuth } from '../../hooks/useAuth';
import { colors, spacing } from '../../theme';
import { ROLES } from '../../types/auth';
import { ErrorState } from '../ErrorState/ErrorState';

/** Impede inclusive a montagem dos componentes que consultam os dados administrativos. */
export function AdminOnly({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();

  if (status !== 'signedIn' || user?.role !== ROLES.admin) {
    return (
      <View style={styles.container} testID="admin-access-denied">
        <ErrorState message="Acesso exclusivo para administradores do sistema." />
      </View>
    );
  }

  return children;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.xl,
  },
});
