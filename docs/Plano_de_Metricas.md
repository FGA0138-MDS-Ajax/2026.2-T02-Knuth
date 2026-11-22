# Plano de Métricas — RotasDF

**Equipe Knuth (T02_KNUTH)** — Métodos de Desenvolvimento de Software, UnB/FCTE, 2026/2  
**Versão:** 1.2

## Integrantes do Grupo

| Matrícula | Nome | Função (responsabilidade) | Pontos de participação |
| :--- | :--- | :--- | :---: |
| 252014223 | Gabriel Sakai e Silva | Analista de qualidade / desenvolvedor | 16,67 |
| 242015601 | Emanuele Victor Santos | Scrum master / Líder do grupo / desenvolvedor | 16,67 |
| 232013990 | Gabriel Felix Mota Soares | Dono do produto / desenvolvedor | 16,67 |
| 190128160 | Guilherme Maciel de Meneses | Desenvolvedor | 16,67 |
| 222024819 | Gabriela Xavier Rodrigues | Desenvolvedor | 16,66 |
| 242015460 | Denilson Lima Santos | Desenvolvedor | 16,66 |
| | | **Total** | **100** |

## Histórico de Revisões

| Data | Versão | Descrição | Autor(es) |
| :--- | :---: | :--- | :--- |
| 15/11/2026 | 1.0 | Plano de Métricas (GQM) com uma métrica de negócio (TSTP) e uma métrica de projeto (TCH) | Emanuele Victor Santos |
| 15/11/2026 | 1.1 | Inclusão da tabela de integrantes do grupo | Emanuele Victor Santos |
| 22/11/2026 | 1.2 | Alinha DoD com a Visão (v1.3.1), detalha aplicação do DoD aos requisitos, preenche histórico de medições (S1–S3) e ajusta cronograma da TSTP (reparo dos DEF-018, DEF-034, DEF-035, DEF-036 e DEF-037) | Emanuele Victor Santos |

---

## 1. Introdução

Este documento define as métricas do projeto **RotasDF**, seguindo a abordagem **GQM** (*Goal–Question–Metric*) (BASILI; CALDIERA; ROMBACH, 1994). As métricas acompanham a experiência do passageiro no planejamento de viagens e a capacidade de entrega da equipe ao longo das Sprints. A **TSTP** operacionaliza o objetivo do produto de facilitar o acesso e a compreensão das informações (Visão, seções 1.3 e 4), enquanto a **TCH** operacionaliza o objetivo GQM de cumprimento do planejamento e aderência à Definição de Pronto (Visão, seções 3 e 5.1), estabelecendo-se a meta operacional de **80%** de conclusão por Sprint.

Os dados coletados ficam versionados no repositório, na pasta `metricas/`:

| Métrica | Arquivos |
| :--- | :--- |
| TSTP (negócio) | [`metricas/negocio/tstp.csv`](../metricas/negocio/tstp.csv) e [`metricas/negocio/relatorio-tstp.md`](../metricas/negocio/relatorio-tstp.md) |
| TCH (projeto) | [`metricas/projeto/tch.csv`](../metricas/projeto/tch.csv) e [`metricas/projeto/registro-escopo.md`](../metricas/projeto/registro-escopo.md) |

---

## 2. Métrica de negócio — Taxa de Sucesso de Tarefas de Planejamento (TSTP)

### 2.1 Objetivo de medição (GQM)

| Elemento | Definição |
| :--- | :--- |
| **Objeto** | Tarefas de planejamento de deslocamentos realizadas por passageiros no RotasDF. |
| **Finalidade** | Avaliar se os usuários conseguem obter e compreender as informações necessárias para planejar viagens. |
| **Foco** | Efetividade de uso das funções de busca de trajetos, consulta de linhas e horários e identificação de alertas. |
| **Ponto de vista** | Passageiros, Dono do Produto e equipe de qualidade. |
| **Contexto** | Testes de usabilidade do RotasDF com cenários do backlog C1 a C4, no ambiente de homologação (`staging`). |

### 2.2 Esquema GQM: objetivo, questões e métricas

**Objetivo (Goal):** avaliar a efetividade do RotasDF para que passageiros obtenham e compreendam as informações necessárias ao planejamento de suas viagens.

| Questão | Métrica |
| :--- | :--- |
| **Q1.** Qual proporção de tarefas de planejamento é concluída corretamente e sem ajuda? | TSTP geral (%). |
| **Q2.** Em quais tarefas os passageiros apresentam mais dificuldades? | TSTP por tipo de tarefa: trajeto, linha/horário e alerta (%). |
| **Q3.** A efetividade do planejamento melhora entre as rodadas de teste? | TSTP por rodada e variação em pontos percentuais. |

### 2.3 Modelo de coleta — ficha de definição

