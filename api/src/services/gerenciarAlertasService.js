const repo = require('../repositories/gerenciarAlertasRepository');
const notificacoesService = require('./notificacoesService');

const TIPOS_VALIDOS = ['DESVIO', 'SUSPENSAO', 'ALTERACAO_HORARIO', 'PARALISACAO'];

const validar = (dados) => {
  const { tipo, titulo, descricao, data_inicio, data_fim } = dados;
  const linhas = dados.linhas === undefined ? [] : dados.linhas;
  const paradas = dados.paradas === undefined ? [] : dados.paradas;

  if (!TIPOS_VALIDOS.includes(tipo)) throw new Error('Tipo de alerta inválido.');
  if (typeof titulo !== 'string' || !titulo.trim()) throw new Error('O título é obrigatório.');
  if (typeof descricao !== 'string' || !descricao.trim()) throw new Error('A descrição é obrigatória.');

  const inicio = new Date(data_inicio);
  const fim = new Date(data_fim);
  if (!data_inicio || !data_fim || isNaN(inicio) || isNaN(fim)) {
    throw new Error('Datas de início e fim inválidas.');
  }
  if (fim <= inicio) throw new Error('A data de fim deve ser depois da data de início.');
  if (!Array.isArray(linhas)) throw new Error('As linhas afetadas devem ser uma lista.');
  if (!Array.isArray(paradas)) throw new Error('As paradas afetadas devem ser uma lista.');

  return {
    tipo,
    titulo: titulo.trim(),
    descricao: descricao.trim(),
    dataInicio: data_inicio,
    dataFim: data_fim,
    linhas,
    paradas
  };
};

const criar = async (dados) => {
  const alerta = await repo.criar(validar(dados));

  try {
    await notificacoesService.notificarFavoritosAfetados(alerta);
  } catch (erro) {
    console.error('Falha ao notificar favoritos:', erro.message || erro);
  }

  return alerta;
};

const editar = async (id, dados) => {
  const alerta = await repo.buscarPorId(id);
  if (!alerta) throw new Error('Alerta não encontrado.');
  if (alerta.encerrado_em) throw new Error('Alerta encerrado não pode ser editado.');
  return await repo.atualizar(id, validar(dados));
};

const listar = async () => {
  return await repo.listar();
};

const encerrar = async (id) => {
  const alerta = await repo.buscarPorId(id);
  if (!alerta) throw new Error('Alerta não encontrado.');
  if (alerta.encerrado_em) throw new Error('Este alerta já foi encerrado.');
  return await repo.encerrar(id);
};

const excluir = async (id) => {
  const alerta = await repo.buscarPorId(id);
  if (!alerta) throw new Error('Alerta não encontrado.');
  const emAndamento = !alerta.encerrado_em && new Date(alerta.data_fim) > new Date();
  if (emAndamento) throw new Error('Encerre o alerta antes de excluí-lo.');
  await repo.excluir(id);
};
const buscarParadas = async (busca) => {
  const texto = typeof busca === 'string' ? busca.trim() : '';
  if (texto.length < 2) return [];
  return await repo.buscarParadas(texto);
};
module.exports = { criar, editar, listar, encerrar, excluir, buscarParadas };