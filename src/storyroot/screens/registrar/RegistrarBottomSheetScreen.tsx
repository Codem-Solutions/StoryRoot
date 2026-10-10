import { router, useLocalSearchParams } from 'expo-router';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Camera,
  ChevronDown,
  Clock3,
  Mic,
  Plus,
  Sparkles,
  X,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { AlimentoPickerSheet } from '../../components/AlimentoPickerSheet';
import { BottomSheet } from '../../components/BottomSheet';
import { DatePickerSheet } from '../../components/DatePickerSheet';
import { DosageIllustration } from '../../components/DosageIllustration';
import { FotosPicker } from '../../components/FotosPicker';
import { PrimaryButton } from '../../components/PrimaryButton';
import { RecordTypeCard } from '../../components/RecordTypeCard';
import { SintomasPickerSheet } from '../../components/SintomasPickerSheet';
import { TimePickerSheet } from '../../components/TimePickerSheet';
import { RECORD_TYPES } from '../../constants/recordTypes';
import { SINTOMA_OUTRO, buscarSintoma } from '../../constants/sintomas';
import { useAlimentosStore } from '../../store/alimentosStore';
import { useCriancaAtiva } from '../../store/childStore';
import { useRecordsStore } from '../../store/recordsStore';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import { colors, radius, spacing, typography } from '../../theme';
import {
  ROTULOS_APETITE,
  ROTULOS_COMPORTAMENTO,
  ROTULOS_CONSUMO,
  ROTULOS_TEXTURA,
  ROTULOS_UNIDADE,
  alimentoENovoParaCrianca,
  registrosComidaDaCrianca,
  rotuloTipoRefeicao,
} from '../../utils/alimentacao';
import { formatarIdade } from '../../utils/age';
import { formatarDataBR, formatarHora, formatarValorRegistro } from '../../utils/format';
import { dataEfetivaDeDados } from '../../utils/medidas';
import { salvarMidiasPermanentes } from '../../utils/midia';
import { agendarLembretesRemedio, cancelarLembretes } from '../../utils/notifications';
import { decodeJsonParam, stringParam } from '../../utils/routerParams';
import {
  STATUS_SAUDE,
  resumoSintomas,
  sincronizarLembretesSaude,
  statusEmAcompanhamento,
} from '../../utils/saude';
import { showSaveErrorToast, showSaveSuccessToast } from '../../utils/toast';
import type {
  Alimento,
  AtualizacaoStatusSaude,
  ComportamentoAlimentar,
  Crianca,
  ItemRefeicao,
  SaudeDados,
  StatusSaude,
  TipoRefeicao,
  TipoRegistro,
} from '../../types';

const TIPOS_REGISTRO_ROTINA: TipoRegistro[] = ['sono', 'amamentacao', 'mamadeira', 'comida', 'fralda'];
const TIPOS_GESTAO_SAUDE: TipoRegistro[] = ['medidas', 'remedio', 'vacina', 'saude'];
const PERIODOS_SONO = ['Manhã', 'Tarde', 'Noite'] as const;

/** Mantém apenas dígitos e um separador decimal (vírgula ou ponto). */
function apenasNumero(texto: string): string {
  const limpo = texto.replace(/[^0-9.,]/g, '').replace(',', '.');
  const partes = limpo.split('.');
  if (partes.length <= 1) return limpo;
  return `${partes[0]}.${partes.slice(1).join('')}`;
}

function inferirPeriodoSonoPorHora(horaIso?: string): 'Manhã' | 'Tarde' | 'Noite' {
  const data = horaIso ? new Date(horaIso) : new Date();
  const hora = data.getHours();
  if (hora < 12) return 'Manhã';
  if (hora < 18) return 'Tarde';
  return 'Noite';
}

function aplicarMascaraHora(texto: string): string {
  const digitos = texto.replace(/\D/g, '').slice(0, 4);
  if (digitos.length <= 2) return digitos;
  return `${digitos.slice(0, 2)}:${digitos.slice(2)}`;
}

function parseHoraTexto(texto: string): { hora: number; minuto: number } | null {
  if (!/^\d{2}:\d{2}$/.test(texto)) return null;
  const [hh, mm] = texto.split(':').map(Number);
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return { hora: hh, minuto: mm };
}

function atualizarIsoComHorario(horaTexto: string, isoBase?: string): string | null {
  const parsed = parseHoraTexto(horaTexto);
  if (!parsed) return null;
  const base = isoBase ? new Date(isoBase) : new Date();
  base.setHours(parsed.hora, parsed.minuto, 0, 0);
  return base.toISOString();
}

function aplicarMascaraData(texto: string): string {
  const digitos = texto.replace(/\D/g, '').slice(0, 8);
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 4) return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
  return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
}

function parseDataTexto(texto: string): { dia: number; mes: number; ano: number } | null {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) return null;
  const [dd, mm, yyyy] = texto.split('/').map(Number);
  if (dd < 1 || dd > 31 || mm < 1 || mm > 12 || yyyy < 1900 || yyyy > 2100) return null;
  const data = new Date(yyyy, mm - 1, dd);
  if (data.getFullYear() !== yyyy || data.getMonth() !== mm - 1 || data.getDate() !== dd) return null;
  return { dia: dd, mes: mm, ano: yyyy };
}

function atualizarIsoComData(dataTexto: string, isoBase?: string): string | null {
  const parsed = parseDataTexto(dataTexto);
  if (!parsed) return null;
  const base = isoBase ? new Date(isoBase) : new Date();
  base.setFullYear(parsed.ano, parsed.mes - 1, parsed.dia);
  return base.toISOString();
}

