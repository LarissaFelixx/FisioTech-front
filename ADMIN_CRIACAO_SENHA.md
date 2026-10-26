# Admin - Criação de senha

Branch `feat/tela-adm-criacao-senha`, derivada de `feat/tela-adm-editar-paciente` no commit
`1256288`. A tela define uma nova senha para contas existentes de pacientes e profissionais,
conforme esclarecimento do usuário. A própria senha do ADM não faz parte desta tarefa.

Fluxo: administração de profissionais → Criação de senha → categoria → buscar e selecionar
conta → informar e confirmar nova senha → confirmar a operação → sucesso.

O navegador e a montagem direta da tela exigem sessão autenticada com `ROLE_ADMIN`.
O layout usa os mesmos cards, fonte Inter, componentes e tokens de tema do sistema.
A seleção é virtualizada e possui busca local por nome/email, atualização manual, estado
vazio, carregamento e nova tentativa. Erros de listagem ocultam as contas, inclusive em cache.

A senha é obrigatória, possui entre 8 e 100 caracteres e precisa coincidir com a confirmação.
Os dois campos são protegidos com `secureTextEntry`; espaços em senhas válidas são preservados.
A confirmação mostra nome, email, categoria e id da conta, sem mostrar a senha. A operação
substitui a senha anterior e o backend revoga as sessões da conta afetada.

## Contrato HTTP existente

Não há endpoint administrativo dedicado somente à senha. São reutilizados os serviços:

- Paciente: `GET /admin/pacientes/{id}` seguido de `PUT /admin/pacientes/{id}`.
- Profissional: `GET /profissionais/{id}` seguido de `PUT /profissionais/{id}`.

Antes da confirmação, o perfil é buscado novamente. O PUT mantém os campos retornados e
altera a senha; não usa os valores antigos da listagem, não reformata valores monetários
nem remove/reordena convênios. Senha e confirmação ficam apenas no estado transitório do
formulário; não são gravadas em armazenamento local, parâmetros de rota ou cache de mutações.

O DTO administrativo de pacientes exige um profissional responsável. Caso o paciente não
tenha vínculo, a tela orienta defini-lo na edição e não envia o PUT. Não escolhe nem modifica
o vínculo automaticamente. Os bloqueios de integridade e duplicidade do servidor permanecem.

O GET seguido de PUT reduz o uso de dados desatualizados, mas a API não fornece versão/ETag:
uma edição concorrente entre a leitura e a gravação ainda depende de controle no backend.
Um endpoint exclusivo de senha permitiria eliminar o reenvio dos demais campos.

## Comportamento e segurança

Durante leitura, confirmação e gravação, impede envios repetidos e troca de conta e bloqueia
os campos. Confirmação cancelada ou resolvida após desmontagem/perda de acesso não inicia
gravação. Erros 400/403/404/409 e de rede mantêm os campos para correção ou nova tentativa.

Após sucesso, limpa ambos os campos, mostra a confirmação e permite selecionar outra conta.
Invalida os caches administrativos afetados. A sessão do ADM é mantida; não autentica como
a conta alterada e não chama os endpoints de alteração da própria senha.

O backend vizinho foi consultado somente para leitura: serviços e DTOs de paciente/profissional
e autorização de `SecurityConfig`. Não houve mudança ou operação real nesse repositório.
Testes com serviços simulados e exportação Android não comprovam execução em aparelho,
integração HTTP real ou revogação de sessões no servidor em execução.

## Validação em 26/10/2026

- TypeScript, ESLint e Prettier dos arquivos alterados passaram.
- Jest: 42 suítes e 452 testes passaram, incluindo 21 cenários desta tela.
- Exportação Expo Android concluída em `dist/admin-criacao-senha`, ignorada pelo Git.
- Validação em aparelho e com a API real permanece pendente.
