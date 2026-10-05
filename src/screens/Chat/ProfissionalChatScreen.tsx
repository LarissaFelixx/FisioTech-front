import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useLayoutEffect } from 'react';

import { ChatView } from '../../components/Chat/ChatView';
import { useChatActivity } from '../../hooks/useChatActivity';
import { useConversaComPaciente, useEnviarMensagem } from '../../hooks/useMensagens';
import { usePaciente } from '../../hooks/usePacientes';
import type { ProfissionalStackParamList } from '../../navigation/types';

export function ProfissionalChatScreen() {
  const { params } = useRoute<RouteProp<ProfissionalStackParamList, 'MensagemThread'>>();
  const navigation = useNavigation<NativeStackNavigationProp<ProfissionalStackParamList>>();
  const active = useChatActivity();
  const conversa = useConversaComPaciente(params.pacienteId, { active, poll: true });
  const enviar = useEnviarMensagem();
  const paciente = usePaciente(params.pacienteId, { enabled: active && !params.nome });
  const nome = params.nome ?? paciente.data?.nome ?? 'Paciente';
  useLayoutEffect(() => {
    navigation.setOptions({ title: nome });
  }, [navigation, nome]);

  return (
    <ChatView
      key={params.pacienteId}
      autor="PROFISSIONAL"
      mensagens={conversa.data}
      loading={conversa.isPending}
      error={conversa.error}
      refreshing={conversa.isRefetching}
      onRefresh={conversa.refetch}
      onSend={(conteudo) =>
        enviar.mutateAsync({ pacienteId: params.pacienteId, autor: 'PROFISSIONAL', conteudo })
      }
    />
  );
}
