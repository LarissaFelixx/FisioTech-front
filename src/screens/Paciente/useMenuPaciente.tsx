import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';

import { MenuLateral } from '../../components/MenuLateral/MenuLateral';
import { useAuth } from '../../hooks/useAuth';
import type { PacienteStackParamList } from '../../navigation/types';

/**
 * Menu do paciente (#46, Figma "M3 Menu · Paciente"): "Editar Perfil", "Alterar Senha" e "Sair".
 * Quem tem o gatilho (o avatar da Home) renderiza `menu` e chama `abrirMenu`.
 */
export function useMenuPaciente() {
  const navigation = useNavigation<NativeStackNavigationProp<PacienteStackParamList>>();
  const { user, logout } = useAuth();
  const [aberto, setAberto] = useState(false);

  const menu = (
    <MenuLateral
      visible={aberto}
      nome={user?.nome ?? ''}
      papel="Paciente"
      onClose={() => setAberto(false)}
      onLogout={() => void logout()}
      items={[
        {
          label: 'Editar Perfil',
          icon: 'user',
          onPress: () => navigation.navigate('Tabs', { screen: 'Perfil' }),
          testID: 'menu-editar-perfil',
        },
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
