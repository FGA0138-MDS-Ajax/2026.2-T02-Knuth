# Plano de Testes - RotasDF

---

## 1. Estratégia de Testes
- **Testes Unitários:** foco na validação isolada dos serviços, repositórios e controladores.
- **Testes Funcionais em Interface:** validações das telas React Native quanto a renderização correta, interações e estado da interface.
- Não há testes de integração entre componentes distintos; os testes mantêm as dependências simuladas com mocks.
- **Teste de sistema:** a execução desse teste visa garantir integração e usabilidade e foi realizado na sprint 4

## 2. Testes de Repositórios

| Módulo                   | Método                      | Cenário / Objetivo                                      | Resultado Esperado                                    |
|--------------------------|-----------------------------|--------------------------------------------------------|------------------------------------------------------|
| AlertasRepository         | findAlertasVigentes          | Retorna todos alertas vigentes                          | Retorna lista ou propaga erro                         |
|                          | findAlertaVigenteById        | Retorna alerta ativo por ID                             | Retorna alerta ou null, trata erro                    |
| BuscasRecentesRepository  | salvarBusca                 | Insere busca e retorna registro                         | Query correta com valores                              |
|                          | listarBuscasRecentes         | Lista buscas recentes com filtro                        | Retorna lista ou vazia                                |
| UsuariosRepository        | criar                      | Insere usuário sem expor senha                          | Query correta, retorna usuário                         |
|                          | buscarPorEmail              | Busca usuário por email                                 | Retorna usuário ou null                                |
| ParadasRepository         | findNearestParada           | Busca parada mais próxima                               | Retorna parada ou null                                |
| LinhasRepository          | findLinhas                 | Busca linhas com/s/ filtros                             | Retorna linhas ou lista vazia                          |
|                          | findItinerarioByLinhaId    | Busca itinerário da linha                               | Retorna resultado ou lista vazia                      |
|                          | findHorariosByLinhaId      | Busca horários Linha                                   | Retorna horários ou lista vazia                        |
| TrajetosRepository        | buscarParadasPorNome       | Busca paradas por nome                                 | Retorna lista ou vazia                                |
|                          | buscarRotasDiretas         | Busca rotas diretas                                    | Retorna rotas ou lista vazia                          |
|                          | buscarRotasComBaldeacao    | Busca rotas com baldeação                              | Retorna rotas ou lista vazia                          |
| GerenciarUsuariosRepository | listar                   | Lista usuários com filtro                              | Retorna lista filtrada ou completa                    |
|                          | buscarPorId                | Busca usuário pelo ID                                  | Retorna usuário ou null                               |
|                          | contarAdmins               | Conta total de admins                                  | Retorna contagem                                      |
|                          | atualizar                  | Atualiza usuário, opcional senha                       | Retorna usuário atualizado                            |
|                          | excluir                    | Remove usuário pelo ID                                 | Confirma remoção ou propaga erro                      |
| AdminRepository           | criar                      | Cria administrador com tipo fixo                       | Query correta e retorno esperado                      |

---

## 3. Testes de Serviços e Controladores

| Módulo                   | Método                          | Cenário / Objetivo                                     | Resultado Esperado                                |
|--------------------------|---------------------------------|-------------------------------------------------------|--------------------------------------------------|
| AlertasService           | listarAlertasVigentes          | Retorna alertas ou erros                              | Lista correta ou erro                             |
|                          | obterAlertaVigente             | Retorna alerta ativo por ID ou null                    | Retorna dado ou null, trata erro                   |
| BuscasRecentesService    | registrarBusca                 | Validação e registro de buscas                         | Dados tratados e retornados corretamente           |
|                          | obterBuscasRecentes            | Listagem com parâmetros e padrões                      | Retorna buscas ou lista vazia                      |
| UsuariosService          | cadastrar                     | Validação cadastro e criação                            | Cria usuário ou lança erros                         |
|                          | login                         | Autenticação e emissão de token                         | Retorna token, usuário ou error                     |
| ParadasService           | obterParadaMaisProxima         | Busca parada próxima com lat/lng                        | Retorna parada, null ou erro                        |
| LinhasService            | obterLinhas                   | Busca linhas com filtros ou texto                       | Retorna linhas ou erro                              |
|                          | obterItinerario               | Retorna itinerário por ID                               | Dados estruturados ou null/erro                     |
|                          | obterQuadroHorarios           | Retorna quadro horários                                | Dados agrupados ou null/erro                        |
| TrajetosService          | obterTrajetos                 | Valida origem/destino e retorna rotas                  | Lista combinada de trajetos ou erro                 |
| GerenciarUsuariosService | listar                       | Lista usuários com filtro                               | Retorna lista ou erro                               |
|                          | atualizar                    | Atualiza dados com regras                               | Resultado atualizado ou erro                         |
|                          | excluir                      | Valida e exclui usuários                                | Confirma exclusão ou erro                            |
| AdminService             | criarAdministrador           | Valida dados e cria admin                               | Cria administrador ou retorna erro                  |

