import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';

import { MenuLateral } from '../../components/MenuLateral/MenuLateral';
import { useAuth } from '../../hooks/useAuth';
import type { AdminStackParamList } from '../../navigation/types';

/**
 * Menu do administrador (#37, Figma "M2 Menu · Admin"): "Alterar Senha" e "Sair".
 * Quem tem o gatilho (o botão de menu do cabeçalho) renderiza `menu` e chama `abrirMenu`.
 */
export function useMenuAdmin() {
  const navigation = useNavigation<NativeStackNavigationProp<AdminStackParamList>>();
  const { user, logout } = useAuth();
  const [aberto, setAberto] = useState(false);

  const menu = (
    <MenuLateral
      visible={aberto}
      nome={user?.nome ?? ''}
      papel="Admin"
      onClose={() => setAberto(false)}
      onLogout={() => void logout()}
      items={[
        {
          label: 'Alterar Senha',
          icon: 'lock',
          onPress: () => navigation.navigate('AlterarSenha'),
          testID: 'menu-alterar-senha',
        },
      ]}
    />
  );

  return { menu, abrirMenu: () => setAberto(true) };
}
