const trajetosRepository = require('../repositories/trajetosRepository');

const PALETA_LINHAS_FALLBACK = ['#006666', '#1565C0', '#D97706', '#2E7D32'];

function criarPonto(id, nome, latitude, longitude, codigo = null) {
  if (
    latitude === null ||
    latitude === undefined ||
    longitude === null ||
    longitude === undefined
  ) {
    return null;
  }
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }
  return {
    id: id !== null && id !== undefined ? String(id) : null,
    codigo: codigo || null,
    nome: nome || 'Parada',
    latitude: lat,
    longitude: lng,
  };
}

function escolherCorTrecho(corBruta, indice = 0) {
  if (corBruta && typeof corBruta === 'string') {
    const limpa = corBruta.trim();
    if (/^#?[0-9a-fA-F]{6}$/.test(limpa)) {
      const hex = limpa.startsWith('#') ? limpa.toUpperCase() : `#${limpa.toUpperCase()}`;
      if (hex !== '#FFFFFF') {
        return hex;
      }
    }
  }
  return PALETA_LINHAS_FALLBACK[indice % PALETA_LINHAS_FALLBACK.length];
}

async function obterPontosTrecho(viagemId, seqInicio, seqFim, pontoInicio, pontoFim) {
  if (
    typeof trajetosRepository.buscarParadasTrecho === 'function' &&
    viagemId &&
    seqInicio !== undefined &&
    seqInicio !== null &&
    seqFim !== undefined &&
    seqFim !== null
  ) {
    try {
      const rows = await trajetosRepository.buscarParadasTrecho(viagemId, seqInicio, seqFim);
      if (Array.isArray(rows) && rows.length > 0) {
        const pontos = rows
          .map((row) =>
            criarPonto(row.parada_id, row.nome, row.latitude, row.longitude, row.codigo)
          )
          .filter(Boolean);
        if (pontos.length >= 2) {
          return pontos;
        }
      }
    } catch (erro) {
      console.error('Erro ao buscar paradas do trecho para o mapa:', erro);
    }
  }

  return [pontoInicio, pontoFim].filter(Boolean);
}

function adicionarCaminhadaSeDiferente(trechos, pontoA, pontoB, titulo) {
  if (!pontoA || !pontoB) return;
  const mesmoId = pontoA.id && pontoB.id && pontoA.id === pontoB.id;
  const mesmaCoord =
    Math.abs(pontoA.latitude - pontoB.latitude) < 1e-5 &&
    Math.abs(pontoA.longitude - pontoB.longitude) < 1e-5;
  if (mesmoId || mesmaCoord) return;

  trechos.push({
    tipo: 'CAMINHADA',
    titulo,
    pontos: [pontoA, pontoB],
  });
}

