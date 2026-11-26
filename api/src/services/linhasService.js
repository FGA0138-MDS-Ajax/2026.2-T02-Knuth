const linhasRepository = require('../repositories/linhasRepository');
const { normalizarHorario } = require('../utils/horarioConsulta');

function normalizarNumeroOpcional(valor) {
  if (valor === null || valor === undefined || valor === '') {
    return undefined;
  }
  const numero = Number(valor);
  return Number.isNaN(numero) ? undefined : numero;
}

function anexarMetadadosLinha(destino, row) {
  if (row.linha_cor) destino.cor = row.linha_cor;
  const tarifa = normalizarNumeroOpcional(row.linha_tarifa);
  if (tarifa !== undefined) destino.tarifa = tarifa;
  if (row.linha_faixa_tarifaria) destino.faixaTarifaria = row.linha_faixa_tarifaria;
  if (row.linha_operadora) destino.operadora = row.linha_operadora;
  const extensaoKm = normalizarNumeroOpcional(row.linha_extensao_km);
  if (extensaoKm !== undefined) destino.extensaoKm = extensaoKm;
}

// RF23 - Validações da manutenção manual de linhas
// O código vira o id da linha (como no importador) e a consulta pública de itinerário só aceita números e pontos.
const REGEX_CODIGO_LINHA = /^[0-9.]+$/;
const REGEX_COR = /^#[0-9A-Fa-f]{6}$/;

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

function lerNumero(valor, mensagem, maximo) {
  if (valor === null || valor === undefined || String(valor).trim() === '') return null;
  const numero = Number(String(valor).trim().replace(',', '.'));
  if (!Number.isFinite(numero) || numero < 0 || numero > maximo) {
    throw erroComStatus(mensagem, 400);
  }
  return numero;
}

function validarLinha(dados) {
  const nome = lerTexto(dados.nome, 'O nome da linha', 255);
  if (!nome) throw erroComStatus('O nome da linha é obrigatório.', 400);

  const cor = lerTexto(dados.cor, 'A cor', 10);
  if (cor && !REGEX_COR.test(cor)) throw erroComStatus('A cor deve estar no formato #RRGGBB.', 400);

  return {
    nome,
    cor: cor || null,
    tarifa: lerNumero(dados.tarifa, 'A tarifa deve ser um número entre 0 e 9999,99.', 9999.99),
    faixaTarifaria: lerTexto(dados.faixa_tarifaria, 'A faixa tarifária', 50) || null,
    operadora: lerTexto(dados.operadora, 'A operadora', 120) || null,
    extensaoKm: lerNumero(dados.extensao_km, 'A extensão deve ser um número entre 0 e 999999,99.', 999999.99)
  };
}

// RF23 - Validações das partidas (viagens) da linha
const SENTIDOS_VALIDOS = ['IDA', 'VOLTA'];
const TIPOS_DIA_VALIDOS = ['DIA_UTIL', 'SABADO', 'DOMINGO_FERIADO'];

function validarSentidoETipoDia(sentido, tipoDia) {
  if (!SENTIDOS_VALIDOS.includes(sentido)) throw erroComStatus('O sentido deve ser IDA ou VOLTA.', 400);
  if (!TIPOS_DIA_VALIDOS.includes(tipoDia)) {
    throw erroComStatus('O tipo de dia deve ser DIA_UTIL, SABADO ou DOMINGO_FERIADO.', 400);
  }
}

function validarHorario(horario) {
  const normalizado = normalizarHorario(horario);
  if (!normalizado) throw erroComStatus('O horário deve estar no formato HH:MM.', 400);
  return normalizado;
}

class LinhasService {
  // RF02 / Busca Geral: aceita tanto busca por texto quanto objeto de filtros (bacia, regiao, tipo)
  async obterLinhas(filtros) {
    return await linhasRepository.findLinhas(filtros);
  }

  // Alias para garantir compatibilidade caso o controller chame por este nome
  async listarLinhasComFiltros(filtros) {
    return await this.obterLinhas(filtros);
  }

  // RF08: Agrupa e formata as paradas no JSON do itinerário
  async obterItinerario(linhaId) {
    const rows = await linhasRepository.findItinerarioByLinhaId(linhaId);

    if (!rows || rows.length === 0) return null;

    const resultado = {
      linhaId: rows[0].linha_id,
      codigo: rows[0].linha_codigo,
      nome: rows[0].linha_nome,
      cor: rows[0].linha_cor,
      itinerario: { IDA: [], VOLTA: [] }
    };
    anexarMetadadosLinha(resultado, rows[0]);

    rows.forEach(row => {
      const parada = {
        sequencia: row.sequencia,
        paradaId: row.parada_id,
        codigo: row.parada_codigo,
        nome: row.parada_nome,
        latitude: parseFloat(row.latitude),
        longitude: parseFloat(row.longitude)
      };
      if (row.parada_tipo) parada.tipo = row.parada_tipo;
      if (row.parada_estrutura) parada.estrutura = row.parada_estrutura;

      if (row.sentido === 'IDA') {
        resultado.itinerario.IDA.push(parada);
      } else if (row.sentido === 'VOLTA') {
        resultado.itinerario.VOLTA.push(parada);
      }
    });

    return resultado;
  }

