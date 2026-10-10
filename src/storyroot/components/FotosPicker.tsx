import * as ImagePicker from 'expo-image-picker';
import { ImagePlus, X } from 'lucide-react-native';
import React from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

const MAX_FOTOS = 6;

/** Grade de miniaturas com botão para adicionar fotos pela câmera ou galeria. */
export function FotosPicker({
  fotos,
  onChange,
}: {
  fotos: string[];
  onChange: (fotos: string[]) => void;
}) {
  const restantes = MAX_FOTOS - fotos.length;

  async function tirarFoto() {
    const permissao = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert('Câmera bloqueada', 'Permita o acesso à câmera nas configurações do aparelho.');
      return;
    }
    const resultado = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!resultado.canceled) onChange([...fotos, ...resultado.assets.map(a => a.uri)].slice(0, MAX_FOTOS));
  }

  async function escolherDaGaleria() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert('Galeria bloqueada', 'Permita o acesso às fotos nas configurações do aparelho.');
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsMultipleSelection: true,
      selectionLimit: restantes,
    });
    if (!resultado.canceled) onChange([...fotos, ...resultado.assets.map(a => a.uri)].slice(0, MAX_FOTOS));
  }

  function adicionar() {
    Alert.alert('Adicionar foto', undefined, [
      { text: 'Tirar foto', onPress: () => void tirarFoto() },
      { text: 'Escolher da galeria', onPress: () => void escolherDaGaleria() },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  return (
    <View style={styles.grade}>
      {fotos.map((uri, index) => (
        <View key={`${uri}-${index}`} style={styles.miniatura}>
          <Image source={{ uri }} style={styles.imagem} accessibilityLabel={`Foto ${index + 1}`} />
          <TouchableOpacity
            style={styles.remover}
            onPress={() => onChange(fotos.filter((_, i) => i !== index))}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`Remover foto ${index + 1}`}>
            <X size={12} color="#fff" />
          </TouchableOpacity>
        </View>
      ))}
      {restantes > 0 && (
        <TouchableOpacity
          style={[styles.miniatura, styles.adicionar]}
          onPress={adicionar}
          accessibilityRole="button"
          accessibilityLabel="Adicionar foto">
          <ImagePlus size={22} color={colors.primary} />
          <Text style={styles.adicionarTexto}>Foto</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  grade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  miniatura: {
    width: 84,
    height: 84,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  imagem: {
    width: '100%',
    height: '100%',
  },
  remover: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adicionar: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    backgroundColor: colors.surface,
  },
  adicionarTexto: {
    ...typography.caption,
    color: colors.primary,
  },
});
