const paradasRepository = require('../repositories/paradasRepository');

const TIPOS_DIA_VALIDOS = new Set(['DIA_UTIL', 'SABADO', 'DOMINGO_FERIADO']);
const REGEX_HORARIO = /^([01]\d|2[0-3]):([0-5]\d)$/;

function criarErroValidacao(detalhes) {
  const erro = new Error(detalhes);
  erro.status = 400;
  erro.erro = 'BAD_REQUEST';
  erro.detalhes = detalhes;
  return erro;
}

function obterReferenciaAtualBrasilia(agora = new Date()) {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(agora);

  const mapa = {};
  for (const parte of partes) {
    mapa[parte.type] = parte.value;
  }

  let tipoDia = 'DIA_UTIL';
  if (mapa.weekday === 'Sat') {
    tipoDia = 'SABADO';
  } else if (mapa.weekday === 'Sun') {
    tipoDia = 'DOMINGO_FERIADO';
  }

  const hora = mapa.hour === '24' ? '00' : mapa.hour;
  const minuto = mapa.minute;

  return {
    tipoDia,
    horarioReferencia: `${hora}:${minuto}`,
  };
}

function horarioParaMinutos(horario) {
  const [horas, minutos] = String(horario).split(':').map(Number);
  return horas * 60 + minutos;
}

class ParadasService {
  async obterParadaMaisProxima(lat, lng) {
    return await paradasRepository.findNearestParada(lat, lng);
  }

  async buscarParadas(busca, limite = 10) {
    if (!busca || typeof busca !== 'string' || busca.trim().length < 2) {
      return [];
    }
    const limiteNumerico = Math.min(Math.max(parseInt(limite, 10) || 10, 1), 25);
    return await paradasRepository.buscarPorNome(busca.trim(), limiteNumerico);
  }

  // RF11 - Consulta próximas partidas programadas em uma parada a partir do horário atual
  async obterProximasPartidas(paradaId, opcoes = {}) {
    const idLimpo = paradaId !== undefined && paradaId !== null ? String(paradaId).trim() : '';
    if (!idLimpo) {
      throw criarErroValidacao('O identificador da parada é obrigatório.');
    }

    const referenciaAtual = obterReferenciaAtualBrasilia(opcoes.agora);

    let tipoDia = referenciaAtual.tipoDia;
    if (opcoes.tipoDia !== undefined && opcoes.tipoDia !== null && String(opcoes.tipoDia).trim() !== '') {
      const tipoInformado = String(opcoes.tipoDia).trim().toUpperCase();
      if (!TIPOS_DIA_VALIDOS.has(tipoInformado)) {
        throw criarErroValidacao(
          'O parâmetro tipoDia deve ser DIA_UTIL, SABADO ou DOMINGO_FERIADO.'
        );
      }
      tipoDia = tipoInformado;
    }

    let horarioReferencia = referenciaAtual.horarioReferencia;
    if (opcoes.horario !== undefined && opcoes.horario !== null && String(opcoes.horario).trim() !== '') {
      const horarioInformado = String(opcoes.horario).trim();
      if (!REGEX_HORARIO.test(horarioInformado)) {
        throw criarErroValidacao('O parâmetro horario deve estar no formato HH:MM.');
      }
      horarioReferencia = horarioInformado;
    }

    const limiteNumerico = Math.min(Math.max(parseInt(opcoes.limite, 10) || 30, 1), 100);

    const parada = await paradasRepository.findById(idLimpo);
    if (!parada) {
      return null;
    }

    const rows = await paradasRepository.findProximasPartidas(
      parada.id,
      tipoDia,
      horarioReferencia,
      limiteNumerico
    );

    const minutosRef = horarioParaMinutos(horarioReferencia);
    const partidas = rows.map((row) => {
      const minutosPartida = horarioParaMinutos(row.horario_partida);
      return {
        linhaId: row.linha_id,
        linhaCodigo: row.linha_codigo,
        linhaNome: row.linha_nome,
        linhaCor: row.linha_cor || null,
        sentido: row.sentido,
        destino: row.destino || null,
        horario: row.horario_partida,
        minutosRestantes: Math.max(0, minutosPartida - minutosRef),
      };
    });

    return {
      parada: {
        id: parada.id,
        codigo: parada.codigo || null,
        nome: parada.nome,
        latitude:
          parada.latitude !== null && parada.latitude !== undefined
            ? parseFloat(parada.latitude)
            : null,
        longitude:
          parada.longitude !== null && parada.longitude !== undefined
            ? parseFloat(parada.longitude)
            : null,
      },
      tipoDia,
      horarioReferencia,
      partidas,
      mensagem:
        partidas.length === 0
          ? 'Não há mais partidas previstas para hoje nesta parada.'
          : null,
    };
  }
}

module.exports = new ParadasService();
