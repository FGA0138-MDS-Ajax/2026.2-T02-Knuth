const pool = require('./database');

const COMANDOS_COLUNAS_ENRIQUECIDAS = [
  'ALTER TABLE linhas ADD COLUMN IF NOT EXISTS tarifa NUMERIC(6,2);',
  'ALTER TABLE linhas ADD COLUMN IF NOT EXISTS faixa_tarifaria VARCHAR(50);',
  'ALTER TABLE linhas ADD COLUMN IF NOT EXISTS operadora VARCHAR(120);',
  'ALTER TABLE linhas ADD COLUMN IF NOT EXISTS extensao_km NUMERIC(8,2);',
  'ALTER TABLE paradas ADD COLUMN IF NOT EXISTS tipo VARCHAR(50);',
  'ALTER TABLE paradas ADD COLUMN IF NOT EXISTS estrutura VARCHAR(80);',
];

async function garantirColunasEnriquecidas(dbPool = pool) {
  try {
    for (const sql of COMANDOS_COLUNAS_ENRIQUECIDAS) {
      await dbPool.query(sql);
    }
    return true;
  } catch (erro) {
    console.error('Aviso ao garantir colunas enriquecidas no banco:', erro.message || erro);
    return false;
  }
}

module.exports = {
  COMANDOS_COLUNAS_ENRIQUECIDAS,
  garantirColunasEnriquecidas,
};
