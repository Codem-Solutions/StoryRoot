import Toast from 'react-native-toast-message';

export function showSaveSuccessToast(mensagem = 'Registro salvo com sucesso') {
  Toast.show({
    type: 'success',
    text1: mensagem,
    visibilityTime: 10000,
    onPress: () => Toast.hide(),
  });
}

export function showSaveErrorToast(
  mensagem = 'Não foi possível salvar esse registro. Tente novamente mais tarde.',
) {
  Toast.show({
    type: 'error',
    text1: mensagem,
    visibilityTime: 10000,
    onPress: () => Toast.hide(),
  });
}
