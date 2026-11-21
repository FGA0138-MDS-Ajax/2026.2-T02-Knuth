# Todos os Defeitos – Inspeção do Grupo KNUTH (RotasDF)

Extraído do Relatório de Inspeção do Grupo HOPPER (FGA0312 – Métodos de Desenvolvimento de Software, Turma 02, UnB), Quadro 21. Inspeção realizada em 16/11/2026.

## Resumo

- **Defeitos neste documento:** 41 confirmados no relatório (1 Crítico, 14 Altos, 22 Médios e 4 Baixos).
- **Resultado da inspeção:** Aprovado com ressalvas. Reparar e reinspecionar o DEF-041 e os defeitos Altos até a entrega final do software; corrigir os Médios no ciclo de revisão e os Baixos na edição dos trechos.
- **Estado inspecionado:** branch docs no commit c7dd2d17 e branch developer no commit 84219bda. Repositório: https://github.com/FGA0138-MDS-Ajax/2026.2-T02-Knuth
- **Severidade Crítica:** impede a aceitação do artefato ou invalida resultados. Deve ser corrigida antes de prosseguir e conta como condição de reprovação.
- **Severidade Alta:** compromete a compreensão, a rastreabilidade ou a qualidade, com risco para as etapas seguintes, sem bloqueio imediato. Deve ser corrigida e submetida a nova checagem.
- **Severidade Média:** afeta a legibilidade, a completude parcial ou o padrão, com risco localizado. Deve ser corrigida no ciclo de revisão.
- **Severidade Baixa:** não afeta o entendimento, mas viola o padrão editorial. Deve ser corrigida na próxima edição do trecho.

## Visão geral

| ID | Sev. | Tema | Tipo | Descrição | Prazo | Evidência de correção |
| --- | --- | --- | --- | --- | --- | --- |
| DEF-041 | Crítico | Visão | Omissão | Backlog sem critérios de aceitação suficientemente operacionalizados | Antes de prosseguir (condição de reprovação) | docs/Documento_de_Visao_do_Produto.md, versão 1.3.0 – seção 4.4.1 (Tabela 8: critérios de aceitação verificáveis para US01–US24) |
| DEF-010 | Alto | Outros | Inconsistência | PDFs publicados divergem dos arquivos Markdown atuais | Até a entrega final, com rechecagem | Não há evidência |
| DEF-013 | Alto | Visão | Inconsistência | Documentos indicam ramos diferentes para integração do código | Até a entrega final, com rechecagem | Não há evidência |
| DEF-015 | Alto | Outros | Omissão | Faltam registros rastreáveis das cerimônias para S1 a S3 | Até a entrega final, com rechecagem | Não há evidência |
| DEF-017 | Alto | Visão | Inconsistência | Planejamento da Visão não reflete o replanejamento registrado separadamente | Até a entrega final, com rechecagem | Não há evidência |
| DEF-019 | Alto | Testes | Inconsistência | Automação de testes declarada sem implementação publicada correspondente | Até a entrega final, com rechecagem | Não há evidência |
| DEF-020 | Alto | Testes | Omissão | Planejamento de testes com definição operacional incompleta | Até a entrega final, com rechecagem | Não há evidência |
| DEF-021 | Alto | Testes | Omissão | Meta de cobertura de testes sem evidência publicada de medição | Até a entrega final, com rechecagem | docs/plano_de_testes_RotasDF.md, seção 8 — cobertura medida: API 94,84% e mobile 89,32% (statements) |
| DEF-022 | Alto | Testes | Inconsistência | Exclusão de teste e lacunas de verificação no incremento integrado | Até a entrega final, com rechecagem | api/src/tests/linhasController.test.js, commit 3d38ba17 — testes de filtros de linhas (getLinhas) e de itinerário (getItinerario) restaurados |
| DEF-025 | Alto | Arquitetura | Inconsistência | Referências cruzadas às MR não acompanham a numeração atual do Markdown | Até a entrega final, com rechecagem | Não há evidência |
| DEF-027 | Alto | Arquitetura | Inconsistência | Uso de ORM declarado na arquitetura diverge do acesso a dados implementado | Até a entrega final, com rechecagem | docs/Documento_de_Arquitetura.md, linhas 141, 148 e 358 — persistência descrita como driver pg com SQL direto |
| DEF-029 | Alto | Código | Inconsistência | Arquivo de ambiente versionado em desacordo com a política | Até a entrega final, com rechecagem | Não há evidência |
| DEF-030 | Alto | Outros | Inconsistência | Revisão de código exigida pela política sem registro nos PRs integrados | Até a entrega final, com rechecagem | Não há evidência |
| DEF-035 | Alto | Outros | Omissão | Coleta TSTP vencida sem dados publicados | Até a entrega final, com rechecagem | Não há evidência |
| DEF-038 | Alto | Outros | Inconsistência | Base e análise TCH contradizem backlog e datas de integração | Até a entrega final, com rechecagem | Não há evidência |
| DEF-001 | Médio | Outros | Inconsistência | Margens laterais insuficientes nos PDFs publicados | No ciclo de revisão | Não há evidência |
| DEF-002 | Médio | Outros | Omissão | Paginação dos PDFs posicionada no rodapé | No ciclo de revisão | Não há evidência |
| DEF-003 | Médio | Arquitetura | Omissão | Figuras 1, 2 e 7 sem indicação de fonte | No ciclo de revisão | Não há evidência |
| DEF-005 | Médio | Visão | Ambiguidade | Tabela de riscos com colunas desalinhadas e um risco truncado | No ciclo de revisão | Não há evidência |
| DEF-006 | Médio | Visão | Omissão | Texto da Visão sem chamadas às obras da bibliografia | No ciclo de revisão | Não há evidência |
| DEF-007 | Médio | Arquitetura | Inconsistência | Citações da Arquitetura sem referências bibliográficas correspondentes | No ciclo de revisão | Não há evidência |
| DEF-008 | Médio | Outros | Inconsistência | Referência de Kruchten sem chamada no texto da Arquitetura | No ciclo de revisão | Não há evidência |
| DEF-011 | Médio | Outros | Inconsistência | Versões dos cabeçalhos divergem dos históricos de revisão | No ciclo de revisão | Não há evidência |
| DEF-014 | Médio | Visão | Omissão | Figura do fluxo de Sprint não incorporada à Visão | No ciclo de revisão | Não há evidência |
| DEF-016 | Médio | Outros | Omissão | Acompanhamento por GitHub Projects declarado sem quadro vinculado acessível | No ciclo de revisão | Não há evidência |
| DEF-018 | Médio | Visão | Inconsistência | Plano atribui à Visão uma meta que não está no trecho citado | No ciclo de revisão | Não há evidência |
| DEF-023 | Médio | Arquitetura | Inconsistência | Notação de generalização de atores inconsistente no diagrama | No ciclo de revisão | Não há evidência |
| DEF-024 | Médio | Arquitetura | Inconsistência | Extensão de gerenciamento de alertas para importação GTFS sem justificativa | No ciclo de revisão | Não há evidência |
| DEF-026 | Médio | Arquitetura | Inconsistência | Configuração versionada de contêineres cobre apenas parte da restrição MR07 | No ciclo de revisão | Não há evidência |
| DEF-028 | Médio | Arquitetura | Ambiguidade | Visão de implantação deixa indefinido o modo de execução do importador | No ciclo de revisão | Não há evidência |
| DEF-031 | Médio | Outros | Omissão | Identificação dos itens de configuração não está consolidada | No ciclo de revisão | Não há evidência |
| DEF-032 | Médio | Outros | Ambiguidade | Exceções ao fluxo obrigatório de PR são ambíguas | No ciclo de revisão | Não há evidência |
| DEF-033 | Médio | Outros | Inconsistência | Mensagem de commit não representa adequadamente as alterações realizadas | No ciclo de revisão | Não há evidência |
| DEF-034 | Médio | Outros | Omissão | Medição da TCH das Sprints 1 e 2 não realizada no prazo previsto | No ciclo de revisão | Não há evidência |
| DEF-036 | Médio | Outros | Inconsistência | DoD usada pela métrica difere da definição da Visão | No ciclo de revisão | Não há evidência |
| DEF-037 | Médio | Outros | Omissão | Registro de análise das medições incompleto | No ciclo de revisão | Não há evidência |
| DEF-040 | Médio | Visão | Inconsistência | Campo de comparação da declaração de posição não identifica alternativa | No ciclo de revisão | Não há evidência |
| DEF-004 | Baixo | Visão | Inconsistência | Linha de fonte fora de lugar ou sem ilustração associada | Na próxima edição do trecho | docs/Documento_de_Visao_do_Produto.md, versão 1.3.1 – fonte da Tabela 1 logo abaixo da tabela e linha de fonte órfã da seção 2.4 retirada |
| DEF-009 | Baixo | Visão | Inconsistência | Referências fora da ordem alfabética | Na próxima edição do trecho | docs/Documento_de_Visao_do_Produto.md, versão 1.3.1 – referências da seção 7 em ordem alfabética (NBR 6023) |
| DEF-012 | Baixo | Visão | Inconsistência | Soma de participação no Markdown diverge do total declarado | Na próxima edição do trecho | docs/Documento_de_Visao_do_Produto.md, versão 1.3.1 – participação ajustada para somar exatamente 100 (4 × 16,67 + 2 × 16,66) |
| DEF-039 | Baixo | Outros | Ambiguidade | O registro tem marcas de citação sem significado | Na próxima edição do trecho | metricas/projeto/registro-escopo.md – marcas “[cite: …]” retiradas (commit ed8c40ce) |

