import { yupResolver } from '@hookform/resolvers/yup';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { format } from 'date-fns';
import {
  ArrowRight,
  Calendar,
  Camera,
  Check,
  CircleUser,
  Plus,
  Trash2,
} from 'lucide-react-native';
import React, { useState } from 'react';
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
import { StoryRootLogo } from '../../components/StoryRootLogo';
import { useChildStore, useCriancasDaConta } from '../../store/childStore';
import { useMemoriesStore } from '../../store/memoriesStore';
import { useRecordsStore } from '../../store/recordsStore';
import { colors, radius, spacing, typography } from '../../theme';
import type { SexoCrianca } from '../../types';
import { formatarIdade } from '../../utils/age';

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
  const partes = [digitos.slice(0, 2), digitos.slice(2, 4), digitos.slice(4, 8)].filter(
    Boolean,
  );
  return partes.join('/');
}

function paraIso(dataBr: string): string {
  const [dia, mes, ano] = dataBr.split('/');
  return new Date(Number(ano), Number(mes) - 1, Number(dia)).toISOString();
}

function parseDataBr(dataBr: string): Date {
  const [dia, mes, ano] = dataBr.split('/');
  if (!dia || !mes || !ano || ano.length < 4) return new Date();
  return new Date(Number(ano), Number(mes) - 1, Number(dia));
}

