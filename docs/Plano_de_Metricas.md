# Plano de Métricas — RotasDF

**Equipe Knuth (T02_KNUTH)** — Métodos de Desenvolvimento de Software, UnB/FCTE, 2026/2

## Integrantes do Grupo

| Matrícula | Nome | Função (responsabilidade) | Pontos de participação |
| :--- | :--- | :--- | :---: |
| 252014223 | Gabriel Sakai e Silva | Analista de qualidade / desenvolvedor | 16,6 |
| 242015601 | Emanuele Victor Santos | Scrum master / Líder do grupo / desenvolvedor | 16,6 |
| 232013990 | Gabriel Felix Mota Soares | Dono do produto / desenvolvedor | 16,6 |
| 190128160 | Guilherme Maciel de Meneses | Desenvolvedor | 16,6 |
| 222024819 | Gabriela Xavier Rodrigues | Desenvolvedor | 16,6 |
| 242015460 | Denilson Lima Santos | Desenvolvedor | 16,6 |
| | | **Total** | **100** |

## Histórico de Revisões

| Data | Versão | Descrição | Autor(es) |
| :--- | :---: | :--- | :--- |
| 15/11/2026 | 1.0 | Plano de Métricas (GQM) com uma métrica de negócio (TSTP) e uma métrica de projeto (TCH) | Emanuele Victor Santos |
| 15/11/2026 | 1.1 | Inclusão da tabela de integrantes do grupo | Emanuele Victor Santos |

---

## 1. Introdução

Este documento define as métricas do projeto **RotasDF**, seguindo a abordagem **GQM** (*Goal–Question–Metric*). As métricas acompanham a experiência do passageiro no planejamento de viagens e a execução das Sprints. A **TSTP** operacionaliza o objetivo do produto de facilitar o uso (Visão, seções 1 e 4), e a meta de 80% da **TCH** consta da seção 5 do Documento de Visão.

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
| **Periodicidade** | Três rodadas de testes de usabilidade em `staging`, ao final das Sprints S3 (15/11/2026), S4 (22/11/2026) e S5 (29/11/2026), com no mínimo 5 participantes por rodada. Na S3, avaliar somente as funcionalidades já implementadas; comparar entre rodadas apenas tarefas equivalentes. |
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
| **Processo de medição** | No *Sprint Planning*, congelar uma lista-base das histórias planejadas no início da Sprint, com ID e prioridade. Ao final, verificar a DoD de cada item: testes unitários aprovados, integração contínua sem falhas, Pull Request revisado e critérios de aceitação validados pelo Dono do Produto. História parcialmente implementada conta como não concluída (0). História incluída no meio da Sprint é registrada separadamente como mudança de escopo e não altera o denominador da linha de base; se a equipe replanejar formalmente a Sprint, preservar também a linha de base original e registrar a alteração. |
| **Fórmula** | TCH = (histórias planejadas no início da Sprint e concluídas integralmente conforme a DoD ÷ histórias planejadas no início da Sprint) × 100. Sem histórias planejadas, registrar "não aplicável", sem dividir por zero. |
| **Responsável** | Emanuele Victor Santos (Scrum Master), com validação de Gabriel Felix Mota Soares (Dono do Produto). |
| **Periodicidade** | Ao final de cada Sprint, antes da *Sprint Review*. |
| **Armazenamento no Git** | `metricas/projeto/tch.csv` e `metricas/projeto/registro-escopo.md`, versionados no repositório GitHub da equipe. O GitHub Projects serve como fonte de acompanhamento, não como substituto do arquivo no Git. |
| **Unidade / escala** | Percentual de 0% a 100%. |
| **Agregações** | Por Sprint e prioridade *Must*/*Should*/*Could*; tabela, gráfico de barras e evolução temporal. |

### 3.4 Modelo de análise e tomada de decisão

| Item | Critério e encaminhamento |
| :--- | :--- |
| **Faixa esperada** | 80% a 100% das histórias planejadas concluídas (meta indicada na seção 5 do Documento de Visão). |
| **Valores limite** | Satisfatório: a partir de 80%. Atenção: 60% a 79,99%. Crítico: abaixo de 60%. |
| **Decisão ao atingir o limite** | A partir de 80%: manter e monitorar. Entre 60% e 79,99%: analisar causas e ajustar a capacidade da Sprint seguinte. Abaixo de 60%: realizar replanejamento formal com o Dono do Produto, priorizando itens *Must* (critérios de replanejamento da Visão, seção 2.5). |
| **Ações sugeridas** | Identificar impedimentos, reduzir trabalho em andamento, redistribuir tarefas, adotar programação em pares, renegociar escopo e registrar histórias pendentes no backlog. |

---

## 4. Registro das medições

Os valores reais de cada Sprint e de cada rodada de teste ficam nos arquivos da pasta `metricas/`, e a análise feita em cada *Retrospective* é registrada abaixo.

**Exemplo de cálculo da TSTP (valores fictícios, apenas ilustrativos):** em 30 tentativas válidas de planejamento, 24 foram concluídas corretamente sem ajuda. TSTP = (24 ÷ 30) × 100 = 80%.

| Sprint / rodada | Data da coleta | Valor medido | Faixa | Análise e decisão |
| :--- | :--- | :--- | :--- | :--- |
| TCH — S1 | | | | |
| TCH — S2 | | | | |
| TCH — S3 | | | | |
| TCH — S4 | | | | |
| TCH — S5 | | | | |
| TSTP — rodada 1 (S3) | | | | |
| TSTP — rodada 2 (S4) | | | | |
| TSTP — rodada 3 (S5) | | | | |

---

## 5. Referências bibliográficas

BASILI, Victor R.; CALDIERA, Gianluigi; ROMBACH, H. Dieter. The Goal Question Metric Approach. In: MARCINIAK, John J. (ed.). **Encyclopedia of Software Engineering**. New York: Wiley, 1994.

EQUIPE KNUTH (T02_KNUTH). **RotasDF: Visão do Produto e do Projeto**. Versão 1.0.0. Brasília, 30 set. 2026. Seções 1, 2, 4, 5 e 6.
