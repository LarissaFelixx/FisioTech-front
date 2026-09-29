import { StyleSheet, TextInput, View } from 'react-native';

import { colors, fontSizes, fonts, radius, shadows } from '../../theme';
import { Icon } from '../Icon/Icon';

type Props = {
  value: string;
  onChangeText: (texto: string) => void;
  placeholder: string;
  testID?: string;
};

/** Campo de busca em pílula com lupa (origem: `.paciente-list__search`). */
export function SearchField({ value, onChangeText, placeholder, testID }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.icon} pointerEvents="none">
        <Icon name="search" size={18} color={colors.textTertiary} />
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        accessibilityLabel={placeholder}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="while-editing"
        style={styles.input}
        testID={testID}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { justifyContent: 'center' },
  icon: { position: 'absolute', left: 16, zIndex: 1 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingVertical: 12,
    paddingLeft: 44,
    paddingRight: 16,
    fontFamily: fonts.regular,
    fontSize: fontSizes.base,
    color: colors.text,
    ...shadows.card,
  },
});