## Defeito crítico

### DEF-041 – Backlog sem critérios de aceitação suficientemente operacionalizados

- **Severidade / Tipo / Tema:** Crítico · Omissão · Visão
- **Localização:** docs: docs/Documento_de_Visao_do_Produto.md, linhas 290–344 (Tabela 7)
- **Evidência:** As 24 histórias da Tabela 7 descrevem funcionalidades e benefícios, mas não estabelecem os resultados esperados e condições de aprovação usados pela seção 6.1 e exigidos na coleta TCH. Os cenários da seção 4 não vinculam esses critérios a cada história. A cobrança é de condições verificáveis, não de coluna ou formato específico.
- **Impacto:** A aceitação das histórias não pode ser aferida pelos parâmetros declarados. O formulário inclui requisito sem critério de aceitação entre os exemplos de severidade Crítica.
- **Reparo:** Cada história do backlog deve ter critérios de aceitação verificáveis, usados para declará-la concluída. **Prazo:** antes de prosseguir (condição de reprovação).
- **Evidência de correção:** docs/Documento_de_Visao_do_Produto.md, versão 1.3.0 – seção 4.4.1 (Tabela 8: critérios de aceitação verificáveis para US01–US24)

## Defeitos altos

### DEF-010 – PDFs publicados divergem dos arquivos Markdown atuais

- **Severidade / Tipo / Tema:** Alto · Inconsistência · Outros
- **Localização:** docs: PDFs em docs/ (commit 7d363535) comparados a docs/Documento_de_Visao_do_Produto.md, linha 23, e a docs/Documento_de_Arquitetura.md, linha 156 (MR01); PDF da Arquitetura, página 4
- **Evidência:** A Visão PDF mantém histórico até 1.1.0, sem a revisão 1.2.0 de 15/11 presente no Markdown. A Arquitetura PDF conserva MR01 de desempenho; no Markdown MR01 é responsividade e acessibilidade. Os três PDFs foram adicionados no commit 7d363535.
- **Impacto:** Versões publicadas do mesmo documento conduzem a informações diferentes sobre decisões e referências.
- **Reparo:** Cada PDF publicado deve corresponder à versão vigente do respectivo .md, com o mesmo histórico de revisões e o mesmo conteúdo. **Prazo:** até a entrega final, com rechecagem.

