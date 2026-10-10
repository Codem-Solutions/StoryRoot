# Migração StoryRoot -> APP-BASE (executada)

## Objetivo
Migrar a estrutura do StoryRoot para o APP-BASE, reaproveitando a fundação já pronta (providers globais, arquitetura modular, notificações, compras, etc.) e mantendo o domínio StoryRoot funcional.

## Estratégia adotada
1. **Preservar o StoryRoot atual** sem sobrescrever o projeto original.
2. **Copiar o domínio StoryRoot para dentro do APP-BASE** em `src/storyroot`.
3. **Criar shell de execução StoryRoot no APP-BASE** via rota dedicada `/(app)/storyroot`.
4. **Manter providers do APP-BASE ativos** no root layout.
5. **Ajustar dependências do APP-BASE** para suportar os módulos migrados.
6. **Stabilizar gradualmente tipagem/arquitetura** em fases posteriores.

## O que foi executado

### 1) Cópia da base StoryRoot
- Origem: `../../src/*` (StoryRoot)
- Destino: `src/storyroot/*` (APP-BASE)

### 2) Integração de rota principal
- Criada rota `src/app/(app)/storyroot.tsx` apontando para `StoryRootShell`.
- Atualizado `src/app/(app)/_layout.tsx` para abrir `storyroot` como tela principal do grupo autenticado.

### 3) Shell StoryRoot no APP-BASE
- Criado `src/storyroot/StoryRootShell.tsx` com:
  - hidratação das stores do StoryRoot,
  - carregamento das fontes Inter/Plus Jakarta,
  - árvore de navegação dedicada via `NavigationIndependentTree` + `NavigationContainer`,
  - `RootNavigator` e Toast do StoryRoot.

### 4) Ajuste no root layout do APP-BASE
- Atualizado `src/app/_layout.tsx` para evitar bloqueio inicial por guard de autenticação durante migração.
- Mantidos providers globais do APP-BASE (`ThemeProvider`, `QueryProvider`, `AuthProvider`, `NotificationsProvider`, `PurchasesProvider`).

### 5) Dependências adicionadas/alinhadas
No `package.json` do APP-BASE foram incluídas as libs necessárias para o módulo StoryRoot, incluindo:
- React Navigation (`native`, `stack`, `bottom-tabs`)
- fontes (`@expo-google-fonts/inter`, `plus-jakarta-sans`)
- stores/forms (`zustand`, `react-hook-form`, `@hookform/resolvers`, `yup`)
- multimídia e UX (`expo-image-picker`, `expo-image-manipulator`, `expo-camera`, `expo-audio`, `expo-video`, `react-native-keyboard-aware-scroll-view`)
- chart/render (`react-native-svg`, `date-fns`)
- utilitários (`react-native-toast-message`, `react-native-url-polyfill`, `@supabase/supabase-js`, `lucide-react-native`)

## Status atual
- Migração estrutural inicial: **concluída**.
- APP-BASE já contém o domínio StoryRoot dentro de `src/storyroot` e rota ativa de execução.
- Instalação de dependências: **concluída**.

## Pendências de estabilização (próxima fase)
1. Resolver incompatibilidades de tipagem entre a configuração estrita do APP-BASE e alguns arquivos do StoryRoot.
2. ~~Migrar navegação StoryRoot para Expo Router nativo~~ — concluído (ver Fase 2).
3. Consolidar tema/tokens (StoryRoot + APP-BASE) para reduzir duplicidade.
4. Integrar autenticação e assinatura em um fluxo único (evitar duplicidade de domínio auth/premium).
5. Rodar suíte de validação funcional por módulo (Home, Rotina, Saúde, Perfil, Registro).

## Fase 2 — Migração para Expo Router (blocos 1–6)

### Árvore de rotas
```
src/app/
  index.tsx                      -> "/" redireciona para storyroot-auth/login (entrada do app)
src/app/(app)/
  storyroot-auth/                -> login, cadastro-conta, forgot-password, verify-otp,
                                    reset-password, recuperar-senha (guard: logado -> main/onboarding)
  storyroot-onboarding/          -> cadastro-crianca (guard: sem login -> auth; concluído -> main)
  storyroot-main/
    (tabs)/                      -> home, saude, rotina, perfil (FloatingTabBar customizada)
    registrar, audio-recorder, video-trim, photo-preview, selecionar-crianca  (transparentModal)
    adicionar-crianca, editar-crianca, premium                                 (modal)
    notificacoes                                                               (push)
```

### Convenções adotadas
- Navegação via `router` / `useRouter` do `expo-router`, sempre com path absoluto
  (`/(app)/storyroot-main/...`).
- Params lidos com `useLocalSearchParams`. Objetos/arrays (`formDataInicial`,
  `notificacaoIdsIniciais`) trafegam como JSON via `encodeJsonParam` /
  `decodeJsonParam` em `src/storyroot/utils/routerParams.ts`; strings via `stringParam`.
- "Salvar e voltar para as abas" (antigo `navigate('MainTabs')`) usa
  `router.dismissAll()`, que fecha os modais e preserva a aba ativa.
- `FloatingTabBar` (`src/storyroot/components`) deriva a aba ativa de `usePathname()` e
  se oculta quando a rota em foco não é uma aba (sheets transparentes por cima).
  Isso substituiu o `uiStore.rotaRaizAtiva`, que dependia do `NavigationContainer`.
- `StoryRootBoot` hidrata stores, carrega fontes e monta o `StoryRootToast`
  (`react-native-toast-message`). O handler de notificações é o global do APP-BASE.

### Removido
- `src/storyroot/navigation/` (`RootNavigator`, `MainTabs`, `types.ts`),
  `StoryRootShell.tsx`, rotas `storyroot-legacy` e `storyroot`, `store/uiStore.ts`.
- Telas de demonstração do template (`(app)/(tabs)`, `(app)/paywall`, `(auth)/*`), que
  ocupavam `/`. O original continua em `outputs/expo-foundation` (excluído do `tsconfig`).
  O `routeMap` de notificações agora aponta para home/perfil/premium do StoryRoot.
- Dependências `@react-navigation/native`, `@react-navigation/stack`,
  `@react-navigation/bottom-tabs` (o `expo-router` 57 não depende delas).

### Checklist de regressão (manual, no device)
- [ ] Login / cadastro de conta / esqueci a senha -> OTP -> reset.
- [ ] Primeiro acesso cai no onboarding; após cadastrar criança vai para Home.
- [ ] Troca de abas pela tab bar; FAB abre Registrar; FAB oculto em Perfil.
- [ ] Tab bar some com Registrar/Áudio/Vídeo/Foto/Selecionar criança abertos e volta ao fechar.
- [ ] Editar registro a partir de Rotina e Saúde (form pré-preenchido; lembretes de remédio).
- [ ] Foto -> PhotoPreview -> salvar fecha tudo e mantém a aba; idem vídeo (VideoTrim) e áudio.
- [ ] Perfil: adicionar/editar criança, selecionar criança, Premium, logout volta ao login.
- [ ] Toasts de sucesso/erro aparecem.

### Limitações conhecidas
- Modais `presentation: 'modal'` são nativos no iOS; um toast disparado enquanto um deles
  está aberto fica por baixo. Os toasts atuais são exibidos após fechar a tela, então não
  há impacto hoje.
- `AssistenteIAScreen` foi migrada, mas não tem rota (já não tinha no app legado).

## Resultado
A estrutura do StoryRoot foi migrada para dentro do APP-BASE e já está integrada como fluxo principal do app, com o reaproveitamento imediato da fundação do APP-BASE e caminho aberto para estabilização incremental.
