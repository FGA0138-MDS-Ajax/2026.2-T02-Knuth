const PALETA_LINHAS = ['#006666', '#1565C0', '#D97706', '#2E7D32'];

function numeroCoordenadaValido(valor) {
  if (valor === null || valor === undefined || valor === '') return null;
  const num = Number(valor);
  return Number.isFinite(num) ? num : null;
}

function normalizarCor(cor, indice = 0) {
  if (cor && typeof cor === 'string') {
    const limpa = cor.trim();
    if (/^#?[0-9a-fA-F]{6}$/.test(limpa)) {
      const hex = limpa.startsWith('#') ? limpa.toUpperCase() : `#${limpa.toUpperCase()}`;
      if (hex !== '#FFFFFF') return hex;
    }
  }
  return PALETA_LINHAS[indice % PALETA_LINHAS.length];
}

function normalizarPonto(ponto) {
  if (!ponto) return null;
  const latitude = numeroCoordenadaValido(ponto.latitude);
  const longitude = numeroCoordenadaValido(ponto.longitude);
  if (latitude === null || longitude === null) return null;
  return {
    id: ponto.id ?? ponto.paradaId ?? null,
    codigo: ponto.codigo || null,
    nome: ponto.nome || 'Parada',
    latitude,
    longitude,
  };
}

export function construirDadosMapaTrajeto(opcaoTrajeto) {
  if (!opcaoTrajeto) {
    return { trechos: [], marcadores: [] };
  }

  if (opcaoTrajeto.mapa && Array.isArray(opcaoTrajeto.mapa.trechos)) {
    const trechos = opcaoTrajeto.mapa.trechos
      .map((trecho, idx) => ({
        tipo: trecho.tipo === 'CAMINHADA' ? 'CAMINHADA' : 'ONIBUS',
        linhaCodigo: trecho.linhaCodigo || null,
        titulo: trecho.titulo || (trecho.linhaCodigo ? `Linha ${trecho.linhaCodigo}` : 'Trecho'),
        cor:
          trecho.tipo === 'CAMINHADA'
            ? '#475569'
            : normalizarCor(trecho.cor, idx),
        pontos: Array.isArray(trecho.pontos)
          ? trecho.pontos.map(normalizarPonto).filter(Boolean)
          : [],
      }))
      .filter((trecho) => trecho.pontos.length >= 2);

    const marcadores = Array.isArray(opcaoTrajeto.mapa.marcadores)
      ? opcaoTrajeto.mapa.marcadores
          .map((m) => {
            const lat = numeroCoordenadaValido(m?.latitude);
            const lng = numeroCoordenadaValido(m?.longitude);
            if (lat === null || lng === null) return null;
            return {
              tipo: m.tipo || 'PARADA',
              titulo: m.titulo || m.tipo || 'Parada',
              nome: m.nome || 'Parada',
              linhaCodigo: m.linhaCodigo || null,
              latitude: lat,
              longitude: lng,
            };
          })
          .filter(Boolean)
      : [];

    return { trechos, marcadores };
  }

  const etapas = Array.isArray(opcaoTrajeto.etapas) ? opcaoTrajeto.etapas : [];
  const trechos = [];
  const marcadores = [];
  let indiceOnibus = 0;

  etapas.forEach((etapa) => {
    const pontos = Array.isArray(etapa?.paradas)
      ? etapa.paradas.map(normalizarPonto).filter(Boolean)
      : [];
    if (pontos.length < 2) return;

    const isCaminhada = etapa.tipo !== 'ONIBUS';
    trechos.push({
      tipo: isCaminhada ? 'CAMINHADA' : 'ONIBUS',
      linhaCodigo: etapa.linhaCodigo || null,
      titulo: etapa.linhaCodigo ? `Linha ${etapa.linhaCodigo}` : etapa.instrucao || 'Trecho',
      cor: isCaminhada ? '#475569' : normalizarCor(etapa.cor, indiceOnibus++),
      pontos,
    });
  });

  const trechosOnibus = trechos.filter((t) => t.tipo === 'ONIBUS');
  if (trechosOnibus.length > 0) {
    const primeiro = trechosOnibus[0].pontos[0];
    marcadores.push({
      tipo: 'EMBARQUE',
      titulo: 'Embarque',
      nome: primeiro.nome,
      linhaCodigo: trechosOnibus[0].linhaCodigo,
      latitude: primeiro.latitude,
      longitude: primeiro.longitude,
    });

    for (let i = 0; i < trechosOnibus.length - 1; i += 1) {
      const fimAtual = trechosOnibus[i].pontos[trechosOnibus[i].pontos.length - 1];
      marcadores.push({
        tipo: 'BALDEACAO',
        titulo: 'Baldeação',
        nome: fimAtual.nome,
        linhaCodigo:
          trechosOnibus[i].linhaCodigo && trechosOnibus[i + 1].linhaCodigo
            ? `${trechosOnibus[i].linhaCodigo} → ${trechosOnibus[i + 1].linhaCodigo}`
            : null,
        latitude: fimAtual.latitude,
        longitude: fimAtual.longitude,
      });
    }

    const ultimoTrecho = trechosOnibus[trechosOnibus.length - 1];
    const ultimo = ultimoTrecho.pontos[ultimoTrecho.pontos.length - 1];
    marcadores.push({
      tipo: 'DESEMBARQUE',
      titulo: 'Desembarque',
      nome: ultimo.nome,
      linhaCodigo: ultimoTrecho.linhaCodigo,
      latitude: ultimo.latitude,
      longitude: ultimo.longitude,
    });
  }

  return { trechos, marcadores };
}