### DEF-013 – Documentos indicam ramos diferentes para integração do código

- **Severidade / Tipo / Tema:** Alto · Inconsistência · Visão
- **Localização:** docs: docs/Documento_de_Visao_do_Produto.md, linhas 132 (seção 2.1, item c) e 225 (seção 3, item e); docs/Documento_de_Arquitetura.md, linha 173 (MR04); docs/Política_de_Commits.md, linhas 12–18 (§3)
- **Evidência:** A Visão 2.1(c) indica main, a seção 3(e) indica developer e a Arquitetura MR04 menciona entrada pela main. A política de commits estabelece integração na developer. A falta de código na main, isoladamente, não é penalizada.
- **Impacto:** A orientação de integração é contraditória entre artefatos usados pela equipe.
- **Reparo:** Visão, Arquitetura e Política de Commits devem indicar a mesma branch de integração do código revisado e o mesmo caminho até a main. **Prazo:** até a entrega final, com rechecagem.

### DEF-015 – Faltam registros rastreáveis das cerimônias para S1 a S3

- **Severidade / Tipo / Tema:** Alto · Omissão · Outros
- **Localização:** docs: docs/atas-reuniao/ata-reuniao-1.md (modelo do template); metricas/projeto/registro-escopo.md, linha 12
- **Evidência:** O registro-escopo admite ausência de atas isoladas de Sprint Planning nas três primeiras Sprints; a única ata publicada é um template de 2024. Não foram encontrados registros equivalentes para as decisões de cada cerimônia.
- **Impacto:** A discussão tempestiva de desvios não pode ser comprovada pelos registros publicados. Não se conclui que as reuniões deixaram de ocorrer.
- **Reparo:** As cerimônias declaradas na Visão 2.1(b) devem ter registro rastreável (data, participantes e decisões), ao menos a partir da Sprint 4, e o modelo de ata do template deve ser substituído. **Prazo:** até a entrega final, com rechecagem.

### DEF-017 – Planejamento da Visão não reflete o replanejamento registrado separadamente

- **Severidade / Tipo / Tema:** Alto · Inconsistência · Visão
- **Localização:** docs: docs/Documento_de_Visao_do_Produto.md, linhas 165–181 (seção 2.3 e Tabela 3); metricas/projeto/tch.csv; metricas/projeto/registro-escopo.md, linhas 35–45 (seção 3)
- **Evidência:** A seção 2.3 diz que o plano é atualizado a cada Sprint. A Tabela 3 conserva a programação original, enquanto registro-escopo relata passivo e replanejamento. Há decisões registradas, mas os artefatos não estão sincronizados.
- **Impacto:** O leitor encontra orientações diferentes sobre o escopo em execução.
- **Reparo:** A Tabela 3 deve refletir o replanejamento decidido (Sprints, entregas e situação), com a mudança registrada no histórico de revisões da Visão. **Prazo:** até a entrega final, com rechecagem.

### DEF-019 – Automação de testes declarada sem implementação publicada correspondente

- **Severidade / Tipo / Tema:** Alto · Inconsistência · Testes
- **Localização:** docs: docs/Documento_de_Visao_do_Produto.md, linha 378 (seção 6.1); .github/workflows/ci.yml (branch docs); branch developer, sem .github/workflows
- **Evidência:** A Visão 6.1 afirma testes e bloqueio por cobertura em cada PR. No snapshot developer não há .github/workflows; o workflow da docs publica MkDocs, sem esse controle.
- **Impacto:** O controle de integração prometido não pode ser reproduzido ou confirmado nos artefatos publicados.
- **Reparo:** A automação descrita na seção 6.1 (testes e limite de cobertura a cada PR) deve estar implementada e verificável no repositório, ou o texto deve descrever o controle realmente praticado. **Prazo:** até a entrega final, com rechecagem.

### DEF-020 – Planejamento de testes com definição operacional incompleta

- **Severidade / Tipo / Tema:** Alto · Omissão · Testes
- **Localização:** docs: docs/Documento_de_Visao_do_Produto.md, linhas 360–378 (seção 6.1) e 169–179 (Tabela 3)
- **Evidência:** A Visão 6.1 contém estratégia, ferramentas, papéis genéricos e teste de sistema previsto para S4. Faltam técnicas selecionadas, casos com entradas e resultados esperados e sincronização dos testes unitários por atividade/Sprint. Permanecem referências a integração após sua retirada da lista de níveis.
- **Impacto:** A execução dos testes unitários não possui planejamento suficientemente verificável. Não se exige arquivo separado nem adoção de todas as técnicas.
- **Reparo:** O planejamento de testes deve definir técnicas, casos com entradas e resultados esperados, responsáveis e Sprints de execução, sem citar níveis já retirados. **Prazo:** até a entrega final, com rechecagem.

### DEF-021 – Meta de cobertura de testes sem evidência publicada de medição

- **Severidade / Tipo / Tema:** Alto · Omissão · Testes
- **Localização:** developer: api/package.json, linha 7; mobile/package.json, linha 7
- **Evidência:** Não foi encontrado relatório de cobertura correspondente ao snapshot. api/package.json usa jest, sem limiar configurado nesse arquivo. A falta de --coverage no script, por si, não prova que a cobertura nunca tenha sido medida por outro comando.
- **Impacto:** Não é possível conferir o atendimento à meta de 80%. O bloqueio automático ausente é tratado em DEF-019.
- **Reparo:** A cobertura de testes deve ser medida e o resultado publicado, de forma que a meta de 80% da Visão 6.1 possa ser conferida. **Prazo:** até a entrega final, com rechecagem.

### DEF-022 – Exclusão de teste e lacunas de verificação no incremento integrado

