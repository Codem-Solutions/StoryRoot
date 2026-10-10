import { yupResolver } from '@hookform/resolvers/yup';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, Camera, Check, Plus } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as yup from 'yup';
import { DatePickerSheet } from '../../components/DatePickerSheet';
import { useChildStore, useCriancasDaConta } from '../../store/childStore';
import { colors, radius, spacing, typography } from '../../theme';
import type { SexoCrianca } from '../../types';
import { stringParam } from '../../utils/routerParams';

type FormData = yup.InferType<typeof schema>;

const schema = yup.object({
  nome: yup.string().trim().required('Informe o nome da criança'),
  dataNascimento: yup
    .string()
    .required('Informe a data de nascimento')
    .matches(/^\d{2}\/\d{2}\/\d{4}$/, 'Use o formato DD/MM/AAAA'),
});

function formatarDataDigitada(texto: string): string {
  const digitos = texto.replace(/\D/g, '').slice(0, 8);
  const partes = [digitos.slice(0, 2), digitos.slice(2, 4), digitos.slice(4, 8)].filter(Boolean);
  return partes.join('/');
}

function paraIso(dataBr: string): string {
  const [dia, mes, ano] = dataBr.split('/');
  return new Date(Number(ano), Number(mes) - 1, Number(dia)).toISOString();
}

function paraBr(iso: string): string {
  return format(new Date(iso), 'dd/MM/yyyy');
}

function parseDataBr(dataBr: string): Date {
  const [dia, mes, ano] = dataBr.split('/');
  if (!dia || !mes || !ano || ano.length < 4) return new Date();
  return new Date(Number(ano), Number(mes) - 1, Number(dia));
}

