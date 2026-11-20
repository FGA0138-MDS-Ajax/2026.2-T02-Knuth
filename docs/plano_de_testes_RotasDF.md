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
| `findAlertasVigentes` | Retorna todos os alertas vigentes. | Retorna uma lista ou propaga o erro. |
| `findAlertaVigenteById` | Retorna um alerta ativo pelo ID. | Retorna o alerta ou `null`; trata erros. |

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

| Tela | Caso / cenário | Resultado esperado |
|---|---|---|
| `LinhasScreen` | Carregamento, filtro, listagem e navegação. | Exibe indicador de carregamento, permite filtrar por código ou nome, lista as linhas e navega corretamente. |
| `HorariosScreen` | Carregamento e filtro por sentido e tipo de dia. | Exibe os horários corretos, apresenta mensagem quando não há resultados e permite navegar para o itinerário. |
| `AlertasScreen` | Listagem, filtros, mensagens de erro e atualizações. | Exibe alertas, filtra por categoria, apresenta mensagens de lista vazia e de erro e utiliza `AsyncStorage`. |
| `AdminScreen` | Acesso, logout e navegação. | Exibe *spinner*, controla o acesso restrito ou liberado e remove os dados no logout. |
| `CadastroScreen` | Validação, cadastro e navegação. | Valida campos obrigatórios, exibe mensagens e indicador de carregamento e realiza a navegação. |
| `LoginScreen` | Validação, login, armazenamento e falhas. | Valida campos, exibe mensagens, salva o token e apresenta erros e indicador de carregamento. |
| `BuscarTrajetoScreen` | GPS, permissão, buscas e erros. | Trata a permissão de GPS e a localização, apresenta erros, valida a busca e realiza a navegação. |
| `ResultadoTrajetoScreen` | Exibição e navegação por opções. | Exibe cartões de opções, apresenta baldeações e realiza a navegação corretamente. |
| `TrajetoDetalheScreen` | Exibição detalhada das etapas. | Exibe etapas ordenadas e ícones e apresenta mensagem quando não há etapas. |
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