class TrajetosService {
  async obterTrajetos(origem, destino) {
    const paradasOrigem = await trajetosRepository.buscarParadasPorNome(origem);
    const paradasDestino = await trajetosRepository.buscarParadasPorNome(destino);

    if (paradasOrigem.length === 0 || paradasDestino.length === 0) {
      return [];
    }

    const idsOrigem = paradasOrigem.map((parada) => parada.id);
    const idsDestino = paradasDestino.map((parada) => parada.id);

    const pontoRefOrigem = criarPonto(
      paradasOrigem[0]?.id,
      paradasOrigem[0]?.nome,
      paradasOrigem[0]?.latitude,
      paradasOrigem[0]?.longitude
    );
    const pontoRefDestino = criarPonto(
      paradasDestino[0]?.id,
      paradasDestino[0]?.nome,
      paradasDestino[0]?.latitude,
      paradasDestino[0]?.longitude
    );

    const diretas = await trajetosRepository.buscarRotasDiretas(idsOrigem, idsDestino);
    const opcoesDiretas = await Promise.all(
      diretas.map(async (viagem) => {
        const pontoOrigem = criarPonto(
          viagem.origem_id,
          viagem.nome_origem,
          viagem.lat_origem,
          viagem.lng_origem
        );
        const pontoDestino = criarPonto(
          viagem.destino_id,
          viagem.nome_destino,
          viagem.lat_destino,
          viagem.lng_destino
        );

        const pontosOnibus = await obterPontosTrecho(
          viagem.viagem_id,
          viagem.seq_origem,
          viagem.seq_destino,
          pontoOrigem,
          pontoDestino
        );

        const etapa = {
          ordem: 1,
          duracaoMinutos: Math.max(Math.round(viagem.duracao), 1),
          instrucao: `Embarque na linha ${viagem.linha_codigo} em "${viagem.nome_origem}" e desça em "${viagem.nome_destino}" após ${viagem.qtd_paradas} paradas.`,
          tipo: 'ONIBUS',
        };

        const opcao = {
          partida: viagem.horario_origem,
          chegada: viagem.horario_destino,
          duracaoMinutos: Math.max(Math.round(viagem.duracao), 1),
          baldeacoes: 0,
          caminhadaMetros: 0,
          afetadaPorAlerta: false,
          etapas: [etapa],
        };

        if (pontosOnibus.length >= 2) {
          const corLinha = escolherCorTrecho(viagem.linha_cor, 0);

          const trechos = [];
          adicionarCaminhadaSeDiferente(
            trechos,
            pontoRefOrigem,
            pontosOnibus[0],
            'Caminhada até o embarque'
          );
          trechos.push({
            tipo: 'ONIBUS',
            linhaCodigo: viagem.linha_codigo,
            cor: corLinha,
            pontos: pontosOnibus,
          });
          adicionarCaminhadaSeDiferente(
            trechos,
            pontosOnibus[pontosOnibus.length - 1],
            pontoRefDestino,
            'Caminhada até o destino'
          );

          opcao.mapa = {
            trechos,
            marcadores: [
              {
                tipo: 'EMBARQUE',
                titulo: 'Embarque',
                linhaCodigo: viagem.linha_codigo,
                nome: pontosOnibus[0].nome,
                latitude: pontosOnibus[0].latitude,
                longitude: pontosOnibus[0].longitude,
              },
              {
                tipo: 'DESEMBARQUE',
                titulo: 'Desembarque',
                linhaCodigo: viagem.linha_codigo,
                nome: pontosOnibus[pontosOnibus.length - 1].nome,
                latitude: pontosOnibus[pontosOnibus.length - 1].latitude,
                longitude: pontosOnibus[pontosOnibus.length - 1].longitude,
              },
            ],
          };
        }

        return opcao;
      })
    );

    const comBaldeacao = await trajetosRepository.buscarRotasComBaldeacao(idsOrigem, idsDestino);
    const opcoesBaldeacao = await Promise.all(
      comBaldeacao.map(async (viagem) => {
        const tempoEspera = Math.round(
          (new Date(`1970-01-01T${viagem.hora_saida_transfer}`) -
            new Date(`1970-01-01T${viagem.hora_chegada_transfer}`)) /
            60000
        );

        const pontoOrigem = criarPonto(
          viagem.origem_id,
          viagem.nome_origem,
          viagem.lat_origem,
          viagem.lng_origem
        );
        const pontoTransfer = criarPonto(
          viagem.transfer_id,
          viagem.nome_transferencia,
          viagem.lat_transferencia,
          viagem.lng_transferencia
        );
        const pontoDestino = criarPonto(
          viagem.destino_id,
          viagem.nome_destino,
          viagem.lat_destino,
          viagem.lng_destino
        );

        const [pontosLeg1, pontosLeg2] = await Promise.all([
          obterPontosTrecho(
            viagem.viagem_1_id,
            viagem.seq_origem_1,
            viagem.seq_transfer_1,
            pontoOrigem,
            pontoTransfer
          ),
          obterPontosTrecho(
            viagem.viagem_2_id,
            viagem.seq_transfer_2,
            viagem.seq_destino_2,
            pontoTransfer,
            pontoDestino
          ),
        ]);

        const etapa1 = {
          ordem: 1,
          duracaoMinutos: Math.max(Math.round(viagem.duracao_total / 2), 1),
          instrucao: `Embarque na linha ${viagem.linha_1} em "${viagem.nome_origem}" e desça em "${viagem.nome_transferencia}" após ${viagem.paradas_leg1} paradas.`,
          tipo: 'ONIBUS',
        };
        const etapa2 = {
          ordem: 2,
          duracaoMinutos: Math.max(tempoEspera, 1),
          instrucao: `Faça a baldeação na parada "${viagem.nome_transferencia}". Aguarde o próximo ônibus.`,
          tipo: 'CAMINHADA',
        };
        const etapa3 = {
          ordem: 3,
          duracaoMinutos: Math.max(Math.round(viagem.duracao_total / 2), 1),
          instrucao: `Embarque na linha ${viagem.linha_2} e desça em "${viagem.nome_destino}" após ${viagem.paradas_leg2} paradas.`,
          tipo: 'ONIBUS',
        };

        const opcao = {
          partida: viagem.hora_origem,
          chegada: viagem.hora_destino,
          duracaoMinutos: Math.max(Math.round(viagem.duracao_total), 1),
          baldeacoes: 1,
          caminhadaMetros: 0,
          afetadaPorAlerta: false,
          etapas: [etapa1, etapa2, etapa3],
        };

        if (pontosLeg1.length >= 2 && pontosLeg2.length >= 2) {
          const cor1 = escolherCorTrecho(viagem.linha_1_cor, 0);
          let cor2 = escolherCorTrecho(viagem.linha_2_cor, 1);
          if (cor2 === cor1) {
            cor2 = PALETA_LINHAS_FALLBACK.find((cor) => cor !== cor1) || '#1565C0';
          }

          const trechos = [];
          adicionarCaminhadaSeDiferente(
            trechos,
            pontoRefOrigem,
            pontosLeg1[0],
            'Caminhada até o embarque'
          );
          trechos.push({
            tipo: 'ONIBUS',
            linhaCodigo: viagem.linha_1,
            cor: cor1,
            pontos: pontosLeg1,
          });
          trechos.push({
            tipo: 'CAMINHADA',
            titulo: `Baldeação em ${viagem.nome_transferencia}`,
            pontos: [pontosLeg1[pontosLeg1.length - 1], pontosLeg2[0]],
          });
          trechos.push({
            tipo: 'ONIBUS',
            linhaCodigo: viagem.linha_2,
            cor: cor2,
            pontos: pontosLeg2,
          });
          adicionarCaminhadaSeDiferente(
            trechos,
            pontosLeg2[pontosLeg2.length - 1],
            pontoRefDestino,
            'Caminhada até o destino'
          );

          const pontoBaldeacao = pontoTransfer || pontosLeg1[pontosLeg1.length - 1];
          opcao.mapa = {
            trechos,
            marcadores: [
              {
                tipo: 'EMBARQUE',
                titulo: 'Embarque',
                linhaCodigo: viagem.linha_1,
                nome: pontosLeg1[0].nome,
                latitude: pontosLeg1[0].latitude,
                longitude: pontosLeg1[0].longitude,
              },
              {
                tipo: 'BALDEACAO',
                titulo: 'Baldeação',
                linhaCodigo: `${viagem.linha_1} → ${viagem.linha_2}`,
                nome: pontoBaldeacao.nome,
                latitude: pontoBaldeacao.latitude,
                longitude: pontoBaldeacao.longitude,
              },
              {
                tipo: 'DESEMBARQUE',
                titulo: 'Desembarque',
                linhaCodigo: viagem.linha_2,
                nome: pontosLeg2[pontosLeg2.length - 1].nome,
                latitude: pontosLeg2[pontosLeg2.length - 1].latitude,
                longitude: pontosLeg2[pontosLeg2.length - 1].longitude,
              },
            ],
          };
        }

        return opcao;
      })
    );

    return [...opcoesDiretas, ...opcoesBaldeacao];
  }
}

module.exports = new TrajetosService();
