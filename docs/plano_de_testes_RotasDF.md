# Plano de Testes — RotasDF

## Sumário

1. [Estratégia de testes](#1-estratégia-de-testes)

2. [Testes de repositórios](#2-testes-de-repositórios)

3. [Testes de serviços e controladores](#3-testes-de-serviços-e-controladores)

4. [Testes de middleware](#4-testes-de-middleware)

5. [Testes de interface (React Native)](#5-testes-de-interface-react-native)

6. [Testes de integração](#6-testes-de-integração)

7. [Testes de sistema](#7-testes-de-sistema)

8. [Tratamento de erros e condições especiais](#8-tratamento-de-erros-e-condições-especiais)

9. [Considerações finais](#9-considerações-finais)

10. [Cobertura de testes](#10-cobertura-de-testes)

---

## 1. Estratégia de testes

- **Testes unitários:** foco na validação isolada dos serviços, repositórios e controladores.

- **Testes funcionais de interface:** validação das telas React Native quanto à renderização, às interações e ao estado da interface.

- **Testes de integração:** na API, validação da comunicação entre Express e PostgreSQL real, com Testcontainers; no Mobile, validação integrada da tela `LinhasScreen` e suas interações, com a chamada à API simulada por mock.

- **Testes de sistema:** desenvolvidos na Sprint 4, verificando o funcionamento integrado das principais funcionalidades da API, incluindo autenticação, consultas, favoritos, recuperação de senha, administração, alertas e reportes.

Os testes unitários utilizam **mocks** para isolar dependências. Os testes de integração da API e os testes de sistema exercitam a persistência de dados no PostgreSQL. A integração de componentes do Mobile usa respostas simuladas da API e, portanto, **não valida uma conexão real entre aplicativo e backend**.

Os testes automatizados de sistema apresentados neste plano verificam os fluxos da API e do banco de dados. A validação das interações e da renderização da interface React Native é realizada separadamente pelos testes funcionais de interface.

As indicações `RFxx` associadas aos componentes e às suítes são referências de **rastreabilidade** à Tabela 9 (Backlog do Produto), seção 4.4 do documento *RotasDF — Visão do Produto e do Projeto*, versão 1.1.0. Elas identificam os requisitos relacionados aos cenários descritos, sem afirmar que cada requisito foi integralmente coberto. Componentes sem correspondência funcional direta no backlog foram mantidos sem código RF.

---

## 2. Testes de repositórios

### 2.1. `AlertasRepository` (RF13, RF14)

| Método | Cenário / objetivo | Resultado esperado |
|---|---|---|
| `findAlertasVigentes` | Retorna todos os alertas vigentes (considerando vigência e não encerrados). | Retorna uma lista ou propaga o erro. |
| `findAlertaVigenteById` | Retorna um alerta ativo pelo ID. | Retorna o alerta ou `null`; trata erros. |
| `findAlertasVigentesPorItens` | Retorna alertas vigentes que afetam uma lista de linhas e/ou paradas (RF14). | Retorna os alertas correspondentes, lista vazia sem ir ao banco quando os parâmetros são vazios, ou propaga o erro. |

### 2.2. `BuscasRecentesRepository` (RF18)

| Método | Cenário / objetivo | Resultado esperado |
|---|---|---|
| `salvarBusca` | Insere uma busca e retorna o registro. | Executa a consulta com os valores corretos. |
| `listarBuscasRecentes` | Lista buscas recentes com filtro. | Retorna uma lista ou uma lista vazia. |

### 2.3. `UsuariosRepository` (RF16)

| Método | Cenário / objetivo | Resultado esperado |
|---|---|---|
| `criar` | Insere um usuário sem expor a senha. | Executa a consulta corretamente e retorna o usuário. |
| `buscarPorEmail` | Busca um usuário pelo e-mail. | Retorna o usuário ou `null`. |
| `buscarPorId` | Busca um usuário pelo ID (RF16). | Retorna o usuário encontrado ou `null`. |
| `atualizarSenha` | Atualiza o hash da senha de um usuário pelo ID (RF16). | Executa `UPDATE usuarios SET senha_hash = $2 WHERE id = $1`. |
| `excluir` | Remove o registro do usuário pelo ID (RF16). | Executa a exclusão ou propaga o erro do banco. |

### 2.4. `ParadasRepository` (RF01, RF03)

| Método | Cenário / objetivo | Resultado esperado |
|---|---|---|
| `findNearestParada` | Busca a parada mais próxima. | Retorna a parada ou `null`. |
| `buscarPorNome` | Busca paradas ignorando acentos/caixa, com fronteira de palavras curtas e limite configurável. | Retorna as paradas correspondentes ordenadas por relevância ou lista vazia para termo vazio. |

### 2.5. `LinhasRepository` (RF07, RF08, RF10)

| Método | Cenário / objetivo | Resultado esperado |
|---|---|---|
| `findLinhas` | Busca linhas com ou sem filtros. | Retorna as linhas ou uma lista vazia. |
| `findItinerarioByLinhaId` | Busca o itinerário de uma linha. | Retorna o resultado ou uma lista vazia. |
| `findHorariosByLinhaId` | Busca os horários de uma linha. | Retorna os horários ou uma lista vazia. |

### 2.6. `TrajetosRepository` (RF01)

| Método | Cenário / objetivo | Resultado esperado |
|---|---|---|
| `buscarParadasPorNome` | Busca múltiplas paradas candidatas ignorando acentos, com aliases locais (ex.: **Rodoviária do Plano Piloto** → `ROD.PP`) e expansão em raio de 350 m para parada única. | Retorna até 15 paradas candidatas ordenadas por relevância ou lista vazia para termo vazio/inexistente. |
| `buscarRotasDiretas` | Busca rotas diretas aceitando listas ou IDs unitários de origem/destino, com ajuste de virada de meia-noite e diversidade de linhas. | Retorna até 8 opções diretas ordenadas por duração/horário ou lista vazia sem consultar o banco quando algum lado está vazio. |
| `buscarRotasComBaldeacao` | Busca rotas com 1 baldeação via CTEs materializadas por padrão `(linha_id, sentido)` e janela de espera de até 60 minutos. | Retorna até 5 opções com baldeação distintas por par de linhas ou lista vazia. |

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

### 3.1. `AlertasService` (RF13, RF14)

| Método | Cenário / objetivo | Resultado esperado |
|---|---|---|
| `listarAlertasVigentes` | Retorna alertas ou erros. | Retorna a lista correta ou um erro. |
| `obterAlertaVigente` | Retorna um alerta ativo pelo ID ou `null`. | Retorna os dados ou `null`; trata erros. |
| `vigentesPara` | Normaliza/deduplica IDs de linhas e paradas e busca alertas vigentes afetados (RF14). | Consulta o repositório com listas normalizadas ou retorna lista vazia quando não há itens válidos. |
| `filtrarAlertasParaItens` | Filtra alertas vigentes por linhas (ID/código) e paradas (ID/código/nome) (RF14). | Retorna apenas os alertas que afetam os itens informados. |
| `extrairItensDoTrajeto` | Extrai códigos de linhas e nomes/IDs de paradas das etapas de uma opção de trajeto (RF14). | Retorna as listas normalizadas de linhas e paradas envolvidas no trajeto. |

### 3.2. `BuscasRecentesService` (RF18)

| Método | Cenário / objetivo | Resultado esperado |
|---|---|---|
| `registrarBusca` | Valida e registra buscas. | Trata e retorna os dados corretamente. |
| `obterBuscasRecentes` | Lista buscas com parâmetros e valores padrão. | Retorna as buscas ou uma lista vazia. |

### 3.3. `UsuariosService` (RF16)

| Método | Cenário / objetivo | Resultado esperado |
|---|---|---|
| `cadastrar` | Valida os dados e realiza o cadastro. | Cria o usuário ou lança erros. |
| `login` | Realiza a autenticação e emite um token. | Retorna o token e o usuário, ou um erro. |
| `solicitarRecuperacaoSenha` | Gera código de 6 dígitos, invalida códigos anteriores, salva o hash com expiração de 15 min e dispara o envio por e-mail sem revelar se o e-mail existe (RF16). | Retorna mensagem padrão; rejeita com `400` se o e-mail estiver vazio. |
| `redefinirSenha` | Valida e-mail, código de 6 dígitos, limite de 5 tentativas e tamanho mínimo da nova senha (6 caracteres), atualizando o hash da senha (RF16). | Atualiza a senha e invalida o código utilizado, ou lança erro `400` para código inválido/expirado/excedido. |
| `excluirConta` | Valida a senha atual do passageiro autenticado e remove sua própria conta, bloqueando autoexclusão de administradores (RF16). | Exclui o passageiro com confirmação de senha ou lança erro `400`/`401`/`403`/`404`. |

### 3.4. `ParadasService` (RF01, RF03)

| Método | Cenário / objetivo | Resultado esperado |
|---|---|---|
| `obterParadaMaisProxima` | Busca a parada mais próxima usando latitude e longitude. | Retorna a parada, `null` ou um erro. |
| `buscarParadas` | Valida o termo mínimo (2 caracteres) e o limite (1–25) para autocomplete (`GET /paradas`). | Retorna lista vazia para termos curtos/vazios ou repassa termo aparado e limite ao repositório. |

### 3.5. `LinhasService` (RF07, RF08, RF10)

| Método | Cenário / objetivo | Resultado esperado |
|---|---|---|
| `obterLinhas` | Busca linhas com filtros ou por texto. | Retorna as linhas ou um erro. |
| `obterItinerario` | Retorna o itinerário pelo ID. | Retorna dados estruturados, `null` ou um erro. |
| `obterQuadroHorarios` | Retorna o quadro de horários. | Retorna os dados agrupados, `null` ou um erro. |

### 3.6. `TrajetosService` (RF01)

| Método | Cenário / objetivo | Resultado esperado |
|---|---|---|
| `obterTrajetos` | Resolve todas as paradas candidatas de origem e destino e combina rotas diretas e com baldeação. | Repassa todos os IDs candidatos ao repositório, retorna lista combinada de trajetos (diretas antes de baldeações) ou propaga erro. |

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
| `TrajetosController.getTrajetos` | Extrai linhas e paradas das etapas de cada opção e associa os alertas vigentes correspondentes. | Responde `200` com cada opção enriquecida com `afetadaPorAlerta` e `alertas`; mantém funcionamento caso o serviço de alertas falhe. |

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

---

## 4. Testes de middleware

| Middleware | Cenário | Resultado esperado |
|---|---|---|
| `authAdmin` (RF21) | Token ausente ou malformado. | Retorna `401 Unauthorized`. |
| `authAdmin` (RF21) | Token expirado ou inválido. | Retorna `401 Unauthorized`. |
| `authAdmin` (RF21) | Usuário sem permissão de administrador. | Retorna `403 Forbidden`. |
| `authAdmin` (RF21) | Token válido e usuário administrador. | Continua a requisição e adiciona os dados a `req.usuario`. |
| `authUsuario` (RF16) | Cabeçalho `Authorization` ausente, sem esquema `Bearer`, token malformado, expirado ou sem `id` (RF16). | Retorna `401 Unauthorized`. |
| `authUsuario` (RF16) | Token JWT válido de passageiro ou administrador (RF16). | Continua a requisição e popula `req.usuario` com os dados decodificados. |

---

## 5. Testes de interface (React Native)

| Tela / Componente | Caso / cenário | Resultado esperado |
|---|---|---|
| `AlertaBanner` e `AlertaBadge` (RF14) | Renderização de banners e badges de sinalização de alertas (RF14). | Exibe cores e rótulos por tipo (`Desvio`, `Suspensão`, `Paralisação`, `Alteração de Horário`), contagem de múltiplos alertas, oculta quando não há alertas e aciona `onPress` para detalhes. |
| `LinhasScreen` (RF07, RF14, RF18) | Carregamento, filtro, listagem, navegação, sinalização de alertas (RF14) e buscas recentes de linhas (RF18). | Exibe indicador de carregamento, permite filtrar por código ou nome, destaca visualmente linhas com `afetadaPorAlerta` (`AlertaBadge`), salva linhas/termos acessados no histórico e exibe chips clicáveis de buscas recentes para repetir a consulta ou abrir horários. |
| `HorariosScreen` (RF10, RF14, RF19) | Carregamento, filtro por sentido/tipo de dia, banner de alerta da linha (RF14) e atalho para reporte (RF19). | Exibe os horários corretos, renderiza o `AlertaBanner` quando a linha possui alertas vigentes, navega para o itinerário e abre `ReportarDivergencia` com `HORARIO` e código da linha. |
| `ItinerarioScreen` (RF08, RF14, RF17, RF19) | Carregamento do itinerário por sentido, sinalização de alertas (RF14), reporte (RF19) e favoritar paradas (RF17). | Lista as paradas em `IDA`/`VOLTA`, exibe alertas da linha/paradas, botão de favoritar em cada parada e navega para `ReportarDivergencia`. |
| `AlertasScreen` (RF13) | Listagem, filtros, título/descrição, mensagens de erro e atualizações. | Exibe alertas vigentes com título, descrição e itens afetados, filtra por categoria, apresenta mensagens de lista vazia e de erro e utiliza `AsyncStorage`. |
| `AdminScreen` (RF21, RF24) | Acesso, logout e navegação (incluindo atalho para análise de reportes — RF24). | Exibe **spinner**, controla o acesso restrito ou liberado, navega para `CriarAdmin`, `GerenciarUsuarios` e `AnalisarReportes` e remove os dados no logout. |
| `CadastroScreen` (RF16) | Validação, cadastro e navegação. | Valida campos obrigatórios, exibe mensagens e indicador de carregamento e realiza a navegação. |
| `LoginScreen` (RF16, RF21) | Validação, login, armazenamento, falhas e atalho de recuperação de senha (RF16). | Valida campos, exibe mensagens, salva o token, navega para `RecuperarSenha` levando o e-mail preenchido e apresenta erros e indicador de carregamento. |
| `RecuperarSenhaScreen` (RF16) | Fluxo em duas etapas para solicitar código por e-mail e redefinir a senha (RF16). | Valida formato de e-mail, código de 6 dígitos, tamanho mínimo e confirmação da nova senha, permite reenviar código ou trocar e-mail e redireciona ao login após sucesso. |
| `ExcluirContaScreen` (RF16) | Confirmação de senha e diálogo destrutivo para exclusão definitiva da própria conta (RF16). | Exige senha atual, solicita confirmação, chama `DELETE /usuarios/me`, limpa `AsyncStorage` (`@rotasdf_token`, `@rotasdf_usuario`, `@rotasdf_buscas_recentes`) e redireciona para `Linhas`. |
| `ConfiguracoesScreen` (RF16, RF19) | Exibição de perfil, limpeza de histórico, logout, atalho para reporte (RF19) e exclusão de conta para passageiros (RF16). | Exibe dados do passageiro logado, navega para `ReportarDivergencia`, mostra **"Excluir minha conta"** apenas para passageiros autenticados e executa logout. |
| `dialogos` (RF16) | Utilitário multiplataforma de alertas e confirmações (`mostrarAviso` e `confirmarAcao`) (RF16). | Utiliza `Alert.alert` no Android/iOS e `window.alert`/`window.confirm` na Web. |
| `BuscarTrajetoScreen` (RF01, RF03, RF14, RF17, RF18) | GPS, permissão, edição manual de origem, autocomplete de paradas (`GET /paradas`), buscas, buscas recentes de trajetos (RF18), alerta na parada de origem (RF14) e favoritos de parada/trajeto (RF17). | Trata permissão de GPS e localização, permite digitar outra origem manualmente e selecionar sugestões de paradas no destino, salva e exibe buscas recentes (local + `/buscas-recentes`) permitindo repeti-las com um toque, exibe `AlertaBanner`, aceita origem/destino pré-preenchidos por rota, permite favoritar a parada próxima ou o trajeto e navega com `{ opcoes, origem, destino }`. |
| `ResultadoTrajetoScreen` (RF01, RF02, RF14, RF17) | Exibição com duração formatada em horas e minutos, navegação por opções, destaque de alertas (RF14) e favoritar trajeto pesquisado (RF17). | Exibe cartões de opções com duração formatada (`25 min`, `1h`, `1h 30min`), baldeações, destaque `afetadaPorAlerta`, resumo `Origem → Destino` com `FavoritoEstrela` e navega para os detalhes. |
| `TrajetoDetalheScreen` (RF02, RF14) | Exibição detalhada das etapas com duração em horas e minutos e banner de alertas do trajeto (RF14). | Exibe duração total e por etapa formatadas em horas e minutos, mostra `AlertaBanner` quando o trajeto é afetado por alerta vigente, lista etapas ordenadas com ícones e apresenta mensagem quando não há etapas. |
| `buscasRecentesStorage` (RF18) | Armazenamento local (`@rotasdf_buscas_recentes`), ordenação, deduplicação e mesclagem com histórico remoto (RF18). | Salva até 5 trajetos e 5 linhas recentes da mais recente para a mais antiga sem duplicatas, mescla histórico local e remoto e lê o `usuarioId` logado com tolerância a erros. |
| `GerenciarUsuariosScreen` | Listagem, filtros, navegação e erros. | Lista usuários, identifica o usuário atual, aplica filtros e apresenta alertas. |
| `CriarAdminScreen` | Cadastro, validação, mensagens e navegação. | Exibe campos e mensagens, indicador de carregamento e retorna após o sucesso. |
| `EditarUsuarioScreen` | Edição, validação, exclusão e mensagens. | Exibe campos, realiza validações, solicita confirmação de exclusão e apresenta alertas. |
| `FavoritoEstrela` (RF17) | Botão de favoritar e desfavoritar um item (RF17). | Mostra estrela cheia ou vazia, alterna pelo store, avisa quando não foi possível (por exemplo, sem login) e se atualiza com a lista. |
| `FavoritosSecao` e `FavoritosCarregador` (RF17) | Lista de linhas, paradas e trajetos favoritos em destaque na tela inicial e na aba Favoritos (RF17). | Mostra a dica quando não há favoritos, lista linhas (abre `Horarios`), paradas (abre `BuscarTrajeto` com origem) e trajetos (abre `BuscarTrajeto` com origem/destino); esconde-se sem passageiro logado. |
| `RodapeNavegacao` | Barra de abas Linhas e Favoritos com **safe area** inferior e ação `onPressAtiva` (voltar ao topo). | Marca a aba ativa, aplica `paddingBottom` conforme o recuo inferior da **safe area** do dispositivo, navega ao tocar na outra aba e dispara `onPressAtiva` (rolando a lista de linhas ao topo) ao tocar na aba já aberta. |
| `FavoritosScreen` (RF17) | Aba Favoritos (RF17). | Carrega e lista os favoritos do passageiro; sem login, pede para entrar e leva à tela de login. |
| `AnalisarReportesScreen` (RF24) | Listagem, filtros por status, exibição de badges/referências, navegação e tratamento de erros (RF24). | Exibe indicador de carregamento, lista reportes com tipo, status, linha/parada e autor, filtra por `Pendentes`/`Procedentes`/`Improcedentes`, navega para `DetalheReporte` e exibe avisos de erro. |
| `DetalheReporteScreen` (RF24) | Classificação de reporte e registro da correção realizada pelo administrador (RF24). | Exibe detalhes do reporte, exige descrição da correção ao selecionar `Procedente`, permite `Improcedente`/`Pendente` sem observação obrigatória, chama `PATCH /admin/reportes/:id` e retorna após salvar. |
| `ReportarDivergenciaScreen` (RF19) | Validação, pré-preenchimento de linha/parada e envio de reporte de divergência pelo passageiro (RF19). | Permite escolher `Horário`, `Parada` ou `Itinerário`, exige ao menos linha ou parada e descrição com no mínimo 10 caracteres, anexa `usuarioId` quando logado, chama `POST /reportes` e trata erros da API. |

---

## 6. Testes de integração

### 6.1. Integração da API com PostgreSQL usando Testcontainers (RF07, RF08, RF10)

O teste de integração verifica se as rotas da API de linhas conseguem consultar dados armazenados em um banco PostgreSQL real, iniciado temporariamente por meio do Testcontainers.

**Tecnologias utilizadas:**

- Jest para execução dos testes.

- Supertest para realizar requisições HTTP à aplicação Express.

- Testcontainers para iniciar um container PostgreSQL.

- PostgreSQL 15 (`postgres:15-alpine`) como banco de dados de teste.

- `pg` para conectar ao banco e preparar os dados iniciais.

#### 6.1.1. Preparação do ambiente

1. É iniciado um container PostgreSQL temporário.

2. As variáveis de ambiente (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` e `DB_NAME`) são configuradas com os dados fornecidos pelo container.

3. O arquivo `infrastructure/init.sql` é executado para criar a estrutura do banco.

4. São inseridos dados de teste nas tabelas de calendário, linhas, paradas, viagens e horários das paradas.

5. A aplicação Express é carregada após a configuração das variáveis de ambiente, para utilizar o banco temporário.

#### 6.1.2. Casos de teste

| Rota | Cenário / objetivo | Resultado esperado |
|---|---|---|
| `GET /api/v1/linhas?busca=0.600` | Busca uma linha pelo código no PostgreSQL. | Retorna HTTP `200`, uma linha e os dados esperados (`codigo: 0.600`, `nome: Planaltina`). |
| `GET /api/v1/linhas/1/itinerario` | Consulta o itinerário da linha cadastrada no banco. | Retorna HTTP `200`, o código da linha e duas paradas no sentido `IDA`, com a primeira parada identificada como `Terminal`. |
| `GET /api/v1/linhas/1/horarios` | Consulta o quadro de horários da linha cadastrada. | Retorna HTTP `200` e o horário `05:00` no quadro de horários do sentido `IDA` para `DIA_UTIL`. |

#### 6.1.3. Isolamento de dependências externas

No teste de integração da API de linhas, o serviço `alertasService` é simulado. Essa decisão mantém o foco do teste nas rotas de linhas e na integração dessas rotas com o PostgreSQL, evitando que dependências do módulo de alertas interfiram no resultado.

Portanto, o banco de dados utilizado para as consultas de linhas é real, mas o serviço de alertas não é exercitado de forma integrada nesse conjunto de testes.

#### 6.1.4. Encerramento

Após a execução:

- A conexão auxiliar `Client`, utilizada para criar o esquema e preparar os dados, é encerrada.

- O pool de conexões PostgreSQL utilizado pela aplicação é encerrado com `pool.end()`.

- O container PostgreSQL é interrompido **depois** do encerramento das conexões, evitando o erro `57P01` de conexão terminada durante a parada do banco.

#### 6.1.5. Resultado observado na execução local

Em **22/11/2026**, a suíte `api/src/tests/Integração/linhas.integration.test.js` foi executada com Jest, Supertest e PostgreSQL temporário via Testcontainers. O resultado informado pelo Jest foi **PASS**, com tempo de aproximadamente **5,152 segundos**.

| Caso de teste | Resultado |
|---|---|
| `GET /api/v1/linhas?busca=0.600` | Aprovado |
| `GET /api/v1/linhas/1/itinerario` | Aprovado |
| `GET /api/v1/linhas/1/horarios` | Aprovado |

**Total desta suíte:** 1 suíte aprovada e 3 casos de teste aprovados. A mensagem informativa do `dotenv` exibida no console não altera o resultado `PASS`. Este resultado comprova a execução **local**, não uma aprovação já verificada no GitHub Actions.

### 6.2. Integração de componentes do Mobile — `LinhasScreen` (RF07)

O teste de integração do Mobile, apresentado no arquivo `linhas.integration.test.js`, exercita conjuntamente a tela React Native `LinhasScreen`, seus estados de carregamento, entrada de busca, renderização da lista e navegação. A função `getLinhas` do serviço de API é **simulada com Jest**, assim como as funções de buscas recentes; os ícones do Expo também são simulados.

**Tecnologias utilizadas:** Jest, React Native Testing Library (`render`, `screen`, `fireEvent`, `waitFor`) e mocks de dependências externas.

| Caso | Cenário / objetivo | Resultado esperado |
|---|---|---|
| 1. Carregamento e listagem | Renderizar a tela e aguardar o retorno simulado de duas linhas (`0.600` e `0.110`). | Apresentar o carregamento e exibir os códigos e nomes das linhas retornadas. |
| 2. Filtragem em tempo real | Digitar `0.110` no campo de busca. | Exibir a linha correspondente e remover `0.600` da lista visível. |
| 3. Busca sem resultados | Digitar `Linha Fantasma` no campo de busca. | Exibir a mensagem de nenhum resultado encontrado. |
| 4. Navegação | Pressionar o card da linha `0.600`. | Chamar a navegação para `Horarios`, com `{ linhaId: '1' }`. |

**Escopo e limitações:** são quatro casos escritos para a integração de componentes da interface, **não** para integração real Mobile–API–PostgreSQL. Nenhum banco de dados ou Docker é necessário nessa suíte. A execução bem-sucedida desses quatro casos **ainda não foi comprovada por um log enviado**; portanto, ficam registrados como casos implementados/propostos, com resultado pendente de confirmação.

Os caminhos relativos dos imports e mocks precisam corresponder à estrutura real do projeto Mobile. O diretório `Integração` e o padrão de nome `*.integration.test.js` devem coincidir com a configuração do Jest.

### 6.3. Separação de execução por tipo de teste

A execução isolada facilita o diagnóstico e evita que testes dependentes de PostgreSQL/Docker sejam iniciados durante a suíte unitária. Abaixo estão os **scripts sugeridos** para os respectivos arquivos `package.json`; a aplicação efetiva dessas alterações deve ser conferida no repositório.

**API — seção `scripts` do `api/package.json`:**

```json
{
  "test": "jest --testPathIgnorePatterns=\"sistema|Integração\"",
  "test:sistema": "jest --config jest.sistema.config.js --runInBand",
  "test:integracao": "jest --runInBand Integração"
}
```

**Mobile — comandos a incorporar à seção `scripts` de `mobile/package.json`, preservando os demais scripts (por exemplo, `start`, `android`, `ios` e `web`):**

```json
{
  "test": "jest --testPathIgnorePatterns=Integração",
  "test:integracao": "jest --runInBand Integração"
}
```

| Diretório | Comando | Finalidade |
|---|---|---|
| `api` | `npm test` | Executar os testes comuns da API, excluindo `sistema` e `Integração`. |
| `api` | `npm run test:integracao` | Executar os testes da pasta `Integração` da API, com Testcontainers. |
| `api` | `npm run test:sistema` | Executar as suítes pelo `jest.sistema.config.js`, com PostgreSQL de teste. |
| `mobile` | `npm test` | Executar os testes comuns do Mobile, excluindo `Integração`. |
| `mobile` | `npm run test:integracao` | Executar os testes de integração de componentes do Mobile. |

Os comandos foram separados por diretório: executar o script de integração da API dentro de `api` e o do Mobile dentro de `mobile`. O filtro pelo nome `Integração` pressupõe que as suítes estejam nesse diretório, incluindo o acento e a mesma capitalização, principalmente no CI Linux.

### 6.4. Estado da integração com CI/CD

- **Testes comuns:** os workflows que usam `npm test` passam a executar apenas os testes não excluídos quando os scripts acima estiverem aplicados.

- **Testes de sistema da API:** há configuração documentada em `ci-sistema-api.yml`, que utiliza `npm run test:sistema` e um serviço PostgreSQL.

- **Integração da API:** o resultado local está aprovado. Ainda é necessário **confirmar ou configurar** no GitHub Actions um job que execute `npm run test:integracao` em ambiente com Docker e as dependências instaladas com `npm ci`.

- **Integração do Mobile:** ainda é necessário executar os quatro casos localmente e adicionar ou confirmar sua execução no CI com `npm run test:integracao` no diretório `mobile`.

**Não se deve registrar aprovação no CI de nenhuma dessas suítes de integração sem o respectivo resultado do workflow.**

---

## 7. Testes de sistema

### 7.1. Objetivo e escopo

Os testes de sistema verificam os principais fluxos funcionais da API do RotasDF, exercitando a aplicação Express e sua comunicação com o banco PostgreSQL.

Diferentemente dos testes unitários, esses testes realizam requisições HTTP por meio do Supertest, verificando a execução conjunta das rotas, dos controladores, dos serviços, dos repositórios e da persistência de dados.

**Tecnologias utilizadas:**

- Jest para organização e execução dos testes automatizados.

- Supertest para realizar requisições HTTP à aplicação Express.

- PostgreSQL para persistência dos dados durante os testes.

- `pg` para preparação e consultas ao banco de dados.

- `bcrypt` e `jsonwebtoken` para apoiar os cenários de autenticação.

- GitHub Actions para execução automatizada em CI/CD.

Os testes de sistema estão organizados em seis suítes, cada uma responsável por verificar um conjunto específico de funcionalidades da API.

### 7.2. Organização das suítes

| Arquivo | Funcionalidades verificadas |
|---|---|
| `consultas.sistema.js` (RF01, RF03, RF07, RF08, RF10) | Consultas de linhas, itinerários, horários, paradas e trajetos. |
| `passageiro.sistema.js` (RF16, RF17, RF18) | Cadastro, login, favoritos, buscas recentes e exclusão da própria conta. |
| `recuperacaoSenha.sistema.js` (RF16) | Solicitação de códigos, redefinição e regras de segurança da recuperação de senha. |
| `administracao.sistema.js` (RF21) | Controle de acesso, criação de administradores, listagem, atualização e exclusão de usuários. |
| `alertas.sistema.js` (RF13, RF14, RF22) | Gerenciamento, vigência e sinalização de alertas nas consultas públicas. |
| `reportes.sistema.js` (RF19, RF24) | Registro, consulta, análise, classificação e reabertura de reportes de divergência. |

### 7.3. Preparação do ambiente

A execução das suítes utiliza os arquivos `ambiente.js`, `auxiliares.js`, `preparoBanco.js` e `jest.sistema.config.js`.

#### 7.3.1. Configuração das variáveis de ambiente

O arquivo `ambiente.js` configura:

- `NODE_ENV=test`, identificando o ambiente de testes.

- `JWT_SECRET`, contendo um segredo próprio para os testes.

- `RECUPERACAO_SENHA_EXPOR_CODIGO=true`, permitindo a verificação automatizada do código de recuperação.

- `DB_NAME`, utilizando o valor de `DB_NAME_SISTEMA` ou o nome padrão `rotasdf_teste`.

#### 7.3.2. Preparação do banco de dados

O arquivo `preparoBanco.js` é responsável por preparar a base utilizada pelos testes.

**Etapas realizadas:**

1. Valida o nome do banco, exigindo que contenha `test`.

2. Conecta-se ao servidor PostgreSQL.

3. Cria o banco de testes caso ele ainda não exista.

4. Executa o esquema definido em `infrastructure/init.sql`.

5. Limpa as tabelas utilizadas pelos cenários.

6. Insere dados controlados de linhas, paradas, calendários, viagens e horários.

Os dados iniciais incluem três linhas fictícias (`Sistema Alfa`, `Sistema Beta` e `Sistema Gama`), seis paradas e viagens de ida e volta.

#### 7.3.3. Funções auxiliares

O arquivo `auxiliares.js` contém funções reutilizáveis:

| Função | Finalidade |
|---|---|
| `api` | Realiza requisições HTTP à aplicação Express utilizando Supertest. |
| `cabecalho` | Prepara o cabeçalho de autorização com token JWT. |
| `emailUnico` | Gera e-mails diferentes para os testes. |
| `isoEmHoras` | Gera datas relativas ao horário atual. |
| `cadastrarPassageiro` | Cadastra um passageiro para os cenários. |
| `logar` | Realiza a autenticação de um usuário. |
| `criarPassageiroLogado` | Prepara um passageiro autenticado. |
| `criarAdminLogado` | Prepara um administrador autenticado. |
| `resetarDados` | Limpa os dados transacionais utilizados pelas suítes. |
| `encerrarConexoes` | Encerra o pool de conexões PostgreSQL. |

### 7.4. Casos de teste

#### 7.4.1. Consultas públicas — `consultas.sistema.js` (RF01, RF03, RF07, RF08, RF10)

| Funcionalidade | Cenário / objetivo | Resultado esperado |
|---|---|---|
| Listagem de linhas | Consultar as linhas cadastradas sem alertas vigentes. | Retorna HTTP `200`, as linhas esperadas e nenhuma sinalização de alerta. |
| Busca por código e nome | Pesquisar linhas pelo código ou nome, independentemente de maiúsculas e minúsculas. | Retorna somente as linhas correspondentes. |
| Busca sem resultados | Consultar linha inexistente. | Retorna HTTP `200` e lista vazia. |
| Itinerário | Consultar paradas de ida e volta. | Retorna as paradas na ordem correta. |
| Coordenadas | Verificar latitude e longitude das paradas. | Retorna coordenadas numéricas. |
| Validação de itinerário | Consultar utilizando ID inválido. | Retorna HTTP `400`. |
| Itinerário inexistente | Consultar linha sem itinerário. | Retorna HTTP `404`. |
| Quadro de horários | Consultar horários por sentido e tipo de dia. | Retorna horários agrupados e ordenados. |
| Horários por linha | Consultar horários de uma linha específica. | Retorna somente os horários correspondentes. |
| Horários inexistentes | Consultar linha sem quadro de horários. | Retorna HTTP `404`. |
| Busca de paradas | Pesquisar paradas pelo nome. | Retorna os resultados priorizando correspondências exatas. |
| Limite de paradas | Consultar paradas informando um limite. | Respeita a quantidade solicitada. |
| Normalização da busca | Pesquisar paradas com diferenças de acentuação e capitalização. | Retorna os resultados correspondentes. |
| Termos curtos ou ausentes | Consultar paradas sem termo adequado. | Retorna lista vazia. |
| Parada mais próxima | Consultar a parada mais próxima utilizando coordenadas. | Retorna a parada correspondente. |
| Validação de coordenadas | Consultar sem latitude ou longitude válidas. | Retorna erro de validação. |
| Trajetos diretos | Consultar origem e destino conectados por uma viagem direta. | Retorna opções sem baldeação, organizadas por horário. |
| Trajetos com baldeação | Consultar um percurso que exige troca de linha. | Retorna opção com baldeação. |
| Validação de trajetos | Informar origem ou destino ausente ou inexistente. | Retorna erro ou lista vazia, conforme o cenário. |
| Sentido da viagem | Consultar percurso no sentido contrário ao disponível. | Não retorna rota incompatível. |

#### 7.4.2. Jornada do passageiro — `passageiro.sistema.js` (RF16, RF17, RF18)

| Funcionalidade | Cenário / objetivo | Resultado esperado |
|---|---|---|
| Cadastro | Cadastrar passageiro com dados válidos. | Retorna HTTP `201`, sem expor dados sensíveis. |
| E-mail duplicado | Cadastrar usuário com e-mail existente. | Retorna HTTP `400`. |
| Campos obrigatórios | Cadastrar usuário sem informações necessárias. | Retorna HTTP `400` e mensagem apropriada. |
| Login | Autenticar passageiro cadastrado. | Retorna HTTP `200`, token JWT e dados do usuário. |
| Falha de autenticação | Informar senha errada ou e-mail inexistente. | Retorna HTTP `401` com mensagem padronizada. |
| Autorização de favoritos | Consultar favoritos sem token ou com token inválido. | Retorna HTTP `401`. |
| Lista inicial | Consultar favoritos de passageiro sem registros. | Retorna lista vazia. |
| Favoritar linha | Adicionar linha aos favoritos. | Retorna HTTP `201` com dados da linha. |
| Favoritar parada | Adicionar parada aos favoritos. | Retorna HTTP `201` com dados da parada. |
| Favoritar trajeto | Adicionar trajeto aos favoritos. | Retorna HTTP `201` com origem e destino. |
| Duplicidade | Tentar adicionar favorito já cadastrado. | Retorna HTTP `409`. |
| Validação de favoritos | Informar tipo inválido ou dados incorretos. | Retorna HTTP `400`. |
| Referência inexistente | Favoritar linha ou parada inexistente. | Retorna HTTP `404`. |
| Listagem de favoritos | Consultar favoritos cadastrados. | Retorna os itens associados ao passageiro. |
| Isolamento de dados | Consultar favoritos de diferentes passageiros. | Cada passageiro visualiza somente seus registros. |
| Remoção | Excluir favorito cadastrado. | Remove o registro e impede nova exclusão do mesmo item. |
| Validação da remoção | Informar ID inválido. | Retorna erro de validação. |
| Restrição administrativa | Administrador tenta utilizar favoritos. | Bloqueia a operação. |
| Buscas recentes | Registrar busca com origem e destino. | Registra a busca associada ao usuário. |
| Validação de busca | Registrar busca sem origem ou destino. | Retorna HTTP `400`. |
| Histórico de buscas | Listar buscas recentes. | Retorna os registros ordenados e respeita o limite. |
| Exclusão da própria conta | Passageiro solicita exclusão com senha correta. | Exclui a conta e os dados relacionados. |
| Validação da exclusão | Solicitar exclusão sem autenticação ou confirmação válida. | Bloqueia a operação. |
| Restrição administrativa | Administrador tenta excluir a própria conta pela rota de passageiro. | Bloqueia a operação. |

#### 7.4.3. Recuperação de senha — `recuperacaoSenha.sistema.js` (RF16)

| Funcionalidade | Cenário / objetivo | Resultado esperado |
|---|---|---|
| Solicitação de código | Solicitar recuperação sem e-mail. | Retorna HTTP `400`. |
| Privacidade | Solicitar código para e-mail cadastrado ou desconhecido. | Retorna a mesma mensagem pública. |
| Geração de código | Solicitar recuperação para usuário cadastrado. | Gera código de seis dígitos e armazena seu hash. |
| Validação da redefinição | Omitir e-mail, código ou nova senha. | Retorna HTTP `400`. |
| Tamanho da senha | Informar nova senha com menos de seis caracteres. | Retorna HTTP `400`. |
| E-mail desconhecido | Solicitar redefinição para conta inexistente. | Não revela a existência da conta. |
| Código correto | Redefinir senha utilizando código válido. | Altera a senha e permite login com a nova senha. |
| Senha anterior | Tentar login com senha antiga após redefinição. | Retorna HTTP `401`. |
| Reutilização | Utilizar novamente um código consumido. | Retorna HTTP `400`. |
| Código incorreto | Informar código errado. | Incrementa o contador de tentativas e preserva a senha antiga. |
| Limite de tentativas | Realizar cinco tentativas incorretas. | Bloqueia o código e exige nova solicitação. |
| Expiração | Utilizar código após o prazo de validade. | Retorna HTTP `400`. |
| Novo código | Solicitar outro código antes de utilizar o anterior. | Invalida o código antigo e aceita o novo. |

#### 7.4.4. Administração de usuários — `administracao.sistema.js` (RF21)

| Funcionalidade | Cenário / objetivo | Resultado esperado |
|---|---|---|
| Acesso sem token | Consultar rotas administrativas sem autenticação. | Retorna HTTP `401`. |
| Acesso de passageiro | Tentar acessar área administrativa como passageiro. | Retorna HTTP `403`. |
| Acesso de administrador | Consultar perfil administrativo com token válido. | Retorna HTTP `200`. |
| Proteção das operações | Passageiro tenta listar, criar, atualizar ou excluir usuários. | Retorna HTTP `403`. |
| Criação de administrador | Criar administrador e realizar login na nova conta. | Retorna HTTP `201` e permite acesso à área administrativa. |
| Validação de cadastro | Criar administrador com campos ausentes, senha curta ou e-mail duplicado. | Retorna HTTP `400`. |
| Listagem de usuários | Consultar todos os usuários. | Retorna a lista sem expor hashes de senha. |
| Filtro de usuários | Filtrar usuários pelo tipo. | Retorna somente os registros correspondentes. |
| Atualização de dados | Alterar nome de passageiro. | Retorna os dados atualizados. |
| Alteração de senha | Modificar a senha de usuário. | Aceita login com a senha nova e rejeita a anterior. |
| Promoção de usuário | Alterar perfil de passageiro para administrador. | Atualiza o tipo do usuário. |
| Validação de atualização | Enviar dados inválidos. | Retorna erro de validação. |
| Autorrestrição | Administrador tenta rebaixar a própria conta. | Impede a operação. |
| Exclusão de passageiro | Excluir passageiro cadastrado. | Remove o registro. |
| Exclusão de administrador | Excluir outro administrador quando permitido. | Remove o registro. |
| Proteção da própria conta | Administrador tenta excluir a própria conta. | Bloqueia a exclusão. |
| Usuário inexistente | Excluir usuário não cadastrado. | Retorna HTTP `404`. |

#### 7.4.5. Gerenciamento de alertas — `alertas.sistema.js` (RF13, RF14, RF22)

| Funcionalidade | Cenário / objetivo | Resultado esperado |
|---|---|---|
| Acesso sem token | Consultar gerenciamento de alertas sem autenticação. | Retorna HTTP `401`. |
| Acesso de passageiro | Tentar gerenciar alertas com perfil de passageiro. | Retorna HTTP `403`. |
| Tipo inválido | Criar alerta com tipo não permitido. | Retorna HTTP `400`. |
| Campos obrigatórios | Criar alerta sem título ou descrição válida. | Retorna HTTP `400`. |
| Datas inválidas | Informar datas incorretas ou fim anterior ao início. | Retorna HTTP `400`. |
| Listas inválidas | Informar linhas ou paradas fora do formato esperado. | Retorna HTTP `400`. |
| Criação de alerta | Criar alerta vinculado a linha e parada. | Registra os relacionamentos esperados. |
| Vigência | Consultar alertas ativos. | Retorna os alertas vigentes com seus itens afetados. |
| Consulta individual | Consultar alerta pelo ID. | Retorna os dados ou HTTP `404`. |
| Filtros | Filtrar alertas por linha ou parada. | Retorna somente os registros correspondentes. |
| Sinalização de linhas | Consultar linhas afetadas e não afetadas. | Identifica corretamente os alertas associados. |
| Sinalização de itinerário | Consultar itinerário com parada afetada. | Marca somente os elementos relacionados ao alerta. |
| Sinalização de horários | Consultar quadro de horários de linha afetada. | Retorna a sinalização apropriada. |
| Sinalização de paradas | Consultar parada afetada por alerta. | Identifica corretamente a parada afetada. |
| Sinalização de trajetos | Buscar trajetos que passam por linhas ou paradas afetadas. | Identifica as opções atingidas. |
| Edição de alerta | Alterar título e itens afetados. | Atualiza os dados do alerta. |
| Listagem administrativa | Consultar alertas na área administrativa. | Retorna os registros com informações relacionadas. |
| Exclusão de alerta vigente | Tentar excluir alerta em andamento. | Impede a exclusão. |
| Encerramento | Encerrar alerta vigente. | Altera sua situação e remove o alerta da listagem de vigentes. |
| Operações repetidas | Encerrar novamente ou editar alerta encerrado. | Bloqueia a operação. |
| Exclusão após encerramento | Excluir alerta encerrado. | Permite a exclusão. |
| Identificadores inválidos | Editar, encerrar ou excluir alerta com ID incorreto. | Retorna erro apropriado. |
| Alerta futuro | Consultar alerta cuja vigência ainda não começou. | Não aparece ao passageiro, mas permanece acessível administrativamente. |
| Alerta expirado | Consultar alerta após o período de vigência. | Não aparece na listagem pública de vigentes. |
| Busca administrativa de paradas | Pesquisar paradas pelo nome ou código. | Retorna resultados correspondentes e lista vazia para buscas muito curtas. |

#### 7.4.6. Reportes de divergência — `reportes.sistema.js` (RF19, RF24)

| Funcionalidade | Cenário / objetivo | Resultado esperado |
|---|---|---|
| Registro de reporte | Registrar divergência vinculada a usuário e linha. | Retorna HTTP `201` e status `PENDENTE`. |
| Normalização | Registrar reporte somente com parada e tipo em letras minúsculas. | Normaliza o tipo e aceita os campos opcionais. |
| Tipo inválido | Informar tipo de divergência não permitido. | Retorna HTTP `400`. |
| Descrição inválida | Informar descrição com menos de dez caracteres. | Retorna HTTP `400`. |
| Referência ausente | Registrar reporte sem linha nem parada. | Retorna HTTP `400`. |
| Acesso sem token | Tentar acessar análise de reportes sem autenticação. | Retorna HTTP `401`. |
| Acesso de passageiro | Passageiro tenta consultar área administrativa de reportes. | Retorna HTTP `403`. |
| Listagem | Consultar reportes cadastrados. | Retorna os registros esperados. |
| Filtros | Filtrar reportes por status e tipo. | Retorna somente os registros correspondentes. |
| Filtros inválidos | Informar tipo ou status desconhecido. | Retorna HTTP `400`. |
| Detalhamento | Consultar reporte com informações do passageiro. | Retorna os dados associados à ocorrência. |
| ID inválido | Consultar reporte com identificador malformado. | Retorna HTTP `400`. |
| Registro inexistente | Consultar reporte não cadastrado. | Retorna HTTP `404`. |
| Validação da análise | Informar status inválido ou dados insuficientes. | Retorna erro de validação. |
| Classificação procedente | Analisar reporte como `PROCEDENTE`. | Atualiza o status e registra a correção realizada. |
| Campo alternativo | Informar correção pelo campo `correcaoRealizada`. | Aceita a informação na análise. |
| Classificação improcedente | Analisar reporte como `IMPROCEDENTE`. | Atualiza o status sem exigir observação. |
| Ordenação | Consultar reportes após análises. | Mantém registros pendentes com prioridade na listagem. |
| Reabertura | Alterar reporte analisado para `PENDENTE`. | Reabre o registro e limpa a data de análise. |

### 7.5. Configuração e execução dos testes

O arquivo `jest.sistema.config.js` configura a execução das suítes de sistema.

**Configurações utilizadas:**

- Ambiente de execução: `node`.

- Padrão de arquivos: `src/tests/sistema/**/*.sistema.js`.

- Inicialização de variáveis de ambiente por `ambiente.js`.

- Preparação global do banco por `preparoBanco.js`.

- Tempo limite por teste de 30 segundos.

- Execução com um trabalhador (`maxWorkers: 1`).

O comando utilizado pelo workflow para executar as suítes é:

`npm run test:sistema`

A execução pressupõe que esse script esteja configurado no `package.json` da API.

### 7.6. Integração com CI/CD

O arquivo `ci-sistema-api.yml` configura a execução automática dos testes de sistema da API no GitHub Actions.

O workflow é acionado em eventos de `push` e `pull_request` nas branches `developer` e `main`.

**Etapas do pipeline:**

1. Inicializa um ambiente Ubuntu.

2. Disponibiliza PostgreSQL 15 usando a imagem `postgres:15-alpine`.

3. Configura Node.js 20.

4. Instala as dependências da API utilizando `npm ci`.

5. Configura as variáveis de conexão ao banco.

6. Executa `npm run test:sistema`.

O workflow utiliza `api` como diretório de trabalho.

### 7.7. Isolamento e encerramento

Os testes utilizam dados controlados para garantir previsibilidade e evitar interferência de registros externos.

O arquivo `preparoBanco.js` prepara a estrutura e os dados iniciais. A função `resetarDados` limpa as tabelas transacionais utilizadas pelos cenários.

Os usuários necessários são criados pelas funções auxiliares, permitindo validar autenticação, permissões e isolamento dos dados entre usuários.

Ao final das suítes, a função `encerrarConexoes` encerra o pool PostgreSQL.

Diferentemente do teste de integração descrito na seção 6, os testes de sistema utilizam uma instância PostgreSQL configurada no ambiente local ou disponibilizada como serviço no GitHub Actions, sem inicializá-la diretamente pelo Testcontainers.

### 7.8. Critérios de avaliação

A avaliação dos testes considera:

- Retorno dos códigos HTTP esperados.

- Correspondência entre respostas da API e registros no PostgreSQL.

- Validação das regras de negócio.

- Funcionamento da autenticação e autorização.

- Proteção das rotas administrativas.

- Isolamento dos dados entre usuários.

- Persistência, atualização e exclusão corretas dos registros.

- Tratamento de entradas inválidas e informações inexistentes.

- Funcionamento dos fluxos de cadastro, login, recuperação de senha, consultas, favoritos, alertas e reportes.

Os arquivos fornecidos contêm os testes e seus resultados esperados. A aprovação ou reprovação efetiva de cada caso depende da execução das suítes no ambiente configurado.

---

## 8. Tratamento de erros e condições especiais

- Validação rigorosa de entradas vazias, inválidas ou mal formatadas.

- Mensagens claras para erros retornados pela API.

- Indicadores visuais para processos em andamento.

- Proteção contra ações não autorizadas, como rebaixamentos ou exclusões indevidas.

- Recuperação e apresentação adequada de informações em casos de falha de conexão.

---

## 9. Considerações finais

- Garantia de cobertura mínima de 80% nas regras de negócio e na interface.

- Uso de **mocks** para isolar os testes e garantir confiabilidade.

- Execução de testes comuns e de sistema em seus respectivos fluxos de CI/CD; a execução automática das suítes de integração da API e do Mobile deve ser confirmada ou adicionada aos workflows.

- Documentação colaborativa para evolução contínua do plano de testes.

---

## 10. Cobertura de testes

A cobertura foi medida com `npx jest --coverage` nas pastas `api` e `mobile`, sobre a branch `developer` no commit `ae272234` (21/11/2026). A meta definida na seção 6.1 do Documento de Visão é de 80%.

| Módulo | Suítes | Testes | Statements | Branches | Funções | Linhas |
|---|---|---|---|---|---|---|
| API | 49 | 513 | 94,84% | 91,83% | 94,11% | 95,38% |
| Mobile | 28 | 344 | 89,32% | 83,23% | 81,96% | 89,84% |

Os dois módulos atendem à meta de 80% em todas as métricas. A medição é feita manualmente: o workflow de CI executa `npm test` sem a opção `--coverage`.

Os valores apresentados correspondem ao commit e à data informados. A inclusão das suítes de sistema e de integração neste plano não altera retroativamente essa medição. Para atualizar as quantidades e os percentuais de cobertura, é necessária uma nova execução com os testes incorporados à branch avaliada.

Como referência de execução, houve **49 suítes e 513 testes aprovados** nos testes comuns da API, além da **suíte de integração da API com 3 casos aprovados**. São conjuntos distintos e não uma nova medição consolidada de cobertura. O Mobile tem **4 casos de integração de componentes descritos**, mas sua aprovação ainda precisa ser demonstrada por uma execução do Jest.