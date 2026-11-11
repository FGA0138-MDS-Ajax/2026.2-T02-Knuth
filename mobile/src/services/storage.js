import AsyncStorage from '@react-native-async-storage/async-storage';

const CHAVE_BUSCAS = '@rotasdf_buscas_recentes';

export const salvarBuscaRecente = async (origem, destino) => {
  try {
    const buscasSalvas = await AsyncStorage.getItem(CHAVE_BUSCAS);
    let buscas = buscasSalvas ? JSON.parse(buscasSalvas) : [];

    buscas = buscas.filter(b => b.origem !== origem || b.destino !== destino);

    buscas.unshift({ origem, destino, id: Date.now().toString() });

    buscas = buscas.slice(0, 5);

    await AsyncStorage.setItem(CHAVE_BUSCAS, JSON.stringify(buscas));
  } catch (error) {
    console.error('Erro ao salvar busca recente:', error);
  }
};

export const getBuscasRecentes = async () => {
  try {
    const buscasSalvas = await AsyncStorage.getItem(CHAVE_BUSCAS);
    return buscasSalvas ? JSON.parse(buscasSalvas) : [];
  } catch (error) {
    console.error('Erro ao carregar buscas recentes:', error);
    return [];
  }
};