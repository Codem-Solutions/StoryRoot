import { router } from 'expo-router';
import {
  BellRing,
  ChevronRight,
  ClipboardList,
  Pencil,
  Ruler,
  Syringe,
  ThermometerSun,
  Trash2,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheet } from '../../components/BottomSheet';
import { EmptyState } from '../../components/EmptyState';
import { GrowthChart } from '../../components/GrowthChart';
import { RECORD_TYPES } from '../../constants/recordTypes';
import { tabelaReferencia } from '../../constants/growthReference';
import type { Crianca, Registro } from '../../types';
import { useCriancaAtiva } from '../../store/childStore';
import { useRecordsStore } from '../../store/recordsStore';
import { colors, radius, spacing, typography } from '../../theme';
import { formatarIdade, idadeEmMeses } from '../../utils/age';
import {
  alturaTotalCm,
  formatarDataBR,
  formatarHora,
  formatarValorExibicao,
  pesoTotalKg,
} from '../../utils/format';
import { interpolarPercentis } from '../../utils/growthReference';
import { dataEfetivaMedidas, idadeMesesMedidas } from '../../utils/medidas';
import { cancelarLembretes } from '../../utils/notifications';
import { encodeJsonParam } from '../../utils/routerParams';
import {
  dadosSaude,
  metaStatusSaude,
  resumoSintomas,
  statusEmAcompanhamento,
} from '../../utils/saude';
import { showSaveSuccessToast } from '../../utils/toast';
import { CadernetaVacinas } from '../vacinas/CadernetaVacinas';

type Aba = 'sintomas' | 'remedios' | 'vacinas' | 'medidas';

const ABAS: { chave: Aba; label: string }[] = [
  { chave: 'sintomas', label: 'Sintomas' },
  { chave: 'remedios', label: 'Remédios' },
  { chave: 'vacinas', label: 'Vacinas' },
  { chave: 'medidas', label: 'Medidas' },
];

/** Formata número no padrão BR (vírgula decimal), sem casas desnecessárias. */
function formatarNumeroPtBR(valor: number, casas = 1): string {
  const fixo = Number(valor.toFixed(casas));
  return fixo.toString().replace('.', ',');
}

