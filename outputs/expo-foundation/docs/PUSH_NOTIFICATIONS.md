# Push notifications

A base usa `expo-notifications` com Expo Push Service por padrão. A arquitetura
também preserva o token nativo para uma futura migração direta para FCM/APNs.

## O que já está implementado

- Permissão solicitada somente quando o usuário ativa a opção.
- Canal Android com importância alta, som, vibração e cor.
- Geração do Expo Push Token com `EAS_PROJECT_ID`.
- Leitura do token nativo APNs/FCM.
- Persistência segura da preferência e do token.
- Sincronização automática com um endpoint HTTP opcional.
- Atualização do backend quando o token nativo muda.
- Tratamento de notificações recebidas com o app aberto.
- Tratamento de toque com o app aberto, em segundo plano ou fechado.
- Navegação segura por uma lista fechada de destinos.
- Ativação, desativação e teste local na tela Perfil.
- Adaptador desacoplado para substituir Expo Push Service por outro fornecedor.

## Configuração mínima

### 1. Registre o projeto no EAS

```bash
npx eas init
```

Copie o `projectId` gerado para:

```env
EAS_PROJECT_ID=seu-project-id
```

### 2. Crie um development build

Push remoto no Android não funciona no Expo Go. Use:

```bash
npx eas build --profile development --platform android
npx eas build --profile development --platform ios
npm run dev
```

Use um aparelho real para gerar o token.

### 3. Configure as credenciais das lojas

No iOS, permita que o EAS configure a chave APNs durante o build ou gerencie-a
em `eas credentials`.

No Android:

1. Crie ou selecione um projeto no Firebase.
2. Cadastre o aplicativo usando o mesmo Android package.
3. Baixe `google-services.json`.
4. Informe seu caminho:

   ```env
   GOOGLE_SERVICES_FILE=./google-services.json
   ```

5. Envie a chave de conta de serviço FCM V1 pelo painel EAS ou
   `eas credentials`.

Não faça commit de uma conta de serviço privada. O `google-services.json` contém
identificadores do cliente e pode ser tratado conforme a política do seu time.

## Conectando ao backend

Informe um endpoint:

```env
EXPO_PUBLIC_NOTIFICATIONS_ENDPOINT=https://api.example.com/push/devices
```

O gateway envia `Authorization: Bearer <accessToken>` automaticamente.

### Registrar ou atualizar aparelho

```http
POST /push/devices
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "user-id",
  "expoPushToken": "ExponentPushToken[...]",
  "nativePushToken": "...",
  "platform": "ios",
  "deviceName": "iPhone"
}
```

Faça `upsert` por usuário, aparelho e token. Um usuário pode ter vários
aparelhos.

### Remover aparelho

```http
DELETE /push/devices/:expoPushToken
Authorization: Bearer <token>
```

### Atualizar preferência

```http
PATCH /push/devices/preference
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "user-id",
  "enabled": false
}
```

Se o endpoint não for informado, o adaptador demonstração mantém o app
funcional e informa no console que o aparelho está pronto para sincronização.

## Payload e navegação

O campo `data.route` aceita somente:

| Valor | Destino |
| --- | --- |
| `home` | Tela inicial |
| `profile` | Perfil e configurações |
| `paywall` | Tela Premium |

Exemplo:

```json
{
  "to": "ExponentPushToken[...]",
  "title": "Meta quase concluída",
  "body": "Faltam apenas 300 ml de água hoje.",
  "sound": "default",
  "channelId": "default",
  "data": {
    "route": "home"
  }
}
```

Novos destinos devem ser adicionados ao tipo `NotificationRoute` e ao
`routeMap`. URLs arbitrárias não são executadas.

## Envio pelo backend

Para um teste, envie uma requisição autenticada pelo seu servidor para:

```text
https://exp.host/--/api/v2/push/send
```

Em produção:

- Envie em lotes de até 100 mensagens.
- Limite conexões concorrentes.
- Repita erros HTTP 429/5xx com exponential backoff.
- Armazene os tickets retornados.
- Consulte os push receipts.
- Remova tokens que retornarem `DeviceNotRegistered`.
- Não envie credenciais ou informações médicas sensíveis no payload.
- Considere habilitar a segurança adicional por access token no EAS.

## Comportamento da preferência

Desativar notificações dentro do app remove o aparelho do backend e apaga o
token local. Isso não altera a permissão do sistema operacional. Depois de o
usuário negar uma permissão, ele pode precisar reativá-la manualmente nos
ajustes do aparelho.

## Limitações

- Push remoto exige aparelho real.
- Expo Notifications não fornece push para web.
- Entrega depende do Expo Push Service, FCM e APNs e não é garantida em tempo
  real.
- Processamento silencioso em segundo plano não está ativado nesta base; ele
  deve ser configurado apenas quando uma feature realmente precisar.

## Arquivos principais

```text
src/features/notifications/
├── domain/notifications.ts
├── notifications-provider.tsx
└── services/
    ├── demo-notifications-gateway.ts
    ├── http-notifications-gateway.ts
    └── notifications-service.ts
```

O restante do aplicativo usa apenas `useNotifications`.
