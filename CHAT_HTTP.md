# Chat HTTP entre paciente e profissional

## Comportamento

O profissional entra pela aba Mensagens ou pelo atalho no formulário de edição de paciente.
O paciente entra pela caixa de conversas após login. O backend determina quais vínculos e
conversas cada conta pode acessar. A primeira versão não cria vínculos ou profissionais pelo chat.

As duas telas usam a mesma interface (`ChatView`, `MessageBubble`, `MessageComposer`). Mostram
mensagens próprias à direita, mensagens recebidas à esquerda, separação por dia e horário.
O nome do interlocutor aparece no cabeçalho; o retorno usa a navegação nativa.

O histórico é ordenado por data e id. Se o usuário estiver no final, novas mensagens aparecem
com rolagem automática. Durante leitura de mensagens anteriores, a posição é preservada e
aparece o botão Novas mensagens.

## Comunicação

| Perfil       | Histórico                            | Envio                                                           | Caixa de entrada                  |
| ------------ | ------------------------------------ | --------------------------------------------------------------- | --------------------------------- |
| Profissional | `GET /mensagens?pacienteId={id}`     | `POST /mensagens` com pacienteId, autor PROFISSIONAL e conteudo | `GET /mensagens/caixa-entrada`    |
| Paciente     | `GET /me/mensagens/{profissionalId}` | `POST /me/mensagens/{profissionalId}` com conteudo              | `GET /me/mensagens/caixa-entrada` |

As requisições usam o cliente Axios protegido e a sessão JWT existente. Não foi alterado o
backend. Ele precisa validar o remetente e o vínculo, inclusive quando o corpo contém autor.

Queries de conversa e caixa de entrada consultam a API a cada 10 segundos somente em foco e
com AppState active. O intervalo está em `CHAT_POLL_INTERVAL_MS`. Ao reativar a query, o
TanStack Query busca os dados stale. Consultas simultâneas da mesma chave são compartilhadas.
Uma consulta já em andamento pode terminar depois da saída da tela; não há novos ciclos de
polling com a query inativa. Respostas 403/404 interrompem o polling daquela query.

Ao enviar, o texto é aparado, conteúdo vazio é bloqueado e a edição fica indisponível enquanto
aguarda a resposta. Não há repetição automática de mutations pelo TanStack Query. O interceptor
JWT existente pode repetir uma chamada uma vez após 401 e renovação do token.

Depois do sucesso, os hooks invalidam o grupo de mensagens do perfil, atualizando a conversa
ativa e tornando a caixa de entrada stale para sua próxima abertura. O texto é limpo somente
depois do sucesso. Falha de rede não confirma que o servidor deixou de salvar a mensagem:
o aviso orienta atualizar a conversa antes de uma nova tentativa manual.

Falhas temporárias de atualização mantêm o histórico. Em 403/404, o histórico da conversa é
ocultado e o envio é bloqueado. Falhas iniciais possuem estado de erro e nova tentativa.

## Validação

Testes automatizados cobrem envio pendente, bloqueio de conteúdo vazio/envios simultâneos,
preservação do texto após falha, ordenação, navegação de ambos os perfis, escolha do destinatário,
autoria, atualização após envio, pausa/retomada de polling, acesso negado, histórico preservado
durante erro e aviso de novas mensagens durante a leitura.

O fluxo `.maestro/chat-http.yaml` usa o backend de desenvolvimento e o seed do projeto para
trocar mensagens entre contas de profissional e paciente. Rodar com o mesmo procedimento de
`npm run test:e2e` documentado no README; não usar contas de produção.

Para validar manualmente em dois aparelhos/emuladores:

1. Configurar a URL do mesmo backend acessível nos dois dispositivos.
2. Entrar como profissional no primeiro e como paciente vinculado no segundo.
3. Abrir a conversa correspondente e enviar nos dois sentidos; conferir nome, autoria e horário.
4. Manter o segundo dispositivo na conversa e confirmar chegada em até um ciclo de polling,
   além do tempo de resposta da API.
5. Colocar o app em segundo plano, enviar pelo outro e voltar: o histórico deve atualizar.
6. Ler mensagens antigas e receber uma nova: a posição deve continuar e o botão aparecer.
7. Simular falha de rede: o texto deve permanecer após falha de envio; ao reconectar,
   atualizar antes de reenviar.

## Limites

O contrato atual retorna o histórico completo. Paginação, busca incremental, idempotência,
confirmação de leitura, anexos, notificações e WebSocket exigem evolução posterior.
Testes unitários não comprovam execução no aparelho nem autorização real do backend.

## Resultado da verificação desta implementação — 05/10/2026

- TypeScript: `tsc --noEmit` passou.
- Jest: 27 suítes e 253 testes passaram, com `--runInBand --testTimeout=15000`.
- ESLint: os arquivos de código alterados/adicionados passaram.
- Exportação Expo para Android: passou; bundle e assets gerados em `dist/chat-preview`.
- YAML dos fluxos Maestro: sintaxe verificada. Fluxos não executados contra backend/aparelho.
- Verificação global de estilo: ainda falha em arquivos preexistentes, principalmente por
  terminações CRLF do checkout Windows; esses arquivos não foram reformatados nesta feature.

A exportação é um bundle Android, não um APK instalado. Não houve validação visual em aparelho,
execução dos testes de contrato ou alteração do backend.
