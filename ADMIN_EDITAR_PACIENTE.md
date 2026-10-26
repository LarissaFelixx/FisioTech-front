# Admin - Editar Paciente

Tarefa na branch `feat/tela-adm-editar-paciente`, derivada de `feat/tela-adm-pacientes`
no commit `b25ca3d`. O commit desta tarefa acrescenta somente a edição e sua integração com
a listagem já entregue. Para integrar as tarefas separadamente, a listagem precede a edição.

Fluxo: administração → Pacientes → selecionar paciente → Editar Paciente → salvar → lista.
A rota `EditarPaciente` exige id inteiro positivo; ausência ou valor inválido não dispara
consulta de paciente nem abre cadastro. Navegador e montagem direta exigem sessão ADM.

O formulário usa os componentes, cards, fonte Inter e tokens de tema existentes:

- Identificação e acesso: nome, email e nova senha opcional.
- Vínculo profissional: seleção obrigatória por nome/registro, com busca e lista virtualizada.
- Dados de perfil: nascimento, sexo, profissão, telefone, endereço, bairro e foto para consulta.

O contrato real de `PUT /admin/pacientes/{id}` permite apenas nome, email, senha opcional
e `profissionalId`. Nome/email têm limite de 120 caracteres; senha, se preenchida, tem de
8 a 100. Senha vazia envia null e mantém a atual. A senha nunca aparece na confirmação.
Alterações de email, senha ou responsável pedem confirmação antes de enviar. O backend
consultado revoga as sessões do paciente ao redefinir sua senha.

O formulário carrega `GET /admin/pacientes/{id}` e os profissionais de `GET /profissionais`.
Não usa endpoints exclusivos do profissional, não cadastra nem exclui pacientes e não
remove o vínculo: o profissional é obrigatório no DTO administrativo. Os demais campos
de perfil permanecem fora do payload. Duplicidade de email continua bloqueada pelo servidor.

São tratados carregamento, falhas de consulta com nova tentativa, lista de responsáveis vazia,
erros de validação, rede, 400/403/404/409 e preservação dos campos após recusa de gravação.
Enquanto aguarda confirmação ou resposta, bloqueia campos e envios repetidos. Uma confirmação
resolvida após perda de acesso/desmontagem não inicia gravação. Ao salvar, invalida o cache
administrativo e retorna à lista atualizada.

O backend vizinho foi apenas inspecionado, sem modificações ou operações reais. Os testes
usam serviços simulados; execução em aparelho e integração HTTP real não foram verificadas.

Validação em 26/10/2026: TypeScript, ESLint e Prettier passaram; Jest passou com 41 suítes
e 431 testes. A exportação Expo Android passou em `dist/admin-editar-paciente`, ignorada
pelo Git. Os 41 testes focados da área administrativa incluem acesso, navegação, validações,
contrato enviado, responsável obrigatório, confirmação, erros, concorrência e atualização da lista.
