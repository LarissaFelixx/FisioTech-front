# Caixa de entrada — paciente e profissional

Implementação na branch `feat/tela-caixa-de-entrada`, derivada de `dev`. A base já continha
as telas básicas de caixa de entrada e o chat HTTP. Esta entrega completa a apresentação,
busca, tratamento de estados e testes específicos das caixas de entrada.

## Acesso e dados

| Perfil       | Entrada                       | Consulta                                                   | Destino ao tocar               |
| ------------ | ----------------------------- | ---------------------------------------------------------- | ------------------------------ |
| Profissional | Aba Mensagens                 | `GET /mensagens/caixa-entrada` via `useCaixaEntrada`       | Chat com pacienteId e nome     |
| Paciente     | Caixa de conversas após login | `GET /me/mensagens/caixa-entrada` via `useMinhasConversas` | Chat com profissionalId e nome |

Os dois perfis reutilizam `ConversationList`. As telas adaptam os DTOs existentes sem alterar
a API. O paciente mantém o botão Sair do cabeçalho nativo; a tela evita aplicar duas vezes o
espaçamento superior do sistema. O profissional mantém as abas existentes.

## Critérios atendidos

- Cabeçalho Conversas com identificação da caixa de pacientes ou profissionais.
- Nome, avatar, prévia da última mensagem e data/hora.
- Mensagem própria identificada por “Você:”; ausência de mensagem mostra “Iniciar conversa”.
- Ordenação da mensagem mais recente para a mais antiga; ausência de data fica no final;
  empate é resolvido pelo id, sem modificar a lista de entrada.
- Busca local por nome ou última mensagem, ignorando acentos, maiúsculas e espaços externos.
  Digitar não dispara chamadas à API.
- Quantidade de conversas e quantidade encontrada ao filtrar.
- Busca sem resultados com ação Limpar busca, separada do estado de caixa vazia.
- Carregamento com skeleton; falha inicial com mensagem e Tentar novamente.
- Falha temporária de atualização preserva as conversas anteriormente carregadas.
- Respostas 403/404 ocultam a lista e a busca, incluindo dados anteriores em cache; nova
  tentativa manual continua disponível.
- Atualização por gesto e polling existente a cada 10 segundos, em foco e primeiro plano.
  Ao voltar, a query stale busca novamente. Enviar pelo chat invalida as conversas do perfil.
- Selecionar uma conversa abre o chat com o destinatário correspondente.

O contrato não fornece quantidade de mensagens não lidas ou estado de leitura. Nenhum
indicador de “não lida” é inferido do autor ou da data da última mensagem.

## Testes

`ConversationList.test.tsx` cobre busca, ordenação, autoria, total, seleção, carregamento,
caixa vazia, busca sem resultados, limpeza, falha de atualização e acesso negado.
`InboxScreens.test.tsx` verifica os endpoints por perfil, navegação com ids corretos,
ausência de chamada HTTP por tecla e recuperação após falha de atualização.
Os testes existentes de chat e polling continuam cobrindo envio e ciclo de vida.

Para validar em aparelho com backend de desenvolvimento:

1. Entrar como profissional, abrir Mensagens e conferir as conversas de seus pacientes.
2. Buscar pelo nome e pelo texto, testar busca sem resultados e limpar.
3. Abrir uma conversa e enviar uma mensagem; voltar e conferir prévia, autoria e ordenação.
4. Entrar como paciente vinculado e repetir o fluxo com seus profissionais.
5. Simular falha de rede durante atualização; a lista deve permanecer e permitir nova tentativa.

Testes automatizados não comprovam conectividade, autorização no servidor ou apresentação
visual em aparelho. Nenhum backend é alterado nesta entrega.

## Verificação em 08/10/2026

- TypeScript: `tsc --noEmit` passou.
- Jest: 33 suítes e 337 testes passaram com `--runInBand --testTimeout=15000`.
- ESLint: os seis arquivos de código adicionados/alterados passaram.
- Expo: exportação Android passou; bundle gerado em `dist/caixa-de-entrada` (ignorado pelo Git).
- Não houve execução em aparelho/emulador ou teste contra o backend real nesta entrega.
