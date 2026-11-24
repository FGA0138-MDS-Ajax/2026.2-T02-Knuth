# Plano de Testes — RotasDF

## Sumário

1. [Estratégia de testes](#1-estratégia-de-testes)
2. [Testes de repositórios](#2-testes-de-repositórios)
3. [Testes de serviços e controladores](#3-testes-de-serviços-e-controladores)
4. [Testes de middleware](#4-testes-de-middleware)
5. [Testes de interface (React Native)](#5-testes-de-interface-react-native)
6. [Tratamento de erros e condições especiais](#6-tratamento-de-erros-e-condições-especiais)
7. [Considerações finais](#7-considerações-finais)
8. [Cobertura de testes](#8-cobertura-de-testes)

---

## 1. Estratégia de testes

- **Testes unitários:** foco na validação isolada dos serviços, repositórios e controladores.
- **Testes funcionais de interface:** validação das telas React Native quanto à renderização, às interações e ao estado da interface.
- **Testes de integração:** não há testes de integração entre componentes distintos; as dependências são simuladas com *mocks*.
- **Teste de sistema:** realizado na Sprint 4, com o objetivo de verificar a integração e a usabilidade do sistema.

---

## 2. Testes de repositórios

### 2.1. `AlertasRepository`

| Método | Cenário / objetivo | Resultado esperado |
|---|---|---|
| `findAlertasVigentes` | Retorna todos os alertas vigentes (considerando vigência e não encerrados). | Retorna uma lista ou propaga o erro. |
| `findAlertaVigenteById` | Retorna um alerta ativo pelo ID. | Retorna o alerta ou `null`; trata erros. |
| `findAlertasVigentesPorItens` | Retorna alertas vigentes que afetam uma lista de linhas e/ou paradas (RF14). | Retorna os alertas correspondentes, lista vazia sem ir ao banco quando os parâmetros são vazios, ou propaga o erro. |

### 2.2. `BuscasRecentesRepository`

| Método | Cenário / objetivo | Resultado esperado |
|---|---|---|
| `salvarBusca` | Insere uma busca e retorna o registro. | Executa a consulta com os valores corretos. |
| `listarBuscasRecentes` | Lista buscas recentes com filtro. | Retorna uma lista ou uma lista vazia. |

### 2.3. `UsuariosRepository`

| Método | Cenário / objetivo | Resultado esperado |
|---|---|---|
| `criar` | Insere um usuário sem expor a senha. | Executa a consulta corretamente e retorna o usuário. |
| `buscarPorEmail` | Busca um usuário pelo e-mail. | Retorna o usuário ou `null`. |
| `buscarPorId` | Busca um usuário pelo ID (RF16). | Retorna o usuário encontrado ou `null`. |
| `atualizarSenha` | Atualiza o hash da senha de um usuário pelo ID (RF16). | Executa `UPDATE usuarios SET senha_hash = $2 WHERE id = $1`. |
| `excluir` | Remove o registro do usuário pelo ID (RF16). | Executa a exclusão ou propaga o erro do banco. |

### 2.4. `ParadasRepository`

| Método | Cenário / objetivo | Resultado esperado |
|---|---|---|
| `findNearestParada` | Busca a parada mais próxima. | Retorna a parada ou `null`. |
| `buscarPorNome` | Busca paradas ignorando acentos/caixa, com fronteira de palavras curtas e limite configurável. | Retorna as paradas correspondentes ordenadas por relevância ou lista vazia para termo vazio. |
| `findById` | Busca os dados de uma parada pelo identificador (RF11). | Retorna a parada encontrada ou `null` quando inexistente. |
| `findProximasPartidas` | Consulta próximas partidas programadas da parada filtrando por tipo de dia e horário de referência sem duplicatas de linha/sentido/horário (RF11). | Retorna as partidas ordenadas cronologicamente respeitando o limite informado. |

### 2.5. `LinhasRepository`

| Método | Cenário / objetivo | Resultado esperado |
|---|---|---|
| `findLinhas` | Busca linhas com ou sem filtros. | Retorna as linhas ou uma lista vazia. |
| `findItinerarioByLinhaId` | Busca o itinerário de uma linha. | Retorna o resultado ou uma lista vazia. |
| `findHorariosByLinhaId` | Busca os horários de uma linha. | Retorna os horários ou uma lista vazia. |

### 2.6. `TrajetosRepository`

| Método | Cenário / objetivo | Resultado esperado |
|---|---|---|
| `buscarParadasPorNome` | Busca múltiplas paradas candidatas ignorando acentos, com aliases locais (ex.: *Rodoviária do Plano Piloto* → `ROD.PP`) e expansão em raio de 350 m para parada única. | Retorna até 15 paradas candidatas ordenadas por relevância ou lista vazia para termo vazio/inexistente. |
| `buscarRotasDiretas` | Busca rotas diretas aceitando listas ou IDs unitários de origem/destino, com ajuste de virada de meia-noite, diversidade de linhas e filtro opcional por horário de partida (`PARTIDA` >= horário) ou chegada (`CHEGADA` <= horário) (RF01 / RF06). | Retorna até 8 opções diretas ordenadas conforme o critério de duração ou proximidade ao horário alvo, ou lista vazia sem consultar o banco quando algum lado está vazio. |
| `buscarRotasComBaldeacao` | Busca rotas com 1 baldeação via CTEs materializadas por padrão `(linha_id, sentido)`, janela de espera de até 60 minutos e filtro opcional por horário de partida ou chegada (RF01 / RF06). | Retorna até 5 opções com baldeação distintas por par de linhas respeitando o horário informado ou lista vazia. |
| `buscarParadasTrecho` | Busca a sequência ordenada de paradas com coordenadas (`latitude`, `longitude`) entre `seqInicio` e `seqFim` de uma viagem para desenho no mapa (RF04). | Retorna as paradas ordenadas por `sequencia ASC` ou lista vazia sem consultar o banco quando faltam parâmetros. |

### 2.7. `GerenciarUsuariosRepository`

| Método | Cenário / objetivo | Resultado esperado |
|---|---|---|
| `listar` | Lista usuários com filtro. | Retorna a lista filtrada ou completa. |
| `buscarPorId` | Busca um usuário pelo ID. | Retorna o usuário ou `null`. |
| `contarAdmins` | Conta o total de administradores. | Retorna a contagem. |
| `atualizar` | Atualiza os dados do usuário, incluindo senha opcional. | Retorna o usuário atualizado. |
| `excluir` | Remove um usuário pelo ID. | Confirma a remoção ou propaga o erro. |

### 2.8. `AdminRepository`

| Método | Cenário / objetivo | Resultado esperado |
|---|---|---|
| `criar` | Cria um administrador com tipo fixo. | Executa a consulta corretamente e retorna o resultado esperado. |

### 2.9. `RecuperacaoSenhaRepository` (RF16)

| Método | Cenário / objetivo | Resultado esperado |
|---|---|---|
| `invalidarPendentes` | Marca como usados todos os códigos de recuperação pendentes do usuário. | Atualiza `usado_em = NOW()` nos registros não utilizados do `usuario_id`. |
| `criar` | Armazena o hash do código de 6 dígitos com data de expiração. | Insere na tabela `recuperacoes_senha` e retorna os metadados sem expor `codigo_hash`. |
| `buscarAtiva` | Consulta o código mais recente ainda válido (não usado e não expirado). | Retorna o registro ativo ou `null`. |
| `registrarTentativa` | Incrementa o contador de tentativas inválidas de um código. | Atualiza `tentativas = tentativas + 1` e retorna o total atualizado. |
| `marcarUsada` | Marca um código de recuperação como utilizado ou bloqueado. | Atualiza `usado_em = NOW()` para o registro informado. |

### 2.10. `FavoritosRepository` (RF17)

| Método | Cenário / objetivo | Resultado esperado |
|---|---|---|
| `listar` | Lista os favoritos de um usuário, do mais recente ao mais antigo, com os dados da linha e da parada. | Retorna apenas os favoritos do usuário ou lista vazia; propaga o erro do banco. |
| `adicionar` | Insere um favorito de linha, parada ou trajeto e devolve o registro já com os dados da linha e da parada. | Devolve o favorito criado, ou `null` quando ele já existia; propaga o erro do banco. |
| `remover` | Remove o favorito somente se pertencer ao usuário. | Retorna `true` quando removeu e `false` quando não havia favorito. |

### 2.11. `AnalisarReportesRepository` (RF24)

| Método | Cenário / objetivo | Resultado esperado |
|---|---|---|
| `listar` | Lista os reportes de divergência com `LEFT JOIN` em `usuarios`, com filtros opcionais de `status` e `tipo`, priorizando pendentes e mais recentes. | Executa a consulta com os filtros corretos e retorna a lista de reportes ou propaga o erro do banco. |
| `buscarPorId` | Busca um reporte específico pelo ID com dados do autor. | Retorna o reporte encontrado ou `null`. |
| `atualizarAnalise` | Atualiza `status`, `observacao_admin` e define `analisado_em` (`NULL` quando `PENDENTE`, `NOW()` nos demais). | Retorna o reporte atualizado ou `null` caso o ID não exista. |

---

## 3. Testes de serviços e controladores

### 3.1. `AlertasService`

| Método | Cenário / objetivo | Resultado esperado |
|---|---|---|
| `listarAlertasVigentes` | Retorna alertas ou erros. | Retorna a lista correta ou um erro. |
| `obterAlertaVigente` | Retorna um alerta ativo pelo ID ou `null`. | Retorna os dados ou `null`; trata erros. |
| `vigentesPara` | Normaliza/deduplica IDs de linhas e paradas e busca alertas vigentes afetados (RF14). | Consulta o repositório com listas normalizadas ou retorna lista vazia quando não há itens válidos. |
| `filtrarAlertasParaItens` | Filtra alertas vigentes por linhas (ID/código) e paradas (ID/código/nome) (RF14). | Retorna apenas os alertas que afetam os itens informados. |
| `extrairItensDoTrajeto` | Extrai códigos de linhas e nomes/IDs de paradas das etapas de uma opção de trajeto (RF14). | Retorna as listas normalizadas de linhas e paradas envolvidas no trajeto. |

### 3.2. `BuscasRecentesService`

| Método | Cenário / objetivo | Resultado esperado |
|---|---|---|
| `registrarBusca` | Valida e registra buscas. | Trata e retorna os dados corretamente. |
| `obterBuscasRecentes` | Lista buscas com parâmetros e valores padrão. | Retorna as buscas ou uma lista vazia. |

### 3.3. `UsuariosService`

| Método | Cenário / objetivo | Resultado esperado |
|---|---|---|
| `cadastrar` | Valida os dados e realiza o cadastro. | Cria o usuário ou lança erros. |
| `login` | Realiza a autenticação e emite um token. | Retorna o token e o usuário, ou um erro. |
| `solicitarRecuperacaoSenha` | Gera código de 6 dígitos, invalida códigos anteriores, salva o hash com expiração de 15 min e dispara o envio por e-mail sem revelar se o e-mail existe (RF16). | Retorna mensagem padrão; rejeita com `400` se o e-mail estiver vazio. |
| `redefinirSenha` | Valida e-mail, código de 6 dígitos, limite de 5 tentativas e tamanho mínimo da nova senha (6 caracteres), atualizando o hash da senha (RF16). | Atualiza a senha e invalida o código utilizado, ou lança erro `400` para código inválido/expirado/excedido. |
| `excluirConta` | Valida a senha atual do passageiro autenticado e remove sua própria conta, bloqueando autoexclusão de administradores (RF16). | Exclui o passageiro com confirmação de senha ou lança erro `400`/`401`/`403`/`404`. |

### 3.4. `ParadasService`

| Método | Cenário / objetivo | Resultado esperado |
|---|---|---|
| `obterParadaMaisProxima` | Busca a parada mais próxima usando latitude e longitude. | Retorna a parada, `null` ou um erro. |
| `buscarParadas` | Valida o termo mínimo (2 caracteres) e o limite (1–25) para autocomplete (`GET /paradas`). | Retorna lista vazia para termos curtos/vazios ou repassa termo aparado e limite ao repositório. |
| `obterProximasPartidas` | Detecta automaticamente horário e tipo de dia em Brasília (`America/Sao_Paulo`), valida parâmetros opcionais (`horario`, `tipoDia`, `limite`) e calcula `minutosRestantes` (RF11). | Retorna partidas ordenadas cronologicamente, mensagem explícita quando não há mais saídas no dia, `null` para parada inexistente ou erro `400` para parâmetros inválidos. |

### 3.5. `LinhasService`

| Método | Cenário / objetivo | Resultado esperado |
|---|---|---|
| `obterLinhas` | Busca linhas com filtros ou por texto. | Retorna as linhas ou um erro. |
| `obterItinerario` | Retorna o itinerário pelo ID, incluindo metadados opcionais da linha (`tarifa`, `faixaTarifaria`, `operadora`, `extensaoKm`, `cor`). | Retorna dados estruturados, `null` ou um erro. |
| `obterQuadroHorarios` | Retorna o quadro de horários agrupado por sentido e tipo de dia, anexando metadados enriquecidos da linha (`cor`, `tarifa`, `faixaTarifaria`, `operadora`, `extensaoKm`) quando disponíveis. | Retorna os dados agrupados com metadados, `null` ou um erro. |

### 3.6. `TrajetosService`

| Método | Cenário / objetivo | Resultado esperado |
|---|---|---|
| `obterTrajetos` | Resolve todas as paradas candidatas de origem e destino, combina rotas diretas e com baldeação, calcula `caminhadaMetros` (Haversine quando há deslocamento entre paradas diferentes), aplica ordenação opcional (`TEMPO`, `BALDEACOES`, `CAMINHADA` — RF05) e monta dados geográficos (`mapa.trechos` e `mapa.marcadores`) com cores distintas por linha, trechos de caminhada/baldeação e marcadores de embarque, baldeação e desembarque (RF01 / RF04 / RF05). | Repassa todos os IDs candidatos ao repositório, calcula `caminhadaMetros`, ordena conforme a estratégia selecionada ou mantém ordem padrão, retorna lista combinada enriquecida com `mapa` quando há coordenadas ou propaga erro. |
| `ordenacaoTrajetos` | Normalização de critérios (`TEMPO`, `BALDEACOES`, `CAMINHADA`) e execução das estratégias *Strategy* (`EstrategiaMenorTempo`, `EstrategiaMenosBaldeacoes`, `EstrategiaMenorCaminhada`) (RF05). | Reordena opções de trajeto conforme o critério com desempates consistentes (tempo, baldeações, caminhada e partida), preserva imutabilidade da lista original e ignora critérios ausentes ou inválidos. |
| `horarioConsulta` | Normalização e validação estrita de `horario` (`HH:MM` / `HH:MM:SS`) e `referenciaHorario` (`PARTIDA` / `CHEGADA`), com `PARTIDA` como referência padrão (RF06). | Retorna `{ filtro: { referencia, horario }, erro: null }` para combinações válidas, `{ filtro: null, erro: null }` quando omitidos e mensagem de erro clara para formatos ou combinações inválidas. |

### 3.7. `GerenciarUsuariosService`

| Método | Cenário / objetivo | Resultado esperado |
|---|---|---|
| `listar` | Lista usuários com filtro. | Retorna a lista ou um erro. |
| `atualizar` | Atualiza os dados conforme as regras. | Retorna o resultado atualizado ou um erro. |
| `excluir` | Valida e exclui usuários. | Confirma a exclusão ou retorna um erro. |

### 3.8. `AdminService`

| Método | Cenário / objetivo | Resultado esperado |
|---|---|---|
| `criarAdministrador` | Valida os dados e cria um administrador. | Cria o administrador ou retorna um erro. |

### 3.9. Controladores — Sinalização de Alertas nos Itens Afetados (RF14)

| Controlador / método | Cenário / objetivo | Resultado esperado |
|---|---|---|
| `AlertasController.getAlertasVigentes` | Lista todos os alertas vigentes ou filtra por `?linhaId` e `?paradaId`. | Chama `vigentesPara` quando há filtros na query ou `listarAlertasVigentes` caso contrário, respondendo `200`. |
| `LinhasController.getLinhas` | Enriquece cada linha retornada com `afetadaPorAlerta` e `alertas`. | Responde `200` com a lista de linhas sinalizadas; mantém resposta `200` sem alertas caso a consulta de alertas falhe. |
| `LinhasController.getItinerario` | Sinaliza alertas vigentes tanto na linha quanto individualmente nas paradas de `IDA` e `VOLTA`. | Responde `200` com `afetadaPorAlerta` e `alertas` no cabeçalho da linha e em cada parada afetada. |
| `LinhasController.getHorarios` | Anexa `afetadaPorAlerta` e `alertas` vigentes ao quadro de horários da linha. | Responde `200` com o quadro de horários enriquecido com os alertas da linha. |
| `ParadasController.getParadaProxima` | Anexa `afetadaPorAlerta` e `alertas` vigentes à parada mais próxima encontrada pelo GPS. | Responde `200` com a parada sinalizada; degrada graciosamente se a consulta de alertas falhar. |
| `TrajetosController.getTrajetos` | Valida `origem`, `destino`, critério opcional `ordenarPor` (`TEMPO`, `BALDEACOES`, `CAMINHADA` — RF05) e filtro opcional por horário (`horario` e `referenciaHorario` `PARTIDA`/`CHEGADA` — RF06), extrai linhas e paradas das etapas de cada opção e associa os alertas vigentes correspondentes (RF14). | Repassa `ordenarPor` e filtro de horário normalizados ao serviço, responde `400` para parâmetros inválidos e `200` com cada opção enriquecida com `afetadaPorAlerta` e `alertas`; mantém funcionamento caso o serviço de alertas falhe. |

### 3.10. Controladores e Serviços — Recuperação de Senha e Exclusão de Conta (RF16)

| Componente / método | Cenário / objetivo | Resultado esperado |
|---|---|---|
| `EmailService.enviarCodigoRecuperacao` | Registra/dispara o envio do código temporário de recuperação com destinatário e tempo de validade. | Registra a mensagem contendo nome, e-mail, código de 6 dígitos e validade em minutos. |
| `UsuariosController.solicitarRecuperacaoSenha` | Recebe `POST /api/v1/usuarios/recuperar-senha` e aciona o serviço de recuperação. | Responde `200` com a mensagem de confirmação, `400` quando falta o e-mail ou `500` em falha inesperada. |
| `UsuariosController.redefinirSenha` | Recebe `POST /api/v1/usuarios/redefinir-senha` com `email`, `codigo` e `novaSenha`. | Responde `200` ao redefinir a senha, `400` para dados/código inválidos ou `500` em erro interno. |
| `UsuariosController.excluirConta` | Recebe `DELETE /api/v1/usuarios/me` autenticado com a senha de confirmação no corpo. | Responde `200` ao excluir a conta, ou `400`/`401`/`403`/`404`/`500` conforme a validação. |

### 3.11. `GerenciarAlertasService` (RF22)

| Método | Cenário / objetivo | Resultado esperado |
|---|---|---|
| `criar` | Valida tipo, título, descrição, datas e listas de linhas/paradas antes de gravar. | Rejeita tipo inválido, título ou descrição ausentes, datas inválidas, fim não posterior ao início e linhas/paradas que não sejam lista. |
| `criar` | Cria o alerta com dados válidos, com ou sem linhas e com paradas afetadas. | Chama o repositório com os dados normalizados (lista vazia quando não há linhas) e retorna o alerta criado. |
| `listar` | Lista todos os alertas para o administrador. | Retorna todos os alertas, inclusive encerrados e expirados. |
| `editar` | Altera um alerta existente com as mesmas validações da criação. | Retorna o alerta atualizado; falha se o alerta não existir, se estiver encerrado ou se os dados forem inválidos. |
| `encerrar` | Encerra um alerta em andamento. | Encerra o alerta; falha se não existir ou se já estiver encerrado. |
| `excluir` | Exclui alertas encerrados ou expirados. | Exclui o alerta; falha se não existir e impede a exclusão de alerta ainda em andamento. |
| `buscarParadas` | Busca paradas pelo texto para escolha das paradas afetadas. | Retorna lista vazia quando a busca é curta e consulta o repositório com o texto sem espaços nas pontas. |

### 3.12. `GerenciarAlertasController` (RF22)

| Controlador / método | Cenário / objetivo | Resultado esperado |
|---|---|---|
| `listar` | Recebe `GET /api/v1/admin/alertas`. | Responde `200` com a lista de alertas. |
| `criar` | Recebe `POST /api/v1/admin/alertas`. | Responde `201` ao criar ou `400` quando o serviço rejeita os dados. |
| `editar` | Recebe `PUT /api/v1/admin/alertas/:id`. | Responde `200` ao editar, `404` se o alerta não existir ou `400` se estiver encerrado ou o id não for numérico. |
| `encerrar` | Recebe `PUT /api/v1/admin/alertas/:id/encerrar`. | Responde `200` ao encerrar, `404` se o alerta não existir ou `400` se já estiver encerrado ou o id for inválido. |
| `buscarParadas` | Recebe `GET /api/v1/admin/paradas?busca=`. | Responde `200` com as paradas encontradas e aceita busca ausente. |

### 3.13. `FavoritosService` (RF17)

| Método | Cenário / objetivo | Resultado esperado |
|---|---|---|
| `listar` | Lista os favoritos do usuário logado. | Retorna a lista do usuário. |
| `adicionar` | Valida o tipo (`LINHA`, `PARADA` ou `TRAJETO`) e o campo exigido por cada tipo. | Rejeita tipo inválido ou campo ausente (400); ignora campos que não pertencem ao tipo. |
| `adicionar` | Salva o favorito e trata duplicidade e referência inexistente. | Salva com sucesso; responde 409 se já existia e 404 se a linha ou a parada não existir. |
| `remover` | Valida o ID e remove o favorito do usuário. | Responde 400 para ID inválido e 404 se o favorito não existir ou for de outro usuário. |

### 3.14. `FavoritosController` e rotas (RF17)

| Controlador / método | Cenário / objetivo | Resultado esperado |
|---|---|---|
| `listar` | Recebe `GET /api/v1/favoritos`. | Responde `200` com os favoritos do usuário do token. |
| `adicionar` | Recebe `POST /api/v1/favoritos`. | Responde `201`, ou `400`, `404` e `409` conforme a regra violada. |
| `remover` | Recebe `DELETE /api/v1/favoritos/:id`. | Responde `200`, ou `400` e `404`. |
| todos | Usuário que não é passageiro. | Responde `403` (administrador não usa favoritos). |
| `favoritosRoutes` | Rotas `GET /`, `POST /` e `DELETE /:id`. | Todas passam pelo `authUsuario`; não há rota `PUT`. |

### 3.15. `AnalisarReportesService` (RF24)

| Método | Cenário / objetivo | Resultado esperado |
|---|---|---|
| `listar` | Normaliza e valida filtros opcionais de `status` (`PENDENTE`, `PROCEDENTE`, `IMPROCEDENTE`) e `tipo` (`HORARIO`, `PARADA`, `ITINERARIO`). | Retorna a lista filtrada ou lança erro `400` para filtro inválido. |
| `obterPorId` | Valida ID inteiro positivo e consulta o reporte. | Retorna o reporte, lança `400` para ID inválido ou `404` quando não encontrado. |
| `analisar` | Valida ID, classificação e exige registro da correção (`observacaoAdmin` / `correcaoRealizada`) quando `PROCEDENTE`. | Atualiza classificação e correção registrada; lança `400` para dados inválidos/ausência de correção em procedente ou `404` se não existir. |

### 3.16. `AnalisarReportesController` e rotas administrativas (RF24)

| Controlador / método | Cenário / objetivo | Resultado esperado |
|---|---|---|
| `listar` | Recebe `GET /api/v1/admin/reportes` com filtros opcionais na query. | Responde `200` com a lista, `400` para filtro inválido ou `500` em falha inesperada. |
| `obterPorId` | Recebe `GET /api/v1/admin/reportes/:id`. | Responde `200` com o reporte, `404` se inexistente ou `500` em erro interno. |
| `analisar` | Recebe `PATCH /api/v1/admin/reportes/:id` com `status` e `observacaoAdmin` / `correcaoRealizada`. | Responde `200` com o reporte atualizado, `400` quando inválido, `404` se não encontrado ou `500` em erro interno. |
| `adminRoutes` | Rotas `GET /reportes`, `GET /reportes/:id` e `PATCH /reportes/:id`. | Todas exigem `authAdmin` como primeiro middleware antes do controlador. |

### 3.17. `ParadasController` e rotas — Próximas Partidas em uma Parada (RF11)

| Controlador / método | Cenário / objetivo | Resultado esperado |
|---|---|---|
| `ParadasController.getProximasPartidas` | Recebe `GET /api/v1/paradas/:id/proximas-partidas` com parâmetros opcionais (`horario`, `tipoDia`, `limite`) e integra alertas vigentes da parada (RF11 / RF14). | Responde `200` com a parada, próximas partidas e alertas (degradando graciosamente se a consulta de alertas falhar), `400` para ID/parâmetros inválidos, `404` se a parada não existir ou `500` em falha inesperada. |
| `paradasRoutes` | Rotas `GET /`, `GET /proximas` e `GET /:id/proximas-partidas`. | Registra exatamente as três rotas vinculadas a `buscarParadas`, `getParadaProxima` e `getProximasPartidas`. |

---

## 4. Testes de middleware

| Middleware | Cenário | Resultado esperado |
|---|---|---|
| `authAdmin` | Token ausente ou malformado. | Retorna `401 Unauthorized`. |
| `authAdmin` | Token expirado ou inválido. | Retorna `401 Unauthorized`. |
| `authAdmin` | Usuário sem permissão de administrador. | Retorna `403 Forbidden`. |
| `authAdmin` | Token válido e usuário administrador. | Continua a requisição e adiciona os dados a `req.usuario`. |
| `authUsuario` | Cabeçalho `Authorization` ausente, sem esquema `Bearer`, token malformado, expirado ou sem `id` (RF16). | Retorna `401 Unauthorized`. |
| `authUsuario` | Token JWT válido de passageiro ou administrador (RF16). | Continua a requisição e popula `req.usuario` com os dados decodificados. |

---

## 5. Testes de interface (React Native)

| Tela / Componente | Caso / cenário | Resultado esperado |
|---|---|---|
| `AlertaBanner` e `AlertaBadge` | Renderização de banners e badges de sinalização de alertas (RF14). | Exibe cores e rótulos por tipo (`Desvio`, `Suspensão`, `Paralisação`, `Alteração de Horário`), contagem de múltiplos alertas, oculta quando não há alertas e aciona `onPress` para detalhes. |
| `LinhasScreen` | Carregamento, filtro, listagem, navegação, sinalização de alertas (RF14) e buscas recentes de linhas (RF18). | Exibe indicador de carregamento, permite filtrar por código ou nome, destaca visualmente linhas com `afetadaPorAlerta` (`AlertaBadge`), salva linhas/termos acessados no histórico e exibe chips clicáveis de buscas recentes para repetir a consulta ou abrir horários. |
| `HorariosScreen` | Carregamento, filtro por sentido/tipo de dia, banner de alerta da linha (RF14) e atalho para reporte (RF19). | Exibe os horários corretos, renderiza o `AlertaBanner` quando a linha possui alertas vigentes, navega para o itinerário e abre `ReportarDivergencia` com `HORARIO` e código da linha. |
| `ItinerarioScreen` | Carregamento do itinerário por sentido, alternância `Lista`/`Mapa` (RF08), sinalização de alertas (RF14), reporte (RF19), favoritar paradas (RF17) e acesso às próximas partidas da parada (RF11). | Lista as paradas em `IDA`/`VOLTA`, alterna para visualização do percurso no mapa com marcadores de início e fim, exibe alertas da linha/paradas, botão de favoritar, navega para `ProximasPartidas` ao tocar na parada e abre `ReportarDivergencia`. |
| `ProximasPartidasScreen` | Carregamento, listagem cronológica de próximas partidas em uma parada, alertas vigentes, atualização manual, estado vazio e navegação (RF11). | Exibe indicador de carregamento, lista partidas com linha, sentido, horário (`HH:MM`) e tempo restante (`Agora` / `em X min`), exibe alertas vigentes da parada, informa explicitamente quando não há mais partidas previstas no dia, trata erros com botão de tentar novamente e navega para `Horarios` ao tocar em uma partida. |
| `AlertasScreen` | Listagem, filtros, título/descrição, mensagens de erro e atualizações. | Exibe alertas vigentes com título, descrição e itens afetados, filtra por categoria, apresenta mensagens de lista vazia e de erro e utiliza `AsyncStorage`. |
| `AdminScreen` | Acesso, logout e navegação (incluindo atalho para análise de reportes — RF24). | Exibe *spinner*, controla o acesso restrito ou liberado, navega para `CriarAdmin`, `GerenciarUsuarios` e `AnalisarReportes` e remove os dados no logout. |
| `CadastroScreen` | Validação, cadastro e navegação. | Valida campos obrigatórios, exibe mensagens e indicador de carregamento e realiza a navegação. |
| `LoginScreen` | Validação, login, armazenamento, falhas e atalho de recuperação de senha (RF16). | Valida campos, exibe mensagens, salva o token, navega para `RecuperarSenha` levando o e-mail preenchido e apresenta erros e indicador de carregamento. |
| `RecuperarSenhaScreen` | Fluxo em duas etapas para solicitar código por e-mail e redefinir a senha (RF16). | Valida formato de e-mail, código de 6 dígitos, tamanho mínimo e confirmação da nova senha, permite reenviar código ou trocar e-mail e redireciona ao login após sucesso. |
| `ExcluirContaScreen` | Confirmação de senha e diálogo destrutivo para exclusão definitiva da própria conta (RF16). | Exige senha atual, solicita confirmação, chama `DELETE /usuarios/me`, limpa `AsyncStorage` (`@rotasdf_token`, `@rotasdf_usuario`, `@rotasdf_buscas_recentes`) e redireciona para `Linhas`. |
| `ConfiguracoesScreen` | Exibição de perfil, limpeza de histórico, logout, atalho para reporte (RF19) e exclusão de conta para passageiros (RF16). | Exibe dados do passageiro logado, navega para `ReportarDivergencia`, mostra *"Excluir minha conta"* apenas para passageiros autenticados e executa logout. |
| `dialogos` | Utilitário multiplataforma de alertas e confirmações (`mostrarAviso` e `confirmarAcao`) (RF16). | Utiliza `Alert.alert` no Android/iOS e `window.alert`/`window.confirm` na Web. |
| `BuscarTrajetoScreen` | GPS, permissão, edição manual de origem, autocomplete de paradas (`GET /paradas`), planejamento por horário (`Agora` / `Partida às` / `Chegada até` com máscara, atalhos e validação — RF06), buscas, buscas recentes de trajetos (RF18), alerta na parada de origem (RF14) e favoritos de parada/trajeto (RF17). | Trata permissão de GPS e localização, permite digitar outra origem manualmente e selecionar sugestões de paradas no destino, permite definir horário de partida ou chegada validando formato e exibindo aviso específico quando não há atendimento no período, salva e exibe buscas recentes (local + `/buscas-recentes`), exibe `AlertaBanner`, aceita origem/destino pré-preenchidos por rota, permite favoritar e navega com `{ opcoes, origem, destino, planejamentoHorario }`. |
| `planejamentoHorario` | Utilitário cliente de máscara `HH:MM` (`aplicarMascaraHorario`), validação (`validarHorarioTexto`) e formatação de resumo (`formatarResumoPlanejamento`) (RF06). | Formata dígitos em `HH:MM`, aceita apenas horários válidos (`00:00` a `23:59`) e gera resumos legíveis (`Partida às HH:MM` / `Chegada até HH:MM`). |
| `ResultadoTrajetoScreen` | Exibição com duração formatada em horas e minutos, selo de planejamento por horário (RF06), ordenação por menor tempo/menos baldeações/menor caminhada, filtro `Somente diretos`, selo de melhor opção e exibição de caminhada (RF05), navegação preservando dados, destaque de alertas (RF14) e favoritar trajeto pesquisado (RF17). | Exibe cartões de opções com duração formatada (`25 min`, `1h`, `1h 30min`), baldeações, distância de caminhada, badge do planejamento por horário quando informado, reordena e filtra opções dinamicamente com destaque na melhor opção e estado vazio com botão de limpar filtro, destaca `afetadaPorAlerta`, exibe `Origem → Destino` com `FavoritoEstrela` e navega para os detalhes preservando a opção selecionada. |
| `ordenarTrajetos` | Utilitário cliente de ordenação/filtragem (`ordenarEFiltrarTrajetos`), formatação de caminhada (`formatarCaminhada`) e selo da melhor opção (`obterSeloMelhorOpcao`) (RF05). | Ordena por `TEMPO`, `BALDEACOES` ou `CAMINHADA` sem mutar a lista original, combina com o filtro `somenteDiretos`, formata metros/quilômetros (`Sem caminhada`, `185 m a pé`, `1,3 km a pé`) e retorna o selo correspondente ao critério ativo. |
| `TrajetoDetalheScreen` | Exibição detalhada das etapas com duração em horas e minutos, alternância `Etapas`/`Ver no mapa` (RF04) e banner de alertas do trajeto (RF14). | Exibe duração total e por etapa formatadas em horas e minutos, mostra `AlertaBanner` quando o trajeto é afetado por alerta vigente, alterna para o `MapaTrajeto` exibindo trechos e marcadores (ou aviso quando não há coordenadas), lista etapas ordenadas com ícones e apresenta mensagem quando não há etapas. |
| `MapaTrajeto` e `mapaHtml` | Geração do mapa Leaflet/OpenStreetMap e renderização de trechos e marcadores de trajetos e itinerários (RF04 / RF08). | Diferencia visualmente trechos de ônibus (linha sólida colorida por linha) e trechos a pé/baldeação (linha tracejada), exibe marcadores `Embarque`, `Baldeação` e `Desembarque`, renderiza legenda e trata graciosamente ausência de coordenadas. |
| `buscasRecentesStorage` | Armazenamento local (`@rotasdf_buscas_recentes`), ordenação, deduplicação e mesclagem com histórico remoto (RF18). | Salva até 5 trajetos e 5 linhas recentes da mais recente para a mais antiga sem duplicatas, mescla histórico local e remoto e lê o `usuarioId` logado com tolerância a erros. |
| `formatarMetadadosLinha` | Formatação de cor por bacia (`obterCorLinha`), tarifa (`formatarTarifa`), extensão (`formatarExtensao`) e normalização de operadoras (`formatarOperadora`). | Normaliza hex de cores com fallback `#006666` para branco/inválido, formata valores em `R$ X,XX` e `X,X km`, padroniza operadoras por bacia do DF e substitui nomes de permissionários pessoa física por `Transporte Complementar (STPCR)`. |
| `GerenciarUsuariosScreen` | Listagem, filtros, navegação e erros. | Lista usuários, identifica o usuário atual, aplica filtros e apresenta alertas. |
| `CriarAdminScreen` | Cadastro, validação, mensagens e navegação. | Exibe campos e mensagens, indicador de carregamento e retorna após o sucesso. |
| `EditarUsuarioScreen` | Edição, validação, exclusão e mensagens. | Exibe campos, realiza validações, solicita confirmação de exclusão e apresenta alertas. |
| `FavoritoEstrela` | Botão de favoritar e desfavoritar um item (RF17). | Mostra estrela cheia ou vazia, alterna pelo store, avisa quando não foi possível (por exemplo, sem login) e se atualiza com a lista. |
| `FavoritosSecao` e `FavoritosCarregador` | Lista de linhas, paradas e trajetos favoritos em destaque na tela inicial e na aba Favoritos (RF17) com atalho de próximas partidas (RF11). | Mostra a dica quando não há favoritos, lista linhas (abre `Horarios`), paradas (abre `BuscarTrajeto` com origem e oferece botão **Partidas** para abrir `ProximasPartidas`) e trajetos (abre `BuscarTrajeto` com origem/destino); esconde-se sem passageiro logado. |
| `RodapeNavegacao` | Barra de abas Linhas e Favoritos com *safe area* inferior e ação `onPressAtiva` (voltar ao topo). | Marca a aba ativa, aplica `paddingBottom` conforme o recuo inferior da *safe area* do dispositivo, navega ao tocar na outra aba e dispara `onPressAtiva` (rolando a lista de linhas ao topo) ao tocar na aba já aberta. |
| `FavoritosScreen` | Aba Favoritos (RF17). | Carrega e lista os favoritos do passageiro; sem login, pede para entrar e leva à tela de login. |
| `AnalisarReportesScreen` | Listagem, filtros por status, exibição de badges/referências, navegação e tratamento de erros (RF24). | Exibe indicador de carregamento, lista reportes com tipo, status, linha/parada e autor, filtra por `Pendentes`/`Procedentes`/`Improcedentes`, navega para `DetalheReporte` e exibe avisos de erro. |
| `DetalheReporteScreen` | Classificação de reporte e registro da correção realizada pelo administrador (RF24). | Exibe detalhes do reporte, exige descrição da correção ao selecionar `Procedente`, permite `Improcedente`/`Pendente` sem observação obrigatória, chama `PATCH /admin/reportes/:id` e retorna após salvar. |
| `ReportarDivergenciaScreen` | Validação, pré-preenchimento de linha/parada e envio de reporte de divergência pelo passageiro (RF19). | Permite escolher `Horário`, `Parada` ou `Itinerário`, exige ao menos linha ou parada e descrição com no mínimo 10 caracteres, anexa `usuarioId` quando logado, chama `POST /reportes` e trata erros da API. |

---

## 6. Tratamento de erros e condições especiais

- Validação rigorosa de entradas vazias, inválidas ou mal formatadas.
- Mensagens claras para erros retornados pela API.
- Indicadores visuais para processos em andamento.
- Proteção contra ações não autorizadas, como rebaixamentos ou exclusões indevidas.
- Recuperação e apresentação adequada de informações em casos de falha de conexão.

---

## 7. Considerações finais

- Garantia de cobertura mínima de 80% nas regras de negócio e na interface.
- Uso de *mocks* para isolar os testes e garantir confiabilidade.
- Inclusão dos casos de teste nos pipelines de CI/CD para feedback contínuo.
- Documentação colaborativa para evolução contínua do plano de testes.

---

## 8. Cobertura de testes

A cobertura foi medida com `npx jest --coverage` nas pastas `api` e `mobile`, sobre a branch `developer` no commit `ae272234` (21/11/2026). A meta definida na seção 6.1 do Documento de Visão é de 80%.

| Módulo | Suítes | Testes | Statements | Branches | Funções | Linhas |
|---|---|---|---|---|---|---|
| API | 49 | 513 | 94,84% | 91,83% | 94,11% | 95,38% |
| Mobile | 28 | 344 | 89,32% | 83,23% | 81,96% | 89,84% |

Os dois módulos atendem à meta de 80% em todas as métricas. A medição é feita manualmente: o workflow de CI executa `npm test` sem a opção `--coverage`.
