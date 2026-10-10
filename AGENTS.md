# Foundation — instruções para agentes de IA

Estas regras valem para todo o repositório. Preserve a base como um produto
reutilizável: implemente o domínio do novo aplicativo sem acoplar componentes
genéricos a um fornecedor ou regra de negócio.

## Antes de alterar

1. Leia `README.md`, `docs/ARCHITECTURE.md` e a documentação do módulo afetado.
2. Procure componentes e contratos existentes antes de criar novos.
3. Mantenha as dependências compatíveis com a versão do Expo.
4. Não coloque segredos em código ou em variáveis `EXPO_PUBLIC_*`.

## Organização

- Rotas e composição de telas: `src/app`.
- Regras e casos de uso de um produto: `src/features/<feature>`.
- Infraestrutura compartilhada: `src/core`.
- Tokens e temas: `src/theme`.
- Componentes sem regra de negócio: `src/ui`.
- Um novo módulo deve seguir `templates/feature`.
- Telas dependem de contratos do domínio; não importam SDKs de fornecedores.

## Componentes

- Use `useTheme()` e tokens semânticos; não escreva cores literais.
- Reutilize `Screen`, `Button`, `TextField`, `FormField`, `AppModal` e os estados
  de `src/ui/feedback.tsx`.
- Todo controle interativo precisa de rótulo ou função de acessibilidade.
- Suporte tamanhos de fonte, áreas seguras e redução de movimento.
- Skia fica isolado em `src/ui/graphics`; mantenha alternativa textual dos dados.
- Liquid Glass deve passar por `PremiumSurface`, sempre com fallback.
- Um componente de `src/ui` não deve conhecer usuário, plano ou endpoint.

## Dados, formulários e armazenamento

- Use `api` de `src/core/api/api-client.ts`; não espalhe URLs ou `fetch` em telas.
- Use TanStack Query apenas para estado vindo do servidor. Estado visual local
  continua no componente.
- Toda query deve ter chave estável e estar encapsulada no próprio módulo.
- Formulários usam React Hook Form + Zod + `FormField`.
- Use `secureStorage` para tokens/segredos pequenos.
- Use `localStorage` apenas para preferências e cache não sensível.
- Não persista dados apenas porque o adaptador existe.

## Qualidade da mudança

- Modele estados de carregamento, vazio e erro.
- Preserve os modos claro, escuro e automático.
- Trate cancelamento e falhas sem exibir detalhes internos ao usuário.
- Execute `npm run typecheck`, `npm run lint` e `npm run doctor`.
- Atualize a documentação quando criar uma convenção reutilizável.

