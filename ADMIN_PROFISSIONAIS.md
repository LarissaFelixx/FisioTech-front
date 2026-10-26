# Administração de perfis de profissionais

Implementação na branch `feat/tela-adm-profissionais`, em 22/10/2026.

## Acesso e fluxo

Após autenticação, `ROLE_ADMIN` entra em `AdminNavigator`, na lista de profissionais.
`ROLE_PROFISSIONAL` e `ROLE_PACIENTE` continuam nos próprios navegadores e não têm rotas
administrativas. O navegador e cada tela administrativa usam `AdminOnly`, que exige sessão
autenticada e o papel exato de administrador antes de montar componentes ou buscar dados.

Fluxo: lista → Novo profissional ou selecionar perfil → formulário → salvar ou excluir → lista.
O botão Sair permanece no cabeçalho administrativo.

As telas seguem os componentes, fonte Inter, cores, espaçamentos, cards, campos e confirmação
global já utilizados em pacientes e consultas. A lista tem busca local por nome, email, registro
e especialidade, carregamento, estado vazio, erros, atualização manual e ao retornar do formulário.
Em erro temporário de atualização, os dados anteriores são preservados; em 403, ficam ocultos.

## Funções disponíveis

- Listar e buscar qualquer profissional retornado pela API administrativa.
- Cadastrar nome, email, senha inicial, registro, especialidade, valor particular e convênios.
- Consultar e corrigir todos os campos do contrato, incluindo nascimento, sexo, telefone e foto.
- Substituir email e registro profissional, com confirmação da correção administrativa.
- Definir nova senha sem a senha anterior, com confirmação. Campo vazio na edição envia null
  e mantém a atual; a nova senha nunca aparece na confirmação nem é persistida localmente.
- Remover convênios, limpar dados opcionais e corrigir o valor da consulta, inclusive para zero.
- Excluir perfil após confirmação, sujeito aos vínculos existentes no backend.

Senha é obrigatória somente no cadastro. As validações usam os componentes e utilitários do
app e os limites dos DTOs: nome/email/especialidade até 120 caracteres, registro até 20,
senha entre 8 e 100, data válida e valor monetário não negativo. Convênios são informados
um por linha, com remoção de entradas vazias/repetidas. Não há lista fechada de especialidades,
convênios ou formato regional obrigatório para registro.

Os botões e campos ficam bloqueados enquanto há uma operação/confirmação em andamento.
O formulário mantém os dados digitados se o servidor recusar a operação. Uma confirmação
resolvida depois da desmontagem da tela/perda de acesso não inicia uma alteração.

## Restrições mantidas conforme decisão do usuário

- Email já cadastrado: operação bloqueada pelo servidor (409).
- Registro profissional já cadastrado: operação bloqueada pelo servidor (409).
- Profissional com registros vinculados: exclusão bloqueada pelo servidor (409).
- Não há exclusão em cascata, alteração de papel, acesso para profissionais ou mecanismo
  genérico para ignorar as regras do servidor.

## API e evidência do backend

| Operação                      | Endpoint                     |
| ----------------------------- | ---------------------------- |
| Listar                        | `GET /profissionais`         |
| Consultar                     | `GET /profissionais/{id}`    |
| Cadastrar                     | `POST /profissionais`        |
| Corrigir / definir nova senha | `PUT /profissionais/{id}`    |
| Excluir                       | `DELETE /profissionais/{id}` |

Foram reutilizados `profissionalService`, tipos e hooks existentes. Os hooks invalidam as
consultas de profissionais e, nas correções/exclusões, a lista administrativa de pacientes.
O cliente Axios existente envia JWT; não são enviados campos de papel ou flags de override.

O repositório vizinho `fisiotech-back` foi inspecionado somente para leitura:

- `admin/config/SecurityConfig.java`: `/profissionais/**` exige ADMIN; a exceção
  `/profissionais/me/**` exige PROFISSIONAL e é exclusiva da própria senha.
- `profissional/dto/ProfissionalCreateRequest.java` e `ProfissionalUpdateRequest.java`:
  campos e limites aceitos pelo servidor.
- `profissional/service/ProfissionalService.java`: duplicidade de email/registro, correção
  do perfil e revogação de sessões ao redefinir a senha.
- `exception/ApiExceptionHandler.java`: conflitos de integridade são retornados como 409.

Isso comprova a política declarada no código local. O backend em execução precisa corresponder
a essa versão; a proteção no app não substitui a autorização do servidor. Não houve alteração
do backend nesta entrega.

## Verificação

Os testes novos cobrem os DTOs montados pelo formulário, validação, preservação da senha,
correções administrativas, confirmação, exclusão, conflitos, envio simultâneo e navegação.
Também cobrem acesso negado para paciente/profissional, montagem direta de telas protegidas
e perda de acesso com confirmação pendente.

Validação em dispositivo/backend: entrar como ADM, cadastrar um perfil de teste, corrigir os
campos, redefinir a senha, verificar que duplicidades e vínculos continuam bloqueados e
confirmar que contas de profissional/paciente não acessam os endpoints administrativos.
Testes com serviços simulados não comprovam execução em aparelho nem autorização real.

### Resultado em 22/10/2026

- TypeScript: `tsc --noEmit` passou.
- ESLint e Prettier: os arquivos adicionados/alterados passaram.
- Jest: 38 suítes e 380 testes passaram com `--runInBand --testTimeout=15000` e
  `--cacheDirectory=node_modules/.cache/jest-admin-profissionais`.
- Exportação Expo Android: passou; bundle Hermes e assets em `dist/admin-profissionais`,
  ignorados pelo Git. A repetição fora do sandbox resolveu a permissão de gravação temporária
  do Hermes, sem alterar a configuração do aplicativo.
- Não houve execução no aparelho/emulador, teste HTTP contra backend real ou modificação
  do repositório backend. O bundle exportado não é um APK instalado.
