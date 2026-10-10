# Foundation — base Expo reutilizável

Uma base de aplicativo React Native com Expo, pronta para receber domínio, API e identidade de qualquer produto. O projeto já inclui autenticação extensível, sessão segura, biometria/Face ID, paywall próprio, compras Apple/Google via RevenueCat e builds EAS.

## O que está pronto

- Expo SDK 57 + React Native 0.86 + TypeScript estrito.
- Rotas tipadas e áreas protegidas com Expo Router.
- Login, cadastro, recuperação de senha e logout.
- Sessão criptografada no Keychain/Keystore com `expo-secure-store`.
- Bloqueio e desbloqueio por Face ID, Touch ID ou biometria forte no Android.
- Home, perfil, configurações de segurança e estado Premium.
- Paywall responsivo, seleção de planos, compra e restauração.
- Adaptadores separados para autenticação e compras.
- Tokens de cor, espaço, tipografia e raio em um único lugar.
- Motor gráfico premium com React Native Skia e Reanimated.
- Superfície Liquid Glass nativa no iOS 26 com fallback multiplataforma.
- Componentes gráficos iniciais para hidratação e séries esportivas.
- Push notifications com permissão, tokens, navegação e gateway HTTP.
- Cliente de API opcional com autenticação, timeout, erros e renovação de token.
- TanStack Query pronto para cache e sincronização de dados remotos.
- Formulários com React Hook Form, Zod e campos reutilizáveis.
- Estados de loading, skeleton, vazio, erro, offline, toast e modal.
- Armazenamento comum e seguro separados por contratos.
- Temas claro, escuro e automático com preferência persistida.
- Molde de funcionalidade e instruções permanentes para agentes de IA.
- Perfis EAS para desenvolvimento, preview e produção.

## Primeiros passos

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Copie `.env.example` para `.env` e substitua os identificadores.

3. Rode a interface em modo de demonstração:

   ```bash
   npm start
   ```

O login demonstração aceita o e-mail e a senha já preenchidos. Sem chaves RevenueCat, o paywall também funciona em modo de demonstração.

## Ligar uma autenticação real

A aplicação consome o contrato `AuthGateway` em `src/features/auth/domain/auth.ts`. Implemente esse contrato para sua API, Firebase, Supabase, Clerk ou outro provedor e troque somente a exportação `authGateway` em:

`src/features/auth/services/demo-auth-gateway.ts`

Tokens nunca devem ser colocados em variáveis `EXPO_PUBLIC_*`. Eles entram apenas em tempo de execução e são persistidos no SecureStore. Em produção, implemente também rotação de refresh token, revogação no backend e expiração da sessão.

## Ativar Face ID e biometria

A configuração nativa e a mensagem de permissão já estão em `app.config.ts`. Impressão digital pode ser testada no Expo Go, mas Face ID no iOS exige um development build:

```bash
npx expo run:ios
# ou
npx expo run:android
```

O app só habilita a opção depois de confirmar uma autenticação biométrica válida. A biometria protege a sessão local; ela não substitui a autenticação do servidor.

## Ativar compras Apple e Google

O adaptador padrão usa RevenueCat para unificar StoreKit e Google Play Billing.

1. Crie os produtos/assinaturas no App Store Connect e Google Play Console.
2. Cadastre os apps e produtos no RevenueCat.
3. Crie um entitlement chamado `premium` (ou altere a variável correspondente).
4. Adicione as chaves públicas de SDK ao `.env`:

   ```env
   EXPO_PUBLIC_REVENUECAT_APPLE_KEY=appl_...
   EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY=goog_...
   EXPO_PUBLIC_REVENUECAT_ENTITLEMENT=premium
   ```

5. Crie um development build. Compras reais usam módulos nativos e não devem ser validadas somente no Expo Go:

   ```bash
   npx eas build --profile development --platform all
   npm run dev
   ```

6. Teste com usuários sandbox/TestFlight no iOS e uma faixa de teste interno no Google Play.

O texto e preço exibidos passam a vir das lojas. O app nunca confia apenas no sucesso visual: o acesso Premium depende do entitlement retornado pelo SDK.

> Compras dentro do app são adequadas para conteúdo e recursos digitais. Produtos físicos e serviços consumidos fora do app normalmente usam outro processador, como Stripe, e devem seguir as regras atuais das lojas.

## Onde personalizar

```text
src/
├── app/                  rotas e composição das telas
├── config/               ambiente e configurações globais
├── core/
│   ├── api/              transporte HTTP opcional
│   ├── query/            cache e estado remoto
│   └── storage/          armazenamento comum e seguro
├── features/
│   ├── auth/             domínio, gateway, biometria e estado
│   ├── notifications/    push, tokens, preferências e navegação
│   └── purchases/        domínio, RevenueCat e estado Premium
├── theme/                tokens de design
└── ui/
    ├── graphics/         gráficos e animações construídos com Skia
    └── ...               componentes reutilizáveis
```

