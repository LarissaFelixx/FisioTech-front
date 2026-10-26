import { StyleSheet, Text, View } from 'react-native';

import { TextField } from '../../../components/TextField/TextField';
import { colors, fontSizes, fonts, radius, spacing } from '../../../theme';
import { mascararData } from '../../../utils/date';
import type { ProfissionalCampo, ProfissionalFormValues } from './profissionalLogic';

type Props = {
  valores: ProfissionalFormValues;
  erros: Partial<Record<ProfissionalCampo, string>>;
  ocupado: boolean;
  editando: boolean;
  alterar: (campo: ProfissionalCampo, valor: string) => void;
};

/** Campos visuais compartilhados, sem consultas ou operações de persistência. */
export function ProfissionalFields({ valores, erros, ocupado, editando, alterar }: Props) {
  const campo = (nome: ProfissionalCampo) => ({
    value: valores[nome],
    onChangeText: (valor: string) => alterar(nome, valor),
    error: erros[nome],
    editable: !ocupado,
    testID: `admin-profissional-${nome}`,
  });

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.section} accessibilityRole="header">
          Identificação e acesso
        </Text>
        <TextField label="Nome" autoComplete="name" maxLength={120} {...campo('nome')} />
        <TextField
          label="Email de acesso"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={120}
          {...campo('email')}
        />
        <TextField
          label="Registro profissional"
          maxLength={20}
          autoCapitalize="characters"
          {...campo('registroProfissional')}
        />
        <TextField label="Especialidade" maxLength={120} {...campo('especialidade')} />
        <TextField
          label={editando ? 'Nova senha' : 'Senha inicial'}
          placeholder={editando ? 'Em branco mantém a senha atual' : 'Pelo menos 8 caracteres'}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          maxLength={100}
          {...campo('senha')}
        />
        {editando ? (
          <Text style={styles.hint}>
            O ADM pode definir uma nova senha sem informar a anterior. A redefinição encerra as
            sessões do profissional.
          </Text>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.section} accessibilityRole="header">
          Atendimento
        </Text>
        <TextField
          label="Valor da consulta particular (R$)"
          placeholder="Ex.: 150,00"
          keyboardType="decimal-pad"
          {...campo('valorConsultaParticular')}
        />
        <TextField
          label="Convênios aceitos"
          placeholder="Um convênio por linha"
          multiline
          numberOfLines={4}
          {...campo('conveniosAceitos')}
        />
        <Text style={styles.hint}>
          {editando
            ? 'Deixe os convênios em branco para remover todos.'
            : 'Informe os convênios aceitos, se houver.'}{' '}
          Valor zero é aceito; em branco, fica não informado.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.section} accessibilityRole="header">
          Dados pessoais e contato
        </Text>
        <TextField
          label="Data de nascimento"
          placeholder="DD/MM/AAAA"
          keyboardType="number-pad"
          maxLength={10}
          {...campo('dataNascimento')}
          onChangeText={(valor) => alterar('dataNascimento', mascararData(valor))}
        />
        <TextField label="Sexo" {...campo('sexo')} />
        <TextField label="Telefone" keyboardType="phone-pad" {...campo('telefone')} />
        <TextField
          label="Foto (URL)"
          placeholder="https://..."
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
          {...campo('foto')}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.xl,
    gap: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  section: { fontFamily: fonts.bold, fontSize: fontSizes.xl, color: colors.text },
  hint: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