| Campo | Definição operacional |
| :--- | :--- |
| **Nome** | Taxa de Sucesso de Tarefas de Planejamento (TSTP). |
| **Processo de medição** | Preparar roteiros padronizados com origem/destino, consulta de linha/horário e identificação de alteração de serviço. Convidar no mínimo 5 participantes por rodada, observar a execução em `staging` e registrar, para cada tentativa: código da tarefa, rodada, participante anonimizado, sucesso (1) ou insucesso (0) e motivo. Considerar sucesso apenas se o participante concluir corretamente, sem intervenção do avaliador, dentro do tempo máximo fixado no roteiro antes do teste. |
| **Fórmula** | TSTP = (número de tentativas concluídas com sucesso ÷ número total de tentativas válidas) × 100 |
| **Responsável** | Gabriel Sakai e Silva (Analista de Qualidade), com validação de Gabriel Felix Mota Soares (Dono do Produto). |
| **Periodicidade** | Duas rodadas de testes de usabilidade em `staging` com no mínimo 5 participantes por rodada: **Rodada 1** na transição S4/S5 (após a integração dos fluxos principais de consulta, trajetos e alertas) e **Rodada 2** no fechamento da S5 (até 29/11/2026). *(Nota de replanejamento: a coleta inicialmente prevista para o fim da S3 em 15/11/2026 foi reprogramada para a etapa S4/S5 porque a integração entre front-end mobile e API de trajetos e alertas ocorreu apenas ao final da S3/início da S4).* |
| **Armazenamento no Git** | `metricas/negocio/tstp.csv` e `metricas/negocio/relatorio-tstp.md`, versionados no repositório GitHub da equipe. Não registrar dados pessoais. |
| **Unidade / escala** | Percentual de 0% a 100%. |
| **Agregações** | TSTP geral, por tipo de tarefa e por rodada; tabela e gráfico de barras/linhas. |

### 2.4 Modelo de análise e tomada de decisão

| Item | Critério e encaminhamento |
| :--- | :--- |
| **Faixa esperada** | 80% a 100% de sucesso (meta operacional definida para esta atividade). |
| **Valores limite** | Satisfatório: a partir de 80%. Atenção: 60% a 79,99%. Crítico: abaixo de 60%. |
| **Decisão ao atingir o limite** | A partir de 80%: manter e monitorar. Entre 60% e 79,99%: revisar fluxos antes da aprovação de usabilidade. Abaixo de 60%: priorizar a correção do fluxo na Sprint seguinte e repetir o teste. |
| **Ações sugeridas** | Revisar textos e navegação, simplificar etapas, corrigir dados ou alertas confusos, repetir os mesmos cenários e comparar resultados. |

---

## 3. Métrica de projeto — Taxa de Conclusão de Histórias por Sprint (TCH)

### 3.1 Objetivo de medição (GQM)

| Elemento | Definição |
| :--- | :--- |
| **Objeto** | Histórias de usuário assumidas no Sprint Backlog. |
| **Finalidade** | Avaliar o cumprimento do planejamento e a capacidade de entrega da equipe. |
| **Foco** | Percentual de histórias concluídas conforme a Definição de Pronto (DoD). |
| **Ponto de vista** | Equipe de desenvolvimento, Scrum Master e Dono do Produto. |
| **Contexto** | Cinco Sprints semanais do RotasDF, de 26/10/2026 a 29/11/2026, com Scrum e XP. |

### 3.2 Esquema GQM: objetivo, questões e métricas

**Objetivo (Goal):** avaliar o cumprimento do planejamento e a capacidade de entrega da equipe do RotasDF em cada Sprint.

| Questão | Métrica |
| :--- | :--- |
| **Q1.** Qual percentual das histórias planejadas é concluído em cada Sprint? | Taxa de conclusão de histórias (%). |
| **Q2.** Como varia o cumprimento do planejamento entre as Sprints? | Taxa por Sprint e evolução em pontos percentuais. |
| **Q3.** O desempenho difere entre histórias *Must*, *Should* e *Could*? | Taxa de conclusão por prioridade do backlog (%). |

### 3.3 Modelo de coleta — ficha de definição

