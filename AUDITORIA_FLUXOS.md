# Auditoria de navegação — correções-gerais

Base auditada: `origin/dev` no commit `5f9f6a1`. A tabela descreve as rotas
registradas nessa base e as transições verificadas no código e nos testes
disponíveis. A verificação automatizada usa serviços simulados; não equivale a
percorrer cada tela em aparelho com a API real.

| Área         | Tela                   | Ida                                                          | Volta ou saída                                                                       | Resultado                                    |
| ------------ | ---------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------ | -------------------------------------------- |
| Sessão       | Splash                 | Abrir app e restaurar sessão                                 | App autenticado, Login ou erro de restauração                                        | Estado transitório                           |
| Sessão       | Erro de restauração    | Falha ao restaurar a sessão                                  | Tentar novamente ou Sair → Login                                                     | Disponível                                   |
| Sessão       | Perfil não suportado   | Sessão com papel desconhecido                                | Sair → Login                                                                         | Disponível                                   |
| Autenticação | Login / Cadastro       | Sessão ausente ou encerrada                                  | Alternar abas; sucesso abre a área do perfil                                         | Disponível                                   |
| Autenticação | Recuperação            | Rota registrada, sem atalho no Login                         | Voltar → Login                                                                       | Protótipo, sem envio de código               |
| Autenticação | Redefinir senha        | Recuperação → informar email → Enviar código                 | Voltar para recuperação, agora com botão visível                                     | Protótipo, sem troca real                    |
| Autenticação | Senha redefinida       | Confirmação simulada da redefinição                          | Ir para o login; a pilha anterior é descartada                                       | Protótipo                                    |
| Profissional | Home                   | Login profissional ou aba Home                               | Outras abas; menu → Sair                                                             | Disponível                                   |
| Profissional | Pacientes              | Aba Pacientes                                                | Outra aba ou retorno à Home                                                          | Disponível                                   |
| Profissional | Formulário de paciente | Pacientes → Novo Paciente ou selecionar paciente             | Voltar nativo; salvar/excluir com sucesso → lista                                    | Disponível                                   |
| Profissional | Consultas              | Aba Consultas ou Ver tudo na Home                            | Outra aba ou retorno à Home                                                          | Disponível                                   |
| Profissional | Nova consulta          | Consultas → Nova Consulta ou atalho do paciente              | Voltar nativo → origem; salvar substitui o formulário pelo registro clínico          | Disponível                                   |
| Profissional | Detalhe / prontuário   | Home, lista de consultas ou histórico do paciente            | Voltar nativo → origem; excluir com sucesso também retorna                           | Disponível                                   |
| Profissional | Registro clínico       | Iniciar na Home, abrir pelo prontuário ou criar uma consulta | Voltar entre etapas; Voltar nativo → origem; Visualizar retorna ou abre o prontuário | Disponível                                   |
| Profissional | Mensagens              | Aba Mensagens                                                | Outra aba ou retorno à Home                                                          | Disponível                                   |
| Profissional | Conversa               | Caixa de entrada ou atalho do paciente                       | Voltar nativo → caixa de entrada ou formulário de origem                             | Disponível                                   |
| Profissional | Alterar senha          | Menu da Home                                                 | Voltar nativo → Home                                                                 | Tela provisória, sem formulário              |
| Paciente     | Mensagens              | Login ou autocadastro do paciente                            | Sair → Login                                                                         | Disponível                                   |
| Paciente     | Conversa               | Selecionar profissional na caixa de entrada                  | Voltar nativo → caixa de entrada                                                     | Disponível                                   |
| ADM          | Profissionais          | Login administrativo                                         | Atalho Pacientes; Sair → Login                                                       | Disponível                                   |
| ADM          | Novo profissional      | Profissionais → Novo profissional                            | Voltar nativo ou cadastro concluído → Profissionais                                  | Disponível                                   |
| ADM          | Editar profissional    | Profissionais → selecionar perfil                            | Voltar nativo ou alteração/exclusão concluída → Profissionais                        | Disponível                                   |
| ADM          | Pacientes              | Profissionais → Pacientes no cabeçalho                       | Voltar nativo → Profissionais                                                        | Disponível                                   |
| ADM          | Editar paciente        | Pacientes → selecionar perfil                                | Voltar nativo ou alteração concluída → Pacientes                                     | Disponível                                   |
| ADM          | Criação de senha       | Profissionais → Criação de senha                             | Escolher outra conta → seletor; Voltar nativo → Profissionais                        | Disponível para redefinição de outras contas |

Home, perfil, consultas, menu e troca de senha do paciente não são rotas desta
base. Os menus e a troca de senha do paciente entregues em branches separadas
não foram incorporados a esta correção. A alteração da própria senha do ADM
também não possui tela registrada nesta base.

A validação de nascimento foi aplicada à edição de paciente pelo profissional
e ao cadastro e à edição de profissional pelo ADM. O campo continua opcional,
aceita o dia atual e usa o calendário local do dispositivo. A data exibida na
edição administrativa do paciente é somente leitura. A regra genérica de datas
foi preservada para não impedir agendamentos futuros. O bloqueio é no frontend.