export function SaudeScreen() {
  const insets = useSafeAreaInsets();
  const criancaAtiva = useCriancaAtiva();
  const registros = useRecordsStore(state => state.registros);
  const removerRegistro = useRecordsStore(state => state.removerRegistro);

  const [aba, setAba] = useState<Aba>('sintomas');

  // Registros antigos de "vacina" (texto livre) continuam visíveis junto dos remédios.
  const remedios = useMemo(
    () =>
      registros
        .filter(
          r => r.criancaId === criancaAtiva?.id && (r.tipo === 'remedio' || r.tipo === 'vacina'),
        )
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()),
    [registros, criancaAtiva],
  );

  const registrosSaude = useMemo(
    () =>
      registros
        .filter(r => r.criancaId === criancaAtiva?.id && r.tipo === 'saude')
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()),
    [registros, criancaAtiva],
  );

  const todasMedidas = useMemo(
    () => registros.filter(r => r.criancaId === criancaAtiva?.id && r.tipo === 'medidas'),
    [registros, criancaAtiva],
  );

  function editarRemedio(registro: (typeof remedios)[number]) {
    router.push({
      pathname: '/(app)/storyroot-main/registrar',
      params: {
        editarRegistroId: registro.id,
        tipoInicial: registro.tipo,
        formDataInicial: encodeJsonParam(registro.dados ?? {}),
        notificacaoIdsIniciais: encodeJsonParam(registro.notificacaoIds ?? []),
      },
    });
  }

  function excluirRemedio(registro: (typeof remedios)[number]) {
    Alert.alert(
      'Excluir registro',
      'Isso também cancela os lembretes desse remédio. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            await cancelarLembretes(registro.notificacaoIds);
            removerRegistro(registro.id);
            showSaveSuccessToast('Registro excluído');
          },
        },
      ],
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={typography.h2}>Saúde</Text>
        <View style={styles.abaSelector}>
          {ABAS.map(opcao => (
            <TouchableOpacity
              key={opcao.chave}
              style={[styles.abaOption, aba === opcao.chave && styles.abaOptionAtiva]}
              onPress={() => setAba(opcao.chave)}
              accessibilityRole="tab"
              accessibilityState={{ selected: aba === opcao.chave }}>
              <Text
                style={[styles.abaText, aba === opcao.chave && styles.abaTextAtiva]}
                numberOfLines={1}>
                {opcao.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {aba === 'sintomas' ? (
        <FlatList
          data={registrosSaude}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => <CartaoRegistroSaude registro={item} />}
          ListEmptyComponent={
            <EmptyState
              icon={ThermometerSun}
              title="Nenhum registro de sintomas"
              description="Toque em + e escolha Registro Saúde para acompanhar febre, tosse e outros sintomas."
            />
          }
        />
      ) : aba === 'vacinas' ? (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {criancaAtiva ? (
            <CadernetaVacinas crianca={criancaAtiva} />
          ) : (
            <EmptyState
              icon={Syringe}
              title="Nenhuma criança selecionada"
              description="Selecione uma criança para ver a caderneta de vacinas."
            />
          )}
        </ScrollView>
      ) : aba === 'remedios' ? (
        <FlatList
          data={remedios}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const meta = RECORD_TYPES[item.tipo];
            const Icon = meta.icon;
            const recorrente = item.tipo === 'remedio' && item.dados?.recorrencia === 'recorrente';
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={[styles.iconWrapper, { backgroundColor: meta.color }]}>
                    <Icon size={18} color="#fff" />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={typography.h4} numberOfLines={2}>
                      {formatarValorExibicao(item.tipo, item.valor)}
                    </Text>
                    <Text style={typography.caption}>
                      {formatarDataBR(item.data)} · {formatarHora(item.data)}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.cardFooter,
                    item.tipo !== 'remedio' && styles.cardFooterEnd,
                  ]}>
                  {item.tipo === 'remedio' && (
                    <View style={[styles.badge, recorrente ? styles.badgeAtivo : styles.badgeUnica]}>
                      {recorrente && <BellRing size={12} color={colors.primary} />}
                      <Text
                        style={[
                          styles.badgeText,
                          { color: recorrente ? colors.primary : colors.textMuted },
                        ]}>
                        {recorrente ? 'Lembrete ativo' : 'Dose única'}
                      </Text>
                    </View>
                  )}

                  <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => editarRemedio(item)}>
                      <Pencil size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => excluirRemedio(item)}>
                      <Trash2 size={16} color={colors.red} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              icon={ClipboardList}
              title="Nenhum remédio registrado"
              description="Toque em + e escolha Remédio para registrar doses e lembretes."
            />
          }
        />
      ) : (
        <MedidasTab
          registros={todasMedidas}
          removerRegistro={removerRegistro}
          criancaAtiva={criancaAtiva}
        />
      )}
    </View>
  );
}

