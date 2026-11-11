const trajetosRepository = require('../repositories/trajetosRepository');

class TrajetosService {
  async obterTrajetos(origem, destino) {
    const paradasOrigem = await trajetosRepository.buscarParadasPorNome(origem);
    const paradasDestino = await trajetosRepository.buscarParadasPorNome(destino);

    if (paradasOrigem.length === 0 || paradasDestino.length === 0) {
      return [];
    }

    const idOrigem = paradasOrigem[0].id;
    const nomeOrigem = paradasOrigem[0].nome;
    const idDestino = paradasDestino[0].id;
    const latDestino = parseFloat(paradasDestino[0].latitude);
    const lngDestino = parseFloat(paradasDestino[0].longitude);

    const MAX_BALDEACOES = 2; 
    const MAX_PARADAS_POR_NIVEL = 5; 

    const fila = [{
      paradaAtual: idOrigem,
      nomeAtual: nomeOrigem,
      horarioAtual: null,
      caminho: [],
      visitadas: new Set([idOrigem]),
      baldeacoes: 0
    }];

    const caminhosEncontrados = [];

    while (fila.length > 0 && caminhosEncontrados.length < 3) {
      const no = fila.shift();

      if (no.baldeacoes >= MAX_BALDEACOES) continue;

      const conexoes = await trajetosRepository.buscarConexoes(
        [no.paradaAtual],
        no.horarioAtual,
        latDestino,
        lngDestino
      );

      const conexoesValidas = conexoes
        .filter(c => !no.visitadas.has(c.destino_id))
        .slice(0, MAX_PARADAS_POR_NIVEL);

      for (const conexao of conexoesValidas) {
        const novaEtapa = {
          ordem: no.caminho.length + 1,
          duracaoMinutos: Math.max(Math.round(conexao.duracao), 1),
          instrucao: `Embarque na linha ${conexao.linha_codigo} em "${no.nomeAtual}" e desça em "${conexao.destino_nome}" após ${conexao.qtd_paradas} paradas.`,
          tipo: "ONIBUS",
          _horarioChegada: conexao.horario_chegada,
          _nomeChegada: conexao.destino_nome
        };

        const novoCaminho = [...no.caminho, novaEtapa];
        const novasVisitadas = new Set(no.visitadas);
        novasVisitadas.add(conexao.destino_id);

        if (conexao.destino_id === idDestino) {
          caminhosEncontrados.push({
            partida: novoCaminho[0]._horarioChegada,
            chegada: conexao.horario_chegada,
            duracaoMinutos: novoCaminho.reduce((acc, e) => acc + e.duracaoMinutos, 0),
            baldeacoes: novoCaminho.length - 1,
            caminhadaMetros: 0,
            afetadaPorAlerta: false,
            etapas: novoCaminho.map(e => ({
              ordem: e.ordem,
              duracaoMinutos: e.duracaoMinutos,
              instrucao: e.instrucao,
              tipo: e.tipo
            }))
          });
        } else {
          fila.push({
            paradaAtual: conexao.destino_id,
            nomeAtual: conexao.destino_nome,
            horarioAtual: conexao.horario_chegada,
            caminho: novoCaminho,
            visitadas: novasVisitadas,
            baldeacoes: no.baldeacoes + 1
          });
        }
      }
    }

    return caminhosEncontrados;
  }
}

module.exports = new TrajetosService();