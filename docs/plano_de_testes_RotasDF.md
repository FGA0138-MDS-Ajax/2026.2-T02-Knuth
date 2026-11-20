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

---

## 4. Testes de middleware

| Middleware | Cenário | Resultado esperado |
|---|---|---|
| `authAdmin` | Token ausente ou malformado. | Retorna `401 Unauthorized`. |
| `authAdmin` | Token expirado ou inválido. | Retorna `401 Unauthorized`. |
| `authAdmin` | Usuário sem permissão de administrador. | Retorna `403 Forbidden`. |
| `authAdmin` | Token válido e usuário administrador. | Continua a requisição e adiciona os dados a `req.usuario`. |

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
| `LoginScreen` | Validação, login, armazenamento e falhas. | Valida campos, exibe mensagens, salva o token e apresenta erros e indicador de carregamento. |
| `BuscarTrajetoScreen` | GPS, permissão, buscas, erros e alerta na parada de origem (RF14). | Trata a permissão de GPS e a localização, exibe `AlertaBanner` compacto quando a parada de origem possui alerta vigente, valida a busca e realiza a navegação. |
| `ResultadoTrajetoScreen` | Exibição, navegação por opções e destaque de trajetos com alerta (RF14). | Exibe cartões de opções, baldeações, destaca opções com `afetadaPorAlerta` (`AlertaBadge` e resumo do alerta) e navega para os detalhes. |
| `TrajetoDetalheScreen` | Exibição detalhada das etapas e banner de alertas do trajeto (RF14). | Exibe `AlertaBanner` quando o trajeto é afetado por alerta vigente, lista etapas ordenadas com ícones e apresenta mensagem quando não há etapas. |
| `GerenciarUsuariosScreen` | Listagem, filtros, navegação e erros. | Lista usuários, identifica o usuário atual, aplica filtros e apresenta alertas. |
| `CriarAdminScreen` | Cadastro, validação, mensagens e navegação. | Exibe campos e mensagens, indicador de carregamento e retorna após o sucesso. |
| `EditarUsuarioScreen` | Edição, validação, exclusão e mensagens. | Exibe campos, realiza validações, solicita confirmação de exclusão e apresenta alertas. |

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
