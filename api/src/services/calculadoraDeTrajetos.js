class CalculadoraDeTrajetos {
  async calcular(consultaTrajeto) {
    const { origem_lat, origem_lng, destino_lat, destino_lng, criterio } = consultaTrajeto;

    return [
      {
        partida: new Date().toISOString(),
        chegada: new Date(Date.now() + 45 * 60000).toISOString(),
        duracaoMinutos: 45,
        baldeacoes: 0,
        caminhadaMetros: 300,
        afetadaPorAlerta: false,
        etapas: [
          {
            ordem: 1,
            duracaoMinutos: 5,
            tipo: "CAMINHADA",
            instrucao: `Caminhe até a parada mais próxima da latitude ${origem_lat}`
          },
          {
            ordem: 2,
            duracaoMinutos: 35,
            tipo: "ONIBUS",
            instrucao: "Embarque na linha 205.1 e desça após 12 paradas"
          },
          {
            ordem: 3,
            duracaoMinutos: 5,
            tipo: "CAMINHADA",
            instrucao: `Caminhe até o destino final na latitude ${destino_lat}`
          }
        ]
      }
    ];
  }
}

module.exports = new CalculadoraDeTrajetos();