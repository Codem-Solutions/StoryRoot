# Arquitetura da APP Base

## Princípio

A base entrega mecanismos, não regras de negócio. Autenticação, compras, push,
API e armazenamento são acessados por contratos ou adaptadores. Um novo produto
pode trocar fornecedores sem reescrever suas telas.

## Camadas

```text
src/app       rotas, layouts e composição visual
src/features  módulos do produto, isolados por domínio
src/core      API, cache remoto, armazenamento e infraestrutura
src/theme     temas, tokens e preferências de aparência
src/ui        componentes reutilizáveis sem regra de negócio
```

O fluxo recomendado é:

```text
Tela → hook/caso de uso do módulo → contrato → adaptador externo
```

## API opcional

`src/core/api/api-client.ts` usa o `fetch` multiplataforma do Expo. Ele oferece
URL base, JSON, token Bearer, timeout, erros padronizados e uma única tentativa
após renovação de token. Não faz nenhuma chamada sozinho e não pressupõe REST
além dos métodos auxiliares.

O `AuthProvider` conecta os tokens da sessão atual ao cliente. Ao trocar o
gateway de autenticação, o contrato `AuthGateway.refresh` deve devolver uma nova
sessão. GraphQL, Firebase ou um SDK próprio podem ignorar o cliente inteiramente.

## Dados remotos opcionais

O `QueryProvider` apenas disponibiliza TanStack Query e integra foco do app e
estado de conexão. Nenhuma query existe globalmente. Cada módulo cria suas
chaves e hooks junto do domínio que consome os dados.

## Formulários

O login demonstra a convenção completa:

1. schema Zod;
2. tipo inferido pelo schema;
3. `useForm` com `zodResolver`;
4. `FormProvider`;
5. campos com `FormField`.

Assim, novos formulários escolhem seus próprios campos sem duplicar a ligação
entre validação e componentes visuais.

## Armazenamento

- `localStorage`: preferências e cache não sensível, sem uso automático.
- `secureStorage`: tokens e pequenos dados secretos no Keychain/Keystore.

Ambos expõem `get`, `set` e `remove`. O módulo decide se deve persistir algo.

## Feedback universal

- `LoadingState`, `EmptyState`, `ErrorState` e `Skeleton`.
- `OfflineBanner` global.
- `ToastProvider` e `useToast`.
- `AppModal`.

Esses elementos devem receber textos do módulo; não contêm regras de produto.

## Temas

`ThemeProvider` resolve `light`, `dark` ou `system` e persiste somente a
preferência. Componentes usam `useTheme()` e cores semânticas. A troca pode ser
testada na tela Perfil.

## Criando um módulo

Copie `templates/feature` para `src/features/<nome>`, remova o sufixo
`.template` e substitua `Example` pelo domínio real. Não copie uma feature
existente se isso carregar regras que não pertencem ao novo módulo.