export function CadastroCriancaScreen({ mode }: { mode?: 'onboarding' | 'add' }) {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const flowMode = mode ?? (params.mode === 'add' ? 'add' : 'onboarding');
  const isOnboarding = flowMode !== 'add';
  const adicionarCrianca = useChildStore(state => state.adicionarCrianca);
  const removerCrianca = useChildStore(state => state.removerCrianca);
  const selecionarCriancaAtiva = useChildStore(state => state.selecionarCriancaAtiva);
  const concluirOnboarding = useChildStore(state => state.concluirOnboarding);
  const removerRegistrosDaCrianca = useRecordsStore(s => s.removerRegistrosDaCrianca);
  const removerOuDesvincularMemoriasDaCrianca = useMemoriesStore(
    s => s.removerOuDesvincularMemoriasDaCrianca,
  );
  const criancasCadastradas = useCriancasDaConta();
  const insets = useSafeAreaInsets();
  const [fotoUri, setFotoUri] = useState<string | undefined>();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [sexo, setSexo] = useState<SexoCrianca | null>(null);
  const [erroSexo, setErroSexo] = useState(false);
  const [passo, setPasso] = useState<'form' | 'lista'>(
    isOnboarding && criancasCadastradas.length > 0 ? 'lista' : 'form',
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: { nome: '', dataNascimento: '' },
  });

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
    if (!sexo) {
      setErroSexo(true);
      return;
    }
    const nova = adicionarCrianca({
      nome: (values.nome ?? '').trim(),
      dataNascimento: paraIso(values.dataNascimento ?? ''),
      sexo,
      fotoUri,
    });
    if (!isOnboarding) {
      selecionarCriancaAtiva(nova.id);
      router.back();
      return;
    }
    reset({ nome: '', dataNascimento: '' });
    setFotoUri(undefined);
    setSexo(null);
    setPasso('lista');
  }

  function removerDaLista(id: string, nome: string) {
    Alert.alert('Remover criança', `Remover ${nome} da lista?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => {
          removerCrianca(id);
          removerRegistrosDaCrianca(id);
          removerOuDesvincularMemoriasDaCrianca(id);
        },
      },
    ]);
  }

  return (
    <KeyboardAwareScrollView
      style={styles.flex}
      contentContainerStyle={styles.scrollContent}
      enableOnAndroid
      extraScrollHeight={spacing.xxl}
      keyboardShouldPersistTaps="handled">
        <View style={[styles.content, { paddingTop: insets.top + spacing.md }]}>
          <View style={styles.logoRow}>
            <View style={styles.logoIcon}>
              <StoryRootLogo size={24} variant="markOnPrimary" />
            </View>
            <Text style={styles.appName}>Story Root</Text>
          </View>

          <View style={styles.textGroup}>
            <Text style={typography.h1}>
              {!isOnboarding
                ? 'Adicionar outra criança.'
                : passo === 'lista'
                  ? 'Quem vamos acompanhar?'
                  : 'Comece a contar essa história.'}
            </Text>
            <Text style={[typography.body, styles.subtext]}>
              {!isOnboarding
                ? 'Cada criança, sua própria história.'
                : passo === 'lista'
                  ? 'Cadastre quantas crianças precisar. Você pode continuar quando quiser.'
                  : 'Cada sorriso, cada descoberta. Registre tudo para nunca mais esquecer.'}
            </Text>
          </View>

          {passo === 'form' ? (
            <>
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
                  {!!errors.nome && (
                    <Text style={styles.error}>{errors.nome.message}</Text>
                  )}
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
            </>
          ) : (
            <View style={styles.listaSection}>
              {criancasCadastradas.map(crianca => (
                <View key={crianca.id} style={styles.listaCard}>
                  {crianca.fotoUri ? (
                    <Image source={{ uri: crianca.fotoUri }} style={styles.listaAvatar} />
                  ) : (
                    <View style={[styles.listaAvatar, styles.listaAvatarPlaceholder]}>
                      <CircleUser size={22} color={colors.primary} />
                    </View>
                  )}
                  <View style={styles.listaCardContent}>
                    <Text style={typography.h4}>{crianca.nome}</Text>
                    <Text style={typography.caption}>
                      {formatarIdade(crianca.dataNascimento)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.listaRemoveButton}
                    hitSlop={8}
                    onPress={() => removerDaLista(crianca.id, crianca.nome)}>
                    <Trash2 size={16} color={colors.red} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.footer}>
          {passo === 'form' ? (
            <>
              <TouchableOpacity
                style={styles.ctaButton}
                activeOpacity={0.85}
                onPress={handleSubmit(onSubmit)}>
                <Text style={styles.ctaLabel}>
                  {isOnboarding ? 'Cadastrar' : 'Adicionar Criança'}
                </Text>
                <ArrowRight size={20} color="#fff" />
              </TouchableOpacity>
              {isOnboarding && criancasCadastradas.length > 0 && (
                <TouchableOpacity onPress={() => setPasso('lista')}>
                  <Text style={styles.linkVoltarLista}>Ver crianças já cadastradas</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.outlineButton}
                activeOpacity={0.85}
                onPress={() => setPasso('form')}>
                <Plus size={18} color={colors.primary} />
                <Text style={styles.outlineButtonLabel}>Cadastrar outra criança</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.ctaButton,
                  criancasCadastradas.length === 0 && styles.ctaButtonDisabled,
                ]}
                activeOpacity={0.85}
                disabled={criancasCadastradas.length === 0}
                onPress={concluirOnboarding}>
                <Text style={styles.ctaLabel}>Continuar</Text>
                <Check size={20} color="#fff" />
              </TouchableOpacity>
            </>
          )}
          <Text style={styles.fineprint}>
            Ao continuar, você concorda com nossos termos e privacidade.
          </Text>
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
    paddingTop: spacing.xxl,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontFamily: typography.h3.fontFamily,
    fontSize: 20,
    color: colors.text,
  },
  textGroup: {
    gap: spacing.sm,
    marginBottom: spacing.xxxl,
  },
  subtext: {
    color: colors.textMuted,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
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
  listaSection: {
    gap: spacing.md,
  },
  listaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  listaAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  listaAvatarPlaceholder: {
    backgroundColor: colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listaCardContent: {
    flex: 1,
    gap: 2,
  },
  listaRemoveButton: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkVoltarLista: {
    ...typography.label,
    color: colors.primary,
    textAlign: 'center',
  },
  outlineButton: {
    width: '100%',
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  outlineButtonLabel: {
    ...typography.label,
    color: colors.primary,
  },
  footer: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxl,
    gap: spacing.lg,
    alignItems: 'center',
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
  ctaButtonDisabled: {
    opacity: 0.5,
  },
  ctaLabel: {
    ...typography.button,
  },
  fineprint: {
    ...typography.caption,
    textAlign: 'center',
  },
});
