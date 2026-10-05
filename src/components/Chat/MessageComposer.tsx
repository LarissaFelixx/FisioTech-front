import { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, fontSizes, fonts, radius, spacing } from '../../theme';
import { Button } from '../Button/Button';
import { mensagemErroChat } from './chatLogic';

type Props = {
  onSend: (conteudo: string) => Promise<unknown>;
  disabled?: boolean;
  onSent: () => void;
};

export function MessageComposer({ onSend, disabled = false, onSent }: Props) {
  const [texto, setTexto] = useState('');
  const [sending, setSending] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  // A ref bloqueia dois toques antes que o estado React seja atualizado.
  const sendingRef = useRef(false);

  async function enviar() {
    const conteudo = texto.trim();
    if (!conteudo || disabled || sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    setErro(null);
    try {
      await onSend(conteudo);
      setTexto('');
      onSent();
    } catch (error) {
      setErro(mensagemErroChat(error, true));
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  return (
    <View style={styles.container}>
      {erro ? (
        <Text accessibilityRole="alert" style={styles.error} testID="chat-send-error">
          {erro}
        </Text>
      ) : null}
      <View style={styles.row}>
        <TextInput
          testID="chat-input"
          accessibilityLabel="Mensagem"
          placeholder="Escreva uma mensagem"
          placeholderTextColor={colors.textSecondary}
          value={texto}
          onChangeText={(valor) => {
            setTexto(valor);
            setErro(null);
          }}
          editable={!disabled && !sending}
          multiline
          style={styles.input}
        />
        <Button
          label="Enviar"
          onPress={() => void enviar()}
          disabled={disabled || !texto.trim()}
          loading={sending}
          testID="chat-send"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 140,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    fontFamily: fonts.regular,
    fontSize: fontSizes.base,
    color: colors.text,
    textAlignVertical: 'top',
  },
  error: { fontFamily: fonts.regular, fontSize: fontSizes.sm, color: colors.danger },
});
