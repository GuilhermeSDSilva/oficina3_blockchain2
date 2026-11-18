# StockChain — Controle de Estoque Antifraude

A StockChain é uma aplicação descentralizada (dApp) desenvolvida para registrar e acompanhar movimentações de estoque utilizando a blockchain Ethereum. O sistema permite cadastrar produtos, registrar entradas e saídas, consultar históricos e acompanhar as operações realizadas.

A utilização de contratos inteligentes permite manter os registros de movimentação na blockchain, proporcionando transparência e rastreabilidade das operações.

## 1. Objetivo do projeto

O objetivo da StockChain é oferecer um mecanismo de controle de estoque com histórico de operações registrado na blockchain, dificultando alterações não autorizadas nos registros e permitindo a consulta das movimentações realizadas.

O sistema contempla:

- Cadastro de produtos;
- Registro de entradas de estoque;
- Registro de saídas de estoque;
- Consulta do saldo disponível;
- Histórico de movimentações por produto;
- Consulta de eventos registrados no contrato;
- Controle administrativo para ativação e desativação de produtos;
- Acumulação e retirada de taxas de cadastro.

## 2. Tecnologias utilizadas

| Tecnologia | Finalidade |
|---|---|
| Solidity 0.8.24 | Desenvolvimento do contrato inteligente |
| Ethereum Sepolia | Rede blockchain de testes |
| Remix IDE | Desenvolvimento e implantação do contrato |
| MetaMask | Conexão da carteira com a aplicação |
| Web3.js 4.16.0 | Comunicação entre o frontend e o contrato |
| HTML5 | Estrutura da interface |
| CSS3 | Estilização e responsividade |
| JavaScript | Lógica e integração do frontend |
| Vercel | Hospedagem do frontend |
| GitHub | Versionamento e disponibilização do código |

## 3. Arquitetura da aplicação

A StockChain é composta por duas partes principais:

**Contrato inteligente (backend):**

Desenvolvido em Solidity, é responsável pelas regras de negócio, validações, armazenamento dos produtos e registro das movimentações. O contrato foi implantado na rede Ethereum Sepolia.

**Interface web (frontend):**

Desenvolvida com HTML, CSS e JavaScript, permite que os usuários interajam com as funcionalidades do contrato por meio da carteira MetaMask. A comunicação com a blockchain é realizada utilizando a biblioteca Web3.js.

## 4. Implantação do contrato

O contrato inteligente utilizado pela aplicação é `ControleEstoque`.

| Informação | Valor |
|---|---|
| Nome do contrato | ControleEstoque |
| Rede | Ethereum Sepolia |
| Chain ID | 11155111 |
| Endereço | `0x16CB2F162F521805177A59e749847aD33cb45F1a` |
| Taxa de cadastro | 0.001 ETH |
| Versão Solidity | 0.8.24 |

**Consulta do contrato:** Etherscan — Ethereum Sepolia.

**Informações da transação de implantação:**
- Hash da transação: A preencher.
- Número do bloco: A preencher.
- Verificação do código-fonte no Etherscan: A confirmar.

## 5. Funcionalidades do contrato inteligente

O contrato `ControleEstoque` implementa as seguintes operações:

| Função | Descrição | Permissão |
|---|---|---|
| `registerProduct()` | Cadastra um novo produto mediante pagamento da taxa de registro. | Usuários conectados |
| `registerEntry()` | Registra a entrada de produtos no estoque. | Usuários conectados |
| `registerExit()` | Registra a saída de produtos, verificando a quantidade disponível. | Usuários conectados |
| `changeProductStatus()` | Ativa ou desativa um produto. | Apenas proprietário |
| `withdrawFees()` | Retira as taxas acumuladas no contrato. | Apenas proprietário |
| `getProduct()` | Consulta os dados de um produto. | Consulta pública |
| `getProductBalance()` | Consulta o saldo de um produto. | Consulta pública |
| `getAllProductIds()` | Retorna os identificadores dos produtos cadastrados. | Consulta pública |
| `getProductHistory()` | Consulta o histórico de movimentações de um produto. | Consulta pública |
| `getTotalMovements()` | Consulta o total de movimentações registradas. | Consulta pública |
| `getAccumulatedFees()` | Consulta as taxas acumuladas. | Apenas proprietário |

