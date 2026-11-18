
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ControleEstoque {

    // =========================================================
    // [Recurso: Tipos de Dados]
    // =========================================================

    address payable public immutable owner;
    uint256 public constant REGISTRATION_FEE = 0.001 ether;

    uint256 public totalProducts;
    uint256 public totalMovements;
    uint256 public accumulatedFees;

    // =========================================================
    // [Recurso: Structs e Enums]
    // =========================================================

    enum ActionType {
        ENTRADA,
        SAIDA
    }

    struct Product {
        uint256 id;
        string code;
        string name;
        bytes32 skuHash;
        address creator;
        uint256 createdAt;
        bool active;
    }

    struct InventoryMovement {
        uint256 id;
        uint256 productId;
        ActionType action;
        uint256 quantity;
        int256 signedDelta;
        string location;
        address operator;
        uint256 timestamp;
    }

    // =========================================================
    // [Recurso: Arrays e Mappings]
    // =========================================================

    uint256[] private productIds;
    InventoryMovement[] private movements;

    mapping(uint256 => Product) private products;
    mapping(bytes32 => uint256) private productIdBySku;
    mapping(uint256 => uint256) public balances;

    // Mapping aninhado: produto => operador => realizou movimentação
    mapping(uint256 => mapping(address => bool)) public hasOperated;

    // Mapping simples: operador => quantidade de movimentações
    mapping(address => uint256) public operatorMovementCount;

    // Histórico de movimentações por produto
    mapping(uint256 => uint256[]) private productMovementIds;

    // =========================================================
    // [Recurso: Eventos e Erros]
    // =========================================================

    event ProductRegistered(
        uint256 indexed productId,
        address indexed creator,
        bytes32 skuHash
    );

    event MovementRecorded(
        uint256 indexed productId,
        uint256 indexed movementId,
        address indexed operator,
        ActionType action,
        uint256 quantity,
        int256 signedDelta,
        string location,
        uint256 timestamp
    );

    event ProductStatusChanged(
        uint256 indexed productId,
        bool active,
        address indexed changedBy
    );

    event FeesWithdrawn(address indexed recipient, uint256 amount);

    error ProductAlreadyExists(bytes32 skuHash);
    error ProductNotFound(uint256 productId);
    error ProductInactive(uint256 productId);
    error InsufficientStock(uint256 available, uint256 requested);
    error InvalidRegistrationFee(uint256 sent, uint256 required);
    error InvalidQuantity();
    error TransferFailed();
    error InvalidHistoryRange();

    // =========================================================
    // [Recurso: Modificadores]
    // =========================================================

    modifier onlyOwner() {
        require(msg.sender == owner, "Apenas o administrador");
        _;
    }

    // Modificador parametrizado
    modifier productExists(uint256 productId) {
        if (products[productId].id == 0) {
            revert ProductNotFound(productId);
        }
        _;
    }

    // Segundo modificador parametrizado
    modifier onlyActiveProduct(uint256 productId) {
        if (!products[productId].active) {
            revert ProductInactive(productId);
        }
        _;
    }

    // =========================================================
    // [Recurso: Funções e Constructor]
    // =========================================================

    constructor() {
        owner = payable(msg.sender);
    }

    // =========================================================
    // CADASTRO DE PRODUTOS
    // =========================================================

    /// @notice Cadastra um produto no sistema.
    /// @param code Código único do produto.
    /// @param name Nome do produto.
    /// @param location Local de armazenamento inicial.
    function registerProduct(
        string calldata code,
        string calldata name,
        string calldata location
    ) external payable returns (uint256) {

        require(bytes(code).length > 0, "Codigo obrigatorio");
        require(bytes(name).length > 0, "Nome obrigatorio");
        require(bytes(location).length > 0, "Local obrigatorio");

        if (msg.value != REGISTRATION_FEE) {
            revert InvalidRegistrationFee(
                msg.value,
                REGISTRATION_FEE
            );
        }

        bytes32 skuHash = _hashSku(code);

        if (productIdBySku[skuHash] != 0) {
            revert ProductAlreadyExists(skuHash);
        }

        totalProducts++;
        uint256 newId = totalProducts;

        products[newId] = Product({
            id: newId,
            code: code,
            name: name,
            skuHash: skuHash,
            creator: msg.sender,
            createdAt: block.timestamp,
            active: true
        });

        productIdBySku[skuHash] = newId;
        productIds.push(newId);

        accumulatedFees += msg.value;

        emit ProductRegistered(
            newId,
            msg.sender,
            skuHash
        );

        return newId;
    }

    // =========================================================
    // REGISTRO DE ENTRADA
    // =========================================================

    /// @notice Registra a entrada de produtos no estoque.
    /// @param productId Identificador do produto.
    /// @param quantity Quantidade recebida.
    /// @param location Local de armazenamento.
    function registerEntry(
        uint256 productId,
        uint256 quantity,
        string calldata location
    )
        external
        productExists(productId)
        onlyActiveProduct(productId)
    {
        require(quantity > 0, "Quantidade invalida");
        require(
            quantity <= uint256(type(int256).max),
            "Quantidade muito alta"
        );
        require(bytes(location).length > 0, "Local obrigatorio");

        balances[productId] += quantity;

        _recordMovement(
            productId,
            ActionType.ENTRADA,
            quantity,
            int256(quantity),
            location
        );
    }

    // =========================================================
    // REGISTRO DE SAÍDA
    // =========================================================

    /// @notice Registra a retirada de produtos do estoque.
    /// @param productId Identificador do produto.
    /// @param quantity Quantidade retirada.
    /// @param location Destino da retirada.
    function registerExit(
        uint256 productId,
        uint256 quantity,
        string calldata location
    )
        external
        productExists(productId)
        onlyActiveProduct(productId)
    {
        require(quantity > 0, "Quantidade invalida");
        require(
            quantity <= uint256(type(int256).max),
            "Quantidade muito alta"
        );
        require(bytes(location).length > 0, "Local obrigatorio");

        uint256 available = balances[productId];

        if (quantity > available) {
            revert InsufficientStock(available, quantity);
        }

        balances[productId] -= quantity;

        _recordMovement(
            productId,
            ActionType.SAIDA,
            quantity,
            -int256(quantity),
            location
        );
    }

    // =========================================================
    // CONTROLE ADMINISTRATIVO
    // =========================================================

    /// @notice Ativa ou desativa um produto.
    /// @param productId Identificador do produto.
    /// @param active Novo estado do produto.
    function changeProductStatus(
        uint256 productId,
        bool active
    )
        external
        onlyOwner
        productExists(productId)
    {
        if (active) {
            products[productId].active = true;
        } else {
            products[productId].active = false;
        }

        emit ProductStatusChanged(
            productId,
            active,
            msg.sender
        );
    }

    /// @notice Retira as taxas acumuladas pelo administrador.
    function withdrawFees() external onlyOwner {

        uint256 amount = accumulatedFees;

        require(amount > 0, "Nenhuma taxa acumulada");

        // Checks-Effects-Interactions
        accumulatedFees = 0;

        (bool success, ) = owner.call{value: amount}("");

        if (!success) {
            revert TransferFailed();
        }

        emit FeesWithdrawn(owner, amount);
    }

    // =========================================================
    // CONSULTAS
    // =========================================================

    /// @notice Consulta os dados de um produto.
    function getProduct(
        uint256 productId
    )
        external
        view
        productExists(productId)
        returns (Product memory)
    {
        return products[productId];
    }

    /// @notice Consulta o saldo atual de um produto.
    function getProductBalance(
        uint256 productId
    )
        public
        view
        productExists(productId)
        returns (uint256)
    {
        return balances[productId];
    }

    /// @notice Retorna todos os identificadores de produtos.
    function getAllProductIds()
        external
        view
        returns (uint256[] memory)
    {
        return productIds;
    }

    /// @notice Consulta o histórico de um produto.
    /// @param productId Identificador do produto.
    /// @param start Posição inicial do histórico.
    /// @param limit Quantidade máxima de registros (até 50).
    function getProductHistory(
        uint256 productId,
        uint256 start,
        uint256 limit
    )
        external
        view
        productExists(productId)
        returns (InventoryMovement[] memory)
    {
        require(limit > 0 && limit <= 50, "Limite deve ser de 1 a 50");

        uint256[] storage ids = productMovementIds[productId];

        if (start > ids.length) {
            revert InvalidHistoryRange();
        }

        uint256 remaining = ids.length - start;

        uint256 count;

        if (limit < remaining) {
            count = limit;
        } else {
            count = remaining;
        }

        InventoryMovement[] memory result =
            new InventoryMovement[](count);

        // [Recurso: Estruturas de Controle]
        // Laço limitado pelo parâmetro limit, máximo de 50.
        for (uint256 i = 0; i < count; i++) {
            result[i] = movements[ids[start + i] - 1];
        }

        return result;
    }

    /// @notice Consulta o total de movimentações registradas.
    function getTotalMovements()
        external
        view
        returns (uint256)
    {
        return totalMovements;
    }

    /// @notice Consulta o saldo de taxas acumuladas.
    function getAccumulatedFees()
        external
        view
        onlyOwner
        returns (uint256)
    {
        return accumulatedFees;
    }

    // =========================================================
    // FUNÇÕES INTERNAS
    // =========================================================

    // [Recurso: Funções - internal]
    function _recordMovement(
        uint256 productId,
        ActionType action,
        uint256 quantity,
        int256 signedDelta,
        string calldata location
    ) internal {

        totalMovements++;

        uint256 newMovementId = totalMovements;

        movements.push(
            InventoryMovement({
                id: newMovementId,
                productId: productId,
                action: action,
                quantity: quantity,
                signedDelta: signedDelta,
                location: location,
                operator: msg.sender,
                timestamp: block.timestamp
            })
        );

        productMovementIds[productId].push(newMovementId);

        hasOperated[productId][msg.sender] = true;
        operatorMovementCount[msg.sender]++;

        emit MovementRecorded(
            productId,
            newMovementId,
            msg.sender,
            action,
            quantity,
            signedDelta,
            location,
            block.timestamp
        );
    }

    // [Recurso: Funções - private e pure]
    function _hashSku(
        string memory code
    )
        private
        pure
        returns (bytes32)
    {
        return keccak256(abi.encodePacked(code));
    }
}