export function EditarCriancaScreen() {
  const params = useLocalSearchParams<{ criancaId?: string }>();
  const criancaId = stringParam(params.criancaId);
  const insets = useSafeAreaInsets();

  const criancas = useCriancasDaConta();
  const atualizarCrianca = useChildStore(s => s.atualizarCrianca);

  const crianca = useMemo(
    () => criancas.find(item => item.id === criancaId),
    [criancas, criancaId],
  );

  const [fotoUri, setFotoUri] = useState<string | undefined>(crianca?.fotoUri);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [sexo, setSexo] = useState<SexoCrianca | null>(crianca?.sexo ?? null);
  const [erroSexo, setErroSexo] = useState(false);
  const [criancaAnterior, setCriancaAnterior] = useState(crianca);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: { nome: '', dataNascimento: '' },
  });

  if (crianca !== criancaAnterior) {
    setCriancaAnterior(crianca);
    if (crianca) {
      setValue('nome', crianca.nome);
      setValue('dataNascimento', paraBr(crianca.dataNascimento));
      setFotoUri(crianca.fotoUri);
      setSexo(crianca.sexo);
    }
  }

  async function escolherFotoDaGaleria() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) return;
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!resultado.canceled) setFotoUri(resultado.assets[0].uri);
  }

  async function tirarFotoComCamera() {
    const permissao = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissao.granted) return;
    const resultado = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!resultado.canceled) setFotoUri(resultado.assets[0].uri);
  }

  function escolherFoto() {
    Alert.alert('Foto da criança', 'Como você quer adicionar a foto?', [
      { text: 'Câmera', onPress: tirarFotoComCamera },
      { text: 'Galeria', onPress: escolherFotoDaGaleria },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  function onSubmit(values: FormData) {
    if (!crianca) return;
    if (!sexo) {
      setErroSexo(true);
      return;
    }
    atualizarCrianca(crianca.id, {
      nome: (values.nome ?? '').trim(),
      dataNascimento: paraIso(values.dataNascimento ?? ''),
      sexo,
      fotoUri,
    });
    router.back();
  }

  if (!crianca) return null;

  return (
    <KeyboardAwareScrollView
      style={styles.flex}
      contentContainerStyle={styles.scrollContent}
      enableOnAndroid
      extraScrollHeight={spacing.xxl}
      keyboardShouldPersistTaps="handled">
      <View style={[styles.content, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={typography.h3}>Editar perfil</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarTouchable}
            activeOpacity={0.85}
            onPress={escolherFoto}>
            <View style={styles.avatarBorder}>
              {fotoUri ? (
                <Image source={{ uri: fotoUri }} style={styles.avatarImage} />
              ) : (
                <Camera size={27} color={colors.primary} />
              )}
            </View>
            <View style={styles.plusBadge}>
              <Plus size={9} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarLabel}>Foto da criança</Text>
        </View>

        <View style={styles.formSection}>
          <View style={styles.field}>
            <Text style={typography.label}>Nome da Criança</Text>
            <Controller
              control={control}
              name="nome"
              render={({ field: { onChange, value } }) => (
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: Gael"
                    placeholderTextColor={colors.placeholder}
                    value={value}
                    onChangeText={onChange}
                  />
                </View>
              )}
            />
            {!!errors.nome && <Text style={styles.error}>{errors.nome.message}</Text>}
          </View>

          <View style={styles.field}>
            <Text style={typography.label}>Data de Nascimento</Text>
            <Controller
              control={control}
              name="dataNascimento"
              render={({ field: { onChange, value } }) => (
                <>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      placeholder="DD/MM/AAAA"
                      placeholderTextColor={colors.placeholder}
                      keyboardType="number-pad"
                      maxLength={10}
                      value={value}
                      onChangeText={text => onChange(formatarDataDigitada(text))}
                    />
                    <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                      <Calendar size={22} color={colors.placeholder} />
                    </TouchableOpacity>
                  </View>
                  <DatePickerSheet
                    visible={showDatePicker}
                    value={value ? parseDataBr(value) : new Date()}
                    onCancel={() => setShowDatePicker(false)}
                    onConfirm={date => {
                      setShowDatePicker(false);
                      onChange(format(date, 'dd/MM/yyyy'));
                    }}
                  />
                </>
              )}
            />
            {!!errors.dataNascimento && (
              <Text style={styles.error}>{errors.dataNascimento.message}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={typography.label}>Sexo</Text>
            <View style={styles.sexoRow}>
              {(
                [
                  { valor: 'menino' as const, label: 'Menino' },
                  { valor: 'menina' as const, label: 'Menina' },
                ]
              ).map(opcao => (
                <TouchableOpacity
                  key={opcao.valor}
                  style={[styles.sexoOption, sexo === opcao.valor && styles.sexoOptionAtiva]}
                  onPress={() => {
                    setSexo(opcao.valor);
                    setErroSexo(false);
                  }}>
                  <Text
                    style={[
                      styles.sexoOptionText,
                      sexo === opcao.valor && styles.sexoOptionTextAtiva,
                    ]}>
                    {opcao.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {erroSexo && <Text style={styles.error}>Selecione o sexo da criança</Text>}
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.ctaButton}
          activeOpacity={0.85}
          onPress={handleSubmit(onSubmit)}>
          <Text style={styles.ctaLabel}>Salvar alterações</Text>
          <Check size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  avatarTouchable: {
    width: 120,
    height: 120,
  },
  avatarBorder: {
    width: 120,
    height: 120,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTint,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  plusBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    borderWidth: 3,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLabel: {
    ...typography.label,
    color: colors.primary,
    marginTop: spacing.lg,
  },
  formSection: {
    gap: spacing.xl,
  },
  field: {
    gap: spacing.sm,
  },
  sexoRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  sexoOption: {
    flex: 1,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
  },
  sexoOptionAtiva: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceTint,
  },
  sexoOptionText: {
    ...typography.body,
    color: colors.textMuted,
  },
  sexoOptionTextAtiva: {
    color: colors.primary,
    fontFamily: typography.label.fontFamily,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
  },
  input: {
    ...typography.body,
    flex: 1,
  },
  error: {
    color: colors.red,
    fontSize: 12,
  },
  footer: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxl,
  },
  ctaButton: {
    width: '100%',
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
  },
  ctaLabel: {
    ...typography.button,
  },
});