- **Severidade / Tipo / Tema:** Alto · Inconsistência · Testes
- **Localização:** developer: commit 84219bda (16/11/2026), que remove api/src/controllers/linhascontroller.test.js
- **Evidência:** O commit 84219bda remove api/src/controllers/linhascontroller.test.js, com 83 linhas, e altera mobile/src/services/api.js. O teste removido verifica filtros de linhas e validação de itinerário. Não há substituto correspondente no snapshot inspecionado.
- **Impacto:** O incremento perde verificações antes existentes. O alcance foi limitado aos comportamentos efetivamente testados, sem alegar perda de testes de todos os requisitos citados no relato original.
- **Reparo:** Os comportamentos verificados pelo teste removido (filtros de linhas e validação de itinerário) devem voltar a ter verificação automatizada, ou a remoção deve ser justificada. **Prazo:** até a entrega final, com rechecagem.

### DEF-025 – Referências cruzadas às MR não acompanham a numeração atual do Markdown

- **Severidade / Tipo / Tema:** Alto · Inconsistência · Arquitetura
- **Localização:** docs: docs/Documento_de_Arquitetura.md, linhas 97, 108, 109, 343, 348, 352, 355, 356, 365, 366, 370, 371, 388, 413 e 425
- **Evidência:** Exemplos no Markdown: cobertura remete a MR06, segurança a MR07 e API a MR03; as seções correspondentes atuais são MR05, MR06 e MR02. CT-03 existe no PDF antigo publicado da Visão, mas não no Markdown atual.
- **Impacto:** As justificativas arquiteturais remetem a restrições diferentes das pretendidas, comprometendo a rastreabilidade.
- **Reparo:** Cada remissão a MR deve apontar para a meta ou restrição correspondente na numeração atual (MR01 a MR09), e a remissão a CT-03 deve indicar um elemento existente. **Prazo:** até a entrega final, com rechecagem.

### DEF-027 – Uso de ORM declarado na arquitetura diverge do acesso a dados implementado

- **Severidade / Tipo / Tema:** Alto · Inconsistência · Arquitetura
- **Localização:** docs: docs/Documento_de_Arquitetura.md, linhas 141, 148 e 358; developer: api/src/config/database.js, linhas 1–4
- **Evidência:** As linhas 141, 148 e 358 declaram ORM; api/src/config/database.js e os repositórios usam pg e SQL direto. A ausência de mapa não recebe desconto genérico, pois parte desse escopo é prevista para S5.
- **Impacto:** A orientação de implementação não corresponde ao mecanismo de persistência integrado.
- **Reparo:** A Arquitetura deve descrever o mecanismo de persistência efetivamente usado, ou o código deve adotar o mecanismo descrito. **Prazo:** até a entrega final, com rechecagem.

### DEF-029 – Arquivo de ambiente versionado em desacordo com a política

- **Severidade / Tipo / Tema:** Alto · Inconsistência · Código
- **Localização:** developer: .env, linhas 5 e 7 (alterado nos commits 246bd9f1 e 28d89283); docs: docs/Política_de_Commits.md, linha 21 (§4)
- **Evidência:** A árvore developer contém .env com as chaves DB_PASSWORD e JWT_SECRET, entre outras (valores omitidos). O §4 da Política de Commits proíbe expressamente “credenciais, senhas, chaves de API ou arquivos de ambiente em qualquer commit”. Não se afirma que exista segredo ativo comprometido.
- **Impacto:** Violação comprovada da política de higiene e risco de exposição de configuração. Alto; não há evidência suficiente nesta inspeção para afirmar incidente crítico.
- **Reparo:** O arquivo de ambiente deve deixar de ser versionado, conforme o §4 da Política, e as credenciais expostas no histórico não devem permanecer em uso. **Prazo:** até a entrega final, com rechecagem.

### DEF-030 – Revisão de código exigida pela política sem registro nos PRs integrados