export function RegistrarBottomSheetScreen() {
  const rawParams = useLocalSearchParams<{
    editarRegistroId?: string;
    tipoInicial?: string;
    formDataInicial?: string;
    notificacaoIdsIniciais?: string;
  }>();
  const params = useMemo(
    () => ({
      editarRegistroId: stringParam(rawParams.editarRegistroId),
      tipoInicial: stringParam(rawParams.tipoInicial) as TipoRegistro | undefined,
      formDataInicial: decodeJsonParam<any>(rawParams.formDataInicial, undefined),
      notificacaoIdsIniciais: decodeJsonParam<string[] | undefined>(
        rawParams.notificacaoIdsIniciais,
        undefined,
      ),
    }),
    [
      rawParams.editarRegistroId,
      rawParams.tipoInicial,
      rawParams.formDataInicial,
      rawParams.notificacaoIdsIniciais,
    ],
  );
  const adicionarRegistro = useRecordsStore(state => state.adicionarRegistro);
  const atualizarRegistro = useRecordsStore(state => state.atualizarRegistro);
  const criancaAtiva = useCriancaAtiva();
  const plano = useSubscriptionStore(state => state.plano);

  const [tipoSelecionado, setTipoSelecionado] = useState<TipoRegistro | null>(
    params?.tipoInicial ?? null,
  );
  const [formData, setFormData] = useState<any>(() => {
    const inicial = params?.formDataInicial ?? {};
    if (params?.tipoInicial === 'medidas' && !inicial.data && inicial.periodoAno && inicial.periodoMes) {
      return { ...inicial, data: dataEfetivaDeDados(inicial, new Date().toISOString()) };
    }
    if (params?.tipoInicial === 'sono' && !inicial.periodo && inicial.horaInicio) {
      return { ...inicial, periodo: inferirPeriodoSonoPorHora(inicial.horaInicio) };
    }
    return inicial;
  });

  function fechar() {
    router.back();
  }

  function selecionarTipo(tipo: TipoRegistro) {
    if (tipo === 'vacina') {
      router.replace('/(app)/storyroot-main/caderneta-vacinas');
      return;
    }
    if ((tipo === 'medidas' || tipo === 'comida') && !formData.data) {
      setFormData((atual: any) => ({ ...atual, data: new Date().toISOString() }));
    }
    if (tipo === 'saude' && !formData.dataInicio) {
      setFormData((atual: any) => ({ ...atual, dataInicio: new Date().toISOString() }));
    }
    setTipoSelecionado(tipo);
  }

  async function salvarRegistroSaude() {
    if (!criancaAtiva) return;
    const sintomas: string[] = formData.sintomas ?? [];
    if (!sintomas.length) {
      Alert.alert('Sintomas', 'Selecione pelo menos um sintoma.');
      return;
    }
    if (sintomas.includes(SINTOMA_OUTRO) && !formData.sintomaOutro?.trim()) {
      Alert.alert('Descreva o sintoma', 'Você marcou "Outros". Escreva qual é o sintoma.');
      return;
    }
    try {
      const agora = new Date().toISOString();
      const status: StatusSaude = formData.status ?? 'inicio';
      const historico: AtualizacaoStatusSaude[] = formData.statusHistorico ?? [];
      const ultimo = historico[historico.length - 1];
      const dados: SaudeDados = {
        sintomas,
        sintomaOutro: sintomas.includes(SINTOMA_OUTRO) ? formData.sintomaOutro.trim() : undefined,
        dataInicio: formData.dataInicio ?? agora,
        medicacao: formData.medicacao?.trim() || undefined,
        fotos: await salvarMidiasPermanentes(formData.fotos ?? [], 'saude'),
        status,
        // Toda mudança de status entra no histórico com data e hora.
        statusHistorico:
          ultimo?.status === status ? historico : [...historico, { status, data: agora }],
      };
      const id = params?.editarRegistroId ?? String(Date.now());
      const notificacaoIds = await sincronizarLembretesSaude(
        id,
        dados,
        criancaAtiva.nome,
        params?.notificacaoIdsIniciais,
      );
      const registro = {
        criancaId: criancaAtiva.id,
        tipo: 'saude' as const,
        data: dados.dataInicio,
        valor: resumoSintomas(dados),
        dados,
        notificacaoIds,
      };
      if (params?.editarRegistroId) {
        atualizarRegistro(id, registro);
      } else {
        adicionarRegistro({ id, ...registro });
      }
      setFormData({});
      showSaveSuccessToast(
        notificacaoIds.length
          ? 'Registro salvo. Vamos lembrar você de atualizar o quadro a cada 8 horas.'
          : 'Registro de saúde salvo',
      );
      if (params?.editarRegistroId) {
        fechar();
      } else {
        router.dismissAll();
      }
    } catch {
      showSaveErrorToast();
    }
  }

  async function registrarFotoVideo() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) return;
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.8,
    });
    if (resultado.canceled) return;
    const asset = resultado.assets[0];

    if (asset.type === 'video') {
      router.push({ pathname: '/(app)/storyroot-main/video-trim', params: { videoUri: asset.uri } });
      return;
    }

    const imagem = await ImageManipulator.ImageManipulator.manipulate(asset.uri).renderAsync();
    const comprimida = await imagem.saveAsync({
      compress: 0.8,
      format: ImageManipulator.SaveFormat.WEBP,
    });
    router.push({ pathname: '/(app)/storyroot-main/photo-preview', params: { imageUri: comprimida.uri } });
  }

  async function salvarRegistroRotina() {
    if (!tipoSelecionado || !criancaAtiva) return;
    if (tipoSelecionado === 'saude') {
      await salvarRegistroSaude();
      return;
    }
    try {
      if (tipoSelecionado === 'sono') {
        if (!formData.periodo) {
          Alert.alert('Período obrigatório', 'Selecione se o sono foi de manhã, tarde ou noite.');
          return;
        }
        if (!formData.horaInicio || !formData.horaFim) {
          Alert.alert('Horário obrigatório', 'Informe a hora inicial e a hora final do sono.');
          return;
        }
      }

      let notificacaoIds: string[] | undefined;

      if (params?.notificacaoIdsIniciais) {
        await cancelarLembretes(params.notificacaoIdsIniciais);
      }

      if (
        tipoSelecionado === 'remedio' &&
        formData.recorrencia === 'recorrente' &&
        plano === 'premium'
      ) {
        const horarios = (formData.horarios || []).filter(Boolean);
        const duracaoDias = Math.max(1, parseInt(formData.duracao, 10) || 1);
        if (horarios.length) {
          notificacaoIds = await agendarLembretesRemedio(
            formData.nome || 'Remédio',
            formData.dosagem || '',
            horarios,
            duracaoDias,
          );
        }
      }

      const dataRegistro =
        (tipoSelecionado === 'medidas' || tipoSelecionado === 'comida') && formData.data
          ? formData.data
          : new Date().toISOString();

      const dadosParaSalvar = { ...formData };
      if (tipoSelecionado === 'medidas') {
        delete dadosParaSalvar.periodoMes;
        delete dadosParaSalvar.periodoAno;
      }

      const registro = {
        criancaId: criancaAtiva.id,
        tipo: tipoSelecionado,
        data: dataRegistro,
        valor: formatarValorRegistro(tipoSelecionado, formData),
        dados: dadosParaSalvar,
        notificacaoIds,
      };

      if (params?.editarRegistroId) {
        atualizarRegistro(params.editarRegistroId, registro);
      } else {
        adicionarRegistro({ id: String(Date.now()), ...registro });
      }

      setFormData({});
      showSaveSuccessToast();
      if (tipoSelecionado === 'sono') {
        if (params?.editarRegistroId) {
          fechar();
        } else {
          setTipoSelecionado(null);
        }
        return;
      }
      if (
        tipoSelecionado === 'medidas' ||
        tipoSelecionado === 'amamentacao' ||
        tipoSelecionado === 'mamadeira' ||
        tipoSelecionado === 'comida'
      ) {
        setTipoSelecionado(null);
      } else {
        router.dismissAll();
      }
    } catch {
      showSaveErrorToast();
    }
  }

  return (
    <BottomSheet onClose={fechar}>
      <KeyboardAwareScrollView
        style={styles.sheetScroll}
        contentContainerStyle={styles.sheetScrollContent}
        showsVerticalScrollIndicator={false}
        enableOnAndroid
        enableAutomaticScroll
        extraHeight={spacing.xxl}
        extraScrollHeight={spacing.xxl}
        keyboardOpeningTime={0}
        keyboardShouldPersistTaps="handled">
        {tipoSelecionado ? (
          <SpecificForm
            tipo={tipoSelecionado}
            formData={formData}
            onChangeFormData={setFormData}
            criancaAtiva={criancaAtiva}
            onBack={() => {
              setTipoSelecionado(null);
              setFormData({});
            }}
            onClose={fechar}
            onSave={salvarRegistroRotina}
          />
        ) : (
          <>
            <View style={styles.sheetHeader}>
              <Text style={typography.h2}>O que aconteceu?</Text>
              <TouchableOpacity style={styles.closeCircle} onPress={fechar}>
                <X size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Memórias Emocionais</Text>
              <View style={styles.twoColumnRow}>
                <TouchableOpacity
                  style={styles.memoryCard}
                  activeOpacity={0.85}
                  onPress={registrarFotoVideo}>
                  <View style={[styles.iconCircle, { backgroundColor: colors.accent }]}>
                    <Camera size={24} color="#fff" />
                  </View>
                  <Text style={typography.h4}>Foto / Vídeo</Text>
                  <Text style={styles.memoryCardDesc}>
                    Salvar expressão ou marco
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.memoryCard}
                  activeOpacity={0.85}
                  onPress={() => router.push('/(app)/storyroot-main/audio-recorder')}>
                  <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
                    <Mic size={24} color="#fff" />
                  </View>
                  <Text style={typography.h4}>Áudio / Fala</Text>
                  <Text style={styles.memoryCardDesc}>
                    Registrar primeiros sons
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Registro de Rotina</Text>
              <View style={styles.routineGrid}>
                {TIPOS_REGISTRO_ROTINA.map(tipo => (
                  <RecordTypeCard key={tipo} tipo={tipo} onPress={() => selecionarTipo(tipo)} />
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Gestão Saúde</Text>
              <View style={styles.routineGrid}>
                {TIPOS_GESTAO_SAUDE.map(tipo => (
                  <RecordTypeCard key={tipo} tipo={tipo} onPress={() => selecionarTipo(tipo)} />
                ))}
              </View>
            </View>
          </>
        )}
      </KeyboardAwareScrollView>
    </BottomSheet>
  );
}

function DateInputField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (iso: string) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [inputData, setInputData] = useState(value ? formatarDataBR(value) : '');
  const [valorAnterior, setValorAnterior] = useState(value);
  const data = value ? new Date(value) : new Date();

  if (value !== valorAnterior) {
    setValorAnterior(value);
    setInputData(value ? formatarDataBR(value) : '');
  }

  function aplicarDigitacao(texto: string) {
    setInputData(aplicarMascaraData(texto));
  }

  function confirmarDigitacao() {
    if (!inputData) return;
    const atualizado = atualizarIsoComData(inputData, value);
    if (!atualizado) {
      Alert.alert('Data inválida', 'Digite uma data válida no formato DD/MM/AAAA.');
      setInputData(value ? formatarDataBR(value) : '');
      return;
    }
    onChange(atualizado);
  }

  return (
    <View style={styles.quickEntryField}>
      <Text style={typography.label}>{label}</Text>
      <View style={styles.timeInputWrapper}>
        <TextInput
          style={styles.timeInputField}
          placeholder="DD/MM/AAAA"
          placeholderTextColor={colors.placeholder}
          keyboardType="number-pad"
          value={inputData}
          onChangeText={aplicarDigitacao}
          onBlur={confirmarDigitacao}
          maxLength={10}
        />
        <TouchableOpacity style={styles.timePickerIconButton} onPress={() => setShowPicker(true)}>
          <CalendarDays size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
      <DatePickerSheet
        visible={showPicker}
        value={data}
        onCancel={() => setShowPicker(false)}
        onConfirm={date => {
          setShowPicker(false);
          const iso = date.toISOString();
          setInputData(formatarDataBR(iso));
          onChange(iso);
        }}
      />
    </View>
  );
}