| Campo | Definição operacional |
| :--- | :--- |
| **Nome** | Taxa de Conclusão de Histórias por Sprint (TCH). |
| **Processo de medição** | No *Sprint Planning*, congelar uma lista-base das histórias planejadas no início da Sprint, com ID e prioridade (conforme Tabela 7 do Documento de Visão). Ao final de cada Sprint, verificar cumulativamente a **Definição de Pronto (DoD)** definida na Seção 3 do Documento de Visão: **(a)** testes unitários implementados; **(b)** código implementado atendendo aos critérios de aceitação verificáveis da história (Visão, Tabela 8); e **(c)** revisão e *merge* via Pull Request na branch `developer` dentro do prazo da Sprint. História parcialmente implementada ou mergeada fora da janela temporal da Sprint conta como não concluída (`0`) naquela Sprint. História incluída no meio da Sprint é registrada separadamente como mudança de escopo e não altera o denominador da linha de base. |
| **Fórmula** | TCH = (histórias planejadas no início da Sprint e concluídas integralmente conforme a DoD dentro da janela da Sprint ÷ histórias planejadas no início da Sprint) × 100. Sem histórias planejadas, registrar "não aplicável", sem dividir por zero. |
| **Responsável** | Emanuele Victor Santos (Scrum Master), com validação de Gabriel Felix Mota Soares (Dono do Produto). |
| **Periodicidade** | Ao final de cada Sprint, antes da *Sprint Review*. *(Nota de rastreabilidade: as medições das Sprints S1 e S2 foram reconstruídas retroativamente em 15/11/2026 com base no cronograma do Documento de Visão e no histórico de merges do GitHub; a partir da Sprint S3, a apuração ocorre no encerramento de cada Sprint).* |
| **Armazenamento no Git** | `metricas/projeto/tch.csv` e `metricas/projeto/registro-escopo.md`, versionados no repositório GitHub da equipe. O GitHub Projects serve como fonte de acompanhamento, não como substituto do arquivo no Git. |
| **Unidade / escala** | Percentual de 0% a 100%. |
| **Agregações** | Por Sprint e prioridade *Must*/*Should*/*Could*; tabela, gráfico de barras e evolução temporal. |

### 3.4 Modelo de análise e tomada de decisão

| Item | Critério e encaminhamento |
| :--- | :--- |
| **Faixa esperada** | 80% a 100% das histórias planejadas concluídas (meta operacional definida neste Plano para atendimento ao objetivo GQM da seção 5.1 do Documento de Visão). |
| **Valores limite** | Satisfatório: a partir de 80%. Atenção: 60% a 79,99%. Crítico: abaixo de 60%. |
| **Decisão ao atingir o limite** | A partir de 80%: manter e monitorar. Entre 60% e 79,99%: analisar causas e ajustar a capacidade da Sprint seguinte. Abaixo de 60%: realizar replanejamento formal com o Dono do Produto, priorizando itens *Must* (critérios de replanejamento da Visão, seção 2.5). |
| **Ações sugeridas** | Identificar impedimentos, reduzir trabalho em andamento, redistribuir tarefas, adotar programação em pares, renegociar escopo e registrar histórias pendentes no backlog. |

### 3.5 Aplicação da Definição de Pronto (DoD) aos Requisitos do Backlog

Para eliminar subjetividade na apuração da **TCH** e garantir rastreabilidade direta entre o código entregue e o backlog (Visão, Seções 3 e 4.4), cada requisito funcional (`RF01` a `RF24` / `US01` a `US24`) é submetido a um protocolo objetivo de verificação em quatro etapas antes de ser contabilizado como concluído (`status = 1`) no arquivo `metricas/projeto/tch.csv`:

| Critério da DoD (Visão, Seção 3) | Como é aplicado aos requisitos (`RF01`–`RF24`) | Evidência auditável exigida no repositório |
| :--- | :--- | :--- |
| **1. Código implementado e aderente aos critérios de aceitação** | Todos os fluxos principais, validações de entrada e mensagens de erro/estado vazio especificados para o requisito na **Tabela 8 da Visão (Seção 4.4.1)** devem estar funcionalmente implementados nas camadas aplicáveis (API REST em `api/src/` e/ou interface mobile em `mobile/src/`). | Arquivos de rotas, controladores, serviços e telas correspondentes ao RF integrados na branch `developer`. |
| **2. Testes unitários implementados** | Cada requisito funcional deve possuir suíte de testes unitários automatizados cobrindo suas regras de negócio e condições de borda descritas nos critérios de aceitação (ex.: validações de parâmetros, filtros, permissões por perfil JWT e tratamento de ausência de dados). | Arquivos `*.test.js` (Jest) ou `test_*.py` (Pytest) executando sem falhas para o módulo do requisito. |
| **3. Revisão por pares (*Code Review*)** | O Pull Request contendo a implementação e os testes do requisito deve ser revisado por outro integrante da equipe (preferencialmente o Analista de Qualidade), verificando aderência aos critérios de aceitação da Tabela 8 e padrões de código. | Registro de revisão/aprovação formal no Pull Request antes do fechamento. |
| **4. Integração (*merge*) na `developer` dentro do prazo da Sprint** | O Pull Request aprovado deve ser mesclado na branch `developer` até as 23h59 do domingo de encerramento da respectiva Sprint. Entregas mescladas após o fechamento da janela são contabilizadas como passivo entregue na Sprint em que o merge efetivamente ocorreu. | Timestamp de *merge* do PR na branch `developer` registrado no histórico do GitHub e vinculado em `registro-escopo.md`. |