  // RF10: Agrupa os horários por sentido e por tipo de dia
  async obterQuadroHorarios(linhaId) {
    const rows = await linhasRepository.findHorariosByLinhaId(linhaId);

    if (!rows || rows.length === 0) return null;

    const resultado = {
      linhaId: rows[0].linha_id,
      codigo: rows[0].linha_codigo,
      nome: rows[0].linha_nome,
      quadroHorarios: {
        IDA: { DIA_UTIL: [], SABADO: [], DOMINGO_FERIADO: [] },
        VOLTA: { DIA_UTIL: [], SABADO: [], DOMINGO_FERIADO: [] }
      }
    };
    anexarMetadadosLinha(resultado, rows[0]);

    rows.forEach(row => {
      const { sentido, tipo_dia, horario_partida } = row;
      if (resultado.quadroHorarios[sentido] && resultado.quadroHorarios[sentido][tipo_dia]) {
        if (!resultado.quadroHorarios[sentido][tipo_dia].includes(horario_partida)) {
          resultado.quadroHorarios[sentido][tipo_dia].push(horario_partida);
        }
      }
    });

    return resultado;
  }
  
  // RF23: Inclusão, alteração e exclusão manual de linhas pelo administrador
  async criarLinha(dados) {
    const codigo = lerTexto(dados.codigo, 'O código da linha', 50);
    if (!codigo) throw erroComStatus('O código da linha é obrigatório.', 400);
    if (!REGEX_CODIGO_LINHA.test(codigo)) {
      throw erroComStatus('O código da linha deve ter apenas números e pontos (ex.: 0.110).', 400);
    }
    const linha = validarLinha(dados);

    const existente = await linhasRepository.buscarPorId(codigo);
    if (existente) throw erroComStatus(`Já existe uma linha com o código ${codigo}.`, 409);

    return await linhasRepository.criar({ codigo, ...linha });
  }

  async editarLinha(id, dados) {
    const linha = await linhasRepository.buscarPorId(id);
    if (!linha) throw erroComStatus('Linha não encontrada.', 404);
    return await linhasRepository.atualizar(id, validarLinha(dados));
  }

  async excluirLinha(id) {
    const linha = await linhasRepository.buscarPorId(id);
    if (!linha) throw erroComStatus('Linha não encontrada.', 404);
    await linhasRepository.excluir(id);
  }

  // RF23: Partidas (viagens) da linha por sentido e tipo de dia
  async listarPartidas(linhaId, sentido, tipoDia) {
    validarSentidoETipoDia(sentido, tipoDia);
    const linha = await linhasRepository.buscarPorId(linhaId);
    if (!linha) throw erroComStatus('Linha não encontrada.', 404);

    const rows = await linhasRepository.listarPartidas(linhaId, sentido, tipoDia);
    return rows.map((row) => ({ viagemId: row.viagem_id, horario: row.horario }));
  }

  // Nova partida = cópia da viagem mais próxima do mesmo sentido e tipo de dia, com todos os horários deslocados
  async incluirPartida(linhaId, dados) {
    const { sentido, tipoDia } = dados;
    validarSentidoETipoDia(sentido, tipoDia);
    const horario = validarHorario(dados.horario);

    const linha = await linhasRepository.buscarPorId(linhaId);
    if (!linha) throw erroComStatus('Linha não encontrada.', 404);

    const modelo = await linhasRepository.buscarPartidaMaisProxima(linhaId, sentido, tipoDia, horario);
    if (!modelo) {
      throw erroComStatus('A linha não tem nenhuma viagem neste sentido e tipo de dia para servir de modelo.', 400);
    }
    if (modelo.horario === horario.slice(0, 5)) {
      throw erroComStatus(`Já existe uma partida às ${modelo.horario} neste sentido e tipo de dia.`, 409);
    }

    const viagemId = await linhasRepository.criarPartida(modelo.viagem_id, horario);
    return { viagemId, horario: horario.slice(0, 5) };
  }

  async alterarPartida(linhaId, viagemId, dados) {
    const horario = validarHorario(dados.horario);

    const partida = await linhasRepository.buscarPartida(linhaId, viagemId);
    if (!partida) throw erroComStatus('Partida não encontrada.', 404);

    const maisProxima = await linhasRepository.buscarPartidaMaisProxima(
      linhaId,
      partida.sentido,
      partida.tipo_dia,
      horario
    );
    if (maisProxima && maisProxima.viagem_id !== viagemId && maisProxima.horario === horario.slice(0, 5)) {
      throw erroComStatus(`Já existe uma partida às ${maisProxima.horario} neste sentido e tipo de dia.`, 409);
    }

    await linhasRepository.deslocarPartida(viagemId, horario);
    return { viagemId, horario: horario.slice(0, 5) };
  }

  async excluirPartida(linhaId, viagemId) {
    const partida = await linhasRepository.buscarPartida(linhaId, viagemId);
    if (!partida) throw erroComStatus('Partida não encontrada.', 404);
    await linhasRepository.excluirPartida(viagemId);
  }
}

module.exports = new LinhasService();