export function construirDadosMapaItinerario(paradas, linhaCodigo = null, cor = null) {
  const pontos = Array.isArray(paradas)
    ? paradas.map(normalizarPonto).filter(Boolean)
    : [];

  if (pontos.length === 0) {
    return { trechos: [], marcadores: [] };
  }

  const corLinha = normalizarCor(cor, 0);
  const trechos =
    pontos.length >= 2
      ? [
          {
            tipo: 'ONIBUS',
            linhaCodigo,
            titulo: linhaCodigo ? `Linha ${linhaCodigo}` : 'Itinerário',
            cor: corLinha,
            pontos,
          },
        ]
      : [];

  const marcadores = [
    {
      tipo: 'EMBARQUE',
      titulo: 'Início do itinerário',
      nome: pontos[0].nome,
      linhaCodigo,
      latitude: pontos[0].latitude,
      longitude: pontos[0].longitude,
    },
  ];

  if (pontos.length >= 2) {
    const ultima = pontos[pontos.length - 1];
    marcadores.push({
      tipo: 'DESEMBARQUE',
      titulo: 'Final do itinerário',
      nome: ultima.nome,
      linhaCodigo,
      latitude: ultima.latitude,
      longitude: ultima.longitude,
    });
  }

  return { trechos, marcadores };
}

export function gerarHtmlMapaLeaflet({ trechos = [], marcadores = [] } = {}) {
  const payloadSeguro = JSON.stringify({ trechos, marcadores }).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
    .marcador-pin {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      color: #FFF;
      font-weight: 700;
      font-size: 13px;
      border: 2px solid #FFF;
      box-shadow: 0 2px 6px rgba(0,0,0,0.35);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    (function () {
      var dados = ${payloadSeguro};
      var map = L.map('map', { zoomControl: true }).setView([-15.793889, -47.882778], 12);

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      var limites = [];

      function escapar(texto) {
        return String(texto || '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
      }

      (dados.trechos || []).forEach(function (trecho) {
        var coords = (trecho.pontos || []).map(function (p) {
          limites.push([p.latitude, p.longitude]);
          return [p.latitude, p.longitude];
        });
        if (coords.length < 2) return;

        var isCaminhada = trecho.tipo === 'CAMINHADA';
        var linha = L.polyline(coords, {
          color: isCaminhada ? '#475569' : (trecho.cor || '#006666'),
          weight: isCaminhada ? 4 : 5,
          opacity: isCaminhada ? 0.85 : 0.92,
          dashArray: isCaminhada ? '8, 8' : null
        }).addTo(map);

        if (trecho.titulo || trecho.linhaCodigo) {
          linha.bindPopup('<strong>' + escapar(trecho.linhaCodigo ? 'Linha ' + trecho.linhaCodigo : trecho.titulo) + '</strong>');
        }

        if (!isCaminhada) {
          (trecho.pontos || []).forEach(function (p, idx) {
            if (idx === 0 || idx === trecho.pontos.length - 1) return;
            L.circleMarker([p.latitude, p.longitude], {
              radius: 4,
              color: trecho.cor || '#006666',
              fillColor: '#FFFFFF',
              fillOpacity: 1,
              weight: 2
            })
              .bindPopup('<strong>Parada intermediária</strong><br/>' + escapar(p.nome))
              .addTo(map);
          });
        }
      });

      var estiloMarcador = {
        EMBARQUE: { cor: '#16A34A', letra: 'E' },
        BALDEACAO: { cor: '#EA580C', letra: 'B' },
        DESEMBARQUE: { cor: '#DC2626', letra: 'D' }
      };

      (dados.marcadores || []).forEach(function (m) {
        limites.push([m.latitude, m.longitude]);
        var cfg = estiloMarcador[m.tipo] || { cor: '#006666', letra: 'P' };
        var icone = L.divIcon({
          className: '',
          html: '<div class="marcador-pin" style="background:' + cfg.cor + ';">' + cfg.letra + '</div>',
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        var popup = '<strong>' + escapar(m.titulo) + '</strong><br/>' + escapar(m.nome);
        if (m.linhaCodigo) {
          popup += '<br/><small>Linha ' + escapar(m.linhaCodigo) + '</small>';
        }
        L.marker([m.latitude, m.longitude], { icon: icone }).bindPopup(popup).addTo(map);
      });

      if (limites.length === 1) {
        map.setView(limites[0], 15);
      } else if (limites.length > 1) {
        map.fitBounds(limites, { padding: [36, 36] });
      }
    })();
  </script>
</body>
</html>`;
}
