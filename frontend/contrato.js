// ============================================================
// STOCKCHAIN - DADOS DO CONTRATO INTELIGENTE
// ============================================================

const CONTRACT_ADDRESS = "0x16CB2F162F521805177A59e749847aD33cb45F1a";

const SEPOLIA_CHAIN_ID = 11155111;
const EXPLORER_URL = "https://sepolia.etherscan.io";

const REGISTRATION_FEE = "0.001";

const CONTRACT_ABI = [
    {
        "inputs": [],
        "name": "REGISTRATION_FEE",
        "outputs": [{"type":"uint256","name":""}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [{"type":"address","name":""}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalProducts",
        "outputs": [{"type":"uint256","name":""}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalMovements",
        "outputs": [{"type":"uint256","name":""}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"name":"code","type":"string"},{"name":"name","type":"string"},{"name":"location","type":"string"}],
        "name": "registerProduct",
        "outputs": [{"name":"","type":"uint256"}],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [{"name":"productId","type":"uint256"},{"name":"quantity","type":"uint256"},{"name":"location","type":"string"}],
        "name": "registerEntry",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"name":"productId","type":"uint256"},{"name":"quantity","type":"uint256"},{"name":"location","type":"string"}],
        "name": "registerExit",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"name":"productId","type":"uint256"},{"name":"active","type":"bool"}],
        "name": "changeProductStatus",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "withdrawFees",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getAccumulatedFees",
        "outputs": [{"name":"","type":"uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"name":"productId","type":"uint256"}],
        "name": "getProductBalance",
        "outputs": [{"name":"","type":"uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"name":"productId","type":"uint256"}],
        "name": "getProduct",
        "outputs": [{
            "name":"",
            "type":"tuple",
            "components":[
                {"name":"id","type":"uint256"},
                {"name":"code","type":"string"},
                {"name":"name","type":"string"},
                {"name":"skuHash","type":"bytes32"},
                {"name":"creator","type":"address"},
                {"name":"createdAt","type":"uint256"},
                {"name":"active","type":"bool"}
            ]
        }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getAllProductIds",
        "outputs": [{"name":"","type":"uint256[]"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {"name":"productId","type":"uint256"},
            {"name":"start","type":"uint256"},
            {"name":"limit","type":"uint256"}
        ],
        "name": "getProductHistory",
        "outputs": [{
            "name":"",
            "type":"tuple[]",
            "components":[
                {"name":"id","type":"uint256"},
                {"name":"productId","type":"uint256"},
                {"name":"action","type":"uint8"},
                {"name":"quantity","type":"uint256"},
                {"name":"signedDelta","type":"int256"},
                {"name":"location","type":"string"},
                {"name":"operator","type":"address"},
                {"name":"timestamp","type":"uint256"}
            ]
        }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "anonymous":false,
        "inputs":[
            {"indexed":true,"name":"productId","type":"uint256"},
            {"indexed":true,"name":"movementId","type":"uint256"},
            {"indexed":true,"name":"operator","type":"address"},
            {"indexed":false,"name":"action","type":"uint8"},
            {"indexed":false,"name":"quantity","type":"uint256"},
            {"indexed":false,"name":"signedDelta","type":"int256"},
            {"indexed":false,"name":"location","type":"string"},
            {"indexed":false,"name":"timestamp","type":"uint256"}
        ],
        "name":"MovementRecorded",
        "type":"event"
    },
    {
        "anonymous":false,
        "inputs":[
            {"indexed":true,"name":"productId","type":"uint256"},
            {"indexed":true,"name":"creator","type":"address"},
            {"indexed":false,"name":"skuHash","type":"bytes32"}
        ],
        "name":"ProductRegistered",
        "type":"event"
    },
    {
        "anonymous":false,
        "inputs":[
            {"indexed":true,"name":"productId","type":"uint256"},
            {"indexed":false,"name":"active","type":"bool"},
            {"indexed":true,"name":"changedBy","type":"address"}
        ],
        "name":"ProductStatusChanged",
        "type":"event"
    },
    {
        "anonymous":false,
        "inputs":[
            {"indexed":true,"name":"recipient","type":"address"},
            {"indexed":false,"name":"amount","type":"uint256"}
        ],
        "name":"FeesWithdrawn",
        "type":"event"
    }
];
