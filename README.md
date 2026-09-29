# FisioTech — App mobile (React Native / Expo)

App Android do sistema de gestão de clínica de fisioterapia **FisioTech**. Este repositório é a
migração do front Angular + Capacitor para **React Native com Expo**, consumindo a mesma API do
backend Java 21 / Spring Boot, sem nenhuma alteração nele.

> **Status:** Batch 0 concluído (inventário + esqueleto Expo). O app ainda mostra só a tela
> padrão do template. O plano completo da migração, com rotas, endpoints, autenticação, divisão
> em batches, riscos e dúvidas, está em [`MIGRATION_PLAN.md`](./MIGRATION_PLAN.md).

## Stack

- Expo (managed workflow, SDK 57) + React Native 0.86 + TypeScript `strict`
- Planejado nos próximos batches: React Navigation, axios, TanStack Query, `expo-secure-store`,
  AsyncStorage, `StyleSheet` (sem biblioteca de UI), Jest + Testing Library e Maestro (e2e)

## Pré-requisitos

- **Node.js 20+**. Com nvm: `nvm use 24`.
- npm
- Para rodar no Android: um emulador (AVD do Android Studio) **ou** um celular com o app
  **Expo Go** instalado
- Backend FisioTech rodando e acessível pela rede (veja abaixo)

## Rodando

```bash
npm install
cp .env.example .env   # ajuste EXPO_PUBLIC_API_URL
npx expo start
```

Com o Metro no ar:

- **Emulador Android:** aperte `a` no terminal do Expo.
- **Celular físico:** abra o Expo Go e leia o QR code. O celular precisa estar na mesma rede
  Wi-Fi do computador.

## Backend e URL da API

A URL da API vem da variável `EXPO_PUBLIC_API_URL`, definida no `.env` (que nunca é commitado).
Use o [`.env.example`](./.env.example) como modelo:

| Onde o app roda  | URL                                                                         |
| ---------------- | --------------------------------------------------------------------------- |
| Emulador Android | `http://10.0.2.2:<porta>` (`10.0.2.2` é o host visto de dentro do emulador) |
| Celular físico   | `http://<IP-do-PC-na-rede>:<porta>`                                         |

Não use `localhost`: dentro do emulador ou do celular, ele aponta para o próprio aparelho.
Também não rode o backend na porta **8081**, que é a porta do Metro (servidor de
desenvolvimento do Expo).

## Verificações

```bash
npx tsc --noEmit    # checagem de tipos
npx expo-doctor     # diagnóstico de dependências/configuração do Expo
```

Lint, testes unitários e e2e entram no Batch 1 (ver `MIGRATION_PLAN.md`).

## Fluxo de branches

- `main`: base inicial. A atualização é feita pelo time, por release.
- `dev`: integração. Todos os PRs de migração convergem para cá.
- `feat/migration/batch-XX-*`: uma stack de PRs (`gh stack`), um batch por camada.
