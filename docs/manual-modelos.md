# Manual de Construção de Modelos — MediaTermo

Este manual ensina como montar (ou recriar) um modelo de termo no MediaTermo,
para que cada mediador possa usar o modelo com o texto e a estrutura que já
está acostumado a usar no papel.

## 1. O que é um "modelo de termo"

Um modelo é um **template composto por blocos ordenados**. Quando uma sessão
é finalizada, o sistema percorre os blocos do modelo escolhido, um a um, e
monta o documento final (PDF ou Word) substituindo variáveis, preenchendo
listas de presença e mostrando apenas os blocos condicionais que se aplicam
ao resultado daquela sessão.

Você pode:
- Editar os dois modelos que já vêm prontos ("Modelo Geral 334" e "Modelo
  Fazenda Pública");
- Criar um modelo novo do zero;
- Duplicar a estrutura de um termo que você já usa no papel, bloco por bloco.

Acesse em **Modelos → Editar** (ou **+ Novo Modelo**). A tela é dividida em
duas colunas: os blocos ficam à esquerda (você adiciona, edita, remove e
arrasta para reordenar) e o **preview em tempo real** fica à direita, sempre
atualizado com dados de exemplo enquanto você edita.

## 2. Os tipos de bloco

| Bloco | Para que serve |
|---|---|
| **Cabeçalho** | O título do termo (ex: "TERMO DE AUDIÊNCIA"). Geralmente o primeiro bloco. |
| **Dados do Processo** | Renderiza automaticamente número CNJ, lotação, comarca, data/horário, local/modalidade — e, se marcado, classe e assunto. Não precisa digitar nada, os dados vêm do processo/sessão. |
| **Presentes** | Lista de presença. Você escolhe quais papéis aparecem (mediador, requerente, advogado da requerente, requerido, preposto, advogado da requerida, procurador). Na hora de gerar o termo, o sistema marca ☑/☐ conforme o que foi registrado na sessão. |
| **Texto Fixo** | Um parágrafo que aparece sempre, igual em todo termo gerado com esse modelo. Aceita variáveis entre chaves, ex: `{nome_mediador}`. Use para os parágrafos de abertura, referências legais, avisos padrão etc. |
| **Condicional** | Um bloco (ou vários) que só aparece quando o **resultado da sessão** for um dos valores marcados (acordo total, acordo parcial, sem acordo, reagendamento, ausência do requerente, ausência do requerido). Dentro de um condicional você pode colocar Texto Fixo, Campo Livre e Campo Customizado. |
| **Campo Livre** | Um campo de texto que o mediador preenche **na hora da sessão** (ex: "Termos do Acordo", "Motivo do reagendamento"). Pode ser marcado como obrigatório. |
| **Campo Customizado** | Um campo específico do modelo, com tipo definido (texto, monetário ou data) — ex: valor do RPV, banco, agência, conta, CPF do titular no Modelo Fazenda Pública. Também pode ser obrigatório. |
| **Assinatura** | Bloco de encerramento: texto de fechamento (opcional) + linha de assinatura com nome, cargo e, se marcado, matrícula do mediador. Normalmente o último bloco. |

## 3. Variáveis disponíveis

Use qualquer uma destas dentro de um bloco **Texto Fixo** (e também no texto
de fechamento do bloco **Assinatura**), entre chaves:

| Variável | Exemplo de valor |
|---|---|
| `{numero_cnj}` | 0001234-56.2026.8.26.0100 |
| `{lotacao}` | CEJUSC Central — 1ª Vara Cível |
| `{data_extenso}` | 09 de julho de 2026 |
| `{horario_inicio}` | 14:00 |
| `{horario_encerramento}` | 14:45 |
| `{nome_mediador}` | Talita Santos |
| `{cargo_mediador}` | Mediadora Judicial |
| `{matricula_mediador}` | CEJUSC-001/2024 |
| `{nome_requerente}` | Maria da Silva |
| `{nome_requerido}` | João Pereira |
| `{adv_requerente}` | Dr. Carlos Souza |
| `{adv_requerido}` | Dra. Ana Lima |
| `{oab_requerente}` | SP 123456 |
| `{oab_requerido}` | SP 654321 |
| `{reagendamento_data}` | 20 de agosto de 2026 (só quando resultado = reagendamento) |
| `{reagendamento_motivo}` | Texto digitado pelo mediador na sessão |
| `{plataforma_virtual}` | Microsoft Teams |

Se o dado da variável estiver vazio no momento de gerar o termo, o sistema
mantém o texto `{variavel}` sem substituir — é um sinal de que algo não foi
preenchido, revise antes de finalizar.

## 4. Como funcionam os blocos Condicionais

Cada condicional tem uma lista de resultados que o ativam. Os seis resultados
possíveis são: **Acordo Total**, **Acordo Parcial**, **Sem Acordo**,
**Reagendamento**, **Ausência do Requerente**, **Ausência do Requerido**.

Você pode marcar mais de um resultado no mesmo condicional — por exemplo, o
bloco de quitação e homologação normalmente é marcado para **Acordo Total
e Acordo Parcial** ao mesmo tempo, já que o texto serve para os dois casos.

Dentro do condicional, adicione os blocos-filho que devem aparecer só
naquela situação:
- Um **Campo Livre** para o mediador digitar (ex: termos do acordo);
- **Textos Fixos** com a redação padrão daquele desfecho;
- **Campos Customizados**, se aquele resultado precisar de dados extras (ex:
  dados bancários só aparecem quando há acordo).

Use o seletor "Simular" no topo do preview, à direita, para alternar entre os
resultados e conferir se cada condicional aparece na hora certa.

## 5. Passo a passo: recriando um modelo que você já usa no papel

1. **Releia o seu termo em papel e separe os parágrafos fixos dos que
   mudam.** Frases que aparecem sempre, independente do resultado, viram
   blocos de **Texto Fixo** soltos. Frases que só aparecem em certos
   desfechos (acordo, sem acordo, ausência, reagendamento) viram blocos
   **Condicional**.
2. **Comece pelo Cabeçalho** com o título exatamente como no seu papel.
3. **Adicione o bloco Dados do Processo** logo em seguida — ele substitui a
   digitação manual do número do processo, vara, data etc.
4. **Adicione o bloco Presentes** e marque só os papéis que realmente
   aparecem no seu termo (nem todo modelo tem "preposto", por exemplo).
5. **Transcreva os parágrafos de abertura** como blocos de Texto Fixo,
   trocando nomes/datas fixas do seu rascunho pelas variáveis correspondentes
   (`{nome_mediador}`, `{data_extenso}` etc.) — assim o texto se adapta
   sozinho a cada sessão.
6. **Para cada desfecho possível do seu termo**, crie um bloco Condicional,
   marque o(s) resultado(s) correspondente(s) e cole dentro dele os
   parágrafos que só aparecem naquele caso. Se seu termo tem um campo para o
   mediador escrever à mão (ex: "termos do acordo"), adicione um **Campo
   Livre** dentro do condicional.
7. **Se o seu termo tem uma tabela de dados específicos** (valores, dados
   bancários, prazos), adicione um **Campo Customizado** para cada um,
   escolhendo o tipo certo (monetário para valores em R$, data para prazos
   com data, texto para o resto).
8. **Feche com o bloco Assinatura**, com o texto de encerramento do seu
   termo e marcando se a matrícula do mediador deve aparecer.
9. **Revise no preview**, alternando o "Simular" entre os resultados, e
   ajuste o que precisar.
10. **Se o seu CEJUSC tem logomarca e você quer que ela apareça no
    cabeçalho** (e o endereço/telefone no rodapé), cadastre o CEJUSC em
    **CEJUSCs** e selecione-o no campo "CEJUSC" da tela de edição do modelo.

## 6. Dicas

- **Reordenar blocos**: clique e arraste pelo ícone de pontinhos (⠿⠿) à
  esquerda de cada bloco.
- **Duplicar um modelo existente**: mais rápido do que começar do zero —
  edite uma cópia do "Modelo Geral 334" ou "Modelo Fazenda Pública" e ajuste
  só o que for diferente.
- **Nomes de campos customizados** (a "chave" que você digita, ex:
  `valor_rpv`) não podem ter espaços nem acentos — use `_` para separar
  palavras. É esse nome que fica salvo nos dados da sessão.
- **Testando de verdade**: depois de salvar, rode uma "Nova Mediação" de
  teste escolhendo esse modelo, para ver o termo gerado com dados reais.
- **Modelo com sessões já geradas**: não é possível excluir, só desativar —
  isso preserva o histórico dos termos já emitidos com aquele modelo.

## 7. Onde cada coisa fica no sistema

| O que você quer fazer | Onde ir |
|---|---|
| Criar/editar modelos | Menu **Modelos** |
| Cadastrar CEJUSC (logo, endereço, telefone, e-mail) | Menu **CEJUSCs** |
| Vincular um modelo a um CEJUSC | Dentro da edição do modelo, campo "CEJUSC" |
| Cadastrar a chave da API DataJud (CNJ) | Menu **Perfil** |
| Ver/baixar termos já gerados | Abrir o processo → histórico de sessões |
