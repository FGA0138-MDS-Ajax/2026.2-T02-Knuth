import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export const TIPO_ALERTA_CONFIG = {
  DESVIO: {
    rotulo: 'Desvio',
    cor: '#B45309',
    borda: '#F59E0B',
    fundo: '#FFFBEB',
    badgeFundo: '#FEF3C7',
  },
  SUSPENSAO: {
    rotulo: 'Suspensão',
    cor: '#B91C1C',
    borda: '#EF4444',
    fundo: '#FEF2F2',
    badgeFundo: '#FEE2E2',
  },
  PARALISACAO: {
    rotulo: 'Paralisação',
    cor: '#6D28D9',
    borda: '#8B5CF6',
    fundo: '#F5F3FF',
    badgeFundo: '#EDE9FE',
  },
  ALTERACAO_HORARIO: {
    rotulo: 'Alteração de Horário',
    cor: '#1D4ED8',
    borda: '#3B82F6',
    fundo: '#EFF6FF',
    badgeFundo: '#DBEAFE',
  },
};

const CONFIG_PADRAO = {
  rotulo: 'Alerta',
  cor: '#B45309',
  borda: '#F59E0B',
  fundo: '#FFFBEB',
  badgeFundo: '#FEF3C7',
};

export function obterConfigAlerta(tipo) {
  return TIPO_ALERTA_CONFIG[tipo] || CONFIG_PADRAO;
}

export function AlertaBadge({ alertas = [], afetadaPorAlerta = false, textoPadrao = 'Alerta ativo' }) {
  const lista = Array.isArray(alertas) ? alertas : [];
  if (!afetadaPorAlerta && lista.length === 0) {
    return null;
  }

  const principal = lista[0];
  const config = obterConfigAlerta(principal?.tipo);

  let texto = textoPadrao;
  if (lista.length === 1) {
    texto = `Alerta: ${config.rotulo}`;
  } else if (lista.length > 1) {
    texto = `${lista.length} alertas ativos`;
  }

  return (
    <View
      style={[styles.badge, { backgroundColor: config.badgeFundo, borderColor: config.borda }]}
      accessibilityRole="alert"
    >
      <Text style={[styles.badgeTexto, { color: config.cor }]}>⚠ {texto}</Text>
    </View>
  );
}

export default function AlertaBanner({
  alertas = [],
  afetadaPorAlerta = false,
  titulo,
  compacto = false,
  onPress,
}) {
  const lista = Array.isArray(alertas) ? alertas : [];
  if (!afetadaPorAlerta && lista.length === 0) {
    return null;
  }

  const principal = lista[0];
  const config = obterConfigAlerta(principal?.tipo);
  const cabecalhoTexto =
    titulo ||
    (lista.length > 1 ? `${lista.length} alertas vigentes` : 'Alerta vigente');

  const conteudo = (
    <View
      style={[
        styles.banner,
        compacto && styles.bannerCompacto,
        { backgroundColor: config.fundo, borderColor: config.borda },
      ]}
      accessibilityRole="alert"
    >
      <View style={styles.bannerHeader}>
        <Text style={[styles.bannerTitulo, { color: config.cor }]}>⚠ {cabecalhoTexto}</Text>
        {onPress ? (
          <Text style={[styles.verDetalhes, { color: config.cor }]}>Ver detalhes ›</Text>
        ) : null}
      </View>

      {lista.length > 0 ? (
        lista.map((alerta, idx) => {
          const itemConfig = obterConfigAlerta(alerta.tipo);
          return (
            <View key={alerta.id !== undefined ? String(alerta.id) : String(idx)} style={styles.alertaItem}>
              <Text style={[styles.itemTipo, { color: itemConfig.cor }]}>
                {itemConfig.rotulo}
                {alerta.titulo ? ` — ${alerta.titulo}` : ''}
              </Text>
              {alerta.descricao ? (
                <Text style={styles.itemDescricao} numberOfLines={compacto ? 2 : 4}>
                  {alerta.descricao}
                </Text>
              ) : null}
            </View>
          );
        })
      ) : (
        <Text style={styles.itemDescricao}>
          Este item possui alertas vigentes no serviço. Consulte a área de alertas para mais detalhes.
        </Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {conteudo}
      </TouchableOpacity>
    );
  }

  return conteudo;
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 10,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: 12,
    marginBottom: 14,
  },
  bannerCompacto: {
    padding: 10,
    marginTop: 8,
    marginBottom: 8,
  },
  bannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  bannerTitulo: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  verDetalhes: {
    fontSize: 12,
    fontWeight: '600',
  },
  alertaItem: {
    marginTop: 4,
  },
  itemTipo: {
    fontSize: 13,
    fontWeight: '700',
  },
  itemDescricao: {
    fontSize: 13,
    color: '#374151',
    marginTop: 2,
    lineHeight: 18,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    borderWidth: 1,
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginTop: 4,
  },
  badgeTexto: {
    fontSize: 11,
    fontWeight: 'bold',
  },
});