function SpecificForm({
  tipo,
  formData,
  onChangeFormData,
  criancaAtiva,
  onBack,
  onClose,
  onSave,
}: {
  tipo: TipoRegistro;
  formData: any;
  onChangeFormData: (data: any) => void;
  criancaAtiva: Crianca | undefined;
  onBack: () => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const meta = RECORD_TYPES[tipo];
  const Icon = meta.icon;

  const renderForm = () => {
    switch (tipo) {
      case 'sono':
        return <SonoForm formData={formData} onChange={onChangeFormData} />;
      case 'comida':
        return (
          <AlimentacaoForm
            formData={formData}
            onChange={onChangeFormData}
            criancaAtiva={criancaAtiva}
          />
        );
      case 'amamentacao':
        return <AmamentacaoForm formData={formData} onChange={onChangeFormData} />;
      case 'mamadeira':
        return <MamadeiraForm formData={formData} onChange={onChangeFormData} />;
      case 'remedio':
        return <RemedioForm formData={formData} onChange={onChangeFormData} />;
      case 'fralda':
        return <FraldaForm formData={formData} onChange={onChangeFormData} />;
      case 'saude':
        return <SaudeForm formData={formData} onChange={onChangeFormData} />;
      case 'medidas':
        return (
          <MedidasForm
            formData={formData}
            onChange={onChangeFormData}
            criancaAtiva={criancaAtiva}
          />
        );
      default:
        return <DefaultForm formData={formData} onChange={onChangeFormData} meta={meta} />;
    }
  };

  return (
    <View>
      <View style={styles.sheetHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.quickEntryTitleGroup}>
          <View style={[styles.iconCircle, styles.iconCircleSmall, { backgroundColor: meta.color }]}>
            <Icon size={18} color="#fff" />
          </View>
          <Text style={typography.h3}>{meta.label}</Text>
        </View>
        <TouchableOpacity style={styles.closeCircle} onPress={onClose}>
          <X size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      {renderForm()}

      <PrimaryButton label="Salvar registro" onPress={onSave} style={styles.saveButton} />
    </View>
  );
}

function DefaultForm({ formData, onChange, meta }: any) {
  return (
    <View style={styles.quickEntryField}>
      <Text style={typography.label}>Detalhes</Text>
      <TextInput
        style={styles.quickEntryInput}
        placeholder={meta.placeholder}
        placeholderTextColor={colors.placeholder}
        value={formData.detalhes || ''}
        onChangeText={(text) => onChange({ ...formData, detalhes: text })}
        autoFocus
      />
    </View>
  );
}

function TimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (iso: string) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [inputHora, setInputHora] = useState(value ? formatarHora(value) : '');
  const [valorAnterior, setValorAnterior] = useState(value);
  const data = value ? new Date(value) : new Date();

  if (value !== valorAnterior) {
    setValorAnterior(value);
    setInputHora(value ? formatarHora(value) : '');
  }

  function aplicarDigitacao(texto: string) {
    setInputHora(aplicarMascaraHora(texto));
  }

  function confirmarDigitacao() {
    if (!inputHora) return;
    const atualizado = atualizarIsoComHorario(inputHora, value);
    if (!atualizado) {
      Alert.alert('Horário inválido', 'Digite um horário válido no formato HH:mm.');
      setInputHora(value ? formatarHora(value) : '');
      return;
    }
    onChange(atualizado);
  }

  return (
    <View style={styles.quickEntryField}>
      <Text style={typography.label}>{label}</Text>
      <View style={styles.timeInputWrapper}>
        <TextInput
          style={styles.timeInputField}
          placeholder="HH:mm"
          placeholderTextColor={colors.placeholder}
          keyboardType="number-pad"
          value={inputHora}
          onChangeText={aplicarDigitacao}
          onBlur={confirmarDigitacao}
          maxLength={5}
        />
        <TouchableOpacity style={styles.timePickerIconButton} onPress={() => setShowPicker(true)}>
          <Clock3 size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
      <TimePickerSheet
        visible={showPicker}
        value={data}
        onCancel={() => setShowPicker(false)}
        onConfirm={date => {
          setShowPicker(false);
          const iso = date.toISOString();
          setInputHora(formatarHora(iso));
          onChange(iso);
        }}
      />
    </View>
  );
}

function SonoForm({ formData, onChange }: any) {
  const [showPeriodoModal, setShowPeriodoModal] = useState(false);
  const periodoSelecionado = formData.periodo as string | undefined;

  return (
    <View style={styles.formContainer}>
      <View style={styles.quickEntryField}>
        <Text style={typography.label}>Período</Text>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setShowPeriodoModal(true)}>
          <Text style={typography.body}>{periodoSelecionado || 'Selecionar período'}</Text>
          <ChevronDown size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {!!periodoSelecionado && (
        <>
          <View style={styles.periodoHint}>
            <Text style={styles.periodoHintText}>
              Janela de sono: {periodoSelecionado}. Preencha início e fim.
            </Text>
          </View>
          <TimeField
            label="Hora Inicial"
            value={formData.horaInicio}
            onChange={iso => onChange({ ...formData, horaInicio: iso })}
          />
          <TimeField
            label="Hora Final"
            value={formData.horaFim}
            onChange={iso => onChange({ ...formData, horaFim: iso })}
          />
        </>
      )}

      <DropdownModal
        visible={showPeriodoModal}
        options={[...PERIODOS_SONO]}
        onSelect={(value) => {
          onChange({ ...formData, periodo: value });
          setShowPeriodoModal(false);
        }}
        onClose={() => setShowPeriodoModal(false)}
        title="Período do Sono"
      />
    </View>
  );
}