### 5.1. Regras de negócio

O contrato aplica algumas validações para preservar a consistência dos registros:

- Não permite cadastrar produtos com código duplicado.
- Exige o pagamento exato de 0.001 ETH para cadastrar um produto.
- Não permite cadastrar produtos sem código, nome ou localização.
- Não permite registrar movimentações com quantidade igual a zero.
- Não permite registrar entradas ou saídas em produtos inativos.
- Não permite retirar uma quantidade superior ao saldo disponível.
- Restringe as operações administrativas ao proprietário do contrato.
- Limita a consulta do histórico a, no máximo, 50 registros por chamada.

### 5.2. Eventos

O contrato possui quatro eventos para registrar operações importantes:

| Evento | Descrição |
|---|---|
| `ProductRegistered` | Emitido quando um produto é cadastrado. |
| `MovementRecorded` | Emitido quando ocorre uma entrada ou saída de estoque. |
| `ProductStatusChanged` | Emitido quando o estado de um produto é alterado. |
| `FeesWithdrawn` | Emitido quando o proprietário retira as taxas acumuladas. |

Os eventos permitem consultar informações das operações diretamente na blockchain.

### 5.3. Erros personalizados

Foram implementados erros personalizados para representar situações que impedem a execução de determinadas operações:

- `ProductAlreadyExists`: produto já cadastrado.
- `ProductNotFound`: produto não encontrado.
- `ProductInactive`: produto inativo.
- `InsufficientStock`: quantidade solicitada superior ao estoque disponível.
- `InvalidRegistrationFee`: valor enviado diferente da taxa exigida.
- `InvalidQuantity`: quantidade inválida.
- `TransferFailed`: falha na transferência de valores.
- `InvalidHistoryRange`: intervalo de consulta do histórico inválido.

## 6. Recursos da linguagem Solidity utilizados

A tabela apresenta os sete grupos de recursos exigidos na atividade e suas respectivas implementações no contrato.

| Grupo | Recursos utilizados | Exemplos no código |
|---|---|---|
| Tipos de dados | `uint256`, `int256`, `bool`, `address payable`, `string`, `bytes32`, `constant` e `immutable`. | Variáveis de estado e estruturas `Product` e `InventoryMovement`. |
| Funções | `public`, `external`, `internal`, `private`, `view`, `pure`, `payable` e constructor. | `registerProduct()`, `getProductBalance()`, `_recordMovement()` e `_hashSku()`. |
| Estruturas de controle | `if/else`, `for` e `require`. | Validações de cadastro, saída de estoque e consulta de histórico. |
| Arrays e mappings | Arrays dinâmicos, mappings simples e mapping aninhado. | `productIds`, `movements`, `products`, `balances` e `hasOperated`. |
| Structs e enums | Estruturas com múltiplos campos e enumeração de estados. | `Product`, `InventoryMovement` e `ActionType`. |
| Modificadores | Modificadores de acesso e validação de produtos. | `onlyOwner`, `productExists()` e `onlyActiveProduct()`. |
| Eventos e erros | Eventos com parâmetros indexados e erros personalizados. | `MovementRecorded`, `ProductRegistered`, `ProductNotFound` e `InsufficientStock`. |

## 7. Interface da aplicação

A interface da StockChain foi desenvolvida utilizando HTML, CSS e JavaScript, com organização em painéis e menu de navegação.

As principais áreas da aplicação são:

| Área | Funcionalidade |
|---|---|
| Dashboard | Apresenta indicadores gerais e a lista de produtos. |
| Cadastro | Permite cadastrar novos produtos. |
| Entrada | Registra o recebimento de produtos. |
| Saída | Registra a retirada de produtos. |
| Auditoria | Apresenta o histórico de movimentações de um produto. |
| Explorador | Exibe eventos de movimentação e links para consulta das transações. |
| Administração | Permite ao proprietário alterar o estado dos produtos e retirar taxas. |

