import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ConversationList } from '../../components/Chat/ConversationList';
import { useChatActivity } from '../../hooks/useChatActivity';
import { useMinhasConversas } from '../../hooks/useMe';
import type { PacienteStackParamList } from '../../navigation/types';

export function PacienteInboxScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<PacienteStackParamList>>();
  const active = useChatActivity();
  const query = useMinhasConversas({ active, poll: true });
  return (
    <ConversationList
      items={(query.data ?? []).map((c) => ({
        id: c.profissionalId,
        nome: c.profissionalNome,
        ultimaMensagem: c.ultimaMensagem,
        dataUltimaMensagem: c.dataUltimaMensagem,
      }))}
      loading={query.isPending}
      error={query.error}
      refreshing={query.isRefetching}
      onRefresh={query.refetch}
      onOpen={(c) => navigation.navigate('MensagemThread', { profissionalId: c.id, nome: c.nome })}
      emptyMessage="Nenhuma conversa disponível. As conversas com seus profissionais aparecerão aqui."
    />
  );
}
