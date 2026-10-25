import { StyleSheet, Text } from 'react-native';

import { fontSizes, fonts, radius, statusColors } from '../../theme';
import type { StatusConsulta } from '../../types/consulta';
import { STATUS_LABEL } from '../../utils/consulta';

/** Cores por status (origem: `--status-*` do SCSS; realizada usa as de agendada, como no Angular). */
export function corDoStatus(status: StatusConsulta) {
  switch (status) {
    case 'CONFIRMADA':
      return statusColors.confirmada;
    case 'CANCELADA':
      return statusColors.cancelada;
    default:
      return statusColors.agendada;
  }
}

export function StatusBadge({ status }: { status: StatusConsulta }) {
  const cor = corDoStatus(status);
  return (
    <Text style={[styles.badge, { backgroundColor: cor.bg, color: cor.fg }]}>
      {STATUS_LABEL[status]}
    </Text>
  );
}

const styles = StyleSheet.create({
  badge: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xs,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
});
