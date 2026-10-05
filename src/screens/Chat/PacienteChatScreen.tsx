import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useLayoutEffect } from 'react';

import { ChatView } from '../../components/Chat/ChatView';
import { useChatActivity } from '../../hooks/useChatActivity';
import {
  useEnviarMinhaMensagem,
  useMinhaConversa,
  useProfissionalPublico,
} from '../../hooks/useMe';
import type { PacienteStackParamList } from '../../navigation/types';

export function PacienteChatScreen() {
  const { params } = useRoute<RouteProp<PacienteStackParamList, 'MensagemThread'>>();
  const navigation = useNavigation<NativeStackNavigationProp<PacienteStackParamList>>();
  const active = useChatActivity();
  const conversa = useMinhaConversa(params.profissionalId, { active, poll: true });
  const enviar = useEnviarMinhaMensagem();
  const profissional = useProfissionalPublico(params.profissionalId, {
    enabled: active && !params.nome,
  });
  const nome = params.nome ?? profissional.data?.nome ?? 'Profissional';
  useLayoutEffect(() => {
    navigation.setOptions({ title: nome });
  }, [navigation, nome]);

  return (
    <ChatView
      key={params.profissionalId}
      autor="PACIENTE"
      mensagens={conversa.data}
      loading={conversa.isPending}
      error={conversa.error}
      refreshing={conversa.isRefetching}
      onRefresh={conversa.refetch}
      onSend={(conteudo) => enviar.mutateAsync({ profissionalId: params.profissionalId, conteudo })}
    />
  );
}
