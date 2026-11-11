const trajetosRepository = require('../repositories/trajetosRepository');

class TrajetosService {
  async obterTrajetos(origem, destino) {
    const paradaOrigem = await trajetosRepository.buscarParadaPorNome(origem);
    const paradaDestino = await trajetosRepository.buscarParadaPorNome(destino);

    if (!paradaOrigem || !paradaDestino) {
      return [];
    }

    const viagens = await trajetosRepository.buscarViagensDiretas(paradaOrigem.id, paradaDestino.id);

    const opcoes = viagens.map(viagem => {
      return {
        partida: viagem.horario_origem,
        chegada: viagem.horario_destino,
        duracaoMinutos: Math.round(viagem.duracao),
        baldeacoes: 0,
        caminhadaMetros: 0,
        afetadaPorAlerta: false,
        etapas: [
          {
            ordem: 1,
            duracaoMinutos: Math.round(viagem.duracao),
            instrucao: `Embarque na linha ${viagem.codigo_linha} e desça após ${viagem.qtd_paradas} paradas.`,
            tipo: "ONIBUS"
          }
        ]
      };
    });

    return opcoes;
  }
}

module.exports = new TrajetosService();