A interface também apresenta o endereço da carteira conectada, seu saldo em ETH e informações sobre a rede utilizada.

O layout possui adaptações para diferentes tamanhos de tela, utilizando CSS Grid, Flexbox e Media Queries.

## 8. Como executar o projeto

### 8.1. Pré-requisitos

Para utilizar a aplicação, são necessários:

- Navegador compatível com MetaMask.
- Extensão MetaMask instalada.
- Carteira configurada para utilizar a rede Ethereum Sepolia.
- ETH de teste na rede Sepolia para realizar transações.
- Conexão com a internet.

### 8.2. Configuração da carteira

1. Instale a extensão MetaMask no navegador.
2. Configure ou importe uma carteira.
3. Selecione a rede Ethereum Sepolia.
4. Obtenha ETH de teste por meio de um faucet da rede Sepolia.

**Atenção:** a aplicação utiliza a rede de testes Sepolia. Não é necessário utilizar ETH real da rede principal Ethereum.

### 8.3. Configuração do projeto

Clone o repositório:

```bash
git clone URL_DO_REPOSITORIO
```

Entre no diretório do projeto:

```bash
cd NOME_DO_REPOSITORIO
```

Para executar o frontend localmente, entre na pasta que contém os arquivos HTML, CSS e JavaScript e inicie um servidor HTTP simples:

```bash
python3 -m http.server 8000
```

Em seguida, abra no navegador:

```text
http://localhost:8000
```

A aplicação utiliza o endereço do contrato e sua ABI definidos no arquivo `contrato.js`.

## 9. Fluxo básico de utilização

1. Acesse a aplicação pelo navegador.
2. Conecte a carteira MetaMask.
3. Certifique-se de que a carteira está utilizando a rede Ethereum Sepolia.
4. Cadastre um produto informando código, nome e localização inicial. Essa operação exige o pagamento de 0.001 ETH.
5. Registre entradas de produtos para atualizar o estoque.
6. Registre saídas, respeitando a quantidade disponível.
7. Consulte o histórico de movimentações na área de auditoria.
8. Consulte os eventos registrados na área de explorador.
9. Caso esteja conectado como proprietário, acesse a área administrativa para gerenciar produtos e retirar taxas acumuladas.

## 10. Segurança e controle de acesso

O contrato implementa mecanismos para restringir operações e validar os dados recebidos.

Entre eles:

- Modificador `onlyOwner`, utilizado para restringir operações administrativas.
- Modificador `productExists`, utilizado para verificar a existência de um produto.
- Modificador `onlyActiveProduct`, utilizado para impedir movimentações em produtos inativos.
- Validação de quantidades e saldos antes de atualizar o estoque.
- Utilização de erros personalizados para representar falhas nas operações.
- Aplicação do padrão Checks-Effects-Interactions na retirada das taxas acumuladas.

## 11. Limitações e melhorias futuras

A versão atual da StockChain concentra-se no cadastro de produtos e no registro de movimentações de estoque.

Como possibilidades de evolução, podem ser consideradas:

- Implementação de relatórios de movimentação.
- Filtros avançados no histórico de operações.
- Melhorias na visualização dos eventos da blockchain.
- Ampliação das informações apresentadas no dashboard.
- Implementação de mecanismos adicionais de controle de usuários e permissões.
- Melhorias na experiência de conexão e troca de rede pela MetaMask.


## 13. Hospedagem

Aplicação publicada na Vercel:

**URL:** (https://oficina3blockchain2-frontend.vercel.app/).

**URL:** A inserir.


## 15. Utilização de inteligência artificial

Foi utilizada inteligência artificial como ferramenta de apoio à organização e elaboração da documentação do projeto. As informações técnicas foram baseadas na implementação existente do contrato inteligente e da interface da StockChain.

---

**StockChain — Controle de Estoque Antifraude**

Projeto acadêmico desenvolvido como atividade prática de desenvolvimento de aplicações descentralizadas na blockchain Ethereum.