const OPCOES_TIPO_REFEICAO: TipoRefeicao[] = [
  'cafe_manha',
  'lanche_manha',
  'almoco',
  'lanche_tarde',
  'jantar',
  'lanche_noite',
  'ceia',
  'alimentacao_complementar',
  'refeicao_escolar',
  'refeicao_fora',
  'refeicao_especial',
];
const OPCOES_APETITE = ['muita_fome', 'fome_normal', 'pouca_fome', 'sem_fome'] as const;
const OPCOES_COMPORTAMENTO: ComportamentoAlimentar[] = [
  'tranquilo',
  'sozinho',
  'precisou_ajuda',
  'distraido',
  'irritado',
  'sonolento',
  'chorou',
  'recusou_alimentos',
];
const OPCOES_CONSUMO: ItemRefeicao['consumo'][] = ['total', 'parcial', 'recusado'];

function ItemRefeicaoLinha({
  item,
  alimento,
  novo,
  onAtualizar,
  onRemover,
}: {
  item: ItemRefeicao;
  alimento: Alimento | undefined;
  novo: boolean;
  onAtualizar: (patch: Partial<ItemRefeicao>) => void;
  onRemover: () => void;
}) {
  const [expandido, setExpandido] = useState(false);

  return (
    <View style={styles.itemCard}>
      <TouchableOpacity
        style={styles.itemCabecalho}
        activeOpacity={0.7}
        onPress={() => setExpandido(!expandido)}>
        <View style={styles.itemNomeGrupo}>
          <Text style={typography.label}>{alimento?.nomeExibicao ?? item.alimentoId}</Text>
          {novo && (
            <View style={styles.itemNovoBadge}>
              <Sparkles size={11} color={colors.primary} />
              <Text style={styles.itemNovoBadgeText}>Novo</Text>
            </View>
          )}
        </View>
        <TouchableOpacity hitSlop={8} onPress={onRemover}>
          <X size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </TouchableOpacity>

      <View style={styles.itemConsumoRow}>
        {OPCOES_CONSUMO.map(opcao => (
          <TouchableOpacity
            key={opcao}
            style={[styles.chip, item.consumo === opcao && styles.chipAtivo]}
            onPress={() => onAtualizar({ consumo: opcao })}>
            <Text style={[styles.chipText, item.consumo === opcao && styles.chipTextAtivo]}>
              {ROTULOS_CONSUMO[opcao]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {expandido && (
        <View style={styles.itemDetalhes}>
          <View style={styles.quickEntryFieldTight}>
            <Text style={styles.itemDetalheLabel}>
              Quantidade {alimento ? `(${ROTULOS_UNIDADE[alimento.unidadePadrao]})` : ''}
            </Text>
            <TextInput
              style={styles.unitInput}
              placeholder="Opcional"
              placeholderTextColor={colors.placeholder}
              keyboardType="decimal-pad"
              value={item.quantidadeConsumida ? String(item.quantidadeConsumida) : ''}
              onChangeText={text =>
                onAtualizar({ quantidadeConsumida: text ? Number(apenasNumero(text)) : undefined })
              }
            />
          </View>

          <View style={styles.itemAceitacaoRow}>
            {(['adorou', 'aceitou_bem', 'aceitou', 'experimentou', 'recusou'] as const).map(nivel => (
              <TouchableOpacity
                key={nivel}
                style={[styles.chipPequeno, item.aceitacao === nivel && styles.chipAtivo]}
                onPress={() => onAtualizar({ aceitacao: nivel })}>
                <Text
                  style={[styles.chipTextPequeno, item.aceitacao === nivel && styles.chipTextAtivo]}>
                  {nivel === 'adorou'
                    ? 'Adorou'
                    : nivel === 'aceitou_bem'
                      ? 'Aceitou bem'
                      : nivel === 'aceitou'
                        ? 'Aceitou'
                        : nivel === 'experimentou'
                          ? 'Experimentou'
                          : 'Recusou'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {novo && (
            <View style={styles.quickEntryFieldTight}>
              <Text style={styles.itemDetalheLabel}>Textura (introdução alimentar)</Text>
              <View style={styles.itemAceitacaoRow}>
                {(Object.keys(ROTULOS_TEXTURA) as (keyof typeof ROTULOS_TEXTURA)[]).map(textura => (
                  <TouchableOpacity
                    key={textura}
                    style={[
                      styles.chipPequeno,
                      item.introducao?.textura === textura && styles.chipAtivo,
                    ]}
                    onPress={() =>
                      onAtualizar({ introducao: { ...item.introducao, textura } })
                    }>
                    <Text
                      style={[
                        styles.chipTextPequeno,
                        item.introducao?.textura === textura && styles.chipTextAtivo,
                      ]}>
                      {ROTULOS_TEXTURA[textura]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function AlimentacaoForm({ formData, onChange, criancaAtiva }: any) {
  const [showTipoModal, setShowTipoModal] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);
  const alimentosBase = useAlimentosStore(s => s.alimentos);
  const registros = useRecordsStore(s => s.registros);

  const itens: ItemRefeicao[] = formData.itens ?? [];
  const alimentosPorId = useMemo(() => new Map(alimentosBase.map(a => [a.id, a])), [alimentosBase]);

  const comidaAnteriores = useMemo(
    () => (criancaAtiva ? registrosComidaDaCrianca(registros, criancaAtiva.id) : []),
    [registros, criancaAtiva],
  );
  const ultimaRefeicao = comidaAnteriores[0];

  function atualizarItem(index: number, patch: Partial<ItemRefeicao>) {
    const novosItens = itens.map((item, i) => (i === index ? { ...item, ...patch } : item));
    onChange({ ...formData, itens: novosItens });
  }

  function removerItem(index: number) {
    onChange({ ...formData, itens: itens.filter((_, i) => i !== index) });
  }

  function adicionarAlimentos(alimentosSelecionados: Alimento[]) {
    if (!alimentosSelecionados.length) return;
    const existentes = new Set(itens.map(item => item.alimentoId));
    const novosItens = alimentosSelecionados
      .filter(alimento => !existentes.has(alimento.id))
      .map<ItemRefeicao>(alimento => ({
        alimentoId: alimento.id,
        unidade: alimento.unidadePadrao,
        consumo: 'total',
      }));

    if (!novosItens.length) return;
    onChange({ ...formData, itens: [...itens, ...novosItens] });
  }

  function repetirUltimaRefeicao() {
    if (!ultimaRefeicao) return;
    const dados = ultimaRefeicao.dados ?? {};
    onChange({
      ...formData,
      tipoRefeicao: dados.tipoRefeicao,
      itens: dados.itens ?? [],
      local: dados.local,
      quemOfereceu: dados.quemOfereceu,
    });
  }

  return (
    <View style={styles.formContainer}>
      <DateInputField
        label="Data"
        value={formData.data}
        onChange={iso => onChange({ ...formData, data: iso })}
      />

      <TimeField
        label="Horário"
        value={formData.data}
        onChange={iso => onChange({ ...formData, data: iso })}
      />

      <View style={styles.quickEntryField}>
        <Text style={typography.label}>Tipo de Refeição</Text>
        <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowTipoModal(true)}>
          <Text style={typography.body}>
            {formData.tipoRefeicao ? rotuloTipoRefeicao(formData.tipoRefeicao) : 'Selecionar tipo'}
          </Text>
          <ChevronDown size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {!!ultimaRefeicao && itens.length === 0 && (
        <TouchableOpacity style={styles.repetirButton} onPress={repetirUltimaRefeicao}>
          <Text style={styles.repetirButtonText}>
            Repetir última refeição ({rotuloTipoRefeicao(ultimaRefeicao.dados?.tipoRefeicao)})
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.quickEntryField}>
        <Text style={typography.label}>Alimentos</Text>
        {itens.map((item, index) => (
          <ItemRefeicaoLinha
            key={`${item.alimentoId}-${index}`}
            item={item}
            alimento={alimentosPorId.get(item.alimentoId)}
            novo={alimentoENovoParaCrianca(comidaAnteriores, item.alimentoId, undefined)}
            onAtualizar={patch => atualizarItem(index, patch)}
            onRemover={() => removerItem(index)}
          />
        ))}
        <TouchableOpacity style={styles.addButton} onPress={() => setShowPicker(true)}>
          <Plus size={16} color={colors.primary} />
          <Text style={styles.addButtonText}>Adicionar alimento</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.detalhesToggle}
        onPress={() => setMostrarDetalhes(!mostrarDetalhes)}>
        <Text style={styles.detalhesToggleText}>
          {mostrarDetalhes ? 'Ocultar detalhes' : 'Mais detalhes (opcional)'}
        </Text>
        <ChevronDown
          size={16}
          color={colors.primary}
          style={{ transform: [{ rotate: mostrarDetalhes ? '180deg' : '0deg' }] }}
        />
      </TouchableOpacity>

      {mostrarDetalhes && (
        <>
          <View style={styles.quickEntryField}>
            <Text style={typography.label}>Local (opcional)</Text>
            <TextInput
              style={styles.quickEntryInput}
              placeholder="Ex: Casa, escola..."
              placeholderTextColor={colors.placeholder}
              value={formData.local || ''}
              onChangeText={text => onChange({ ...formData, local: text })}
            />
          </View>

          <View style={styles.quickEntryField}>
            <Text style={typography.label}>Quem ofereceu (opcional)</Text>
            <TextInput
              style={styles.quickEntryInput}
              placeholder="Ex: Mãe, avó, escola..."
              placeholderTextColor={colors.placeholder}
              value={formData.quemOfereceu || ''}
              onChangeText={text => onChange({ ...formData, quemOfereceu: text })}
            />
          </View>

          <View style={styles.quickEntryField}>
            <Text style={typography.label}>Apetite</Text>
            <View style={styles.itemAceitacaoRow}>
              {OPCOES_APETITE.map(opcao => (
                <TouchableOpacity
                  key={opcao}
                  style={[styles.chipPequeno, formData.apetite === opcao && styles.chipAtivo]}
                  onPress={() => onChange({ ...formData, apetite: opcao })}>
                  <Text
                    style={[styles.chipTextPequeno, formData.apetite === opcao && styles.chipTextAtivo]}>
                    {ROTULOS_APETITE[opcao]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.quickEntryField}>
            <Text style={typography.label}>Comportamento</Text>
            <View style={styles.itemAceitacaoRow}>
              {OPCOES_COMPORTAMENTO.map(opcao => {
                const ativo = (formData.comportamento ?? []).includes(opcao);
                return (
                  <TouchableOpacity
                    key={opcao}
                    style={[styles.chipPequeno, ativo && styles.chipAtivo]}
                    onPress={() => {
                      const atual: ComportamentoAlimentar[] = formData.comportamento ?? [];
                      const novo = ativo ? atual.filter(c => c !== opcao) : [...atual, opcao];
                      onChange({ ...formData, comportamento: novo });
                    }}>
                    <Text style={[styles.chipTextPequeno, ativo && styles.chipTextAtivo]}>
                      {ROTULOS_COMPORTAMENTO[opcao]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.quickEntryField}>
            <Text style={typography.label}>Observação (opcional)</Text>
            <TextInput
              style={styles.quickEntryInput}
              placeholder="Ex: comeu bem sentado à mesa"
              placeholderTextColor={colors.placeholder}
              value={formData.observacao || ''}
              onChangeText={text => onChange({ ...formData, observacao: text })}
              multiline
            />
          </View>
        </>
      )}

      <DropdownModal
        visible={showTipoModal}
        options={OPCOES_TIPO_REFEICAO.map(rotuloTipoRefeicao)}
        onSelect={value => {
          const chave = OPCOES_TIPO_REFEICAO.find(t => rotuloTipoRefeicao(t) === value);
          onChange({ ...formData, tipoRefeicao: chave });
          setShowTipoModal(false);
        }}
        onClose={() => setShowTipoModal(false)}
        title="Tipo de Refeição"
      />

      <AlimentoPickerSheet
        visible={showPicker}
        criancaId={criancaAtiva?.id}
        selecionadosIds={itens.map(item => item.alimentoId)}
        onConfirmarSelecao={alimentosSelecionados => {
          adicionarAlimentos(alimentosSelecionados);
          setShowPicker(false);
        }}
        onFechar={() => setShowPicker(false)}
      />
    </View>
  );
}

const OPCOES_TIPO_LEITE = [
  { chave: 'materno_ordenhado', label: 'Leite materno ordenhado' },
  { chave: 'formula', label: 'Fórmula' },
  { chave: 'outro', label: 'Outro' },
] as const;

function MamadeiraForm({ formData, onChange }: any) {
  const [showTipoModal, setShowTipoModal] = useState(false);
  const tipoLeiteLabel = OPCOES_TIPO_LEITE.find(o => o.chave === formData.tipoLeite)?.label;

  return (
    <View style={styles.formContainer}>
      <View style={styles.quickEntryField}>
        <Text style={typography.label}>Tipo de leite</Text>
        <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowTipoModal(true)}>
          <Text style={typography.body}>{tipoLeiteLabel || 'Selecionar'}</Text>
          <ChevronDown size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={styles.quickEntryField}>
        <Text style={typography.label}>Volume</Text>
        <View style={styles.dualInputRow}>
          <View style={styles.dualInputGroup}>
            <TextInput
              style={styles.unitInput}
              placeholder="Oferecido"
              placeholderTextColor={colors.placeholder}
              keyboardType="decimal-pad"
              value={formData.volumeOferecidoMl || ''}
              onChangeText={text => onChange({ ...formData, volumeOferecidoMl: apenasNumero(text) })}
            />
            <Text style={styles.unitLabel}>ml</Text>
          </View>
          <View style={styles.dualInputGroup}>
            <TextInput
              style={styles.unitInput}
              placeholder="Consumido"
              placeholderTextColor={colors.placeholder}
              keyboardType="decimal-pad"
              value={formData.volumeConsumidoMl || ''}
              onChangeText={text => onChange({ ...formData, volumeConsumidoMl: apenasNumero(text) })}
            />
            <Text style={styles.unitLabel}>ml</Text>
          </View>
        </View>
      </View>

      <TimeField
        label="Horário"
        value={formData.horario}
        onChange={iso => onChange({ ...formData, horario: iso })}
      />

      <View style={styles.quickEntryField}>
        <Text style={typography.label}>Aceitou tudo?</Text>
        <View style={styles.itemConsumoRow}>
          {[
            { valor: true, label: 'Sim' },
            { valor: false, label: 'Não' },
          ].map(opcao => (
            <TouchableOpacity
              key={String(opcao.valor)}
              style={[styles.chip, formData.aceitouTudo === opcao.valor && styles.chipAtivo]}
              onPress={() => onChange({ ...formData, aceitouTudo: opcao.valor })}>
              <Text
                style={[
                  styles.chipText,
                  formData.aceitouTudo === opcao.valor && styles.chipTextAtivo,
                ]}>
                {opcao.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.quickEntryField}>
        <Text style={typography.label}>Observação (opcional)</Text>
        <TextInput
          style={styles.quickEntryInput}
          placeholder="Ex: mamou tranquila, dormiu logo depois"
          placeholderTextColor={colors.placeholder}
          value={formData.observacao || ''}
          onChangeText={text => onChange({ ...formData, observacao: text })}
        />
      </View>

      <DropdownModal
        visible={showTipoModal}
        options={OPCOES_TIPO_LEITE.map(o => o.label)}
        onSelect={value => {
          const chave = OPCOES_TIPO_LEITE.find(o => o.label === value)?.chave;
          onChange({ ...formData, tipoLeite: chave });
          setShowTipoModal(false);
        }}
        onClose={() => setShowTipoModal(false)}
        title="Tipo de leite"
      />
    </View>
  );
}

const PERIODOS_AMAMENTACAO = ['Manhã', 'Tarde', 'Noite'];
const INTENSIDADES_AMAMENTACAO = ['Muito', 'Médio', 'Pouco'];

function AmamentacaoForm({ formData, onChange }: any) {
  const [showPeriodoModal, setShowPeriodoModal] = useState(false);
  const [showIntensidadeModal, setShowIntensidadeModal] = useState(false);

  return (
    <View style={styles.formContainer}>
      <View style={styles.periodoHint}>
        <Text style={styles.periodoHintText}>
          A amamentação é em livre demanda — registre quantas vezes o bebê mamar dentro do
          período, sem precisar informar o horário exato.
        </Text>
      </View>

      <View style={styles.quickEntryField}>
        <Text style={typography.label}>Período do Dia</Text>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setShowPeriodoModal(true)}>
          <Text style={typography.body}>
            {formData.periodo || 'Selecionar período'}
          </Text>
          <ChevronDown size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={styles.quickEntryField}>
        <Text style={typography.label}>Intensidade</Text>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setShowIntensidadeModal(true)}>
          <Text style={typography.body}>
            {formData.intensidade || 'Selecionar intensidade'}
          </Text>
          <ChevronDown size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={styles.quickEntryField}>
        <Text style={typography.label}>Detalhes (opcional)</Text>
        <TextInput
          style={styles.quickEntryInput}
          placeholder="Ex: pega tranquila, bebê relaxado"
          placeholderTextColor={colors.placeholder}
          value={formData.detalhes || ''}
          onChangeText={(text) => onChange({ ...formData, detalhes: text })}
        />
      </View>

      <DropdownModal
        visible={showPeriodoModal}
        options={PERIODOS_AMAMENTACAO}
        onSelect={(value) => {
          onChange({ ...formData, periodo: value });
          setShowPeriodoModal(false);
        }}
        onClose={() => setShowPeriodoModal(false)}
        title="Período do Dia"
      />

      <DropdownModal
        visible={showIntensidadeModal}
        options={INTENSIDADES_AMAMENTACAO}
        onSelect={(value) => {
          onChange({ ...formData, intensidade: value });
          setShowIntensidadeModal(false);
        }}
        onClose={() => setShowIntensidadeModal(false)}
        title="Intensidade da mamada"
      />
    </View>
  );
}

function FraldaForm({ formData, onChange }: any) {
  const [showTipoModal, setShowTipoModal] = useState(false);
  const tipos = ['Xixi', 'Cocô'];

  return (
    <View style={styles.formContainer}>
      <View style={styles.quickEntryField}>
        <Text style={typography.label}>O que fez?</Text>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setShowTipoModal(true)}>
          <Text style={typography.body}>{formData.tipoFralda || 'Selecionar'}</Text>
          <ChevronDown size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <TimeField
        label="Horário da troca"
        value={formData.horario}
        onChange={iso => onChange({ ...formData, horario: iso })}
      />

      <View style={styles.quickEntryField}>
        <Text style={typography.label}>Detalhes (opcional)</Text>
        <TextInput
          style={styles.quickEntryInput}
          placeholder="Ex: troca às 14h, xixi"
          placeholderTextColor={colors.placeholder}
          value={formData.detalhes || ''}
          onChangeText={(text) => onChange({ ...formData, detalhes: text })}
        />
      </View>

      <DropdownModal
        visible={showTipoModal}
        options={tipos}
        onSelect={(value) => {
          onChange({ ...formData, tipoFralda: value });
          setShowTipoModal(false);
        }}
        onClose={() => setShowTipoModal(false)}
        title="O que fez?"
      />
    </View>
  );
}

function SaudeForm({ formData, onChange }: any) {
  const [mostrarSintomas, setMostrarSintomas] = useState(false);
  const sintomas: string[] = formData.sintomas ?? [];
  const status: StatusSaude = formData.status ?? 'inicio';
  const sinaisAlerta = sintomas
    .map(buscarSintoma)
    .filter(sintoma => sintoma?.alerta)
    .map(sintoma => sintoma!.label);

  function removerSintoma(id: string) {
    onChange({ ...formData, sintomas: sintomas.filter(s => s !== id) });
  }

  return (
    <View style={styles.formContainer}>
      <View style={styles.quickEntryField}>
        <Text style={typography.label}>Sintomas</Text>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setMostrarSintomas(true)}
          accessibilityRole="button">
          <Text style={[typography.body, !sintomas.length && styles.textoPlaceholder]}>
            {sintomas.length
              ? `${sintomas.length} sintoma${sintomas.length > 1 ? 's' : ''} selecionado${sintomas.length > 1 ? 's' : ''}`
              : 'Selecionar sintomas'}
          </Text>
          <ChevronDown size={20} color={colors.textMuted} />
        </TouchableOpacity>
        {!!sintomas.length && (
          <View style={styles.itemAceitacaoRow}>
            {sintomas.map(id => (
              <View key={id} style={styles.sintomaChip}>
                <Text style={styles.sintomaChipTexto}>
                  {id === SINTOMA_OUTRO ? 'Outros' : buscarSintoma(id)?.label}
                </Text>
                <TouchableOpacity
                  onPress={() => removerSintoma(id)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Remover sintoma">
                  <X size={12} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        {sintomas.includes(SINTOMA_OUTRO) && (
          <TextInput
            style={styles.quickEntryInput}
            placeholder="Descreva o sintoma"
            placeholderTextColor={colors.placeholder}
            value={formData.sintomaOutro || ''}
            onChangeText={text => onChange({ ...formData, sintomaOutro: text })}
            autoFocus
            accessibilityLabel="Outro sintoma"
          />
        )}
      </View>

      {!!sinaisAlerta.length && (
        <View style={styles.alertaBox}>
          <AlertTriangle size={18} color={colors.red} />
          <Text style={styles.alertaTexto}>
            Sinal de alerta: {sinaisAlerta.join(', ')}. Procure atendimento médico — em emergência,
            ligue 192 (SAMU).
          </Text>
        </View>
      )}

      <DateInputField
        label="Data de início"
        value={formData.dataInicio}
        onChange={iso => onChange({ ...formData, dataInicio: iso })}
      />
      <TimeField
        label="Horário de início"
        value={formData.dataInicio}
        onChange={iso => onChange({ ...formData, dataInicio: iso })}
      />

      <View style={styles.quickEntryField}>
        <Text style={typography.label}>Medicação (opcional)</Text>
        <TextInput
          style={styles.quickEntryInput}
          placeholder="Ex: Dipirona 10 gotas às 14h"
          placeholderTextColor={colors.placeholder}
          value={formData.medicacao || ''}
          onChangeText={text => onChange({ ...formData, medicacao: text })}
          multiline
        />
      </View>

      <View style={styles.quickEntryField}>
        <Text style={typography.label}>Fotos (opcional)</Text>
        <FotosPicker
          fotos={formData.fotos ?? []}
          onChange={fotos => onChange({ ...formData, fotos })}
        />
      </View>

      <View style={styles.quickEntryField}>
        <Text style={typography.label}>Status</Text>
        <View style={styles.itemAceitacaoRow}>
          {STATUS_SAUDE.map(opcao => {
            const ativo = status === opcao.status;
            return (
              <TouchableOpacity
                key={opcao.status}
                style={[
                  styles.statusChip,
                  ativo && { backgroundColor: opcao.cor, borderColor: opcao.cor },
                ]}
                onPress={() => onChange({ ...formData, status: opcao.status })}
                accessibilityRole="radio"
                accessibilityState={{ selected: ativo }}>
                <Text style={[styles.chipText, ativo && styles.chipTextAtivo]}>{opcao.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            {statusEmAcompanhamento(status)
              ? '🔔 Você vai receber um lembrete a cada 8 horas para atualizar como a criança está, até marcar "Fim dos sintomas" ou "Finalizar registro". Cada mudança de status fica salva com data e hora.'
              : 'Com esse status, não há lembretes de acompanhamento.'}
          </Text>
        </View>
      </View>

      {mostrarSintomas && (
        <SintomasPickerSheet
          selecionados={sintomas}
          onConfirmar={ids => {
            onChange({ ...formData, sintomas: ids });
            setMostrarSintomas(false);
          }}
          onFechar={() => setMostrarSintomas(false)}
        />
      )}
    </View>
  );
}

function MedidasForm({ formData, onChange, criancaAtiva }: any) {
  return (
    <View style={styles.formContainer}>
      <View style={styles.quickEntryField}>
        <Text style={typography.label}>Altura (Estatura)</Text>
        <View style={styles.dualInputRow}>
          <View style={styles.dualInputGroup}>
            <TextInput
              style={styles.unitInput}
              placeholder="0"
              placeholderTextColor={colors.placeholder}
              keyboardType="decimal-pad"
              value={formData.alturaM || ''}
              onChangeText={text => onChange({ ...formData, alturaM: apenasNumero(text) })}
            />
            <Text style={styles.unitLabel}>m</Text>
          </View>
          <View style={styles.dualInputGroup}>
            <TextInput
              style={styles.unitInput}
              placeholder="58"
              placeholderTextColor={colors.placeholder}
              keyboardType="decimal-pad"
              value={formData.alturaCm || ''}
              onChangeText={text => onChange({ ...formData, alturaCm: apenasNumero(text) })}
            />
            <Text style={styles.unitLabel}>cm</Text>
          </View>
        </View>
      </View>

      <View style={styles.quickEntryField}>
        <Text style={typography.label}>Peso</Text>
        <View style={styles.dualInputRow}>
          <View style={styles.dualInputGroup}>
            <TextInput
              style={styles.unitInput}
              placeholder="0"
              placeholderTextColor={colors.placeholder}
              keyboardType="decimal-pad"
              value={formData.pesoKg || ''}
              onChangeText={text => onChange({ ...formData, pesoKg: apenasNumero(text) })}
            />
            <Text style={styles.unitLabel}>kg</Text>
          </View>
          <View style={styles.dualInputGroup}>
            <TextInput
              style={styles.unitInput}
              placeholder="0"
              placeholderTextColor={colors.placeholder}
              keyboardType="decimal-pad"
              value={formData.pesoG || ''}
              onChangeText={text => onChange({ ...formData, pesoG: apenasNumero(text) })}
            />
            <Text style={styles.unitLabel}>g</Text>
          </View>
        </View>
      </View>

      <View style={styles.quickEntryField}>
        <Text style={typography.label}>Perímetro Cefálico (PC)</Text>
        <View style={styles.unitInputWrapper}>
          <TextInput
            style={styles.unitInput}
            placeholder="Ex: 40"
            placeholderTextColor={colors.placeholder}
            keyboardType="decimal-pad"
            value={formData.pc || ''}
            onChangeText={text => onChange({ ...formData, pc: apenasNumero(text) })}
          />
          <Text style={styles.unitLabel}>cm</Text>
        </View>
      </View>

      <DateInputField
        label="Data da medição"
        value={formData.data}
        onChange={iso => onChange({ ...formData, data: iso })}
      />

      {!!formData.data && criancaAtiva && (
        <View style={styles.quickEntryField}>
          <Text style={typography.label}>Idade na data</Text>
          <Text style={typography.body}>
            {formatarIdade(criancaAtiva.dataNascimento, formData.data)}
          </Text>
        </View>
      )}

      <View style={styles.quickEntryField}>
        <Text style={typography.label}>Observação (opcional)</Text>
        <TextInput
          style={styles.quickEntryInput}
          placeholder="Ex: começou a sentar sozinho"
          placeholderTextColor={colors.placeholder}
          value={formData.observacao || ''}
          onChangeText={text => onChange({ ...formData, observacao: text })}
          multiline
        />
      </View>
    </View>
  );
}

const OPCOES_RECORRENCIA = ['Dose única (apenas registro)', 'Recorrente (vira lembrete)'];

function RemedioForm({ formData, onChange }: any) {
  const plano = useSubscriptionStore(s => s.plano);
  const [horarios, setHorarios] = useState<string[]>(formData.horarios || ['']);
  const [showFormaModal, setShowFormaModal] = useState(false);
  const [showRecorrenciaModal, setShowRecorrenciaModal] = useState(false);
  const formas = ['Gotas', 'Seringa', 'Copo dosador'];
  const recorrente = formData.recorrencia === 'recorrente';

  function selecionarRecorrencia(value: string) {
    const querRecorrente = value === OPCOES_RECORRENCIA[1];
    setShowRecorrenciaModal(false);
    if (querRecorrente && plano !== 'premium') {
      Alert.alert(
        'Recurso Premium',
        'Alarmes de lembretes fazem parte do plano Premium. Assine para ativar lembretes recorrentes.',
        [
          { text: 'Agora não', style: 'cancel' },
          { text: 'Ver Premium', onPress: () => router.push('/(app)/storyroot-main/premium') },
        ],
      );
      return;
    }
    onChange({ ...formData, recorrencia: querRecorrente ? 'recorrente' : 'unica' });
  }

  const adicionarHorario = () => {
    const novos = [...horarios, ''];
    setHorarios(novos);
    onChange({ ...formData, horarios: novos });
  };

  const atualizarHorario = (index: number, valor: string) => {
    const novosHorarios = [...horarios];
    novosHorarios[index] = valor;
    setHorarios(novosHorarios);
    onChange({ ...formData, horarios: novosHorarios });
  };

  const removerHorario = (index: number) => {
    const novosHorarios = horarios.filter((_, i) => i !== index);
    setHorarios(novosHorarios);
    onChange({ ...formData, horarios: novosHorarios });
  };

  return (
    <View style={styles.formContainer}>
      <View style={styles.quickEntryField}>
        <Text style={typography.label}>Nome do Remédio</Text>
        <TextInput
          style={styles.quickEntryInput}
          placeholder="Ex: Paracetamol"
          placeholderTextColor={colors.placeholder}
          value={formData.nome || ''}
          onChangeText={(text) => onChange({ ...formData, nome: text })}
        />
      </View>

      <View style={styles.quickEntryField}>
        <Text style={typography.label}>Forma de administração</Text>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setShowFormaModal(true)}>
          <Text style={typography.body}>{formData.formaAdministracao || 'Selecionar'}</Text>
          <ChevronDown size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={styles.quickEntryField}>
        <Text style={typography.label}>Dosagem</Text>
        <TextInput
          style={styles.quickEntryInput}
          placeholder="Ex: 5ml ou 1 comprimido"
          placeholderTextColor={colors.placeholder}
          value={formData.dosagem || ''}
          onChangeText={(text) => onChange({ ...formData, dosagem: text })}
        />
      </View>

      {(formData.formaAdministracao === 'Seringa' ||
        formData.formaAdministracao === 'Copo dosador') && (
        <DosageIllustration
          forma={formData.formaAdministracao}
          dosagem={formData.dosagem || ''}
        />
      )}

      <View style={styles.quickEntryField}>
        <Text style={typography.label}>Horários do Dia</Text>
        {horarios.map((horario, index) => (
          <View key={index} style={styles.horarioRow}>
            <View style={styles.horarioInputWrapper}>
              <HorarioInput value={horario} onChange={(valor) => atualizarHorario(index, valor)} />
            </View>
            <TouchableOpacity
              style={styles.removeHorarioButton}
              onPress={() => removerHorario(index)}>
              <X size={16} color={colors.red} />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={styles.addButton} onPress={adicionarHorario}>
          <Text style={styles.addButtonText}>+ Adicionar horário</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.quickEntryField}>
        <Text style={typography.label}>Esse remédio será dado novamente?</Text>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setShowRecorrenciaModal(true)}>
          <Text style={typography.body}>
            {formData.recorrencia === 'recorrente'
              ? 'Recorrente (vira lembrete)'
              : formData.recorrencia === 'unica'
                ? 'Dose única (apenas registro)'
                : 'Selecionar'}
          </Text>
          <ChevronDown size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {recorrente && (
        <View style={styles.quickEntryField}>
          <Text style={typography.label}>Duração (dias)</Text>
          <TextInput
            style={styles.quickEntryInput}
            placeholder="Ex: 7"
            placeholderTextColor={colors.placeholder}
            keyboardType="numeric"
            value={formData.duracao || ''}
            onChangeText={(text) => onChange({ ...formData, duracao: text })}
          />
        </View>
      )}

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          {recorrente
            ? 'ℹ️ Você vai receber um alerta em cada horário definido, todos os dias, até o fim da duração informada.'
            : 'ℹ️ Esse remédio será apenas registrado, sem lembretes — ideal para doses pontuais como febre.'}
        </Text>
      </View>

      <DropdownModal
        visible={showFormaModal}
        options={formas}
        onSelect={(value) => {
          onChange({ ...formData, formaAdministracao: value });
          setShowFormaModal(false);
        }}
        onClose={() => setShowFormaModal(false)}
        title="Forma de administração"
      />

      <DropdownModal
        visible={showRecorrenciaModal}
        options={OPCOES_RECORRENCIA}
        onSelect={selecionarRecorrencia}
        onClose={() => setShowRecorrenciaModal(false)}
        title="Esse remédio será dado novamente?"
      />
    </View>
  );
}

function HorarioInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [showPicker, setShowPicker] = useState(false);
  const data = value ? new Date(value) : new Date();

  return (
    <View>
      <TouchableOpacity
        style={styles.datePickerButton}
        onPress={() => setShowPicker(true)}>
        <Text style={typography.body}>
          {value ? formatarHora(value) : 'Selecionar horário'}
        </Text>
        <ChevronDown size={20} color={colors.textMuted} />
      </TouchableOpacity>
      <TimePickerSheet
        visible={showPicker}
        value={data}
        onCancel={() => setShowPicker(false)}
        onConfirm={date => {
          setShowPicker(false);
          onChange(date.toISOString());
        }}
      />
    </View>
  );
}

function DropdownModal({
  visible,
  options,
  onSelect,
  onClose,
  title,
}: {
  visible: boolean;
  options: string[];
  onSelect: (value: string) => void;
  onClose: () => void;
  title: string;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent>
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}>
        <View style={styles.modalContent}>
          <Text style={[typography.h3, styles.modalTitle]}>{title}</Text>
          {options.map((option) => (
            <TouchableOpacity
              key={option}
              style={styles.modalOption}
              onPress={() => onSelect(option)}>
              <Text style={typography.body}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xxl,
  },
  closeCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.textMuted,
    fontSize: 15,
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  memoryCard: {
    flex: 1,
    gap: spacing.md,
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    shadowColor: colors.text,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  memoryCardDesc: {
    ...typography.caption,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleSmall: {
    width: 32,
    height: 32,
  },
  routineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  quickEntryTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  quickEntryField: {
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  quickEntryInput: {
    ...typography.body,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  saveButton: {
    marginTop: spacing.lg,
    marginBottom: spacing.xxxl,
  },
  quickEntryFieldTight: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  itemCard: {
    backgroundColor: colors.surfaceTint,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  itemCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemNomeGrupo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  itemNovoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.badgeBg,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  itemNovoBadgeText: {
    ...typography.caption,
    color: colors.primary,
    fontSize: 10,
  },
  itemConsumoRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  itemDetalhes: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  itemDetalheLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  itemAceitacaoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipText: {
    ...typography.label,
    fontSize: 13,
    color: colors.textMuted,
  },
  chipPequeno: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipTextPequeno: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
  chipAtivo: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipTextAtivo: {
    color: '#fff',
  },
  repetirButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceTint,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  repetirButtonText: {
    ...typography.label,
    color: colors.primary,
    fontSize: 13,
  },
  detalhesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  detalhesToggleText: {
    ...typography.label,
    color: colors.primary,
    fontSize: 13,
  },
  sheetScroll: {
    flex: 1,
  },
  sheetScrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxxl,
  },
  unitInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  unitInput: {
    ...typography.body,
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  unitLabel: {
    ...typography.label,
    color: colors.textMuted,
    width: 28,
  },
  dualInputRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dualInputGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  formContainer: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  timeInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingLeft: spacing.lg,
  },
  timeInputField: {
    ...typography.body,
    flex: 1,
    paddingVertical: spacing.lg,
    color: colors.text,
  },
  timePickerIconButton: {
    width: 44,
    height: 44,
    marginRight: spacing.xs,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  periodoHint: {
    backgroundColor: colors.surfaceTint,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: -spacing.md,
    marginBottom: spacing.sm,
  },
  periodoHintText: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(20,23,15,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    marginBottom: spacing.lg,
  },
  modalOption: {
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  horarioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  horarioInputWrapper: {
    flex: 1,
  },
  removeHorarioButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.lg,
    borderStyle: 'dashed',
  },
  addButtonText: {
    ...typography.label,
    color: colors.primary,
  },
  infoBox: {
    backgroundColor: colors.surfaceTint,
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginTop: spacing.md,
  },
  infoText: {
    ...typography.caption,
    color: colors.textMuted,
    lineHeight: 18,
  },
  textoPlaceholder: {
    color: colors.placeholder,
  },
  sintomaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.badgeBg,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  sintomaChipTexto: {
    ...typography.caption,
    color: colors.primary,
  },
  statusChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  alertaBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: `${colors.red}14`,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: -spacing.lg,
    marginBottom: spacing.lg,
  },
  alertaTexto: {
    ...typography.bodySmall,
    flex: 1,
    color: colors.red,
  },
});
