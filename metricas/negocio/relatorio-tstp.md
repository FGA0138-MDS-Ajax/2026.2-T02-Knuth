# Relatório de Medição — Taxa de Sucesso de Tarefas de Planejamento (TSTP)

**Projeto:** RotasDF (Turma T02 - Knuth — UnB/FCTE)  
**Responsável pela Coleta:** Gabriel Sakai e Silva (Analista de Qualidade)  
**Validação:** Gabriel Felix Mota Soares (Dono do Produto)  
**Última Atualização:** 22/11/2026  

---

## 1. Status e Atualização de Cronograma (Replanejamento S3 → S4/S5)

Em conformidade com a Seção 2.3 do **Plano de Métricas (v1.2)**, a **Rodada 1** dos testes de usabilidade para apuração da **TSTP**, inicialmente prevista para o encerramento da Sprint 3 (15/11/2026), foi formalmente reprogramada para a transição entre as **Sprints 4 e 5 (até 25/11/2026)**.

### Justificativa Técnica
Ao final da Sprint 3 (15/11/2026), a integração entre o aplicativo mobile (React Native) e os endpoints de busca de trajetos (`RF01`), consulta de paradas (`RF09`) e exibição de alertas (`RF13`/`RF14`) ainda estava em fase de conclusão via Pull Requests na branch `developer`. Como a TSTP avalia a efetividade de ponta a ponta do passageiro na execução de tarefas completas de planejamento (cenários C1 a C4 em `staging`), a aplicação do roteiro sem os fluxos integrados invalidaria a medição.

---

## 2. Roteiro Padronizado de Tarefas (Preparado para Coleta)

Cada participante (mínimo de 5 usuários por rodada, sem vínculo com o desenvolvimento) executará individualmente no ambiente `staging` as seguintes tarefas cronometradas, sem intervenção do avaliador:

| Código | Cenário | Tarefa de Planejamento | Tempo Máximo | Critério de Sucesso (`1`) |
| :--- | :--- | :--- | :---: | :--- |
| **T01** | C2 / C3 | Buscar uma linha específica pelo número/nome, abrir seu itinerário e verificar os horários de partida em dias úteis. | 90 s | Localizar a linha correta, alternar sentido e identificar o horário exato sem auxílio. |
| **T02** | C1 | Planejar um trajeto entre uma origem e um destino informados, identificando a linha a embarcar e o ponto de desembarque. | 120 s | Obter as opções de rota e descrever corretamente as etapas de embarque e desembarque. |
| **T03** | C4 | Verificar se há algum alerta de alteração de serviço (desvio, paralisação ou alteração de horário) afetando uma linha ou parada consultada. | 60 s | Acessar a área de alertas ou identificar a sinalização no item afetado e relatar o impacto. |

---

## 3. Registro Consolidado das Rodadas

Os dados brutos por participante anonimizado serão armazenados em `metricas/negocio/tstp.csv` imediatamente após a execução de cada rodada.

| Rodada | Janela Prevista | Participantes | Tentativas Válidas | Sucessos | TSTP (%) | Faixa | Encaminhamento |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Rodada 1** | Até 25/11/2026 (S4/S5) | Mín. 5 | 15 (3 por usuário) | *Aguardando coleta* | — | — | Aplicar ajustes de fluxo/texto identificados antes da entrega final. |
| **Rodada 2** | 29/11/2026 (Fechamento S5) | Mín. 5 | 15 (3 por usuário) | *Prevista* | — | — | Comparar evolução em pontos percentuais em relação à Rodada 1. |
