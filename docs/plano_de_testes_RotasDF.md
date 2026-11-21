# Plano de Testes — RotasDF

## Sumário

1. [Estratégia de testes](#1-estratégia-de-testes)
2. [Testes de repositórios](#2-testes-de-repositórios)
3. [Testes de serviços e controladores](#3-testes-de-serviços-e-controladores)
4. [Testes de middleware](#4-testes-de-middleware)
5. [Testes de interface (React Native)](#5-testes-de-interface-react-native)
6. [Tratamento de erros e condições especiais](#6-tratamento-de-erros-e-condições-especiais)
7. [Considerações finais](#7-considerações-finais)

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

### 2.5. `LinhasRepository`

| Método | Cenário / objetivo | Resultado esperado |
|---|---|---|
| `findLinhas` | Busca linhas com ou sem filtros. | Retorna as linhas ou uma lista vazia. |
| `findItinerarioByLinhaId` | Busca o itinerário de uma linha. | Retorna o resultado ou uma lista vazia. |
| `findHorariosByLinhaId` | Busca os horários de uma linha. | Retorna os horários ou uma lista vazia. |

### 2.6. `TrajetosRepository`

| Método | Cenário / objetivo | Resultado esperado |
|---|---|---|
| `buscarParadasPorNome` | Busca paradas pelo nome. | Retorna uma lista ou uma lista vazia. |
| `buscarRotasDiretas` | Busca rotas diretas. | Retorna as rotas ou uma lista vazia. |
| `buscarRotasComBaldeacao` | Busca rotas com baldeação. | Retorna as rotas ou uma lista vazia. |

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

### 3.5. `LinhasService`

| Método | Cenário / objetivo | Resultado esperado |
|---|---|---|
| `obterLinhas` | Busca linhas com filtros ou por texto. | Retorna as linhas ou um erro. |
| `obterItinerario` | Retorna o itinerário pelo ID. | Retorna dados estruturados, `null` ou um erro. |
| `obterQuadroHorarios` | Retorna o quadro de horários. | Retorna os dados agrupados, `null` ou um erro. |

### 3.6. `TrajetosService`

| Método | Cenário / objetivo | Resultado esperado |
|---|---|---|
| `obterTrajetos` | Valida a origem e o destino e retorna rotas. | Retorna uma lista combinada de trajetos ou um erro. |

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
| `LinhasScreen` | Carregamento, filtro, listagem, navegação e sinalização de alertas (RF14). | Exibe indicador de carregamento, permite filtrar por código ou nome, destaca visualmente linhas com `afetadaPorAlerta` (`AlertaBadge`) e navega corretamente. |
| `HorariosScreen` | Carregamento, filtro por sentido/tipo de dia e banner de alerta da linha (RF14). | Exibe os horários corretos, renderiza o `AlertaBanner` quando a linha possui alertas vigentes (com navegação para `Alertas`) e permite navegar para o itinerário. |
| `ItinerarioScreen` | Carregamento do itinerário por sentido e sinalização de alertas na linha e paradas (RF14). | Lista as paradas em `IDA`/`VOLTA`, exibe o `AlertaBanner` da linha no topo e destaca individualmente as paradas afetadas com badge e descrição do alerta. |
| `AlertasScreen` | Listagem, filtros, título/descrição, mensagens de erro e atualizações. | Exibe alertas vigentes com título, descrição e itens afetados, filtra por categoria, apresenta mensagens de lista vazia e de erro e utiliza `AsyncStorage`. |
| `AdminScreen` | Acesso, logout e navegação. | Exibe *spinner*, controla o acesso restrito ou liberado e remove os dados no logout. |
| `CadastroScreen` | Validação, cadastro e navegação. | Valida campos obrigatórios, exibe mensagens e indicador de carregamento e realiza a navegação. |
| `LoginScreen` | Validação, login, armazenamento, falhas e atalho de recuperação de senha (RF16). | Valida campos, exibe mensagens, salva o token, navega para `RecuperarSenha` levando o e-mail preenchido e apresenta erros e indicador de carregamento. |
| `RecuperarSenhaScreen` | Fluxo em duas etapas para solicitar código por e-mail e redefinir a senha (RF16). | Valida formato de e-mail, código de 6 dígitos, tamanho mínimo e confirmação da nova senha, permite reenviar código ou trocar e-mail e redireciona ao login após sucesso. |
| `ExcluirContaScreen` | Confirmação de senha e diálogo destrutivo para exclusão definitiva da própria conta (RF16). | Exige senha atual, solicita confirmação, chama `DELETE /usuarios/me`, limpa `AsyncStorage` (`@rotasdf_token`, `@rotasdf_usuario`, `@rotasdf_buscas_recentes`) e redireciona para `Linhas`. |
| `ConfiguracoesScreen` | Exibição de perfil, limpeza de histórico, logout e opção de exclusão de conta para passageiros (RF16). | Exibe dados do passageiro logado, mostra a opção *"Excluir minha conta"* apenas para passageiros autenticados (ocultando para anônimos e administradores) e executa logout. |
| `dialogos` | Utilitário multiplataforma de alertas e confirmações (`mostrarAviso` e `confirmarAcao`) (RF16). | Utiliza `Alert.alert` no Android/iOS e `window.alert`/`window.confirm` na Web. |
| `BuscarTrajetoScreen` | GPS, permissão, buscas, erros e alerta na parada de origem (RF14). | Trata a permissão de GPS e a localização, exibe `AlertaBanner` compacto quando a parada de origem possui alerta vigente, valida a busca e realiza a navegação. |
| `ResultadoTrajetoScreen` | Exibição, navegação por opções e destaque de trajetos com alerta (RF14). | Exibe cartões de opções, baldeações, destaca opções com `afetadaPorAlerta` (`AlertaBadge` e resumo do alerta) e navega para os detalhes. |
| `TrajetoDetalheScreen` | Exibição detalhada das etapas e banner de alertas do trajeto (RF14). | Exibe `AlertaBanner` quando o trajeto é afetado por alerta vigente, lista etapas ordenadas com ícones e apresenta mensagem quando não há etapas. |
| `GerenciarUsuariosScreen` | Listagem, filtros, navegação e erros. | Lista usuários, identifica o usuário atual, aplica filtros e apresenta alertas. |
| `CriarAdminScreen` | Cadastro, validação, mensagens e navegação. | Exibe campos e mensagens, indicador de carregamento e retorna após o sucesso. |
| `EditarUsuarioScreen` | Edição, validação, exclusão e mensagens. | Exibe campos, realiza validações, solicita confirmação de exclusão e apresenta alertas. |
| `FavoritoEstrela` | Botão de favoritar e desfavoritar um item (RF17). | Mostra estrela cheia ou vazia, alterna pelo store, avisa quando não foi possível (por exemplo, sem login) e se atualiza com a lista. |
| `FavoritosSecao` e `FavoritosCarregador` | Lista de linhas favoritas e carregamento ao abrir e ao voltar ao foco (RF17). | Mostra a dica quando não há favoritos, lista as linhas e abre os horários ao tocar; esconde-se sem passageiro logado. |
| `RodapeNavegacao` | Barra de abas Linhas e Favoritos. | Marca a aba ativa, navega ao tocar na outra e não navega na que já está aberta. |
| `FavoritosScreen` | Aba Favoritos (RF17). | Carrega e lista os favoritos do passageiro; sem login, pede para entrar e leva à tela de login. |

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
