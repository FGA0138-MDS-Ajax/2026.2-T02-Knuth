const trajetosRepository = require('../repositories/trajetosRepository');

class TrajetosService {
  async obterTrajetos(origem, destino) {
    const paradasOrigem = await trajetosRepository.buscarParadasPorNome(origem);
    const paradasDestino = await trajetosRepository.buscarParadasPorNome(destino);

    if (paradasOrigem.length === 0 || paradasDestino.length === 0) {
      return [];
    }

    const idOrigem = paradasOrigem[0].id;
    const idDestino = paradasDestino[0].id;
    const opcoesFinais = [];

    const diretas = await trajetosRepository.buscarRotasDiretas(idOrigem, idDestino);
    diretas.forEach(viagem => {
      opcoesFinais.push({
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
            instrucao: `Embarque na linha ${viagem.linha_codigo} em "${viagem.nome_origem}" e desça em "${viagem.nome_destino}" após ${viagem.qtd_paradas} paradas.`,
            tipo: "ONIBUS"
          }
        ]
      });
    });

    const comBaldeacao = await trajetosRepository.buscarRotasComBaldeacao(idOrigem, idDestino);
    comBaldeacao.forEach(viagem => {
      const tempoEspera = Math.round((new Date(`1970-01-01T${viagem.hora_saida_transfer}`) - new Date(`1970-01-01T${viagem.hora_chegada_transfer}`)) / 60000);

      opcoesFinais.push({
        partida: viagem.hora_origem,
        chegada: viagem.hora_destino,
        duracaoMinutos: Math.round(viagem.duracao_total),
        baldeacoes: 1,
        caminhadaMetros: 0,
        afetadaPorAlerta: false,
        etapas: [
          {
            ordem: 1,
            duracaoMinutos: Math.round(viagem.duracao_total / 2),
            instrucao: `Embarque na linha ${viagem.linha_1} em "${viagem.nome_origem}" e desça em "${viagem.nome_transferencia}" após ${viagem.paradas_leg1} paradas.`,
            tipo: "ONIBUS"
          },
          {
            ordem: 2,
            duracaoMinutos: Math.max(tempoEspera, 1),
            instrucao: `Faça a baldeação na parada "${viagem.nome_transferencia}". Aguarde o próximo ônibus.`,
            tipo: "CAMINHADA"
          },
          {
            ordem: 3,
            duracaoMinutos: Math.round(viagem.duracao_total / 2),
            instrucao: `Embarque na linha ${viagem.linha_2} e desça em "${viagem.nome_destino}" após ${viagem.paradas_leg2} paradas.`,
            tipo: "ONIBUS"
          }
        ]
      });
    });

    return opcoesFinais;
  }
}

module.exports = new TrajetosService();