const COR_PADRAO = '#006666';
const REGEX_HEX = /^#?[0-9a-fA-F]{6}$/;

export function obterCorLinha(cor) {
  if (!cor || typeof cor !== 'string') {
    return COR_PADRAO;
  }
  const limpa = cor.trim();
  if (!REGEX_HEX.test(limpa)) {
    return COR_PADRAO;
  }
  const comHash = limpa.startsWith('#') ? limpa.toUpperCase() : `#${limpa.toUpperCase()}`;
  if (comHash === '#FFFFFF') {
    return COR_PADRAO;
  }
  return comHash;
}

export function formatarTarifa(tarifa) {
  if (tarifa === null || tarifa === undefined || tarifa === '') {
    return null;
  }
  const numero = Number(tarifa);
  if (Number.isNaN(numero) || numero <= 0) {
    return null;
  }
  return `R$ ${numero.toFixed(2).replace('.', ',')}`;
}

export function formatarExtensao(extensaoKm) {
  if (extensaoKm === null || extensaoKm === undefined || extensaoKm === '') {
    return null;
  }
  const numero = Number(extensaoKm);
  if (Number.isNaN(numero) || numero <= 0) {
    return null;
  }
  return `${numero.toFixed(1).replace('.', ',')} km`;
}

export function formatarOperadora(operadora) {
  if (!operadora || typeof operadora !== 'string') {
    return null;
  }
  const limpa = operadora.trim();
  if (!limpa) {
    return null;
  }
  const upper = limpa.toUpperCase();
  if (upper.includes('PIRACICABANA') || upper.includes('BACIA 01') || upper.includes('BACIA - 01')) {
    return 'Piracicabana · Bacia 01';
  }
  if (upper.includes('COOBRATAETE')) {
    return 'Coobrataete · Bacia 02';
  }
  if (upper.includes('PIONEIRA') || upper.includes('BACIA 02') || upper.includes('BACIA - 02')) {
    return 'Pioneira · Bacia 02';
  }
  if (upper.includes('URBI') || upper.includes('BACIA 03') || upper.includes('BACIA - 03')) {
    return 'Urbi · Bacia 03';
  }
  if (upper.includes('MARECHAL') || upper.includes('BACIA 04') || upper.includes('BACIA - 04')) {
    return 'Marechal · Bacia 04';
  }
  if (
    upper.includes('SÃO JOSÉ') ||
    upper.includes('SAO JOSE') ||
    upper.includes('BSBUS') ||
    upper.includes('BACIA 05') ||
    upper.includes('BACIA - 05')
  ) {
    return 'São José · Bacia 05';
  }
  return 'Transporte Complementar (STPCR)';
}
