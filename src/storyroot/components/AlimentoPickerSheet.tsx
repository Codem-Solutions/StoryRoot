import { Search, Star } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRecordsStore } from '../store/recordsStore';
import { useAlimentosStore } from '../store/alimentosStore';
import { colors, radius, spacing, typography } from '../theme';
import { registrosComidaDaCrianca, rotuloCategoria } from '../utils/alimentacao';
import type { Alimento, CategoriaAlimento, ComidaDados } from '../types';
import { BottomSheet } from './BottomSheet';

interface AlimentoPickerSheetProps {
  visible: boolean;
  criancaId?: string;
  selecionadosIds?: string[];
  onConfirmarSelecao: (alimentos: Alimento[]) => void;
  onFechar: () => void;
}

function AlimentoLinha({
  alimento,
  favorito,
  selecionado,
  onPress,
  onToggleFavorito,
}: {
  alimento: Alimento;
  favorito: boolean;
  selecionado: boolean;
  onPress: () => void;
  onToggleFavorito: () => void;
}) {
  return (
    <TouchableOpacity style={styles.linha} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.linhaEsquerda}>
        <View style={[styles.checkbox, selecionado && styles.checkboxAtivo]}>
          {selecionado && <Text style={styles.checkboxIcon}>✓</Text>}
        </View>
        <Text style={styles.linhaTexto}>{alimento.nomeExibicao}</Text>
      </View>
      <TouchableOpacity hitSlop={8} onPress={onToggleFavorito}>
        <Star
          size={18}
          color={favorito ? colors.amber : colors.border}
          fill={favorito ? colors.amber : 'transparent'}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export function AlimentoPickerSheet({
  visible,
  criancaId,
  selecionadosIds = [],
  onConfirmarSelecao,
  onFechar,
}: AlimentoPickerSheetProps) {
  const [busca, setBusca] = useState('');
  const [selecionados, setSelecionados] = useState<string[]>(selecionadosIds);
  const [visibleAnterior, setVisibleAnterior] = useState(visible);
  const alimentos = useAlimentosStore(s => s.alimentos);
  const favoritos = useAlimentosStore(s => s.favoritos);
  const registrarUso = useAlimentosStore(s => s.registrarUso);
  const toggleFavorito = useAlimentosStore(s => s.toggleFavorito);
  const registros = useRecordsStore(s => s.registros);

  const ativos = useMemo(() => alimentos.filter(a => a.ativo), [alimentos]);

  const recentesIds = useMemo(() => {
    if (!criancaId) return [];
    const comida = registrosComidaDaCrianca(registros, criancaId);
    const vistos = new Set<string>();
    const ids: string[] = [];
    for (const r of comida) {
      const dados = r.dados as ComidaDados | undefined;
      for (const item of dados?.itens ?? []) {
        if (!vistos.has(item.alimentoId)) {
          vistos.add(item.alimentoId);
          ids.push(item.alimentoId);
        }
      }
      if (ids.length >= 8) break;
    }
    return ids;
  }, [registros, criancaId]);

  if (visible !== visibleAnterior) {
    setVisibleAnterior(visible);
    if (visible) {
      setSelecionados(selecionadosIds);
      setBusca('');
    }
  }

  if (!visible) return null;

  const termo = busca.trim().toLowerCase();
  const filtrados = termo ? ativos.filter(a => a.nomeExibicao.toLowerCase().includes(termo)) : ativos;

  function alternarSelecao(alimentoId: string) {
    setSelecionados(atual =>
      atual.includes(alimentoId) ? atual.filter(id => id !== alimentoId) : [...atual, alimentoId],
    );
  }

  function confirmarSelecao() {
    const escolhidos = ativos.filter(a => selecionados.includes(a.id));
    if (criancaId) {
      escolhidos.forEach(alimento => registrarUso(criancaId, alimento.id));
    }
    onConfirmarSelecao(escolhidos);
  }

  const porId = new Map(ativos.map(a => [a.id, a]));
  const recentes = recentesIds.map(id => porId.get(id)).filter((a): a is Alimento => !!a);
  const favoritosAlimentos = ativos.filter(a => favoritos.includes(a.id));

  const porCategoria = new Map<CategoriaAlimento, Alimento[]>();
  for (const a of filtrados) {
    const lista = porCategoria.get(a.categoria) ?? [];
    lista.push(a);
    porCategoria.set(a.categoria, lista);
  }

  return (
    <BottomSheet onClose={onFechar}>
      <Text style={[typography.h3, styles.titulo]}>Adicionar alimento</Text>

      <View style={styles.buscaWrapper}>
        <Search size={18} color={colors.textMuted} />
        <TextInput
          style={styles.buscaInput}
          placeholder="Buscar alimento..."
          placeholderTextColor={colors.placeholder}
          value={busca}
          onChangeText={setBusca}
          autoCapitalize="none"
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.lista}>
        {!termo && !!recentes.length && (
          <View style={styles.secao}>
            <Text style={styles.secaoTitulo}>Recentes</Text>
            {recentes.map(a => (
              <AlimentoLinha
                key={a.id}
                alimento={a}
                favorito={favoritos.includes(a.id)}
                selecionado={selecionados.includes(a.id)}
                onPress={() => alternarSelecao(a.id)}
                onToggleFavorito={() => toggleFavorito(a.id)}
              />
            ))}
          </View>
        )}

        {!termo && !!favoritosAlimentos.length && (
          <View style={styles.secao}>
            <Text style={styles.secaoTitulo}>Favoritos</Text>
            {favoritosAlimentos.map(a => (
              <AlimentoLinha
                key={a.id}
                alimento={a}
                favorito
                selecionado={selecionados.includes(a.id)}
                onPress={() => alternarSelecao(a.id)}
                onToggleFavorito={() => toggleFavorito(a.id)}
              />
            ))}
          </View>
        )}

        {filtrados.length === 0 ? (
          <Text style={styles.vazioTexto}>Nenhum alimento encontrado com esse nome.</Text>
        ) : (
          Array.from(porCategoria.entries()).map(([categoria, itens]) => (
            <View key={categoria} style={styles.secao}>
              <Text style={styles.secaoTitulo}>{rotuloCategoria(categoria)}</Text>
              {itens.map(a => (
                <AlimentoLinha
                  key={a.id}
                  alimento={a}
                  favorito={favoritos.includes(a.id)}
                  selecionado={selecionados.includes(a.id)}
                  onPress={() => alternarSelecao(a.id)}
                  onToggleFavorito={() => toggleFavorito(a.id)}
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerHint}>
          {selecionados.length
            ? `${selecionados.length} alimento(s) selecionado(s)`
            : 'Selecione um ou mais alimentos'}
        </Text>
        <TouchableOpacity
          style={[styles.confirmButton, !selecionados.length && styles.confirmButtonDisabled]}
          disabled={!selecionados.length}
          onPress={confirmarSelecao}>
          <Text style={styles.confirmButtonText}>Confirmar seleção</Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  titulo: {
    marginBottom: spacing.lg,
  },
  buscaWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceTint,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  buscaInput: {
    ...typography.body,
    flex: 1,
    paddingVertical: spacing.md,
  },
  lista: {
    flex: 1,
  },
  secao: {
    marginBottom: spacing.lg,
  },
  secaoTitulo: {
    ...typography.label,
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  linhaEsquerda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  checkboxAtivo: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxIcon: {
    ...typography.caption,
    color: '#fff',
    lineHeight: 12,
    fontSize: 11,
  },
  linhaTexto: {
    ...typography.body,
  },
  vazioTexto: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.background,
  },
  footerHint: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  confirmButton: {
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: colors.border,
  },
  confirmButtonText: {
    ...typography.label,
    color: '#fff',
  },
});
