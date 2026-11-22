# Registro de Escopo e Rastreabilidade de Entregas — RotasDF

**Projeto:** RotasDF (Turma T02 - Knuth — UnB/FCTE)  
**Data de Atualização:** 22/11/2026 (Alinhamento pós-inspeção e fechamento da Sprint 4)  
**Scrum Master:** Emanuele Victor Santos  
**Product Owner (PO):** Gabriel Felix Mota Soares  

---

## 1. Reconstrução da Linha de Base (Sprints 1 a 3)

Como as Sprints 1, 2 e 3 não contaram com atas isoladas de *Sprint Planning* contendo a contagem fechada de histórias comprometidas, a linha de base de planejamento foi reconstruída formalmente em **15/11/2026** a partir da distribuição por Sprint definida na **Tabela 7 (Seção 4.4) do Documento de Visão** (`docs/Documento_de_Visao_do_Produto.md`, v1.3.1), validada junto ao Dono do Produto e ao Analista de Qualidade:

* **Sprint 1 (26/10/2026 a 01/11/2026):** 4 histórias planejadas (`RF07`, `RF08`, `RF10`, `RF20`).
* **Sprint 2 (02/11/2026 a 08/11/2026):** 5 histórias planejadas (`RF01`, `RF02`, `RF03`, `RF09`, `RF18`).
* **Sprint 3 (09/11/2026 a 15/11/2026):** 2 histórias planejadas na Tabela 7 (`RF13`, `RF21`), somadas ao esforço de absorção do passivo técnico das Sprints 1 e 2. *(Nota: os requisitos `RF06` e `RF11` pertencem originalmente à Sprint 5 na Tabela 7 da Visão, enquanto `RF22` e `RF23` foram priorizados para estabilização administrativa entre S3 e S5).*

---

## 2. Histórico Consolidado da Taxa de Conclusão de Histórias (TCH)

Conforme a *Definition of Done* (DoD) estabelecida na Seção 3 do Documento de Visão e detalhada na Seção 3.5 do Plano de Métricas, uma história só é contabilizada como concluída na Sprint após implementação completa dos critérios de aceitação (Visão, Tabela 8), testes unitários implementados, revisão por pares e integração (*merge*) via Pull Request na branch `developer` dentro da janela temporal da respectiva Sprint.

| Sprint | Período | Planejadas | Concluídas na Janela | TCH (%) | Situação e Rastreabilidade de PRs |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **S1** *(reconstruída)* | 26/10 a 01/11 | 4 | 0 | **0%** | Atraso na configuração inicial do ambiente Docker/PostgreSQL e estruturação do banco. Nenhuma história foi mesclada até 01/11. Os requisitos `RF07`, `RF08` e `RF10` foram concluídos e mesclados na **S2** via PR `#7` (05/11/2026); `RF20` avançou nos PRs `#14` e `#23` na **S3**, permanecendo em monitoramento de risco. |
| **S2** *(reconstruída)* | 02/11 a 08/11 | 5 | 0 | **0%** | A absorção do passivo da S1 (entrega de `RF07`, `RF08` e `RF10` no PR `#7`, mesclado em 05/11/2026) deslocou as entregas novas da S2. `RF02`, `RF03` e `RF18` foram concluídos e mesclados na **S3**; `RF01` (PR `#16`) e `RF09` (PR `#18`) seguiram para ajustes finais. |
| **S3** | 09/11 a 15/11 | 2 | 0 | **0%** | Esforço concentrado na entrega do passivo de S1 e S2 (**16 PRs mesclados na S3**: `#5`, `#8`, `#10`, `#11`, `#12`, `#13`, `#14`, `#15`, `#17`, `#20`, `#21`, `#22`, `#23`, `#24`, `#25`, `#26`), concluindo integralmente `RF02`, `RF03` e `RF18`. As histórias novas da S3 (`RF13` no PR `#30` e `RF21` nos PRs `#28`, `#29`, `#31`) ficaram prontas para integração na abertura da S4. |

### Nota Técnica de Rastreabilidade — RF20 (Importador GTFS)
A primeira versão do script de ingestão GTFS (`RF20`) foi inserida inicialmente via commit direto na estruturação do banco de dados sem abertura de Pull Request. Sua formalização e adequação ocorreram por meio dos Pull Requests **`#14`** (*corrige coleta de domingos/feriados de importador*) e **`#23`** (*fix: atualiza importador GTFS e dependências mobile*), ambos mesclados durante a **Sprint 3**. Embora os PRs `#14` e `#23` tenham avançado a implementação na Sprint 3, o `RF20` permanece **em andamento (parcial)** e encontra-se formalmente mapeado na matriz de riscos do Documento de Visão (Tabela 4), sujeito a redução de escopo caso a estabilização integral dos dados oficiais GTFS não se conclua até a Sprint 5.

---

## 3. Decisões de Replanejamento de Escopo (Sprint 3 → Sprints 4 e 5)

Em alinhamento entre a **Scrum Master** (Emanuele Victor Santos) e o **Product Owner** (Gabriel Felix Mota Soares), diante do passivo acumulado nas Sprints 1 e 2 e da priorização da estabilidade da arquitetura (API + Mobile + Banco GTFS):

1. **Absorção do Passivo na Sprint 3:** A equipe priorizou o fechamento da base funcional crítica planejada para S1 e S2, resultando na integração de **16 Pull Requests** na branch `developer` dentro da janela de 09/11 a 15/11 (`#5`, `#8`, `#10`, `#11`, `#12`, `#13`, `#14`, `#15`, `#17`, `#20`, `#21`, `#22`, `#23`, `#24`, `#25` e `#26`), além do PR `#7` já integrado em 05/11 (S2).
2. **Proteção do Escopo Crítico (*Must Have*):** Histórias classificadas como *Should Have* e *Could Have* previstas para o encerramento do projeto permanecem alocadas na **Sprint 5** (conforme Tabela 7 da Visão: `RF04`, `RF05`, `RF06`, `RF11`, `RF12`, `RF15`), garantindo capacidade da equipe na **Sprint 4** para consolidar os requisitos essenciais (*Must Have*) e sanar os defeitos apontados na inspeção de 16/11/2026.
3. **Alocação de Entregas da Sprint 4 (16/11/2026 a 22/11/2026):**
   * **Passivo da S3 integrado na abertura da S4:** `RF13` (PR `#30`) e `RF21` (PRs `#28`, `#29`, `#31`).
   * **Passivo da S2 em fechamento na S4:** `RF01` (PR `#16`) e `RF09` (PR `#18`).
   * **Histórias planejadas para a S4 (Tabela 7 da Visão):** `RF14` (sinalização de alertas), `RF16` (cadastro/autenticação de passageiro), `RF17` (favoritos), `RF19` (reporte de divergências) e `RF24` (análise de reportes).
   * **Em acompanhamento de risco / possível redução de escopo:** `RF20` (Importador GTFS).