#### Regra de contabilização por tipo de requisito:
* **Requisitos de Back-end + Front-end (ex.: `RF01`, `RF07`, `RF10`, `RF13`, `RF14`, `RF16`, `RF17`, `RF22`):** só atingem a DoD completa quando tanto os endpoints da API quanto a integração na interface mobile (ou painel administrativo) estão mesclados e testados. Enquanto apenas uma camada estiver integrada, o requisito permanece com status `parcial (0)` na TCH.
* **Requisitos exclusivamente de Back-end/Infraestrutura (ex.: `RF20` – Importação GTFS; `RF21` – Autenticação Admin via middleware/API):** atingem a DoD quando o serviço/endpoint, as validações de integridade/segurança e os respectivos testes automatizados estão mesclados na `developer`.

---

## 4. Registro das medições

Os valores reais de cada Sprint e de cada rodada de teste ficam nos arquivos da pasta `metricas/`, e a análise feita em cada *Retrospective* é registrada abaixo.

**Exemplo de cálculo da TSTP (valores fictícios, apenas ilustrativos):** em 30 tentativas válidas de planejamento, 24 foram concluídas corretamente sem ajuda. TSTP = (24 ÷ 30) × 100 = 80%.

| Sprint / rodada | Data da coleta | Valor medido | Faixa | Análise e decisão |
| :--- | :--- | :--- | :--- | :--- |
| **TCH — S1** *(reconstruída)* | 15/11/2026 | **0%** (0/4) | Crítico (< 60%) | Atraso inicial na configuração do ambiente Docker/PostgreSQL e estruturação da base GTFS impediu entregas dentro da janela (26/10 a 01/11). **Decisão:** priorizar a conclusão da base (`RF07`, `RF08`, `RF10`) na S2/S3 e isolar o risco do importador `RF20`. |
| **TCH — S2** *(reconstruída)* | 15/11/2026 | **0%** (0/5) | Crítico (< 60%) | O acúmulo do passivo da S1 deslocou o cronograma da S2 (02/11 a 08/11). Embora o PR `#7` (entregando `RF07`, `RF08` e `RF10` da S1) tenha sido mesclado em 05/11, nenhuma história planejada originalmente para a S2 foi concluída dentro da janela. **Decisão:** concentrar esforço de integração via PRs na S3 para absorver o passivo acumulado. |
| **TCH — S3** | 15/11/2026 | **0%** (0/2) | Crítico (< 60%) | Na S3 (09/11 a 15/11), a equipe integrou 16 PRs na `developer` que concluíram o passivo das Sprints 1 e 2 (`RF02`, `RF03`, `RF18`, além de partes de `RF01`, `RF09` e avanços em `RF20`), mas as histórias novas da S3 (`RF13` e `RF21`) ficaram em revisão final para merge no início da S4. **Decisão:** replanejar formalmente o escopo com o PO (Visão, seção 2.5), postergando itens *Should*/*Could* para a S5 e focando a S4 no fechamento dos requisitos *Must* e correção de defeitos da inspeção. |
| **TCH — S4** | 22/11/2026 | *Em apuração no fechamento da S4* | — | Fechamento da Sprint 4 (16/11 a 22/11), contemplando `RF13`, `RF14`, `RF16`, `RF17`, `RF19`, `RF21`, `RF24` e o encerramento do passivo `RF01`/`RF09`. |
| **TCH — S5** | 29/11/2026 | *Prevista* | — | Encerramento do projeto (23/11 a 29/11), contemplando `RF04`, `RF05`, `RF06`, `RF11`, `RF12`, `RF15`, `RF22`, `RF23` e refinamento final. |
| **TSTP — rodada 1 (S4/S5)** | Até 25/11/2026 | *Reprogramada (S3 → S4/S5)* | — | Rodada adiada do fechamento da S3 (15/11) para a transição S4/S5 para garantir que os fluxos completos de busca de trajeto, linhas e alertas estejam integrados no aplicativo mobile em `staging` antes do teste com usuários. |
| **TSTP — rodada 2 (S5)** | 29/11/2026 | *Prevista* | — | Segunda rodada comparativa com os mesmos cenários após os ajustes de usabilidade e correções finais da S5. |

---

## 5. Referências bibliográficas

BASILI, Victor R.; CALDIERA, Gianluigi; ROMBACH, H. Dieter. The Goal Question Metric Approach. In: MARCINIAK, John J. (ed.). **Encyclopedia of Software Engineering**. New York: Wiley, 1994.

EQUIPE KNUTH (T02_KNUTH). **RotasDF: Visão do Produto e do Projeto**. Versão 1.3.1. Brasília, 21 nov. 2026. Seções 1, 2, 3, 4, 5 e 6.
