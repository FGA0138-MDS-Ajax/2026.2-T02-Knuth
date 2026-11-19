const repo = require('../repositories/gerenciarAlertasRepository');

const TIPOS_VALIDOS = ['DESVIO', 'SUSPENSAO', 'ALTERACAO_HORARIO', 'PARALISACAO'];

const criar = async (dados) => {
  const { tipo, titulo, descricao, data_inicio, data_fim } = dados;
  const linhas = dados.linhas === undefined ? [] : dados.linhas;

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

  return await repo.criar({
    tipo,
    titulo: titulo.trim(),
    descricao: descricao.trim(),
    dataInicio: data_inicio,
    dataFim: data_fim,
    linhas
  });
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
module.exports = { criar, listar, encerrar, excluir };