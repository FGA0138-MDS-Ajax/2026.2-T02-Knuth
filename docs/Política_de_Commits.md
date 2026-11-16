## Política de Commits e Versionamento

Para garantir a rastreabilidade, a organização e a qualidade do histórico do repositório, o projeto RotasDF adota uma política rigorosa de *commits*. Esta política está alinhada às práticas do Extreme Programming (XP) e é fundamental para o processo de inspeção e auditoria do código. As diretrizes estabelecidas são:

### 1. Padrão de Mensagens 
Todas as mensagens de *commit* devem ser claras no que fazem, podendo ser uma frase curta que explica o que a aquela mudança faz

### 2. Commits Atômicos e Granulares
A equipe adota a prática de *commits* atômicos. Cada *commit* deve representar uma única alteração lógica e completa. É expressamente proibido realizar *commits* genéricos  que misturam várias funcionalidades ou arquivos não relacionados de uma só vez.


### 3. Fluxo de Branches e PRs
*commits* que adicionam funcionalidades não são enviadas diretamente para as branches principais (`main` ou `developer`), se forem enviadas são a fim de testes, foram apagadas ou corrigem erros logisticos (estrutura de pastas, identação, etc).  No entanto, se os commits não entrarem nas excessões o fluxo obrigatório é:

* Todo trabalho é realizado em branches isoladas (`feature/nome-da-tarefa`).
* Os *commits* são enviados via `push` para a branch remota.
* A integração com a branch `developer` ocorre exclusivamente por meio de um **Pull Request (PR)**, que deve passar pela revisão de código do Analista de Qualidade.

### 4. Segurança e Higiene do Repositório
É terminantemente proibido o envio de credenciais, senhas, chaves de API ou arquivos de ambiente em qualquer *commit*. O arquivo `.gitignore` deve ser rigorosamente mantido para evitar que pastas pesadas e desnecessárias ou arquivos locais de configuração sejam versionados.

