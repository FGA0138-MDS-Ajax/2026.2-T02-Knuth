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

// RF23 - Validações da manutenção manual de paradas
// O código vira o id da parada (como no importador) e é usado nas URLs da API.
const REGEX_CODIGO_PARADA = /^[A-Za-z0-9.-]+$/;

function erroComStatus(mensagem, status) {
  const erro = new Error(mensagem);
  erro.status = status;
  return erro;
}

function lerTexto(valor, rotulo, limite) {
  const texto = typeof valor === 'string' || typeof valor === 'number' ? String(valor).trim() : '';
  if (texto.length > limite) {
    throw erroComStatus(`${rotulo} deve ter no máximo ${limite} caracteres.`, 400);
  }
  return texto;
}

function lerCoordenada(valor, rotulo, limite) {
  if (valor === null || valor === undefined || String(valor).trim() === '') {
    throw erroComStatus(`${rotulo} é obrigatória.`, 400);
  }
  const numero = Number(String(valor).trim().replace(',', '.'));
  if (!Number.isFinite(numero) || numero < -limite || numero > limite) {
    throw erroComStatus(`${rotulo} deve ser um número entre -${limite} e ${limite}.`, 400);
  }
  return numero;
}

function validarParada(dados) {
  const nome = lerTexto(dados.nome, 'O nome da parada', 255);
  if (!nome) throw erroComStatus('O nome da parada é obrigatório.', 400);

  return {
    nome,
    latitude: lerCoordenada(dados.latitude, 'A latitude', 90),
    longitude: lerCoordenada(dados.longitude, 'A longitude', 180),
    tipo: lerTexto(dados.tipo, 'O tipo', 50) || null,
    estrutura: lerTexto(dados.estrutura, 'A estrutura', 80) || null
  };
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

  // RF23 - Inclusão, alteração e exclusão manual de paradas pelo administrador
  async obterParada(id) {
    const parada = await paradasRepository.findById(id);
    if (!parada) throw erroComStatus('Parada não encontrada.', 404);
    return parada;
  }

  async criarParada(dados) {
    const codigo = lerTexto(dados.codigo, 'O código da parada', 50);
    if (!codigo) throw erroComStatus('O código da parada é obrigatório.', 400);
    if (!REGEX_CODIGO_PARADA.test(codigo)) {
      throw erroComStatus('O código da parada deve ter apenas letras, números, ponto ou hífen.', 400);
    }
    const parada = validarParada(dados);

    const existente = await paradasRepository.findById(codigo);
    if (existente) throw erroComStatus(`Já existe uma parada com o código ${codigo}.`, 409);

    return await paradasRepository.criar({ codigo, ...parada });
  }

  async editarParada(id, dados) {
    const parada = await paradasRepository.findById(id);
    if (!parada) throw erroComStatus('Parada não encontrada.', 404);
    return await paradasRepository.atualizar(id, validarParada(dados));
  }

  async excluirParada(id) {
    const parada = await paradasRepository.findById(id);
    if (!parada) throw erroComStatus('Parada não encontrada.', 404);

    const totalLinhas = await paradasRepository.contarLinhasNoItinerario(id);
    if (totalLinhas > 0) {
      const linhas = totalLinhas === 1 ? '1 linha' : `${totalLinhas} linhas`;
      throw erroComStatus(`A parada não pode ser excluída porque faz parte do itinerário de ${linhas}.`, 409);
    }
    await paradasRepository.excluir(id);
  }
}

module.exports = new ParadasService();
