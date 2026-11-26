const linhasRepository = require('../repositories/linhasRepository');

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
  
}

module.exports = new LinhasService();