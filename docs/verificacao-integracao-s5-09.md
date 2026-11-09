# Verificação de integração (S5-09)

Autenticação, permissões dos três perfis, contratos da API e respostas de erro entre o app e o
backend [Fisio-Teach](https://github.com/LarissaFelixx/Fisio-Teach) (`main`, `fc8074c`).

## Autenticação

- Login, renovação e logout por JWT (`/auth/login`, `/auth/refresh`, `/auth/logout`). O access
  token fica só em memória; o refresh token, no armazenamento seguro, e é trocado a cada renovação.
- O backend valida a sessão (`sid`) em toda requisição: logout e troca de senha derrubam na hora
  o access token e o refresh token daquela conta.
- No app, **só o 401 desloga**, e só quando a renovação também falha. 403, 404, 409, 5xx, falta de
  rede e timeout mantêm a sessão (`authInterceptors.test.ts`, `session.test.ts`).
- Troca de senha: o app reloga sozinho com a nova senha e continua na mesma tela; se esse login
  falhar, volta para o login (`useAlterarSenha`, `AlterarSenhaProfissional.test.tsx`).

## Permissões por perfil

Regras do `SecurityConfig` do backend. O app só monta o navegador do perfil logado
(`RootNavigator`), então as telas de um perfil não chamam rotas de outro.

| Rotas                                                                                                                        | Admin   | Profissional | Paciente |
| ---------------------------------------------------------------------------------------------------------------------------- | ------- | ------------ | -------- |
| `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/recuperar-senha`, `/auth/redefinir-senha`, `POST /pacientes/cadastro` | público | público      | público  |
| `/auth/me`                                                                                                                   | sim     | sim          | sim      |
| `/profissionais/**`, `/admin/pacientes/**`, `/admin/me/**`                                                                   | sim     | 403          | 403      |
| `/profissionais/me/**`                                                                                                       | 403     | sim          | 403      |
| `/pacientes/**`, `/consultas/**`, `/mensagens/**`, `/avaliacoes/**`, `/prontuario/**`, `/agenda/**`                          | 403     | sim          | 403      |
| `/me/**` (inclui `/me/prontuario/**`)                                                                                        | 403     | 403          | sim      |

Além do perfil, o backend filtra por dono: profissional só vê os próprios pacientes, consultas e
prontuários (404 para os dos outros); paciente só vê as próprias consultas pelo `/me` (404).

Todos os endpoints chamados pelos services do app existem no backend e estão na coluna do perfil
que os usa.

## Respostas de erro

Corpo padrão: `{ status, error, message }` (o `ApiExceptionHandler` acrescenta `timestamp`).

| Status     | Quando                                                                               | Mensagem do backend                                  | O que o app faz                                             |
| ---------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------- | ----------------------------------------------------------- |
| 400        | Validação do corpo                                                                   | "Dados da requisição inválidos."                     | Mensagem da tela ("Verifique os dados…")                    |
| 400        | Senha atual errada                                                                   | "Senha atual incorreta."                             | "Senha atual incorreta."                                    |
| 400        | Término do plano antes do início                                                     | "A data final não pode ser anterior à data inicial." | Barrado antes, na validação local                           |
| 401        | Sem token, token inválido, sessão revogada                                           | "Token inválido ou expirado." e similares            | Renova uma vez; se falhar, desloga                          |
| 401        | Login com credencial errada                                                          | igual para email inexistente                         | "Usuário ou senha incorreta."                               |
| 403        | Perfil sem acesso à rota                                                             | "Acesso negado."                                     | "Você não tem permissão para fazer isso." (padrão)          |
| 404        | Recurso inexistente ou de outro dono                                                 | "… não encontrado(a)."                               | Mensagem da tela, sem "Tentar novamente" quando não adianta |
| 409        | Email duplicado, horário ocupado, avaliação repetida, exclusão com registros ligados | varia                                                | Mensagem específica da tela                                 |
| 5xx / rede | Falha do servidor ou sem conexão                                                     | —                                                    | Mensagem genérica ou "Sem conexão…", com "Tentar novamente" |

## O que a verificação encontrou e corrigiu

1. **Sessão derrubada depois da troca de senha (S5-08).** Uma renovação com o refresh token antigo
   que voltasse 401 depois do novo login apagava os tokens novos e deslogava. Corrigido em
   `session.ts`, com teste de regressão.
2. **403 sem mensagem própria.** Caía na mensagem genérica de cada tela; agora `mensagemDeErro` usa
   "Você não tem permissão para fazer isso." quando a tela não define outra.
3. **Contrato do Revisar Plano.** O app esperava 409/422 para término antes do início, mas o
   backend responde 400; o mapeamento morto saiu.
4. **Excluir consulta com evolução ou avaliação.** O backend recusa com 409 (chave estrangeira) e o
   app mostrava "Não foi possível excluir a consulta."; agora explica o motivo.

## Como verificar

- Unitários (sem backend): `npm test`.
- Contrato contra o backend real (`src/contract/api.contract.test.ts`): suba o backend em dev
  (`bash dev.sh 8080` no Fisio-Teach), preencha `.maestro/e2e.local` e rode
  `npm run test:contract`. Cobre os três perfis, a matriz de 403 acima, 401 sem token e com token
  inválido, login sem revelar se o email existe, corpos de 400/404/409, logout revogando a sessão,
  troca de senha revogando a sessão antiga e o prontuário do profissional (evoluções, versões do
  plano, 400 e 404 de outro profissional).
- E2E (Maestro): `profissional-prontuario.yaml` (S5-07) e `profissional-senha.yaml` (S5-08), além
  de `auth-profissional.yaml` (401 no login, sessão restaurada, logout).
