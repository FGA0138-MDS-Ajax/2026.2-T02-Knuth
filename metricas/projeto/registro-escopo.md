# Registro de Escopo e Rastreabilidade de Entregas — RotasDF

**Projeto:** RotasDF (Turma T02 - Knuth — UnB/FCTE)  
**Data de Atualização:** 15/11/2026 (Fechamento da Sprint 3)  
**Scrum Master:** Emanuele Victor Santos  
**Product Owner (PO):** Gabriel Felix Mota Soares  

---

## 1. Reconstrução da Linha de Base (Sprints 1 a 3)

Como as Sprints 1, 2 e 3 não contaram com atas isoladas de *Sprint Planning* contendo a contagem fechada de histórias comprometidas, a linha de base de planejamento foi reconstruída formalmente a partir do cronograma previsto na **Seção 4.4 do Documento de Visão** (`docs/Documento_de_Visao_do_Produto.md`), validada junto ao Dono do Produto e aos Analistas de Qualidade:

* **Sprint 1 (26/10/2026 a 01/11/2026):** 4 histórias planejadas (`RF07`, `RF08`, `RF10`, `RF20`).
* **Sprint 2 (02/11/2026 a 08/11/2026):** 5 histórias planejadas (`RF01`, `RF02`, `RF03`, `RF09`, `RF18`).
* **Sprint 3 (09/11/2026 a 15/11/2026):** 4 histórias planejadas (`RF06`, `RF11`, `RF13`, `RF21`).

---

## 2. Histórico Consolidado da Taxa de Conclusão de Histórias (TCH)

Conforme a *Definition of Done* (DoD) estabelecida no Plano de Métricas, uma história só é contabilizada como concluída na Sprint após implementação, revisão técnica e integração (*merge*) via Pull Request na branch `developer` dentro da janela temporal da respectiva Sprint.

| Sprint | Período | Planejadas | Concluídas na Janela | TCH (%) | Situação e Rastreabilidade de PRs |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **S1** | 26/10 a 01/11 | 4 | 0 | **0%** | Atraso na configuração inicial de ambiente e banco. Todos os 4 itens (`RF07`, `RF08`, `RF10`, `RF20`) foram concluídos e mergeados na **S3**. |
| **S2** | 02/11 a 08/11 | 5 | 0 | **0%** | Itens acumulados da S1 postergaram o início da S2. `RF02`, `RF03` e `RF18` foram concluídos e mergeados na **S3**; `RF01` (`#16`) e `RF09` (`#18`) seguem em revisão. |
| **S3** | 09/11 a 15/11 | 4 | 0 | **0%** | Esforço concentrado na entrega do passivo de S1 e S2 (**16 PRs mergeados na S3**). `RF13` (`#30`) e `RF21` (`#28`, `#29`, `#31`) estão implementados e aguardam merge; `RF06` e `RF11` foram replanejados. |

### Nota Técnica de Rastreabilidade — RF20 (Importador GTFS)
A primeira versão do script de ingestão GTFS (`RF20`) foi inserida inicialmente via commit direto na estruturação do banco de dados sem abertura de Pull Request. Sua formalização, revisão e adequação à DoD ocorreram por meio dos Pull Requests **`#14`** (*corrige coleta de domingos/feriados de importador*) e **`#23`** (*fix: atualiza importador GTFS e dependências mobile*), ambos mergeados durante a **Sprint 3**. Por esse critério de conformidade, o `RF20` é contabilizado como concluído na Sprint 3.

---

## 3. Decisões de Replanejamento de Escopo (Sprint 3 -> Sprints 4 e 5)

Em alinhamento entre a **Scrum Master** (Emanuele Victor) e o **Product Owner** (Gabriel Felix), diante do passivo acumulado nas Sprints 1 e 2 e da priorização da estabilidade da arquitetura (API + Mobile + Banco GTFS):

1. **Absorção do Passivo na Sprint 3:** A equipe priorizou o fechamento de toda a base funcional crítica planejada para S1 e S2, resultando na integração de 16 Pull Requests na `developer` (`#5`, `#7`, `#8`, `#10`, `#11`, `#12`, `#13`, `#14`, `#15`, `#17`, `#20`, `#21`, `#22`, `#23`, `#24`, `#25`, `#26`).
2. **Proteção do Escopo Crítico (*Must Have*):** Histórias classificadas como *Should Have* e *Could Have* no backlog foram postergadas para a **Sprint 5**, garantindo capacidade total da equipe nas Sprints 3 e 4 para consolidar os requisitos essenciais (*Must Have*) do MVP.
3. **Transição para a Sprint 4:**
   * **Prontos para merge imediato na abertura da S4:** `RF13` (PR `#30`) e `RF21` (PRs `#28`, `#29`, `#31`).
   * **Em revisão/ajustes finais para conclusão na S4:** `RF01` (PR `#16`) e `RF09` (PR `#18`).
   * **Replanejados para a S4:** `RF06` e `RF11`.