---

## 4. Testes de Middleware

| Middleware               | Cenário                         | Resultado Esperado                              |
|--------------------------|--------------------------------|------------------------------------------------|
| authAdmin                | Token ausente ou malformado     | Retorna 401 Unauthorized                        |
|                          | Token expirado ou inválido      | Retorna 401 Unauthorized                        |
|                          | Usuário sem permissão admin     | Retorna 403 Forbidden                           |
|                          | Token válido e admin            | Continua requisição, adiciona dados ao req.usuario |

---

## 5. Testes de Interface (React Native)

| Tela                    | Caso / Cenário                                      | Resultado Esperado                                                          |
|-------------------------|----------------------------------------------------|----------------------------------------------------------------------------|
| LinhasScreen            | Carregamento, filtro, listagem e navegação         | Indicador, filtro por código/nome, lista das linhas, navegação correta      |
| HorariosScreen          | Carregamento, filtro sentido/tipo dia               | Indicador, horários corretos, mensagem para vazio, navegação itinerário     |
| AlertasScreen           | Listagem, filtros, mensagens de erro e atualizações | Mostra alertas, filtragem por categoria, mensagem vazia e erro, AsyncStorage|
| AdminScreen             | Acesso, logout, navegação                            | Spinner, acesso restrito/liberado, logout remove dados                      |
| CadastroScreen          | Validação, cadastro e navegação                      | Campos obrigatórios, mensagens, indicador e navegação                      |
| LoginScreen             | Validação, login, armazenamento e falhas             | Campos, mensagens, token salvo, erro e indicador                           |
| BuscarTrajetoScreen     | GPS, permissão, buscas e erros                        | Permissão GPS, localização, erro, busca validação e navegação             |
| ResultadoTrajetoScreen  | Exibição e navegação por opções                        | Cartões de opções, exibição de baldeações, navegação correta               |
| TrajetoDetalheScreen    | Exibição detalhada de etapas                            | Etapas ordenadas, ícones, mensagem para etapas vazias                     |
| GerenciarUsuariosScreen | Listagem, filtros, navegação e erros                   | Usuários listados, marcação do usuário atual, filtros e alertas            |
| CriarAdminScreen        | Cadastro, validação, mensagens e navegação            | Campos, mensagens, indicador e retorno ao sucesso                         |
| EditarUsuarioScreen     | Edição, validação, exclusão e mensagens                | Campos, validações, confirmação exclusão e alertas                        |

---

## 6. Tratamento de Erros e Condições Especiais

- Validação rigorosa para entradas vazias, inválidas ou mal formatadas.
- Mensagens claras para erros retornados pela API.
- Indicadores visuais para processos em andamento.
- Proteção contra ações não autorizadas como rebaixamento/exclusão indevidas.
- Recuperação e apresentação adequada em casos de falhas de conexão.

---

## 7. Considerações Finais

- Garantia de cobertura mínima de 80% nas regras de negócio e interface.
- Uso de mocks para isolar testes e garantir confiabilidade.
- Inclusão dos casos de teste nos pipelines CI/CD para feedback contínuo.
- Documentação colaborativa para evolução contínua do plano de testes.