O guia de arquitetura e as decisões de uso estão em `docs/ARCHITECTURE.md`.
Ao iniciar um domínio, copie `templates/feature`. Agentes de IA recebem as
convenções do projeto automaticamente por meio do `AGENTS.md` da raiz.

## Infraestrutura opcional

A existência dessas camadas não obriga o novo aplicativo a utilizá-las:

- `api`: cliente baseado no `fetch` do Expo, sem fornecedor ou backend definido;
- `QueryProvider`: nenhum dado é consultado até uma feature criar sua query;
- `localStorage`: não persiste nada sozinho e é destinado a dados não sensíveis;
- `secureStorage`: reservado para pequenos segredos e tokens;
- `FormField`: conecta qualquer campo ao React Hook Form.

O login serve como exemplo funcional de formulário com schema Zod. Os estados
universais ficam em `src/ui/feedback.tsx`, e o modal, toast e aviso offline
podem ser usados por qualquer módulo sem carregar regras de negócio.

## Temas

Os temas claro, escuro e automático estão ativos. A preferência pode ser
alterada na tela Perfil e é persistida localmente. Componentes novos devem usar
`useTheme()` e cores semânticas, conforme `AGENTS.md`.

- Nome, scheme, bundle ID e package: `app.config.ts`
- Cores, fontes e espaçamento: `src/theme/tokens.ts`
- Provedor de login: `src/features/auth/services/demo-auth-gateway.ts`
- Provedor de compras: `src/features/purchases/services/revenuecat-gateway.ts`
- Paywall: `src/app/(app)/paywall.tsx`

## Gráficos premium, animações e Liquid Glass

O React Native Skia é o motor gráfico padrão. As telas não devem importar Skia
diretamente: novos gráficos e visualizações ficam em `src/ui/graphics` e expõem
uma interface simples para o restante do aplicativo.

A referência detalhada de arquitetura, performance, acessibilidade e criação de
novos gráficos está em `docs/GRAPHICS.md`.

Componentes iniciais:

- `HydrationRing`: progresso circular animado para água, calorias ou metas.
- `ActivitySparkline`: série temporal animada para ritmo, carga e desempenho.
- `PremiumSurface`: usa Liquid Glass nativo no iOS 26 e uma superfície premium
  equivalente em iOS anteriores, Android e web.

Exemplo:

```tsx
import { ActivitySparkline, HydrationRing } from '@/ui/graphics';
import { PremiumSurface } from '@/ui/premium-surface';

<PremiumSurface>
  <HydrationRing progress={0.7} current={1750} goal={2500} />
  <ActivitySparkline data={[42, 56, 48, 71, 66, 82, 76, 91]} />
</PremiumSurface>
```

Diretrizes:

- Use Skia para gráficos, ondas, partículas, shaders e desenhos por frame.
- Use Reanimated para progresso, gestos e transições de valores.
- Preserve `accessibilityLabel` e uma representação textual dos dados.
- Respeite redução de movimento e transparência nas configurações do aparelho.
- Não anime `opacity` diretamente no `GlassView`; use as transições próprias do
  `glassEffectStyle` ou anime um contêiner externo.
- Teste efeitos gráficos em aparelho real e mantenha um fallback sem Skia para
  experiências que precisem funcionar antes do CanvasKit carregar na web.

## Ativar push notifications

O cliente de push já está implementado. Informe o projeto EAS e, quando houver
um backend, o endpoint que armazenará os aparelhos:

```env
EAS_PROJECT_ID=seu-project-id
EXPO_PUBLIC_NOTIFICATIONS_ENDPOINT=https://api.example.com/push/devices
GOOGLE_SERVICES_FILE=./google-services.json
```

A tela Perfil permite ativar, desativar e enviar uma notificação local de teste.
O módulo registra o Expo Push Token e o token nativo, atualiza tokens rotacionados
e abre somente destinos internos permitidos.

Push remoto precisa de development build e aparelho real. As credenciais APNs e
FCM continuam vinculadas às contas Apple, Google/Firebase e EAS de cada
aplicativo. O guia completo do cliente, contrato do backend, payloads, testes e
tratamento de receipts está em `docs/PUSH_NOTIFICATIONS.md`.

## Checklist antes de publicar

- Trocar bundle ID/package e registrar o projeto no EAS.
- Substituir o gateway de autenticação demonstração.
- Configurar produtos, ofertas e entitlement no RevenueCat.
- Adicionar links reais para Termos e Privacidade no paywall.
- Configurar ícones, splash e URLs universais.
- Criar política de privacidade e preencher declarações das lojas.
- Testar compra, cancelamento, restauração e expiração em aparelhos reais.
- Rodar `npm run typecheck`, `npm run lint` e `npm run doctor`.

## Decisões de arquitetura

As telas não conhecem Firebase, RevenueCat ou qualquer API específica: elas dependem de contratos. Assim, trocar um fornecedor não exige reescrever a interface. Rotas protegidas respondem ao estado da sessão; biometria apenas desbloqueia uma sessão já válida; e os recursos Premium dependem de um entitlement, não de um ID de produto específico.
