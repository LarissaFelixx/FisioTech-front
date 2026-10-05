import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ConversationList } from '../../components/Chat/ConversationList';
import { useChatActivity } from '../../hooks/useChatActivity';
import { useCaixaEntrada } from '../../hooks/useMensagens';
import type { ProfissionalStackParamList } from '../../navigation/types';

export function ProfissionalInboxScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfissionalStackParamList>>();
  const active = useChatActivity();
  const query = useCaixaEntrada({ active, poll: true });
  return (
    <ConversationList
      items={(query.data ?? []).map((c) => ({
        id: c.pacienteId,
        nome: c.pacienteNome,
        ultimaMensagem: c.ultimaMensagem,
        dataUltimaMensagem: c.dataUltimaMensagem,
      }))}
      loading={query.isPending}
      error={query.error}
      refreshing={query.isRefetching}
      onRefresh={query.refetch}
      onOpen={(c) => navigation.navigate('MensagemThread', { pacienteId: c.id, nome: c.nome })}
      emptyMessage="Nenhuma conversa ainda. Para iniciar, abra um paciente e toque em Mensagens."
    />
  );
}
