const trajetosRepository = require('../repositories/trajetosRepository');

class TrajetosService {
  async obterTrajetos(origem, destino) {
    const viagens = await trajetosRepository.buscarTrajetosPorNome(origem, destino);

    if (!viagens || viagens.length === 0) {
      return [];
    }

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
            // Agora a instrução mostra exatamente as paradas que o banco encontrou
            instrucao: `Embarque na linha ${viagem.codigo_linha} em "${viagem.nome_origem}" e desça em "${viagem.nome_destino}" após ${viagem.qtd_paradas} paradas.`,
            tipo: "ONIBUS"
          }
        ]
      };
    });

    return opcoes;
  }
}

module.exports = new TrajetosService();