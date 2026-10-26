# Admin - Pacientes

Tarefa de listagem na branch `feat/tela-adm-pacientes`, derivada de
`feat/tela-adm-novo-profissional` no commit `75fecbf`.

O botão Pacientes no cabeçalho administrativo abre uma tela própria, protegida no navegador
e na montagem direta por `AdminOnly`. Somente sessões autenticadas com `ROLE_ADMIN` consultam
`GET /admin/pacientes`; as rotas de pacientes do profissional não são utilizadas.

A tela segue os cards, fonte Inter, cores, busca e estados das telas administrativas existentes.
Exibe nome, email, telefone e profissional responsável, inclusive pacientes sem vínculo.
Permite busca local por nome, email e profissional, sem diferenciar acentos ou maiúsculas,
contagem de resultados, atualização manual, carregamento, lista vazia e nova tentativa.
Falhas temporárias preservam os dados anteriores; respostas 403 ocultam os dados e a busca.

Esta tarefa entrega somente a listagem. A edição terá branch e commit próprios, derivados
desta entrega, e acrescentará a navegação a partir dos cards. Não há cadastro ou exclusão
administrativa de pacientes no contrato inspecionado.

Backend consultado somente para leitura: `PacienteAdminController`, `PacienteAdminUpdateRequest`,
`PacienteService` e a política administrativa de `SecurityConfig` no repositório vizinho.
O contrato de edição aceita nome, email, senha opcional e id do profissional obrigatório.
Os demais campos pessoais não são editáveis por esse endpoint.

Os testes simulam os serviços: não comprovam integração HTTP real, autorização do servidor
em execução ou aparência/comportamento em aparelho.

Validação da listagem em 26/10/2026: TypeScript, ESLint e Prettier passaram; Jest passou
com 39 suítes e 399 testes. A exportação Expo Android passou em `dist/admin-pacientes`,
ignorada pelo Git.
