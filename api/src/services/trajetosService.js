const trajetosRepository = require('../repositories/trajetosRepository');
const { ordenarOpcoesTrajeto } = require('./ordenacaoTrajetos');

const RAIO_TERRA_METROS = 6371000;

function paraNumeroValido(valor) {
  if (valor === null || valor === undefined || valor === '') {
    return null;
  }
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

function calcularDistanciaMetros(pontoA, pontoB) {
  if (!pontoA || !pontoB) {
    return 0;
  }
  if (
    pontoA.id !== null &&
    pontoA.id !== undefined &&
    pontoB.id !== null &&
    pontoB.id !== undefined &&
    String(pontoA.id) === String(pontoB.id)
  ) {
    return 0;
  }

  const lat1 = paraNumeroValido(pontoA.latitude);
  const lng1 = paraNumeroValido(pontoA.longitude);
  const lat2 = paraNumeroValido(pontoB.latitude);
  const lng2 = paraNumeroValido(pontoB.longitude);

  if (lat1 === null || lng1 === null || lat2 === null || lng2 === null) {
    return 0;
  }

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));

  return Math.round(RAIO_TERRA_METROS * c);
}

function calcularCaminhadaOpcao(pontoRefOrigem, pontoRefDestino, viagem) {
  const pontoEmbarque = {
    id: viagem.origem_id,
    latitude: viagem.lat_origem,
    longitude: viagem.lng_origem,
  };
  const pontoDesembarque = {
    id: viagem.destino_id,
    latitude: viagem.lat_destino,
    longitude: viagem.lng_destino,
  };

  return (
    calcularDistanciaMetros(pontoRefOrigem, pontoEmbarque) +
    calcularDistanciaMetros(pontoDesembarque, pontoRefDestino)
  );
}

class TrajetosService {
  async obterTrajetos(origem, destino, criterioOrdenacao = null) {
    const paradasOrigem = await trajetosRepository.buscarParadasPorNome(origem);
    const paradasDestino = await trajetosRepository.buscarParadasPorNome(destino);

    if (paradasOrigem.length === 0 || paradasDestino.length === 0) {
      return [];
    }

    const idsOrigem = paradasOrigem.map((parada) => parada.id);
    const idsDestino = paradasDestino.map((parada) => parada.id);
    const pontoRefOrigem = paradasOrigem[0] || null;
    const pontoRefDestino = paradasDestino[0] || null;
    const opcoesFinais = [];

    const diretas = await trajetosRepository.buscarRotasDiretas(idsOrigem, idsDestino);
    diretas.forEach((viagem) => {
      const caminhadaMetros = calcularCaminhadaOpcao(pontoRefOrigem, pontoRefDestino, viagem);
      opcoesFinais.push({
        partida: viagem.horario_origem,
        chegada: viagem.horario_destino,
        duracaoMinutos: Math.max(Math.round(viagem.duracao), 1),
        baldeacoes: 0,
        caminhadaMetros,
        afetadaPorAlerta: false,
        etapas: [
          {
            ordem: 1,
            duracaoMinutos: Math.max(Math.round(viagem.duracao), 1),
            instrucao: `Embarque na linha ${viagem.linha_codigo} em "${viagem.nome_origem}" e desça em "${viagem.nome_destino}" após ${viagem.qtd_paradas} paradas.`,
            tipo: 'ONIBUS',
          },
        ],
      });
    });

    const comBaldeacao = await trajetosRepository.buscarRotasComBaldeacao(idsOrigem, idsDestino);
    comBaldeacao.forEach((viagem) => {
      const tempoEspera = Math.round(
        (new Date(`1970-01-01T${viagem.hora_saida_transfer}`) -
          new Date(`1970-01-01T${viagem.hora_chegada_transfer}`)) /
          60000
      );
      const caminhadaMetros = calcularCaminhadaOpcao(pontoRefOrigem, pontoRefDestino, viagem);

      opcoesFinais.push({
        partida: viagem.hora_origem,
        chegada: viagem.hora_destino,
        duracaoMinutos: Math.max(Math.round(viagem.duracao_total), 1),
        baldeacoes: 1,
        caminhadaMetros,
        afetadaPorAlerta: false,
        etapas: [
          {
            ordem: 1,
            duracaoMinutos: Math.max(Math.round(viagem.duracao_total / 2), 1),
            instrucao: `Embarque na linha ${viagem.linha_1} em "${viagem.nome_origem}" e desça em "${viagem.nome_transferencia}" após ${viagem.paradas_leg1} paradas.`,
            tipo: 'ONIBUS',
          },
          {
            ordem: 2,
            duracaoMinutos: Math.max(tempoEspera, 1),
            instrucao: `Faça a baldeação na parada "${viagem.nome_transferencia}". Aguarde o próximo ônibus.`,
            tipo: 'CAMINHADA',
          },
          {
            ordem: 3,
            duracaoMinutos: Math.max(Math.round(viagem.duracao_total / 2), 1),
            instrucao: `Embarque na linha ${viagem.linha_2} e desça em "${viagem.nome_destino}" após ${viagem.paradas_leg2} paradas.`,
            tipo: 'ONIBUS',
          },
        ],
      });
    });

    if (criterioOrdenacao) {
      return ordenarOpcoesTrajeto(opcoesFinais, criterioOrdenacao);
    }

    return opcoesFinais;
  }
}

module.exports = new TrajetosService();