function CartaoRegistroSaude({ registro }: { registro: Registro }) {
  const dados = dadosSaude(registro);
  const meta = metaStatusSaude(dados.status);
  const ultimaAtualizacao = dados.statusHistorico[dados.statusHistorico.length - 1];

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() =>
        router.push({
          pathname: '/(app)/storyroot-main/registro-saude',
          params: { registroId: registro.id },
        })
      }
      accessibilityRole="button">
      <View style={styles.cardTop}>
        <View style={[styles.iconWrapper, { backgroundColor: colors.red }]}>
          <ThermometerSun size={18} color="#fff" />
        </View>
        <View style={styles.cardContent}>
          <Text style={typography.h4} numberOfLines={2}>
            {resumoSintomas(dados)}
          </Text>
          <Text style={typography.caption}>
            Início {formatarDataBR(dados.dataInicio)} · {formatarHora(dados.dataInicio)}
          </Text>
        </View>
        <ChevronRight size={18} color={colors.textMuted} />
      </View>
      <View style={styles.cardFooter}>
        <View style={[styles.badge, { backgroundColor: `${meta.cor}1F` }]}>
          {statusEmAcompanhamento(dados.status) && !!registro.notificacaoIds?.length && (
            <BellRing size={12} color={meta.cor} />
          )}
          <Text style={[styles.badgeText, { color: meta.cor }]}>{meta.label}</Text>
        </View>
        {!!ultimaAtualizacao && (
          <Text style={typography.caption}>
            Atualizado {formatarDataBR(ultimaAtualizacao.data)} · {formatarHora(ultimaAtualizacao.data)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

interface MedidasTabProps {
  registros: ReturnType<typeof useRecordsStore.getState>['registros'];
  removerRegistro: (id: string) => void;
  criancaAtiva: Crianca | undefined;
}

function MedidasTab({ registros, removerRegistro, criancaAtiva }: MedidasTabProps) {
  const [registroSelecionado, setRegistroSelecionado] = useState<
    ReturnType<typeof useRecordsStore.getState>['registros'][number] | null
  >(null);

  const registrosOrdenados = useMemo(
    () =>
      registros
        .slice()
        .sort(
          (a, b) =>
            new Date(dataEfetivaMedidas(a)).getTime() - new Date(dataEfetivaMedidas(b)).getTime(),
        ),
    [registros],
  );

  const pontosAltura = useMemo(
    () =>
      criancaAtiva
        ? registrosOrdenados
            .map(r => ({
              idadeMeses: idadeMesesMedidas(r, criancaAtiva.dataNascimento),
              valor: alturaTotalCm(r.dados),
              dataIso: dataEfetivaMedidas(r),
            }))
            .filter(p => p.valor > 0)
        : [],
    [registrosOrdenados, criancaAtiva],
  );
  const pontosPeso = useMemo(
    () =>
      criancaAtiva
        ? registrosOrdenados
            .map(r => ({
              idadeMeses: idadeMesesMedidas(r, criancaAtiva.dataNascimento),
              valor: pesoTotalKg(r.dados),
              dataIso: dataEfetivaMedidas(r),
            }))
            .filter(p => p.valor > 0)
        : [],
    [registrosOrdenados, criancaAtiva],
  );
  const pontosPc = useMemo(
    () =>
      criancaAtiva
        ? registrosOrdenados
            .filter(r => r.dados?.pc)
            .map(r => ({
              idadeMeses: idadeMesesMedidas(r, criancaAtiva.dataNascimento),
              valor: Number(r.dados!.pc),
              dataIso: dataEfetivaMedidas(r),
            }))
            .filter(p => !Number.isNaN(p.valor))
        : [],
    [registrosOrdenados, criancaAtiva],
  );

  const referencia = useMemo(() => {
    if (!criancaAtiva) return { altura: [], peso: [], pc: [] };
    const idadeMaxima = Math.max(24, idadeEmMeses(criancaAtiva.dataNascimento));
    const passo = idadeMaxima <= 24 ? 2 : 6;
    const idades = Array.from({ length: Math.floor(idadeMaxima / passo) + 1 }, (_, i) => i * passo);
    function curva(metrica: 'peso' | 'altura' | 'pc') {
      const tabela = tabelaReferencia(metrica, criancaAtiva!.sexo);
      return idades
        .map(idadeMeses => {
          const percentis = interpolarPercentis(tabela, idadeMeses);
          return percentis ? { idadeMeses, ...percentis } : null;
        })
        .filter((p): p is NonNullable<typeof p> => p !== null);
    }
    return { altura: curva('altura'), peso: curva('peso'), pc: curva('pc') };
  }, [criancaAtiva]);

  function editar(registro: (typeof registrosOrdenados)[number]) {
    router.push({
      pathname: '/(app)/storyroot-main/registrar',
      params: {
        editarRegistroId: registro.id,
        tipoInicial: 'medidas',
        formDataInicial: encodeJsonParam(registro.dados ?? {}),
      },
    });
  }

  function excluir(registro: (typeof registrosOrdenados)[number]) {
    Alert.alert('Excluir registro', 'Deseja excluir este registro de medidas?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          removerRegistro(registro.id);
          showSaveSuccessToast('Registro excluído');
        },
      },
    ]);
  }

  if (!registros.length) {
    return (
      <ScrollView contentContainerStyle={styles.listContent}>
        <EmptyState
          icon={Ruler}
          title="Nenhuma medida registrada"
          description="Toque em + e escolha Medidas para acompanhar o crescimento da criança."
        />
      </ScrollView>
    );
  }

  return (
    <>
    <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
      <GrowthChart
        titulo="Altura"
        unidade="cm"
        color={colors.primary}
        pontos={pontosAltura}
        referencia={referencia.altura}
      />
      <GrowthChart
        titulo="Peso"
        unidade="kg"
        color={colors.accent}
        pontos={pontosPeso}
        referencia={referencia.peso}
      />
      <GrowthChart
        titulo="Perímetro Cefálico"
        unidade="cm"
        color={colors.green}
        pontos={pontosPc}
        referencia={referencia.pc}
      />

      {!!registrosOrdenados.length && (
        <View style={styles.section}>
          <Text style={typography.h3}>Registros</Text>
          {registrosOrdenados.map(registro => (
            <TouchableOpacity
              key={registro.id}
              style={styles.card}
              activeOpacity={0.7}
              onPress={() => setRegistroSelecionado(registro)}>
              <View style={styles.cardTop}>
                <View style={[styles.iconWrapper, { backgroundColor: colors.green }]}>
                  <Ruler size={18} color="#fff" />
                </View>
                <View style={styles.cardContent}>
                  <Text style={typography.h4} numberOfLines={2}>
                    {formatarValorExibicao(registro.tipo, registro.valor) || 'Sem medidas'}
                  </Text>
                  <Text style={typography.caption}>
                    {formatarDataBR(dataEfetivaMedidas(registro))}
                    {criancaAtiva
                      ? ` · ${formatarIdade(criancaAtiva.dataNascimento, dataEfetivaMedidas(registro))}`
                      : ''}
                  </Text>
                </View>
                <View style={styles.actionsRow}>
                  <TouchableOpacity style={styles.actionButton} onPress={() => editar(registro)}>
                    <Pencil size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton} onPress={() => excluir(registro)}>
                    <Trash2 size={16} color={colors.red} />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

    </ScrollView>

    {!!registroSelecionado && (
      <BottomSheet onClose={() => setRegistroSelecionado(null)} fillHeight={false}>
        <Text style={[typography.h3, styles.popupTitulo]}>Registro de medidas</Text>
        <Text style={styles.popupData}>
          {formatarDataBR(dataEfetivaMedidas(registroSelecionado))}
          {criancaAtiva
            ? ` · ${formatarIdade(criancaAtiva.dataNascimento, dataEfetivaMedidas(registroSelecionado))}`
            : ''}
        </Text>

        <View style={styles.popupLinhas}>
          {alturaTotalCm(registroSelecionado.dados) > 0 && (
            <View style={styles.popupLinha}>
              <Text style={styles.popupLabel}>Altura</Text>
              <Text style={styles.popupValor}>
                {formatarNumeroPtBR(alturaTotalCm(registroSelecionado.dados))} cm
              </Text>
            </View>
          )}
          {pesoTotalKg(registroSelecionado.dados) > 0 && (
            <View style={styles.popupLinha}>
              <Text style={styles.popupLabel}>Peso</Text>
              <Text style={styles.popupValor}>
                {formatarNumeroPtBR(pesoTotalKg(registroSelecionado.dados))} kg
              </Text>
            </View>
          )}
          {!!registroSelecionado.dados?.pc && (
            <View style={styles.popupLinha}>
              <Text style={styles.popupLabel}>Perímetro Cefálico</Text>
              <Text style={styles.popupValor}>
                {formatarNumeroPtBR(Number(registroSelecionado.dados.pc))} cm
              </Text>
            </View>
          )}
        </View>

        {!!registroSelecionado.dados?.observacao && (
          <View style={styles.popupObservacao}>
            <Text style={styles.popupLabel}>Observação</Text>
            <Text style={typography.body}>{registroSelecionado.dados.observacao}</Text>
          </View>
        )}
      </BottomSheet>
    )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  abaSelector: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceTint,
    borderRadius: radius.pill,
    padding: 3,
  },
  abaOption: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  abaOptionAtiva: {
    backgroundColor: colors.surface,
    shadowColor: colors.text,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  abaText: {
    ...typography.label,
    color: colors.textMuted,
    fontSize: 13,
  },
  abaTextAtiva: {
    color: colors.primary,
  },
  listContent: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: 140,
  },
  section: {
    gap: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  obsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
    shadowColor: colors.text,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  obsMes: {
    ...typography.label,
    color: colors.primary,
    fontSize: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
    shadowColor: colors.text,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.violet,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    gap: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardFooterEnd: {
    justifyContent: 'flex-end',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
  },
  badgeAtivo: {
    backgroundColor: colors.badgeBg,
  },
  badgeUnica: {
    backgroundColor: colors.surfaceTint,
  },
  badgeText: {
    ...typography.label,
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupTitulo: {
    marginBottom: spacing.xs,
  },
  popupData: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  popupLinhas: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  popupLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  popupLabel: {
    ...typography.label,
    color: colors.textMuted,
    fontSize: 13,
  },
  popupValor: {
    ...typography.h4,
  },
  popupObservacao: {
    gap: spacing.xs,
  },
});
