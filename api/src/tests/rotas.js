function listarRotas(router) {
  return router.stack
    .filter((layer) => layer.route)
    .flatMap((layer) =>
      Object.keys(layer.route.methods)
        .filter((metodo) => layer.route.methods[metodo])
        .map((metodo) => ({
          metodo: metodo.toUpperCase(),
          caminho: layer.route.path,
          handlers: layer.route.stack.map((s) => s.handle),
        }))
    );
}

function buscarRota(router, metodo, caminho) {
  return listarRotas(router).find(
    (r) => r.metodo === metodo.toUpperCase() && r.caminho === caminho
  );
}

function assinaturas(router) {
  return listarRotas(router).map((r) => `${r.metodo} ${r.caminho}`);
}

function criarRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

module.exports = { listarRotas, buscarRota, assinaturas, criarRes };
