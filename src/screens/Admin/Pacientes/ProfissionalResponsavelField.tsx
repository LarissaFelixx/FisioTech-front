import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../../components/Button/Button';
import { SearchField } from '../../../components/SearchField/SearchField';
import { colors, fontSizes, fonts, radius, spacing } from '../../../theme';
import type { Profissional } from '../../../types/profissional';
import { filtrarProfissionais } from '../Profissionais/profissionalLogic';

type Props = {
  profissionais: Profissional[];
  valor: string;
  onChange: (id: string) => void;
  disabled: boolean;
  erro?: string;
};

/** Lista virtualizada com busca para escolher o vínculo sem digitar ids manualmente. */
export function ProfissionalResponsavelField({
  profissionais,
  valor,
  onChange,
  disabled,
  erro,
}: Props) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState('');
  const selecionado = profissionais.find((profissional) => String(profissional.id) === valor);
  const resultados = useMemo(
    () => filtrarProfissionais(profissionais, busca),
    [profissionais, busca],
  );

  function fechar() {
    setAberto(false);
    setBusca('');
  }

  return (
    <View style={styles.field}>
      <Text style={styles.label}>Profissional responsável</Text>
      <Pressable
        testID="admin-paciente-responsavel"
        accessibilityRole="button"
        accessibilityLabel={`Profissional responsável: ${selecionado?.nome ?? 'Selecionar'}`}
        accessibilityState={{ disabled, expanded: aberto }}
        disabled={disabled}
        style={[styles.option, !!erro && styles.invalid]}
        onPress={() => setAberto(true)}
      >
        <Text style={styles.text}>{selecionado?.nome ?? 'Selecionar profissional'}</Text>
        {selecionado ? <Text style={styles.label}>{selecionado.registroProfissional}</Text> : null}
      </Pressable>
      {erro ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {erro}
        </Text>
      ) : null}
      <Modal visible={aberto} animationType="slide" onRequestClose={fechar}>
        <SafeAreaView style={styles.modal}>
          <Text style={styles.title} accessibilityRole="header">
            Selecionar profissional
          </Text>
          <SearchField
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar nome, email, registro ou especialidade"
            testID="admin-paciente-responsavel-busca"
          />
          <FlatList
            data={resultados}
            keyExtractor={(profissional) => String(profissional.id)}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.options}
            ListEmptyComponent={<Text style={styles.text}>Nenhum profissional encontrado.</Text>}
            renderItem={({ item }) => (
              <Pressable
                testID={`admin-paciente-responsavel-${item.id}`}
                accessibilityRole="radio"
                accessibilityState={{ checked: String(item.id) === valor, disabled }}
                disabled={disabled}
                style={styles.option}
                onPress={() => {
                  onChange(String(item.id));
                  fechar();
                }}
              >
                <Text style={styles.text}>{item.nome}</Text>
                <Text style={styles.label}>
                  {item.registroProfissional} · {item.especialidade}
                </Text>
              </Pressable>
            )}
          />
          <Button label="Fechar" onPress={fechar} testID="admin-paciente-responsavel-fechar" />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.sm },
  label: { fontFamily: fonts.semibold, fontSize: fontSizes.sm, color: colors.textSecondary },
  text: { fontFamily: fonts.regular, fontSize: fontSizes.lg, color: colors.text },
  title: { fontFamily: fonts.bold, fontSize: fontSizes.xl, color: colors.text },
  option: {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  invalid: { borderColor: colors.danger },
  error: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.danger },
  modal: { flex: 1, padding: spacing.xl, gap: spacing.lg, backgroundColor: colors.bg },
  options: { gap: spacing.sm },
});