- **Severidade / Tipo / Tema:** Alto · Inconsistência · Outros
- **Localização:** GitHub: os 22 Pull Requests mesclados na developer (#2 a #31), em https://github.com/FGA0138-MDS-Ajax/2026.2-T02-Knuth/pulls?q=is%3Apr+is%3Amerged; docs: docs/Política_de_Commits.md, linhas 12–18 (§3)
- **Evidência:** Dos 22 PRs mesclados na developer, apenas o #7 tem aprovação registrada. Os PRs #2, #11, #12, #14, #15, #20, #21, #22, #24, #25 e #26, abertos pelo Analista de Qualidade, foram mesclados por ele mesmo; os PRs #17 e #23 foram mesclados pela própria autora. O §3 exige a revisão do Analista de Qualidade antes da integração.
- **Impacto:** A política de revisão, que sustenta a DoD, não tem evidência de cumprimento.
- **Reparo:** Cada PR integrado à developer deve ter revisão registrada antes do merge, conforme o §3, feita por pessoa diferente do autor. **Prazo:** até a entrega final, com rechecagem.

### DEF-035 – Coleta TSTP vencida sem dados publicados

- **Severidade / Tipo / Tema:** Alto · Omissão · Outros
- **Localização:** docs: metricas/negocio/relatorio-tstp.md; metricas/negocio/tstp.csv (inexistente); docs/Plano_de_Metricas.md, linha 69 (periodicidade)
- **Evidência:** A rodada 1 está prevista para 15/11/2026. Em 16/11, metricas/negocio/relatorio-tstp.md permanece sem resultados e tstp.csv não consta da árvore. Não se cobram antecipadamente as rodadas de S4 e S5.
- **Impacto:** Não é possível conferir a medição de negócio já prevista. A conclusão é falta de evidência publicada, não prova de ausência de sessão externa.
- **Reparo:** Os resultados da rodada 1 da TSTP devem ser publicados no arquivo previsto pelo Plano, ou a mudança de cronograma deve ser registrada com justificativa. **Prazo:** até a entrega final, com rechecagem.

### DEF-038 – Base e análise TCH contradizem backlog e datas de integração

- **Severidade / Tipo / Tema:** Alto · Inconsistência · Outros
- **Localização:** docs: metricas/projeto/registro-escopo.md, linhas 16, 26, 28 e 39–45; docs/Documento_de_Visao_do_Produto.md, linhas 290–344 (Tabela 7); GitHub: PR #7, mesclado em 05/11/2026
- **Evidência:** O registro aloca RF06/RF11 na S3, mas o backlog os situa em S5. Atribui o PR #7 à S3, embora o merge seja de 05/11 (S2). Declara 16 PRs e enumera 17. O CSV, contudo, registra TCH 0%: não se afirma inflação do numerador.
- **Impacto:** A reconstrução da linha de base e a explicação dos desvios não são confiáveis sem conciliação das fontes.
- **Reparo:** A linha de base e a análise da TCH devem coincidir com o backlog da Visão e com as datas de merge registradas no GitHub. **Prazo:** até a entrega final, com rechecagem.

## Defeitos médios

### DEF-001 – Margens laterais insuficientes nos PDFs publicados

- **Severidade / Tipo / Tema:** Médio · Inconsistência · Outros
- **Localização:** docs: docs/RotasDF - Visão do Produto e do Projeto.pdf e docs/RotasDF - Documento de Arquitetura.pdf; todas as páginas (medição nas páginas 3 e 5)
- **Evidência:** Nas páginas 3 e 5 dos PDFs de Visão e Arquitetura, o texto alcança aproximadamente 1,8 cm das laterais. A medição foi feita pela posição do conteúdo em páginas A4; cabeçalhos e rodapés foram distinguidos do corpo.
- **Impacto:** O corpo invade a área prevista pelo critério de margens ABNT.
- **Reparo:** Os dois PDFs devem apresentar margens de 3 cm (superior e esquerda) e 2 cm (inferior e direita), conforme a NBR 14724. **Prazo:** no ciclo de revisão.

### DEF-002 – Paginação dos PDFs posicionada no rodapé

- **Severidade / Tipo / Tema:** Médio · Omissão · Outros
- **Localização:** docs: docs/RotasDF - Visão do Produto e do Projeto.pdf e docs/RotasDF - Documento de Arquitetura.pdf; rodapé de todas as páginas (“Página N”)
- **Evidência:** Os PDFs de Visão e Arquitetura apresentam Página N na parte inferior. O apontamento se limita à posição da paginação cobrada no critério; não inclui desconto adicional por capa ou folha de rosto.
- **Impacto:** A posição da paginação diverge do padrão formal adotado na inspeção.
- **Reparo:** A numeração das páginas dos dois PDFs deve seguir a NBR 14724: algarismos arábicos no canto superior direito. **Prazo:** no ciclo de revisão.

### DEF-003 – Figuras 1, 2 e 7 sem indicação de fonte

- **Severidade / Tipo / Tema:** Médio · Omissão · Arquitetura
- **Localização:** docs: docs/Documento_de_Arquitetura.md, linhas 115–117 (Figura 1), 217–219 (Figura 2) e 437–439 (Figura 7); PDF correspondente
- **Evidência:** As Figuras 3 a 6 têm “Fonte: Elaborado pelos autores (2026)”, mas as Figuras 1, 2 e 7 não têm a linha de fonte.
- **Impacto:** Não fica identificada a autoria das ilustrações.
- **Reparo:** As Figuras 1, 2 e 7 devem ter a linha “Fonte:” abaixo da ilustração, como as Figuras 3 a 6, no .md e no PDF. **Prazo:** no ciclo de revisão.

### DEF-005 – Tabela de riscos com colunas desalinhadas e um risco truncado

- **Severidade / Tipo / Tema:** Médio · Ambiguidade · Visão
- **Localização:** docs: docs/Documento_de_Visao_do_Produto.md, linhas 195–201 (Tabela 4) e 205–209 (texto dos riscos)
- **Evidência:** O cabeçalho tem 3 colunas (Risco, Mitigação, Plano de contingência), mas as linhas têm 4 valores: o nível (Alto/Médio) cai na coluna Mitigação. O risco “Desenvolvedores com pouco” está incompleto, e o texto da linha 207 o descreve de outro modo (“não saberem o que fazer”).
- **Impacto:** O nível, a mitigação e a contingência de cada risco não podem ser lidos com segurança.
- **Reparo:** A Tabela 4 deve ter uma coluna para cada informação (risco, nível, mitigação e contingência), e o segundo risco deve estar completo e coerente com o texto explicativo. **Prazo:** no ciclo de revisão.

### DEF-006 – Texto da Visão sem chamadas às obras da bibliografia

- **Severidade / Tipo / Tema:** Médio · Omissão · Visão
- **Localização:** docs: docs/Documento_de_Visao_do_Produto.md, seções 1 a 6 (linhas 50–378) e seção 7 (linhas 383–395)
- **Evidência:** As seções 1 a 6 não estabelecem chamadas às seis obras listadas na seção 7. Foi examinada a associação entre texto e referências, além de buscas por padrões de citação.
- **Impacto:** As fontes do conteúdo não ficam associadas aos trechos fundamentados. Problema de completude e padrão, classificado como Médio.
- **Reparo:** As afirmações apoiadas em literatura devem trazer citações no padrão da NBR 10520, e cada obra da seção 7 deve ser citada no texto ou retirada da lista. **Prazo:** no ciclo de revisão.

### DEF-007 – Citações da Arquitetura sem referências bibliográficas correspondentes

- **Severidade / Tipo / Tema:** Médio · Inconsistência · Arquitetura
- **Localização:** docs: docs/Documento_de_Arquitetura.md, linhas 75, 163, 168, 183 e 193; seção 3 (linhas 472–482)
- **Evidência:** FIELDING (2000), OPENAPI INITIATIVE (2021), VAN ROSSUM; WARSAW; COGHLAN (2001), MARTIN (2009), BRASIL (2018) e GTFS (2026) são citados, mas não aparecem nas cinco entradas da seção 3.
- **Impacto:** A bibliografia fica incompleta e dificulta consultar as fontes. Severidade Média pelo impacto documental demonstrado.
- **Reparo:** Cada obra citada (FIELDING, OPENAPI INITIATIVE, VAN ROSSUM; WARSAW; COGHLAN, MARTIN, BRASIL e GTFS) deve ter referência completa na seção 3, conforme a NBR 6023. **Prazo:** no ciclo de revisão.

### DEF-008 – Referência de Kruchten sem chamada no texto da Arquitetura

- **Severidade / Tipo / Tema:** Médio · Inconsistência · Outros
- **Localização:** docs: docs/Documento_de_Arquitetura.md, linha 476 (referência KRUCHTEN, 1995)
- **Evidência:** KRUCHTEN (1995) consta da lista de referências, mas não foi localizada uma chamada correspondente no corpo. As referências não citadas da Visão já são tratadas em DEF-006.
- **Impacto:** Há falta de correspondência entre bibliografia e texto, sem duplicar a ocorrência da Visão.
- **Reparo:** A obra de Kruchten deve ser citada no trecho que ela fundamenta ou retirada da lista de referências. **Prazo:** no ciclo de revisão.

### DEF-011 – Versões dos cabeçalhos divergem dos históricos de revisão

- **Severidade / Tipo / Tema:** Médio · Inconsistência · Outros
- **Localização:** docs: docs/Documento_de_Visao_do_Produto.md, linhas 3 e 23; docs/Documento_de_Arquitetura.md, linhas 3 e 22
- **Evidência:** Visão: cabeçalho 1.1.0 e histórico até 1.2.0. Arquitetura: cabeçalho 1.1.0 e histórico até 1.1.1. A notação 1.0 não gera outro desconto sem exigência expressa de SemVer.
- **Impacto:** A identificação da revisão vigente é ambígua.
- **Reparo:** O cabeçalho de cada documento deve indicar a mesma versão registrada na última linha do histórico de revisões. **Prazo:** no ciclo de revisão.

### DEF-014 – Figura do fluxo de Sprint não incorporada à Visão

- **Severidade / Tipo / Tema:** Médio · Omissão · Visão
- **Localização:** docs: docs/Documento_de_Visao_do_Produto.md, seções 2.1 (linhas 120–147) e 3 (linhas 213–243); docs/imagens/visao-fig2-fluxo-sprint.png
- **Evidência:** docs/imagens/visao-fig2-fluxo-sprint.png existe, mas não é incorporada nas seções 2.1 e 3. O quadro de conteúdo da Visão pede alinhamento de figuras e texto. O processo está descrito em prosa.
- **Impacto:** A apresentação do processo fica parcialmente incompleta no critério de conteúdo; não significa inexistência de ciclo de vida.
- **Reparo:** O ciclo de vida e o processo devem ser representados por figura numerada, com fonte e explicação no texto, coerente com as seções 2.1 e 3. **Prazo:** no ciclo de revisão.

### DEF-016 – Acompanhamento por GitHub Projects declarado sem quadro vinculado acessível

- **Severidade / Tipo / Tema:** Médio · Omissão · Outros
- **Localização:** docs: docs/Documento_de_Visao_do_Produto.md, linhas 106 e 142; GitHub do repositório: abas Projects, Issues e Milestones (vazias em 16/11/2026)
- **Evidência:** A Visão declara acompanhamento A Fazer/Em Andamento/Em Revisão/Concluído em GitHub Projects. A consulta do repositório retornou projectsV2 vazio, zero issues e zero milestones. Isso não exclui quadros privados ou externos não vinculados.
- **Impacto:** O acompanhamento prometido não está disponível ao inspetor pelo repositório, reduzindo a rastreabilidade publicada.
- **Reparo:** O acompanhamento declarado deve estar acessível a partir do repositório (quadro vinculado), ou a Visão deve descrever a ferramenta realmente usada. **Prazo:** no ciclo de revisão.

### DEF-018 – Plano atribui à Visão uma meta que não está no trecho citado

- **Severidade / Tipo / Tema:** Médio · Inconsistência · Visão
- **Localização:** docs: docs/Documento_de_Visao_do_Produto.md, linhas 350–354 (seção 5 vigente) e versão de 28/10/2026 (commit d3af588c), linha 369; docs/Plano_de_Metricas.md, linhas 28, 124 e 154
- **Evidência:** O Plano atribui a meta de 80% da TCH à seção 5 da Visão (linhas 28 e 124) e cita a “Visão, versão 1.0.0” (linha 154). A meta existia na seção 5 da versão de 28/10/2026 (commit d3af588c, linha 369), mas foi retirada na revisão 1.2.0, de 15/11/2026; na versão vigente, a seção 5 não traz a meta.
- **Impacto:** A referência cruzada não permite localizar a definição da meta.
- **Reparo:** A meta de 80% da TCH deve constar do trecho da Visão para o qual o Plano remete, ou o Plano deve indicar a origem correta da meta. **Prazo:** no ciclo de revisão.

### DEF-023 – Notação de generalização de atores inconsistente no diagrama

- **Severidade / Tipo / Tema:** Médio · Inconsistência · Arquitetura
- **Localização:** docs: docs/Documento_de_Arquitetura.md, linhas 217–219 (Figura 2); docs/imagens/arq-fig2-casos-de-uso.png
- **Evidência:** A Figura 2 usa ligação tracejada para generalização entre Passageiro Cadastrado e Passageiro Anônimo. As extensões RF15/RF18 também não explicitam a condição de autenticação. Não se afirma que o código autoriza acesso anônimo a essas funções.
- **Impacto:** A notação e as condições de perfil dificultam interpretar corretamente o modelo de uso.
- **Reparo:** A Figura 2 deve usar a notação UML de generalização entre atores (linha contínua com triângulo vazado) e explicitar a condição de autenticação nas extensões RF15 e RF18. **Prazo:** no ciclo de revisão.

### DEF-024 – Extensão de gerenciamento de alertas para importação GTFS sem justificativa

- **Severidade / Tipo / Tema:** Médio · Inconsistência · Arquitetura
- **Localização:** docs: docs/Documento_de_Arquitetura.md, linhas 217–219 (Figura 2); docs/imagens/arq-fig2-casos-de-uso.png
- **Evidência:** A Figura 2 liga Gerenciar Alertas (RF22) por extend a Importar GTFS (RF20), sem condição de extensão ou relação equivalente explicada no backlog. Há também o rótulo Buscas recenes.
- **Impacto:** A relação do modelo não encontra sustentação explícita no escopo; o erro de rótulo é editorial e não gera outro ID.
- **Reparo:** A relação entre Gerenciar Alertas (RF22) e Importar GTFS (RF20) deve ter respaldo no backlog ou ser retirada, e o rótulo “Buscas recenes” deve ser corrigido. **Prazo:** no ciclo de revisão.

### DEF-026 – Configuração versionada de contêineres cobre apenas parte da restrição MR07

- **Severidade / Tipo / Tema:** Médio · Inconsistência · Arquitetura
- **Localização:** docs: docs/Documento_de_Arquitetura.md, linha 188 (MR07); developer: infrastructure/docker-compose.yml, linhas 1–2
- **Evidência:** A MR07 prevê Dockerfile e Compose para aplicação e banco. O snapshot developer contém infrastructure/docker-compose.yml somente com db e nenhum Dockerfile. Não se conclui que staging externo inexiste.
- **Impacto:** A padronização de ambientes está parcialmente documentada e não pode ser reproduzida integralmente pelo repositório.
- **Reparo:** A configuração de contêineres versionada deve cobrir o que a MR07 estabelece (aplicação e banco), ou a MR07 deve ser ajustada ao que foi adotado. **Prazo:** no ciclo de revisão.

### DEF-028 – Visão de implantação deixa indefinido o modo de execução do importador

- **Severidade / Tipo / Tema:** Médio · Ambiguidade · Arquitetura
- **Localização:** docs: docs/Documento_de_Arquitetura.md, linhas 421–423 (seção 2.6)
- **Evidência:** A seção 2.6 admite execução no mesmo ambiente ou via cron job/worker, sem selecionar ou explicar o mecanismo de disparo e operação. A mera lista de provedores de nuvem possíveis não gera penalidade.
- **Impacto:** Falta uma decisão operacional para reproduzir a implantação descrita.
- **Reparo:** A visão de implantação deve indicar onde e como o importador GTFS é executado e disparado. **Prazo:** no ciclo de revisão.

### DEF-031 – Identificação dos itens de configuração não está consolidada

- **Severidade / Tipo / Tema:** Médio · Omissão · Outros
- **Localização:** docs: docs/Política_de_Commits.md (documento inteiro); docs/Documento_de_Visao_do_Produto.md, seção 3 (linhas 213–243)
- **Evidência:** A política define mensagens, branches e higiene, mas não há inventário que identifique o conjunto controlado de artefatos, sua localização e forma de identificação. A árvore do projeto não explicita sozinha esse controle.
- **Impacto:** A gestão de configuração apresenta completude parcial, classificada como Média.
- **Reparo:** Deve existir uma identificação dos itens de configuração: quais artefatos são controlados, onde ficam e como são versionados. **Prazo:** no ciclo de revisão.

### DEF-032 – Exceções ao fluxo obrigatório de PR são ambíguas

- **Severidade / Tipo / Tema:** Médio · Ambiguidade · Outros
- **Localização:** docs: docs/Política_de_Commits.md, linhas 12–14 (§3, exceções); developer: commits 00cec0a9 e ad11b025 (15/11/2026)
- **Evidência:** O §3 permite envios diretos “a fim de testes”, que “foram apagadas” ou que “corrigem erros logísticos”, sem delimitar sua aplicação. Pela redação atual, o merge 00cec0a9, que integrou código do RF13 à developer sem PR e foi revertido em ad11b025, cabe na exceção de alterações apagadas. Não se exige Conventional Commits, aprovação formal na interface ou proteção de branch, pois esses controles não estão expressos nessa política.
- **Impacto:** A exceção permite contornar o fluxo obrigatório de PR, inclusive para funcionalidades.
- **Reparo:** As exceções ao fluxo de PR devem ser delimitadas de forma verificável: quais alterações, em quais branches e por quem. **Prazo:** no ciclo de revisão.

### DEF-033 – Mensagem de commit não representa adequadamente as alterações realizadas

- **Severidade / Tipo / Tema:** Médio · Inconsistência · Outros
- **Localização:** developer: commit 84219bda (16/11/2026); docs: docs/Política_de_Commits.md, linhas 5–10 (§1 e §2)
- **Evidência:** O commit 84219bda, com a mensagem “corige erros de identação” (grafia original), remove um arquivo de testes e corrige fechamento/retorno de função em api.js. A política exige mensagens claras e commits de alteração lógica identificável.
- **Impacto:** A descrição omite a perda de teste e prejudica a rastreabilidade do histórico; a mistura de estilos de mensagem não é penalizada.
- **Reparo:** As mensagens de commit devem descrever todas as alterações feitas, e cada commit deve conter uma única alteração lógica, conforme os §1 e §2. **Prazo:** no ciclo de revisão.

### DEF-034 – Medição da TCH das Sprints 1 e 2 não realizada no prazo previsto

- **Severidade / Tipo / Tema:** Médio · Omissão · Outros
- **Localização:** docs: docs/Documento_de_Visao_do_Produto.md na versão de 28/10/2026 (commit d3af588c), linhas 343–370 (seção 5, Métrica 1, “When: ao final de cada sprint”); metricas/projeto/registro-escopo.md, linha 12; docs/Plano_de_Metricas.md, linhas 17–22
- **Evidência:** A Visão publicada em 28/10/2026 já previa medir as histórias concluídas “ao final de cada sprint”. As Sprints 1 e 2 terminaram em 01/11 e 08/11, mas o primeiro registro da TCH é de 15/11, quando o Plano de Métricas foi criado (commit b09dbed9). O registro-escopo informa que a linha de base dessas Sprints “foi reconstruída”.
- **Impacto:** As medições das Sprints 1 e 2 não puderam orientar decisões no momento em que ocorreram.
- **Reparo:** As próximas medições devem ser registradas ao final de cada Sprint, na data prevista, e o Plano deve indicar quais valores foram reconstruídos depois. **Prazo:** no ciclo de revisão.

### DEF-036 – DoD usada pela métrica difere da definição da Visão

- **Severidade / Tipo / Tema:** Médio · Inconsistência · Outros
- **Localização:** docs: docs/Documento_de_Visao_do_Produto.md, linhas 239–243 (DoD); docs/Plano_de_Metricas.md, linha 112 (seção 3.3)
- **Evidência:** A Visão enumera implementação, testes unitários e revisão/merge. A coleta TCH do Plano acrescenta CI sem falhas e critérios de aceitação validados pelo PO.
- **Impacto:** A definição operacional de história concluída não está sincronizada entre os documentos. O modelo GQM existe e não recebe desconto por esse motivo.
- **Reparo:** A DoD usada na medição da TCH deve ser a mesma definida na Visão. **Prazo:** no ciclo de revisão.

### DEF-037 – Registro de análise das medições incompleto

- **Severidade / Tipo / Tema:** Médio · Omissão · Outros
- **Localização:** docs: docs/Plano_de_Metricas.md, linhas 131–146 (seção 4)
- **Evidência:** A tabela da seção 4 do Plano está vazia. registro-escopo contém causas e decisões de replanejamento, mas não completa o registro por medição/faixa/análise previsto no plano.
- **Impacto:** A relação entre cada medição e as decisões não está completamente registrada; não se afirma ausência total de análise.
- **Reparo:** A tabela da seção 4 deve registrar, para cada Sprint medida, o valor, a faixa e a análise com a decisão tomada. **Prazo:** no ciclo de revisão.

### DEF-040 – Campo de comparação da declaração de posição não identifica alternativa

- **Severidade / Tipo / Tema:** Médio · Inconsistência · Visão
- **Localização:** docs: docs/Documento_de_Visao_do_Produto.md, linha 81 (Tabela 1, campo “Ao contrário”)
- **Evidência:** Na Tabela 1, Ao contrário descreve Escassez de informação, em vez da alternativa/concorrente com que o produto é comparado. React/HTML/CSS ou interface responsiva não são tratados como contradição automática com mobile.
- **Impacto:** A declaração de posição está parcialmente incompleta.
- **Reparo:** O campo “Ao contrário” deve identificar a alternativa ou o concorrente com que o produto é comparado. **Prazo:** no ciclo de revisão.

## Defeitos baixos

### DEF-004 – Linha de fonte fora de lugar ou sem ilustração associada

- **Severidade / Tipo / Tema:** Baixo · Inconsistência · Visão
- **Localização:** docs: docs/Documento_de_Visao_do_Produto.md, linhas 73–86 (Tabela 1) e 191 (seção 2.4)
- **Evidência:** A fonte da Tabela 1 aparece depois do parágrafo explicativo, separada da tabela (linha 86). A seção 2.4 traz “Fonte: Elaborado pelos autores (2026)” sem nenhuma tabela ou figura (linha 191).
- **Impacto:** Fere a consistência editorial.
- **Reparo:** A fonte da Tabela 1 deve ficar logo abaixo da tabela, e a linha de fonte da seção 2.4 deve ser associada a uma ilustração ou retirada. **Prazo:** na próxima edição do trecho.
- **Evidência de correção:** docs/Documento_de_Visao_do_Produto.md, versão 1.3.1 – fonte da Tabela 1 logo abaixo da tabela e linha de fonte órfã da seção 2.4 retirada

### DEF-009 – Referências fora da ordem alfabética

- **Severidade / Tipo / Tema:** Baixo · Inconsistência · Visão
- **Localização:** docs: docs/Documento_de_Visao_do_Produto.md, linhas 385–395 (seção 7; ISTQB na linha 395)
- **Evidência:** A referência ao ISTQB vem depois de SOMMERVILLE, o que contraria a NBR 6023.
- **Impacto:** Fere a consistência editorial.
- **Reparo:** As referências da seção 7 devem seguir a ordem alfabética, conforme a NBR 6023. **Prazo:** na próxima edição do trecho.
- **Evidência de correção:** docs/Documento_de_Visao_do_Produto.md, versão 1.3.1 – referências da seção 7 em ordem alfabética (NBR 6023)

### DEF-012 – Soma de participação no Markdown diverge do total declarado

- **Severidade / Tipo / Tema:** Baixo · Inconsistência · Visão
- **Localização:** docs: docs/Documento_de_Visao_do_Produto.md, linhas 9–15 (tabela de integrantes)
- **Evidência:** A Visão registra seis parcelas de 16,6, soma 99,6, e declara total 100. Trata-se de inconsistência aritmética de baixo impacto; diferenças por arredondamento no PDF não recebem nova penalidade.
- **Impacto:** Inconsistência editorial local, sem alteração da avaliação técnica do produto.
- **Reparo:** Os pontos de participação devem somar exatamente o total declarado (100). **Prazo:** na próxima edição do trecho.
- **Evidência de correção:** docs/Documento_de_Visao_do_Produto.md, versão 1.3.1 – participação ajustada para somar exatamente 100 (4 × 16,67 + 2 × 16,66)

### DEF-039 – O registro tem marcas de citação sem significado

- **Severidade / Tipo / Tema:** Baixo · Ambiguidade · Outros
- **Localização:** docs: metricas/projeto/registro-escopo.md, linhas 26–28, 31 e 39–44
- **Evidência:** Aparecem marcas como “[cite: 20]”, “[cite: 1, 11]” e “[cite: 5, 6, 7]”, sem nenhuma referência correspondente.
- **Impacto:** O registro fica confuso para o leitor.
- **Reparo:** As marcas “[cite: …]” devem ser retiradas ou substituídas por referências identificáveis. **Prazo:** na próxima edição do trecho.
- **Evidência de correção:** metricas/projeto/registro-escopo.md – marcas “[cite: …]” retiradas (commit ed8c40ce)