import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, fontSizes, fonts, radius, shadows, spacing } from '../../theme';
import { Skeleton } from '../Skeleton/Skeleton';

export type DiaSeletor = { iso: string; semana: string; dia: string };
export type HorarioSeletor = { valor: string; label: string; habilitado: boolean };

type Props = {
  dias: DiaSeletor[];
  diaSelecionado: string;
  onSelecionarDia: (iso: string) => void;
  horarios: HorarioSeletor[];
  horarioSelecionado: string | null;
  onSelecionarHorario: (valor: string) => void;
  carregando?: boolean;
  /** Mensagem no lugar da grade (ex.: erro ao carregar os horários). */
  aviso?: string | null;
};

/**
 * Escolha de dia e horário (Figma "19 Marcar Consulta"): faixa de dias rolável e grade de
 * horários em 4 colunas; horários ocupados aparecem esmaecidos e não respondem ao toque.
 */
export function SeletorHorario({
  dias,
  diaSelecionado,
  onSelecionarDia,
  horarios,
  horarioSelecionado,
  onSelecionarHorario,
  carregando = false,
  aviso,
}: Props) {
  return (
    <View style={styles.raiz}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dias}
        style={styles.faixa}
      >
        {dias.map((d) => {
          const ativo = d.iso === diaSelecionado;
          return (
            <Pressable
              key={d.iso}
              onPress={() => onSelecionarDia(d.iso)}
              accessibilityRole="radio"
              accessibilityState={{ checked: ativo }}
              accessibilityLabel={`${d.semana} ${d.dia}`}
              style={[styles.dia, ativo && styles.diaAtivo]}
              testID={`dia-${d.iso}`}
            >
              <Text style={[styles.semana, ativo && styles.textoAtivo]}>{d.semana}</Text>
              <Text style={[styles.numero, ativo && styles.textoAtivo]}>{d.dia}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.rotulo}>Horários livres</Text>
      {carregando ? (
        <Skeleton variant="lines" count={3} />
      ) : aviso ? (
        <Text style={styles.aviso}>{aviso}</Text>
      ) : (
        <View style={styles.grade}>
          {horarios.map((h) => {
            const ativo = h.valor === horarioSelecionado;
            return (
              <Pressable
                key={h.valor}
                onPress={() => onSelecionarHorario(h.valor)}
                disabled={!h.habilitado}
                accessibilityRole="radio"
                accessibilityState={{ checked: ativo, disabled: !h.habilitado }}
                accessibilityLabel={h.label}
                style={[styles.horario, ativo && styles.horarioAtivo]}
                testID={`horario-${h.label}`}
              >
                <Text
                  style={[
                    styles.horarioTexto,
                    !h.habilitado && styles.horarioOcupado,
                    ativo && styles.textoAtivo,
                  ]}
                >
                  {h.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { gap: spacing.md },
  faixa: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    ...shadows.card,
  },
  dias: { padding: spacing.sm, gap: spacing.xs },
  dia: {
    width: 48,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
    gap: 2,
  },
  diaAtivo: { backgroundColor: colors.primary },
  semana: { fontFamily: fonts.semibold, fontSize: fontSizes.xs, color: colors.textTertiary },
  numero: { fontFamily: fonts.bold, fontSize: fontSizes.lg, color: colors.text },
  textoAtivo: { color: colors.textInverse },
  rotulo: { fontFamily: fonts.semibold, fontSize: fontSizes.sm, color: colors.textSecondary },
  aviso: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.textSecondary },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  horario: {
    width: '23%',
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    ...shadows.card,
  },
  horarioAtivo: { backgroundColor: colors.primary },
  horarioTexto: { fontFamily: fonts.semibold, fontSize: fontSizes.md, color: colors.text },
  horarioOcupado: { color: colors.border, textDecorationLine: 'line-through' },
});
