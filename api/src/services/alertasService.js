const alertasRepository = require('../repositories/alertasRepository');

function normalizarLista(itens) {
  if (!Array.isArray(itens)) return [];
  const limpos = itens
    .filter((item) => item !== null && item !== undefined && String(item).trim() !== '')
    .map((item) => String(item).trim());
  return [...new Set(limpos)];
}

class AlertasService {
  // RF13 - Lista todos os alertas vigentes
  async listarAlertasVigentes() {
    return await alertasRepository.findAlertasVigentes();
  }

  // RF13 - Consulta um alerta vigente pelo id
  async obterAlertaVigente(id) {
    return await alertasRepository.findAlertaVigenteById(id);
  }

  // RF14 - Consulta alertas vigentes que afetam um conjunto de linhas e/ou paradas (ServicoAlertas.vigentesPara)
  async vigentesPara(linhasIds = [], paradasIds = []) {
    const linhas = normalizarLista(linhasIds);
    const paradas = normalizarLista(paradasIds);

    if (linhas.length === 0 && paradas.length === 0) {
      return [];
    }

    return await alertasRepository.findAlertasVigentesPorItens(linhas, paradas);
  }

  // RF14 - Filtra uma lista de alertas vigentes pelos itens (linhas e/ou paradas) afetados
  filtrarAlertasParaItens(alertas, { linhasIds = [], paradasIds = [], paradasNomes = [] } = {}) {
    if (!Array.isArray(alertas) || alertas.length === 0) return [];

    const linhasSet = new Set(normalizarLista(linhasIds).map((v) => v.toLowerCase()));
    const paradasIdSet = new Set(normalizarLista(paradasIds).map((v) => v.toLowerCase()));
    const paradasNomeSet = new Set(normalizarLista(paradasNomes).map((v) => v.toLowerCase()));

    if (linhasSet.size === 0 && paradasIdSet.size === 0 && paradasNomeSet.size === 0) {
      return [];
    }

    return alertas.filter((alerta) => {
      const linhasAfetadas = Array.isArray(alerta.linhas_afetadas) ? alerta.linhas_afetadas : [];
      const paradasAfetadas = Array.isArray(alerta.paradas_afetadas) ? alerta.paradas_afetadas : [];

      const afetaLinha = linhasAfetadas.some((linha) => {
        const id = linha?.id !== undefined && linha?.id !== null ? String(linha.id).trim().toLowerCase() : '';
        const codigo = linha?.codigo !== undefined && linha?.codigo !== null ? String(linha.codigo).trim().toLowerCase() : '';
        return (id && linhasSet.has(id)) || (codigo && linhasSet.has(codigo));
      });

      if (afetaLinha) return true;

      return paradasAfetadas.some((parada) => {
        const id = parada?.id !== undefined && parada?.id !== null ? String(parada.id).trim().toLowerCase() : '';
        const codigo = parada?.codigo !== undefined && parada?.codigo !== null ? String(parada.codigo).trim().toLowerCase() : '';
        const nome = parada?.nome !== undefined && parada?.nome !== null ? String(parada.nome).trim().toLowerCase() : '';
        return (
          (id && paradasIdSet.has(id)) ||
          (codigo && paradasIdSet.has(codigo)) ||
          (nome && paradasNomeSet.has(nome))
        );
      });
    });
  }

  // RF14 - Extrai códigos de linhas e nomes/ids de paradas envolvidos em uma opção de trajeto
  extrairItensDoTrajeto(opcao) {
    const linhasIds = [];
    const paradasIds = [];
    const paradasNomes = [];

    if (!opcao || typeof opcao !== 'object') {
      return { linhasIds, paradasIds, paradasNomes };
    }

    if (Array.isArray(opcao.linhas)) {
      linhasIds.push(...opcao.linhas);
    }
    if (Array.isArray(opcao.paradas)) {
      paradasIds.push(...opcao.paradas);
    }

    const etapas = Array.isArray(opcao.etapas) ? opcao.etapas : [];
    for (const etapa of etapas) {
      if (etapa?.linhaId) linhasIds.push(etapa.linhaId);
      if (etapa?.linhaCodigo) linhasIds.push(etapa.linhaCodigo);

      const instrucao = typeof etapa?.instrucao === 'string' ? etapa.instrucao : '';
      if (instrucao) {
        const matchLinha = instrucao.match(/linha\s+([A-Za-z0-9.\-_]+)/i);
        if (matchLinha && matchLinha[1]) {
          linhasIds.push(matchLinha[1]);
        }

        const regexAspas = /"([^"]+)"/g;
        let matchParada;
        while ((matchParada = regexAspas.exec(instrucao)) !== null) {
          if (matchParada[1]) {
            paradasNomes.push(matchParada[1]);
          }
        }
      }
    }

    return {
      linhasIds: normalizarLista(linhasIds),
      paradasIds: normalizarLista(paradasIds),
      paradasNomes: normalizarLista(paradasNomes),
    };
  }
}

module.exports = new AlertasService();
