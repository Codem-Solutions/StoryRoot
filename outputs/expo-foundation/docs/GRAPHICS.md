# Sistema gráfico premium

Este projeto usa React Native Skia como motor gráfico padrão e Reanimated como
motor de movimento. A regra arquitetural é simples: telas e features não
importam `@shopify/react-native-skia` diretamente. Toda visualização reutilizável
fica em `src/ui/graphics`.

## Responsabilidade de cada camada

| Camada | Responsabilidade |
| --- | --- |
| `src/ui/graphics` | Canvas, paths, shaders, gráficos e medidores |
| `react-native-reanimated` | Valores animados, timing, spring e gestos |
| `PremiumSurface` | Liquid Glass nativo e fallback multiplataforma |
| `src/theme/tokens.ts` | Cores, tipografia, raios e espaçamento |
| Telas/features | Dados, estados e composição dos componentes |

## Componentes incluídos

### `HydrationRing`

Representa o progresso de uma meta. Pode ser usado para água, calorias, passos,
distância, sono ou conclusão de treino.

```tsx
<HydrationRing
  current={1750}
  goal={2500}
  progress={1750 / 2500}
  size={150}
/>
```

O valor `progress` deve estar entre `0` e `1`. O componente normaliza valores
fora desse intervalo e mantém uma descrição acessível para leitores de tela.

### `ActivitySparkline`

Exibe uma série temporal compacta para cards e resumos.

```tsx
<ActivitySparkline
  data={[42, 56, 48, 71, 66, 82, 76, 91]}
  width={180}
  height={72}
/>
```

Para gráficos com eixos, zoom, múltiplas séries ou tooltips complexos, crie um
componente separado em `src/ui/graphics` e considere Victory Native sobre o
mesmo motor Skia.

### `PremiumSurface`

Usa `GlassView` em aparelhos com Liquid Glass disponível. Em iOS anteriores,
Android e web, renderiza uma superfície translúcida com borda e profundidade.

```tsx
<PremiumSurface interactive>
  <YourContent />
</PremiumSurface>
```

Nunca assuma que Liquid Glass está disponível. O componente já verifica a API e
faz a degradação visual automaticamente.

## Criando um gráfico novo

1. Crie o arquivo em `src/ui/graphics`.
2. Defina uma API baseada em dados do domínio, sem expor tipos do Skia.
3. Exporte o componente por `src/ui/graphics/index.ts`.
4. Adicione texto alternativo ou uma representação acessível dos dados.
5. Anime valores com Reanimated em vez de atualizar estado React a cada quadro.
6. Teste valores vazios, negativos, extremos e fontes ampliadas.
7. Valide em iOS, Android e web.

## Performance

- Mantenha cálculos e paths estáticos em `useMemo`.
- Use shared values para propriedades que mudam durante a animação.
- Evite criar arrays, paths ou shaders a cada frame.
- Prefira uma animação principal bem coordenada a várias animações concorrentes.
- Pause animações contínuas quando a tela estiver fora de foco.
- Teste em um Android intermediário, não apenas em simuladores recentes.

## Acessibilidade

- Todo gráfico deve ter `accessibilityLabel`.
- Informações importantes não podem depender somente de cor.
- Preserve contraste no fallback e no vidro.
- Respeite as preferências de redução de movimento e transparência.
- Para gráficos detalhados, ofereça também um resumo textual ou uma tabela.

## Testes

Antes de publicar uma alteração gráfica:

```bash
npm run typecheck
npm run lint
npx expo export --platform web
```

Para validar Liquid Glass verdadeiro, use um aparelho com iOS 26 e um build
gerado com a versão de Xcode exigida pelo Expo SDK atual.
