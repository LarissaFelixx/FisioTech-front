# Plano de migração — FisioTech: Angular + Capacitor → React Native (Expo)

> Inventário gerado no **Batch 0** a partir do repositório de origem `fisiotech-front`
> (Angular 22 + Capacitor 8, commit `3fd764c`). O backend (Java 21 / Spring Boot) **não muda**:
> o app novo consome exatamente a mesma API.

## Sumário

0. [Stack alvo e fluxo de trabalho](#0-stack-alvo-e-fluxo-de-trabalho)
1. [Rotas, telas e navegação](#1-rotas-telas-e-navegação)
2. [Services, endpoints e models](#2-services-endpoints-e-models)
3. [Autenticação em detalhe](#3-autenticação-em-detalhe)
4. [Perfis de usuário e redirecionamento pós-login](#4-perfis-de-usuário-e-redirecionamento-pós-login)
5. [Home do profissional em detalhe](#5-home-do-profissional-em-detalhe)
6. [Plugins do Capacitor → Expo](#6-plugins-do-capacitor--expo)
7. [Bibliotecas de terceiros e substitutos](#7-bibliotecas-de-terceiros-e-substitutos)
8. [Como rodar o app em cada entrega](#8-como-rodar-o-app-em-cada-entrega)
9. [Divisão em batches](#9-divisão-em-batches)
10. [Riscos e dúvidas](#10-riscos-e-dúvidas)

---

## 0. Stack alvo e fluxo de trabalho

| Tema             | Escolha                                                         |
| ---------------- | --------------------------------------------------------------- |
| Base             | Expo (managed workflow), SDK 57, React Native 0.86, React 19    |
| Linguagem        | TypeScript `strict`                                             |
| Navegação        | React Navigation (native stack + bottom tabs)                   |
| HTTP             | axios com interceptors                                          |
| Dados remotos    | TanStack Query                                                  |
| Armazenamento    | `expo-secure-store` (credencial) e AsyncStorage (dados simples) |
| Estilos          | `StyleSheet` do React Native, sem biblioteca de UI              |
| Testes unitários | Jest (`jest-expo`) + `@testing-library/react-native`            |
| Testes e2e       | Maestro (fluxos YAML rodando no emulador ou dispositivo)        |
| Alvo             | Android (APK)                                                   |

### Estrutura de pastas

```
src/
  api/          cliente axios, interceptors
  services/     chamadas à API por domínio
  hooks/        hooks customizados (useAuth, useConsultas...)
  contexts/     AuthContext e outros estados globais
  navigation/   stacks e tabs
  screens/      uma pasta por tela
  components/   componentes reutilizáveis
  types/        interfaces e models
  theme/        cores, espaçamentos, tipografia
```

### Fluxo git

- **`main`**: recebe só o commit inicial (esqueleto Expo + este plano). As atualizações futuras da `main` são feitas manualmente pelo time, por release.
- **`dev`**: branch de integração, criada a partir da `main` e usada como _trunk_ da stack.
- **Batches 1 em diante**: formam uma única stack de PRs gerenciada com [`gh stack`](https://github.com/github/gh-stack). Todas as branches usam o prefixo `feat/migration/`. Cada batch é uma camada, e o PR de cada camada tem como base a camada logo abaixo:

```
(dev) <- feat/migration/batch-01-setup
      <- feat/migration/batch-02-auth-home-profissional
      <- feat/migration/batch-03-camada-dados
      <- feat/migration/batch-04-profissional-pacientes
      <- feat/migration/batch-05-profissional-consultas
      <- feat/migration/batch-06-registro-clinico
      <- feat/migration/batch-07-profissional-mensagens-senha
      <- feat/migration/batch-08-paciente-consultas
      <- feat/migration/batch-09-paciente-marcar-consulta
      <- feat/migration/batch-10-paciente-mensagens-perfil
      <- feat/migration/batch-11-admin
      <- feat/migration/batch-12-build-apk
```

As camadas são criadas uma a uma, cada uma só depois de o batch anterior ser aprovado. O merge acontece para dentro da `dev` via `gh stack merge`, somente quando o time pedir.

- Commits pequenos, com mensagens em português.
- Ao fim de cada batch, a entrega só é considerada pronta quando `npx tsc --noEmit` passa, a suíte completa de testes roda e o app abre sem erro.

---

## 1. Rotas, telas e navegação

Origem: `src/app/app.routes.ts` e `src/app/layout/shell/`.

### 1.1 Rota pública

| Rota     | Componente             | Descrição                                                                     |
| -------- | ---------------------- | ----------------------------------------------------------------------------- |
| `/login` | `features/login/login` | Uma tela com duas abas: **Login** e **Cadastrar** (autocadastro de paciente). |

### 1.2 Rotas autenticadas

Todas ficam dentro do `Shell`, protegidas por `authGuard`. A rota `''` redireciona para `home`, e o curinga `**` também vai para `home`.

**Profissional** (`roleGuard('ROLE_PROFISSIONAL')`)

| Rota                       | Componente                  | Metadados                          | Função                                               |
| -------------------------- | --------------------------- | ---------------------------------- | ---------------------------------------------------- |
| `/home`                    | `features/home`             | `hideHeader`                       | Home do profissional (ver §5)                        |
| `/pacientes`               | `pacientes/paciente-list`   | `hideHeader`, backTo `/home`       | Lista de pacientes                                   |
| `/pacientes/novo`          | `pacientes/paciente-form`   | título "Novo Paciente"             | Cadastro de paciente                                 |
| `/pacientes/:id`           | `pacientes/paciente-form`   | título "Editar Paciente"           | Edição/exclusão do paciente e histórico de consultas |
| `/pacientes/:id/mensagens` | `mensagens/mensagem-thread` | `hideHeader`, `hideNav`            | Conversa com o paciente                              |
| `/mensagens`               | `mensagens/caixa-entrada`   | título "Mensagens", backTo `/home` | Caixa de entrada                                     |
| `/consultas`               | `consultas/consulta-list`   | `hideHeader`                       | Lista com filtros, agrupada por data                 |
| `/consultas/novo`          | `consultas/consulta-form`   | título "Nova Consulta"             | Nova consulta, com cadastro rápido de paciente       |
| `/consultas/:id`           | `consultas/consulta-detail` | `hideHeader`, `hideNav`            | Detalhe/prontuário, avaliação e exclusão             |
| `/consultas/:id/wizard`    | `consultas/consulta-wizard` | `hideHeader`, `hideNav`            | Registro clínico em 4 etapas                         |
| `/senha`                   | `profissional-senha`        | backTo `/home`                     | Alterar a própria senha                              |

**Admin** (`roleGuard('ROLE_ADMIN')`)

| Rota                        | Componente                | Função                                                 |
| --------------------------- | ------------------------- | ------------------------------------------------------ |
| `/admin/profissionais`      | `admin/profissional-list` | Lista de profissionais                                 |
| `/admin/profissionais/novo` | `admin/profissional-form` | Cadastro de profissional                               |
| `/admin/profissionais/:id`  | `admin/profissional-form` | Edição/exclusão                                        |
| `/admin/pacientes`          | `admin/paciente-list`     | Lista de pacientes                                     |
| `/admin/pacientes/:id`      | `admin/paciente-form`     | Edição do paciente, incluindo o profissional vinculado |
| `/admin/senha`              | `admin/admin-senha`       | Alterar a própria senha                                |

**Paciente** (`roleGuard('ROLE_PACIENTE')`)

| Rota                                  | Componente                          | Função                                                                                             |
| ------------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------- |
| `/paciente/home`                      | `paciente/paciente-home`            | Home: próxima consulta, totais, indicador de mensagem                                              |
| `/paciente/consultas`                 | `paciente/paciente-consulta-list`   | Minhas consultas                                                                                   |
| `/paciente/consultas/marcar`          | `paciente/consulta-booking`         | Marcar consulta: busca de profissional, disponibilidade, tipo e convênio (`hideHeader`, `hideNav`) |
| `/paciente/consultas/:id`             | `paciente/paciente-consulta-detail` | Detalhe: cancelar, remarcar, avaliar                                                               |
| `/paciente/mensagens`                 | `paciente/paciente-mensagens`       | Lista de conversas                                                                                 |
| `/paciente/mensagens/:profissionalId` | `paciente/paciente-mensagem-thread` | Conversa com o profissional                                                                        |
| `/paciente/perfil`                    | `paciente/paciente-perfil`          | Editar o próprio perfil                                                                            |
| `/paciente/senha`                     | `paciente/paciente-senha`           | Alterar a própria senha                                                                            |

### 1.3 Shell (layout)

- **Header**: aparece quando a rota tem `title` e não tem `hideHeader`. Contém o botão de menu (abre a sidebar), um botão voltar (`backTo`), o título e o botão **Sair**.
- **Bottom nav**: escondida quando a rota tem `hideNav`. Os itens dependem do perfil:
  - Admin: Profissionais, Pacientes
  - Profissional: Home, Pacientes, Consultas, Mensagens
  - Paciente: Home, Consultas, Mensagens, Perfil
- **Sidebar**: avatar com iniciais, nome, "Editar Perfil" (só paciente), "Alterar Senha" (rota por perfil) e "Sair".
- **`ConfirmDialog` global**: diálogo de confirmação baseado em Promise, usado nas exclusões e no cancelamento de consulta.

### 1.4 Mapeamento para React Navigation

```
RootNavigator (decide pelo AuthContext)
├── status = restoring  → SplashScreen (restaurando sessão)
├── status = signedOut  → AuthStack
│                          └── Login (abas Login | Cadastrar)
└── status = signedIn   → navegador do perfil (user.role)
    ├── ROLE_PROFISSIONAL → ProfissionalStack
    │     ├── ProfissionalTabs (Home | Pacientes | Consultas | Mensagens)
    │     └── telas empilhadas por cima das tabs: PacienteForm, MensagemThread,
    │         ConsultaForm, ConsultaDetail, ConsultaWizard, AlterarSenha
    ├── ROLE_PACIENTE     → PacienteStack (tabs Home | Consultas | Mensagens | Perfil + telas)
    ├── ROLE_ADMIN        → AdminStack (tabs Profissionais | Pacientes + telas)
    └── outro papel       → tela placeholder "perfil não suportado" com botão Sair
```

- Os route guards deixam de existir: a navegação condicional já garante que cada perfil só enxerga o próprio navegador.
- `title` vira `options.title`, `backTo` vira o voltar nativo do stack, e `hideHeader`/`hideNav` viram `headerShown: false` ou a tela empilhada fora das tabs.
- A sidebar vira um bottom sheet ou modal de menu (não entra biblioteca de drawer sem aprovação).

---

## 2. Services, endpoints e models

Origem: `src/app/core/**`. Todas as URLs são relativas a `environment.apiUrl`, que no app novo vem de `EXPO_PUBLIC_API_URL`.

### 2.1 Endpoints por service

| Service (origem)                        | Método                     | HTTP   | Endpoint                                                   | Request → Response                                         |
| --------------------------------------- | -------------------------- | ------ | ---------------------------------------------------------- | ---------------------------------------------------------- |
| `auth/auth.service.ts`                  | `login` / `restoreSession` | GET    | `/auth/me` (header `Authorization: Basic`)                 | → `CurrentUser`                                            |
| `pacientes/paciente.service.ts`         | `listarTodos`              | GET    | `/pacientes`                                               | → `Paciente[]`                                             |
|                                         | `buscarPorId`              | GET    | `/pacientes/{id}`                                          | → `Paciente`                                               |
|                                         | `criar`                    | POST   | `/pacientes`                                               | `PacienteCreateRequest` → void                             |
|                                         | `cadastrarPublico`         | POST   | `/pacientes/cadastro` (**público**)                        | `PacienteCreateRequest` → void                             |
|                                         | `atualizar`                | PUT    | `/pacientes/{id}`                                          | `PacienteUpdateRequest` → void                             |
|                                         | `deletar`                  | DELETE | `/pacientes/{id}`                                          | → void                                                     |
| `pacientes/paciente-admin.service.ts`   | `listarTodos`              | GET    | `/admin/pacientes`                                         | → `Paciente[]`                                             |
|                                         | `buscarPorId`              | GET    | `/admin/pacientes/{id}`                                    | → `Paciente`                                               |
|                                         | `atualizar`                | PUT    | `/admin/pacientes/{id}`                                    | `PacienteAdminUpdateRequest` → void                        |
| `profissionais/profissional.service.ts` | `listarTodos`              | GET    | `/profissionais`                                           | → `Profissional[]`                                         |
|                                         | `buscarPorId`              | GET    | `/profissionais/{id}`                                      | → `Profissional`                                           |
|                                         | `criar`                    | POST   | `/profissionais`                                           | `ProfissionalCreateRequest` → void                         |
|                                         | `atualizar`                | PUT    | `/profissionais/{id}`                                      | `ProfissionalUpdateRequest` → void                         |
|                                         | `deletar`                  | DELETE | `/profissionais/{id}`                                      | → void                                                     |
|                                         | `alterarPropriaSenha`      | PUT    | `/profissionais/me/senha`                                  | `AlterarSenhaRequest` → void                               |
| `admin/admin.service.ts`                | `alterarPropriaSenha`      | PUT    | `/admin/me/senha`                                          | `AlterarSenhaRequest` → void                               |
| `consultas/consulta.service.ts`         | `listarTodos(pacienteId?)` | GET    | `/consultas?pacienteId=`                                   | → `Consulta[]`                                             |
|                                         | `buscarPorId`              | GET    | `/consultas/{id}`                                          | → `Consulta`                                               |
|                                         | `criar`                    | POST   | `/consultas`                                               | `ConsultaCreateRequest` → **id lido do header `Location`** |
|                                         | `atualizar`                | PUT    | `/consultas/{id}`                                          | `ConsultaUpdateRequest` → void                             |
|                                         | `deletar`                  | DELETE | `/consultas/{id}`                                          | → void                                                     |
| `mensagens/mensagem.service.ts`         | `listarPorPaciente`        | GET    | `/mensagens?pacienteId=`                                   | → `Mensagem[]`                                             |
|                                         | `enviar`                   | POST   | `/mensagens`                                               | `MensagemCreateRequest` → void                             |
|                                         | `caixaEntrada`             | GET    | `/mensagens/caixa-entrada`                                 | → `CaixaEntradaItem[]`                                     |
| `avaliacoes/avaliacao.service.ts`       | `buscarPorConsulta`        | GET    | `/avaliacoes/consulta/{consultaId}`                        | → `Avaliacao`                                              |
|                                         | `criar`                    | POST   | `/avaliacoes`                                              | `AvaliacaoCreateRequest` → void                            |
| `me/me.service.ts` (paciente)           | `perfil`                   | GET    | `/me`                                                      | → `Paciente`                                               |
|                                         | `atualizarPerfil`          | PUT    | `/me`                                                      | `MePerfilUpdateRequest` → void                             |
|                                         | `alterarSenha`             | PUT    | `/me/senha`                                                | `AlterarSenhaRequest` → void                               |
|                                         | `minhasConsultas`          | GET    | `/me/consultas`                                            | → `Consulta[]`                                             |
|                                         | `minhaConsulta`            | GET    | `/me/consultas/{id}`                                       | → `Consulta`                                               |
|                                         | `cancelarConsulta`         | PUT    | `/me/consultas/{id}/cancelar`                              | `{}` → void                                                |
|                                         | `remarcarConsulta`         | PUT    | `/me/consultas/{id}/remarcar`                              | `{ novaDataHora }` → `Consulta`                            |
|                                         | `minhasConversas`          | GET    | `/me/mensagens/caixa-entrada`                              | → `MinhaConversaItem[]`                                    |
|                                         | `minhaConversa`            | GET    | `/me/mensagens/{profissionalId}`                           | → `Mensagem[]`                                             |
|                                         | `enviarMensagem`           | POST   | `/me/mensagens/{profissionalId}`                           | `{ conteudo }` → void                                      |
|                                         | `avaliar`                  | POST   | `/me/avaliacoes`                                           | `AvaliacaoCreateRequest` → void                            |
|                                         | `minhaAvaliacao`           | GET    | `/me/avaliacoes/consulta/{consultaId}`                     | → `Avaliacao`                                              |
|                                         | `buscarProfissionais`      | GET    | `/me/profissionais?nome=&especialidade=` (ambos opcionais) | → `ProfissionalBusca[]`                                    |
|                                         | `buscarProfissional`       | GET    | `/me/profissionais/{id}`                                   | → `ProfissionalBusca`                                      |
|                                         | `buscarDisponibilidade`    | GET    | `/me/profissionais/{id}/disponibilidade?data=`             | → `DisponibilidadeResponse`                                |
|                                         | `marcarConsulta`           | POST   | `/me/consultas`                                            | `ConsultaBookingRequest` → `Consulta`                      |

### 2.1.1 Conferência com o backend e implementação (Batch 3)

- **Verificação:** os 45 endpoints acima foram conferidos contra os controllers do `fisiotech-back` (master, `07cbc22`). Todos existem com o mesmo verbo e caminho, e os campos dos DTOs batem com os models do Angular.
  - `ProfissionalBusca` corresponde a `ProfissionalPublicoResponse`.
  - `SlotDisponibilidade.horario` é um `LocalTime` (`"08:00:00"`).
  - `LocalDate` e `LocalDateTime` chegam sem fuso.
- **Onde ficou no RN:**
  - services em `src/services/*Service.ts`, um por service do Angular (`pacienteAdminService` e `adminService` junto dos afins);
  - hooks do TanStack Query em `src/hooks/use*.ts`;
  - chaves de cache em `src/hooks/queryKeys.ts`.
- **Validação:** `npm run test:contract` roda os services contra o backend real com os três perfis (19 cenários no Batch 3; 20 desde o Batch 6, que confere o salvamento por etapa do registro clínico).
- **Achados do contrato:**
  - Excluir paciente com registros associados (mensagens, consultas) retorna **409** ("recurso associado a outros registros"). O Angular mostrava só "Não foi possível excluir o paciente." A mensagem específica fica para decidir no Batch 4.
  - `GET /avaliacoes/consulta/{id}` e `GET /me/avaliacoes/consulta/{id}` retornam **404** quando a consulta ainda não foi avaliada. O Angular tratava qualquer erro como "sem avaliação"; o RN converte só o 404 em `null` (`nuloSeNaoEncontrado`), e erros de rede ou 5xx aparecem como erro.
  - Trocar a senha revoga todas as sessões. `useAlterarSenha` faz o login de novo com a nova senha, como o Angular; se falhar, desloga.
  - Marcar a primeira consulta vincula o profissional ao paciente (`profissionalId` passa a vir preenchido em `GET /me`).
- **Sem uso no app:** `POST /avaliacoes` (lado do profissional) existe no service do Angular, mas nenhuma tela o usa. Ficou no service, sem hook.

### 2.2 Códigos de erro tratados pelas telas

| Status | Onde                                                           | Mensagem                                                    |
| ------ | -------------------------------------------------------------- | ----------------------------------------------------------- |
| 401    | Login                                                          | "Usuário ou senha incorreta."                               |
| 409    | Cadastro público, perfil, formulários de paciente/profissional | "Já existe uma conta/paciente/profissional com este email." |
| 409    | Marcar/remarcar consulta                                       | "Este horário não está mais disponível. Escolha outro."     |
| 400    | Alterar senha (3 variantes)                                    | "Senha atual incorreta."                                    |
| outros | todas                                                          | mensagem genérica "Não foi possível … Tente novamente."     |

### 2.3 Models (copiados campo a campo para `src/types/`)

| Arquivo de origem                     | Tipos                                                                                                                                                                                                                                      |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `auth/current-user.ts`                | `CurrentUser { id, nome, email, role }`, `AlterarSenhaRequest { senhaAtual, novaSenha }`                                                                                                                                                   |
| `pacientes/paciente.model.ts`         | `Paciente`, `PacienteCreateRequest`, `PacienteUpdateRequest`, `PacienteAdminUpdateRequest`, `MePerfilUpdateRequest`                                                                                                                        |
| `profissionais/profissional.model.ts` | `Profissional`, `ProfissionalCreateRequest`, `ProfissionalUpdateRequest`                                                                                                                                                                   |
| `consultas/consulta.model.ts`         | `TipoConsulta` (`PRESENCIAL`\|`ONLINE`), `StatusConsulta` (`AGENDADA`\|`CONFIRMADA`\|`REALIZADA`\|`CANCELADA`), `QuadroClinico`, `HabitosVida`, `ExameFisico`, `Diagnostico`, `Consulta`, `ConsultaCreateRequest`, `ConsultaUpdateRequest` |
| `consultas/consulta-booking.model.ts` | `ProfissionalBusca`, `SlotDisponibilidade`, `DisponibilidadeResponse`, `ConsultaBookingRequest`                                                                                                                                            |
| `mensagens/mensagem.model.ts`         | `AutorMensagem` (`PROFISSIONAL`\|`PACIENTE`), `Mensagem`, `MensagemCreateRequest`, `CaixaEntradaItem`, `MinhaConversaItem`                                                                                                                 |
| `avaliacoes/avaliacao.model.ts`       | `Avaliacao`, `AvaliacaoCreateRequest`                                                                                                                                                                                                      |

### 2.4 Utilitários e componentes compartilhados

| Origem                                                                                   | Destino proposto                                                             |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `core/forms/field-error.ts` (mensagens de validação: obrigatório, email, min/max length) | `src/utils/validation.ts` (validadores puros + mesmas mensagens)             |
| `core/ui/avatar-color.ts` (hash do nome → tint blue/orange/green/purple)                 | `src/utils/avatarTint.ts`                                                    |
| `iniciais(nome)` (duplicado em 5 telas)                                                  | `src/utils/iniciais.ts` (fonte única)                                        |
| `core/ui/icon/icon.ts` (21 ícones SVG inline)                                            | `src/components/Icon` com `react-native-svg`, reaproveitando os mesmos paths |
| `core/ui/skeleton` (variantes `list`, `form`, `thread`, `lines`)                         | `src/components/Skeleton` com `Animated`                                     |
| `core/ui/confirm-dialog` (serviço com Promise)                                           | `src/components/ConfirmDialog` + `useConfirm()` (Context)                    |

---

## 3. Autenticação em detalhe

> ⚠️ **Atualização (Batch 2, 29/09/2026):** no mesmo dia, o backend (`gabrielneriqa/fisiotech-back`,
> PR #4, commit `07cbc22`) **trocou HTTP Basic por JWT** e desativou o Basic. Por decisão do time, o
> app React Native implementa o **JWT do backend atual** (ver §3.5). As seções 3.1–3.4 descrevem o
> Angular (Basic), que ficou incompatível com o backend atual.

Origem: `core/auth/*`, `features/login/*`, `features/*-senha/*`, `layout/shell/shell.ts`.

### 3.1 Formato da credencial: HTTP Basic, não há token

- **Não existe JWT nem token emitido pelo backend.** A autenticação é **HTTP Basic**. A credencial é `btoa("email:senha")`, enviada como `Authorization: Basic <credencial>`.
- Onde fica guardada: `sessionStorage`, chave `fisiotech.auth.credentials`. Por isso a sessão morre quando a aba ou o app fecha.
- O usuário logado fica em memória (signal `currentUser`) como `CurrentUser { id, nome, email, role }`.

### 3.2 Telas envolvidas

| Tela                   | Existe?              | Detalhes                                                                                                                     |
| ---------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Login                  | Sim                  | Aba "Login" em `/login`. Campos email (obrigatório, formato email) e senha (obrigatória).                                    |
| Cadastro               | Sim, só **paciente** | Aba "Cadastrar" em `/login`. Campos nome (obrigatório, ≤120), email (obrigatório, email, ≤120) e senha (obrigatória, 8–100). |
| Recuperação de senha   | **Não existe**       | Não há tela nem endpoint.                                                                                                    |
| Alterar senha (logado) | Sim, 3 variantes     | `/senha` (profissional), `/admin/senha`, `/paciente/senha`.                                                                  |

### 3.3 Fluxos

**Login**

1. `GET /auth/me` com o header Basic montado a partir do formulário.
2. Se der 200: salva a credencial no sessionStorage, guarda o `CurrentUser` e navega para `homeRouteFor(role)` (ver §4).
3. Se der 401: "Usuário ou senha incorreta.". Qualquer outro erro: "Não foi possível entrar. Tente novamente.".
4. O botão mostra "Entrando..." e fica desabilitado enquanto a requisição está em andamento.

**Cadastro público (paciente)**

1. `POST /pacientes/cadastro { nome, email, senha }`.
2. Se der certo, faz o login automático e vai para `/paciente/home`.
3. Se o login automático falhar: "Conta criada, mas não foi possível entrar automaticamente. Faça login." e volta para a aba Login.
4. 409: "Já existe uma conta com este email.". Outros erros: "Não foi possível criar a conta. Tente novamente.".

**Restauração de sessão (`authGuard`)**

- Se já existe usuário em memória, deixa passar.
- Senão, se há credencial salva, chama `GET /auth/me`. Se der certo, preenche o usuário. **Qualquer erro** redireciona para `/login` (a credencial não é apagada).
- Sem credencial salva, vai para `/login`.

**Interceptor (`auth.interceptor.ts`)**

- Se a requisição já tem `Authorization`, não mexe (é o caso do login testando uma credencial nova).
- Senão, se há credencial salva, adiciona `Authorization: Basic <credencial>`.
- **Não há tratamento global de 401/403**: cada tela trata os próprios erros.

**`roleGuard(role)`**

- Sem usuário, vai para `/login`. Se o papel for diferente do exigido, vai para `homeRouteFor(user.role)`.

**Logout**

- Apaga a credencial do sessionStorage, zera o usuário e navega para `/login`. **Não chama o backend.**
- Só é acessível pelo header ou pela sidebar do Shell, que ficam ocultos na home do profissional (ver §5.5).

**Alterar senha (profissional, admin e paciente)**

- Validação: senha atual obrigatória; nova senha obrigatória com 8–100 caracteres; confirmação precisa ser igual à nova.
- Endpoints: `PUT /profissionais/me/senha`, `PUT /admin/me/senha` ou `PUT /me/senha`.
- Se der certo, **faz login de novo com a nova senha** para atualizar a credencial Basic salva e, depois de 1,2 s, volta para a tela de origem. Se o novo login falhar, faz logout e vai para `/login`.
- 400: "Senha atual incorreta.".

### 3.4 Destino no React Native

| Angular                   | React Native                                                                                                                                                                                    |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AuthService` (signals)   | `src/services/authService.ts` (chamadas) + `src/contexts/AuthContext.tsx` (`status: 'restoring' \| 'signedOut' \| 'signedIn'`, `user`, `login`, `logout`, `cadastrar`) + `src/hooks/useAuth.ts` |
| `sessionStorage`          | `expo-secure-store` (refresh token JWT; ver §3.5)                                                                                                                                               |
| `authInterceptor`         | interceptor de request do axios em `src/api/client.ts` (mesma regra: não sobrescreve um `Authorization` já presente)                                                                            |
| `authGuard` / `roleGuard` | navegação condicional no `RootNavigator`                                                                                                                                                        |
| `btoa`                    | não é mais necessário (o JWT substituiu o Basic)                                                                                                                                                |

### 3.5 Implementação no app (JWT do backend atual)

Contrato (documentado em `docs/autenticacao-jwt.md` do backend e validado contra ele):

| Endpoint                          | Corpo              | Resposta                                                                                                                                             |
| --------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /auth/login` (sem Bearer)   | `{ email, senha }` | `TokenResponse { accessToken, tokenType: "Bearer", expiresIn: 900, refreshToken, refreshExpiresIn }`. Credencial inválida: 401. Dados inválidos: 400 |
| `POST /auth/refresh` (sem Bearer) | `{ refreshToken }` | Novo `TokenResponse`. **Rotação**: o token anterior é consumido, e reutilizá-lo revoga a sessão (401)                                                |
| `POST /auth/logout` (sem Bearer)  | `{ refreshToken }` | 204, inclusive quando repetido                                                                                                                       |
| `GET /auth/me` (com Bearer)       | —                  | `{ id, nome, email, role }` (inalterado)                                                                                                             |

- O access token dura 15 min e a sessão dura 7 dias a partir do login; renovar não estende esse prazo.
- Trocar a senha revoga todas as sessões da conta, então o app precisa fazer login de novo (vale para o Batch 7).

Como o app implementa:

| Peça            | Arquivo                           | Comportamento                                                                                                                                                                      |
| --------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tokens          | `src/services/tokenStorage.ts`    | O **refresh token** fica no `expo-secure-store` (chave `fisiotech.auth.refreshToken`). O **access token** fica só em memória. **A senha nunca é salva.**                           |
| Sessão          | `src/api/session.ts`              | `login`, `refresh` e `logout`. A renovação é **centralizada**: chamadas simultâneas compartilham um único `POST /auth/refresh`, e o novo refresh token é salvo antes de ser usado. |
| Interceptors    | `src/api/authInterceptors.ts`     | Injeta o `Bearer`. Num 401, renova **uma vez** e repete a requisição. Se a renovação responder 401, desloga.                                                                       |
| Cliente público | `src/api/client.ts` (`publicApi`) | Login, refresh, logout e cadastro público saem **sem** Bearer, como o backend exige.                                                                                               |
| Estado global   | `src/contexts/AuthContext.tsx`    | Estados `restoring`, `restoreFailed`, `signedOut` e `signedIn`. Ao abrir o app: com refresh token salvo, chama `refresh` e depois `/auth/me`.                                      |

Política de erros (decisão do Batch 0): **só 401 desloga**.

- Erro de rede, 5xx, 403 ou timeout na restauração levam à tela "Não foi possível conectar", com as opções "Tentar novamente" e "Sair", e o refresh token é mantido.
- Se o servidor chegou a consumir o refresh token e a resposta se perdeu, a nova tentativa recebe 401 e o app pede login novamente, como o backend recomenda.

---

## 4. Perfis de usuário e redirecionamento pós-login

Origem: `core/auth/role-routes.ts`.

| `role` retornado por `/auth/me` | Rota inicial no Angular | Destino no RN                                           |
| ------------------------------- | ----------------------- | ------------------------------------------------------- |
| `ROLE_PROFISSIONAL`             | `/home`                 | `ProfissionalStack` → Home do profissional              |
| `ROLE_PACIENTE`                 | `/paciente/home`        | `PacienteStack` (placeholder até o Batch 8)             |
| `ROLE_ADMIN`                    | `/admin/profissionais`  | `AdminStack` (placeholder até o Batch 11)               |
| qualquer outro valor            | `/home` (_default_)     | Placeholder "perfil não suportado" + Sair (ver risco 5) |

A decisão acontece em um único ponto: `homeRouteFor(role)` no Angular, `RootNavigator` no React Native.

---

## 5. Home do profissional em detalhe

Origem: `features/home/home.ts|html|scss`.

### 5.1 Dados e endpoints

| Fonte                           | Endpoint                | Uso                                           |
| ------------------------------- | ----------------------- | --------------------------------------------- |
| `AuthService.currentUser`       | (já carregado no login) | Nome na saudação e iniciais no avatar         |
| `ConsultaService.listarTodos()` | `GET /consultas`        | Hero, "sessões hoje" e agenda de hoje         |
| `PacienteService.listarTodos()` | `GET /pacientes`        | Só `.length`, exibido como "pacientes ativos" |

As duas requisições disparam em paralelo ao abrir a tela.

### 5.2 Blocos da tela (de cima para baixo)

1. **Saudação**: "Bem-vindo(a)," seguido do nome em destaque e, à direita, um avatar circular com as iniciais (2 letras) numa cor derivada do nome (`avatarTint`).
2. **Hero "Próxima consulta"**
   - Regra: a primeira consulta com status `AGENDADA` ou `CONFIRMADA` e `dataHora >= agora`, em ordem crescente de data.
   - Exibe:
     - o eyebrow "PRÓXIMA CONSULTA";
     - um badge de contagem regressiva:
       - se a consulta não é hoje, mostra a data `dd mmm` (pt-BR);
       - se é hoje e já está no horário, "agora";
       - se faltam menos de 60 min, "em X min";
       - se falta mais, "em Xh Ymin" ou "em Xh";
     - a hora `HH:mm` em fonte grande;
     - o nome do paciente;
     - um subtítulo "Online|Presencial · {convênio ou 'Particular'}".
   - Ações:
     - **Iniciar consulta**, que abre o registro clínico (`/consultas/:id/wizard`);
     - **Prontuário**, que abre o detalhe da consulta (`/consultas/:id`).
   - Sem próxima consulta, mostra o card "Nenhuma consulta futura agendada.".
3. **Cards de estatística** (2 colunas):
   - "pacientes ativos": total de `GET /pacientes`;
   - "sessões hoje": consultas de hoje com status diferente de `CANCELADA`.
4. **Agenda de hoje**
   - Cabeçalho "Agenda de hoje" com o link **ver tudo**, que leva para Consultas.
   - Lista as consultas de hoje, sem as canceladas e sem a que já está no hero, ordenadas por horário.
   - Cada linha mostra avatar de iniciais, nome do paciente, "HH:mm · Online|Presencial" e um chevron. Tocar na linha abre o detalhe da consulta.
   - Se não houver consultas: "Nenhuma outra consulta hoje.".

### 5.3 Estados

| Estado     | Angular                                                                        | RN (Batch 2)                                                    |
| ---------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| Carregando | Skeleton `lines` (4) no hero e `list` (3) na agenda                            | Igual (componente `Skeleton`)                                   |
| Vazio      | Textos do §5.2                                                                 | Igual                                                           |
| Erro       | **Não existe**: o erro é engolido e a tela aparece como vazia, com 0 pacientes | **Novo**: mensagem de erro com "Tentar novamente" (ver risco 4) |
| Atualizar  | Só recarregando a página                                                       | Pull-to-refresh + refetch ao voltar para a tela                 |

### 5.4 Ações disponíveis

- Iniciar consulta: abre o registro clínico (wizard, Batch 6).
- Prontuário e as linhas da agenda: abrem o detalhe da consulta (Batch 5; até lá, um placeholder).
- ver tudo: abre a aba Consultas (Batch 5).
- Bottom nav: Home, Pacientes, Consultas, Mensagens.
- **Sair**: não existe na home do Angular (ver §5.5).

### 5.5 Observações

- A rota tem `hideHeader: true`, então a home **não tem header, menu nem botão Sair**. No Angular, o profissional só consegue sair a partir de telas que mostram o header (Mensagens, formulários, Alterar Senha). Como o critério do Batch 2 exige logout, a proposta é tornar o avatar da saudação tocável e abrir um menu com "Alterar senha" e "Sair" (ver risco 2).
- A lógica de datas vai para funções puras testáveis em `src/screens/ProfissionalHome/homeLogic.ts`: `proximaConsulta`, `consultasHoje`, `agendaHoje`, `countdown`, `subtitulo` e `mesmoDia`.

---

## 6. Plugins do Capacitor → Expo

Origem: `package.json`, `capacitor.config.ts`, `android/`.

| Item                                                                      | Uso no Angular                     | Equivalente no Expo                                                                           |
| ------------------------------------------------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------- |
| `@capacitor/core`, `@capacitor/android`, `@capacitor/cli`                 | Empacota o build web num WebView   | Não se aplica: o app passa a ser nativo                                                       |
| Plugins nativos (`@capacitor/*` ou Cordova)                               | **Nenhum**                         | —                                                                                             |
| `appId: com.fisiotech.app`                                                | ID do app Android                  | `app.json` → `android.package: "com.fisiotech.app"` (já configurado)                          |
| `appName: FisioTech`                                                      | Nome exibido                       | `app.json` → `name: "FisioTech"` (já configurado)                                             |
| `server.androidScheme: 'http'`, `cleartext: true`                         | Permite chamar a API por `http://` | `expo-build-properties` → `android.usesCleartextTraffic: true` (necessário no APK de release) |
| Permissão `INTERNET`                                                      | `AndroidManifest.xml`              | Já incluída por padrão no Expo                                                                |
| `environment.mobile.ts` (`apiUrl: http://localhost:8081` + `adb reverse`) | URL da API no APK                  | `EXPO_PUBLIC_API_URL` no `.env` (ver `.env.example`)                                          |

---

## 7. Bibliotecas de terceiros e substitutos

A origem **não usa Ionic, Angular Material nem nenhuma biblioteca de UI**. Todo o visual é SCSS próprio, inspirado no design "AgedaFisio" (Figma).

| Origem                                     | Papel                       | Substituto no React Native                                                                                                               |
| ------------------------------------------ | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `@angular/router`                          | Rotas, guards, lazy loading | React Navigation (`@react-navigation/native`, `native-stack`, `bottom-tabs`) + `react-native-screens` + `react-native-safe-area-context` |
| `@angular/forms` (Reactive Forms)          | Formulários e validação     | Estado controlado (`useState`) + validadores puros de `src/utils/validation.ts`. Nenhuma biblioteca de formulário                        |
| `@angular/common/http` + interceptors      | HTTP                        | axios + interceptors (`src/api/client.ts`)                                                                                               |
| RxJS                                       | Assíncrono                  | async/await + TanStack Query (`@tanstack/react-query`)                                                                                   |
| `DatePipe` + `registerLocaleData(pt)`      | Formatação de datas pt-BR   | Helpers em `src/utils/date.ts` sobre `Intl` (disponível no Hermes)                                                                       |
| SVG inline (`Icon`)                        | Ícones                      | `react-native-svg` (mesmos paths)                                                                                                        |
| Google Fonts **Inter** (400–800)           | Tipografia                  | `@expo-google-fonts/inter` + `expo-font`                                                                                                 |
| `styles.scss` (CSS custom properties)      | Tema                        | `src/theme/` (`colors`, `spacing`, `radius`, `typography`, `shadows`)                                                                    |
| `sessionStorage`                           | Credencial                  | `expo-secure-store`                                                                                                                      |
| Vitest + jsdom                             | Testes unitários            | Jest (`jest-expo`) + `@testing-library/react-native`                                                                                     |
| — (não havia e2e)                          | Testes e2e                  | Maestro                                                                                                                                  |
| Prettier (`printWidth 100`, `singleQuote`) | Formatação                  | Prettier com a mesma configuração + ESLint (`eslint-config-expo`)                                                                        |

### 7.1 Tokens de tema extraídos de `src/styles.scss`

| Grupo             | Valores                                                                                                                                                                     |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primária          | `primary #0f9aa3`, `primaryDark #0b767d`                                                                                                                                    |
| Acento            | `accent #8b90f0`, `accentDark #6d72e0`                                                                                                                                      |
| Semânticas        | `success #2fbf71`, `danger #e15c5c`                                                                                                                                         |
| Superfícies       | `bg #eef1f2`, `surface #ffffff`, `border #e4e8ea`, `divider #f0f2f3`                                                                                                        |
| Texto             | `text #151a1e`, `textSecondary #5b6670`, `textTertiary #8a97a0`, `textInverse #ffffff`, `navInactive #a7b0b6`                                                               |
| Tints (bg/fg)     | blue `#e7f0fe/#4f7ad9`, orange `#fdeee2/#e0854a`, green `#eaf7ec/#3aab55`, purple `#f4e9fc/#8b5fc9`                                                                         |
| Status (bg/fg)    | confirmada `#e7f7f8/#0b767d`, agendada `#f0f2f3/#5b6670`, cancelada `#fdeaea/#d84343`                                                                                       |
| Raios             | `sm 14`, `md 20`, `pill 999`                                                                                                                                                |
| Sombra do card    | `0 6px 20px rgba(20,30,40,0.06)` → `shadow*` + `elevation` no Android                                                                                                       |
| Gradiente do hero | `#20c4cd → #0b767d` (145°). Usado no logo do login, no header do Shell e na home do paciente (não na home do profissional). Proposta: `expo-linear-gradient` (ver risco 10) |
| Fonte             | Inter, pesos 400/500/600/700/800                                                                                                                                            |

### 7.2 Testes da origem que servem de referência de casos

`auth.service`, `auth.interceptor`, `auth.guard`, `role.guard`, `field-error`, `login`, `confirm-dialog`, `confirm-dialog.service`, `skeleton`, `paciente-home`, `pacientes/paciente-form`, `pacientes/paciente-list`, `admin/profissional-form`, `consulta-wizard`, `profissional-senha`, `admin-senha`.

---

## 8. Como rodar o app em cada entrega

A partir do Batch 1, **todo batch termina com o app rodando no emulador e no celular físico**, com o passo a passo no README:

- **Emulador Android**: criar um AVD, rodar `npx expo start` e apertar `a`. O app abre no emulador pelo Expo Go. A API fica em `http://10.0.2.2:<porta>`.
- **Celular físico (desenvolvimento)**: instalar o **Expo Go** (Play Store), rodar `npx expo start` no PC e ler o QR code. Celular e PC precisam estar na mesma rede Wi-Fi, e a API aponta para o IP do PC.
- **APK instalável (sem depender do PC)**: a partir do **Batch 2**, um APK de preview é gerado por build local (`npx expo prebuild` + Gradle) e anexado ao PR ou release. Com ele, o app é instalado direto no aparelho e funciona com login e home reais, desde que o backend esteja acessível pela rede.
- Critério de pronto de cada batch: abre no emulador e no celular via Expo Go. A partir do B2, o APK também instala e abre.

---

## 9. Divisão em batches

| Batch                   | Branch                                                 | Escopo                                                                                                                                                                                                                                                                                                                                                                                                 |
| ----------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **B0**                  | `main` (commit inicial) + criação da `dev`             | Este inventário + esqueleto Expo (`blank-typescript`, TS strict, `com.fisiotech.app`) + `.gitignore` + `.env.example` + README                                                                                                                                                                                                                                                                         |
| **B1**                  | `feat/migration/batch-01-setup`                        | Criação do AVD. Estrutura `src/`. Tema (§7.1) e fonte Inter. React Navigation com `AuthStack` + stack principal e tela placeholder. Cliente axios lendo `EXPO_PUBLIC_API_URL`. ESLint/Prettier. Jest + RNTL com os primeiros testes. Maestro com smoke test. App abrindo no emulador e no celular (Expo Go), com guia no README                                                                        |
| **B2** — **1ª entrega** | `feat/migration/batch-02-auth-home-profissional`       | Models e services de auth. Interceptor Basic. `AuthContext` (login, cadastro, logout, restauração) com SecureStore. Tela Login/Cadastrar. Navegação condicional por perfil (placeholders para paciente e admin). Home do profissional completa (§5) com carregando/vazio/erro. Componentes `Icon`, `Skeleton`, `Avatar`, `ConfirmDialog`. Tratamento de erros (401, rede). **Primeiro APK instalável** |
| **B3**                  | `feat/migration/batch-03-camada-dados`                 | Todos os services, models e hooks (queries e mutations) restantes do §2                                                                                                                                                                                                                                                                                                                                |
| **B4**                  | `feat/migration/batch-04-profissional-pacientes`       | Lista de pacientes. Criar, editar e excluir. Histórico de consultas no formulário                                                                                                                                                                                                                                                                                                                      |
| **B5**                  | `feat/migration/batch-05-profissional-consultas`       | Lista com filtros (todas, agendadas, canceladas, remarcadas) agrupada por data. Nova consulta com cadastro rápido de paciente (id via `Location`). Detalhe/prontuário com avaliação e exclusão                                                                                                                                                                                                         |
| **B6**                  | `feat/migration/batch-06-registro-clinico`             | Wizard em 4 etapas (quadro clínico, hábitos, exame físico, diagnóstico) com salvamento por etapa, chips de histórico de saúde, voltar e retomada na etapa certa                                                                                                                                                                                                                                        |
| **B7**                  | `feat/migration/batch-07-profissional-mensagens-senha` | Caixa de entrada, conversa com o paciente, Alterar senha do profissional e menu lateral                                                                                                                                                                                                                                                                                                                |
| **B8**                  | `feat/migration/batch-08-paciente-consultas`           | Home do paciente, Minhas consultas e Detalhe (cancelar, remarcar com disponibilidade, avaliar 1–5)                                                                                                                                                                                                                                                                                                     |
| **B9**                  | `feat/migration/batch-09-paciente-marcar-consulta`     | Busca de profissional (nome/especialidade), seleção de data e horário, tipo, convênio e tratamento do 409                                                                                                                                                                                                                                                                                              |
| **B10**                 | `feat/migration/batch-10-paciente-mensagens-perfil`    | Conversas do paciente, conversa com o profissional, Meu perfil e Alterar senha                                                                                                                                                                                                                                                                                                                         |
| **B11**                 | `feat/migration/batch-11-admin`                        | Profissionais (CRUD, convênios, valor), Pacientes (editar + vínculo com profissional) e Alterar senha do admin                                                                                                                                                                                                                                                                                         |
| **B12** (final)         | `feat/migration/batch-12-build-apk`                    | Build definitivo do APK (EAS ou local), ícone e splash, assinatura e passo a passo no README                                                                                                                                                                                                                                                                                                           |

Cada batch de telas inclui testes unitários (lógica, hooks, componentes), fluxos e2e no Maestro e a execução da suíte completa (regressão).

---

## 9.1 Registro das entregas

| Batch | Resultado                                                                                                                                                                                                                                       | Observações                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B4    | Lista, cadastro, edição e exclusão de pacientes, histórico de consultas, `ConfirmDialog`                                                                                                                                                        | **Cadastro mostra só nome, email e senha**, porque o backend (`PacienteCreateRequest`) só aceita esses campos. O Angular exibia os demais campos no cadastro e os descartava sem avisar; eles podem ser preenchidos na edição. Data de nascimento: campo com máscara DD/MM/AAAA (sem dependência nova). Sexo: chips no lugar do `<select>`. Excluir paciente com consultas ou mensagens (409): "Este paciente tem consultas ou mensagens e não pode ser excluído." (decisão do usuário). O histórico mostra o status legível ("Agendada") em vez do enum.                                                                                                                                                                                                                                                                                                                                                                                                   |
| B5    | Lista de consultas (filtros e agrupamento por dia), nova consulta (busca, cadastro rápido de paciente, id via `Location` → registro clínico), prontuário (dados, seções clínicas, avaliação, exclusão)                                          | **Data e hora**: o `datetime-local` virou dois campos com máscara (DD/MM/AAAA e HH:MM), sem biblioteca nova. Valor aceita "150" ou "150,50". **Prontuário**: cada seção aparece se tiver qualquer dado. O Angular escondia o "Quadro Clínico" quando só havia histórico de saúde e não mostrava cirurgias; os "Hábitos de Vida" também ficavam ocultos quando só tabagismo ou álcool estavam preenchidos. Ao escolher um paciente na nova consulta, há "Trocar" (no Angular não dava para voltar). Excluir consulta mantém a mensagem genérica do Angular.                                                                                                                                                                                                                                                                                                                                                                                                  |
| B6    | Registro clínico em 4 etapas (quadro clínico, hábitos de vida, exame físico, diagnóstico) com salvamento por etapa (`PUT` só com o bloco da etapa; o backend mantém os demais), retomada na etapa certa, voltar, tela de sucesso e "Visualizar" | **Histórico de saúde**: ao reabrir, "Outras" volta marcado e com o texto livre (o Angular reabria desmarcado e vazio, e o texto ficava escondido). Desmarcar "Outras" tira o texto livre do que é salvo (no Angular ele continuava sendo enviado). O campo "Outras" respeita o limite de 255 do backend, descontando os chips; os demais textos, o de 2000. **Sim/Não**: os radios viraram chips de escolha única, como no Batch 4. **Sair**: o "Sair" do topo do Angular (que levava ao prontuário) virou o voltar do header e do Android, que volta para a tela de origem. "Visualizar" volta ao prontuário se o wizard foi aberto dele; senão, abre o prontuário no lugar do wizard. **Carregamento**: o wizard espera a leitura atual da consulta (não usa o cache) para decidir a etapa, e a recarga depois de cada etapa salva não refaz os formulários. Erro ao carregar tem "Tentar novamente"; sem conexão ao salvar mostra a mensagem de conexão. |

## 10. Riscos e dúvidas

| #   | Tema                             | Situação                                                                                             | Proposta / decisão necessária                                                                                                                                                                                                                 |
| --- | -------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Credencial persistida**        | O Angular guarda `base64(email:senha)`.                                                              | ✅ **Resolvido pelo JWT (Batch 2):** o app guarda só o refresh token no SecureStore; a senha nunca é armazenada.                                                                                                                              |
| 2   | **Sair na home do profissional** | Não existe no Angular (header oculto).                                                               | ✅ **Decidido:** a saudação da home (nome + avatar) é tocável e abre um menu com "Alterar senha" e "Sair".                                                                                                                                    |
| 3   | **Erros que deslogam**           | O Angular não trata 401 globalmente e, na restauração, qualquer erro manda para o login.             | ✅ **Decidido:** **só o 401** desloga, tanto em chamada autenticada quanto na restauração. Erro de rede e os demais erros (5xx, 403, 404, timeout…) **nunca** deslogam: a credencial é mantida e a tela mostra o erro com "Tentar novamente". |
| 4   | Estado de erro na home           | O Angular engole o erro.                                                                             | Criar o estado de erro com "Tentar novamente" (exigido pelo Batch 2).                                                                                                                                                                         |
| 5   | Papel desconhecido               | No Angular, `homeRouteFor` manda para `/home` e o `roleGuard` redireciona de novo, entrando em loop. | No RN, tela "perfil não suportado" com Sair.                                                                                                                                                                                                  |
| 6   | "pacientes ativos"               | É só `GET /pacientes`.length. Não se sabe se o backend filtra por profissional ou por status.        | Manter igual. Validar com o backend.                                                                                                                                                                                                          |
| 7   | Formato de `dataHora`            | —                                                                                                    | ✅ **Resolvido:** o backend usa `LocalDateTime` sem fuso (ex.: `2026-09-29T14:30:00`). `src/utils/date.ts#parseDataHora` lê como hora local, com testes.                                                                                      |
| 8   | **Porta 8081**                   | O Metro usa a 8081, e o `environment.mobile.ts` apontava o backend para 8081.                        | ✅ **Decidido:** a porta é configurável via `EXPO_PUBLIC_API_URL`. O padrão do `.env.example` é 8080, e o usuário ajusta no `.env` local.                                                                                                     |
| 9   | Ambiente local                   | O Node padrão do nvm é v12 (o Expo exige ≥ 20; a v24 está instalada) e não há AVD criado.            | Resolvido no B1: `.nvmrc` com Node 24 e AVD criado (ver README).                                                                                                                                                                              |
| 10  | Dependências                     | —                                                                                                    | ✅ **Aprovadas:** `react-native-svg`, `@expo-google-fonts/inter`, `expo-font`, `expo-build-properties`, `expo-linear-gradient`, `react-native-screens`/`react-native-safe-area-context`, Jest/RNTL e Maestro.                                 |
| 11  | Mensagens                        | Não há polling nem tempo real.                                                                       | Manter: atualiza ao entrar na tela, ao enviar e no pull-to-refresh.                                                                                                                                                                           |
| 12  | Campo `foto`                     | É uma URL digitada (não há upload nem câmera).                                                       | Manter. Não precisa de `expo-image-picker`.                                                                                                                                                                                                   |
| 13  | E2E contra o backend real        | Os fluxos de login precisam de backend no ar e de um profissional de teste.                          | Credenciais via variáveis de ambiente do Maestro, nunca commitadas.                                                                                                                                                                           |
| 14  | Recuperação de senha             | Não existe no Angular nem na API usada pelo front.                                                   | Fora do escopo; não será criada.                                                                                                                                                                                                              |
| 15  | Stacked PRs no GitHub            | O `gh stack submit` exige o recurso habilitado no repositório.                                       | Se não estiver disponível, PRs comuns encadeados (`--base` = camada anterior).                                                                                                                                                                |
| 16  | Expo Go × módulos nativos        | Tudo o que está planejado roda no Expo Go do SDK 57.                                                 | Se algum módulo exigir development build, avisar antes.                                                                                                                                                                                       |
| 17  | **Backend mudou para JWT**       | Commit `07cbc22` do backend (29/09/2026). O Angular (Basic) ficou incompatível.                      | ✅ **Decidido:** o app segue o JWT do backend atual (§3.5).                                                                                                                                                                                   |
