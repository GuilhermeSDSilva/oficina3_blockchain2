// ============================================================
// STOCKCHAIN - CONTROLE DE ESTOQUE ANTIFRAUDE
// Integração: Web3.js + MetaMask + Ethereum Sepolia
// ============================================================

let web3;
let contract;
let account = null;
let isOwner = false;
let productsCache = [];

// ============================================================
// UTILITÁRIOS
// ============================================================

function showAlert(message, type = "info") {
    const box = document.getElementById("alertBox");
    box.className = "alert " + type;
    box.textContent = message;
    box.classList.remove("hidden");
    box.scrollIntoView({behavior:"smooth",block:"nearest"});
}

function hideAlert() {
    document.getElementById("alertBox").classList.add("hidden");
}

function shortAddress(address) {
    if (!address) return "—";
    return address.slice(0, 6) + "..." + address.slice(-4);
}

async function updateWalletBalance() {
    if (!web3 || !account) return;

    const balanceWei = await web3.eth.getBalance(account);
    const balanceEth = Number(web3.utils.fromWei(balanceWei, "ether")).toFixed(4);

    document.getElementById("walletBalance").textContent = `${balanceEth} ETH`;
}

function formatDate(timestamp) {
    return new Date(Number(timestamp) * 1000).toLocaleString("pt-BR");
}

function getProductField(product, field, index) {
    return product[field] !== undefined ? product[field] : product[index];
}

function getMovementField(movement, field, index) {
    return movement[field] !== undefined ? movement[field] : movement[index];
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&":"&amp;",
        "<":"&lt;",
        ">":"&gt;",
        '"':"&quot;",
        "'":"&#39;"
    })[char]);
}

function requireConnection() {
    if (!account || !contract) {
        throw new Error("Conecte a MetaMask antes de continuar.");
    }
}

async function ensureSepolia() {
    const chainId = Number(await web3.eth.getChainId());

    if (chainId !== SEPOLIA_CHAIN_ID) {
        throw new Error("Conecte sua MetaMask à rede Ethereum Sepolia.");
    }
}

async function checkAdminAccess() {
    const contractOwner = await contract.methods.owner().call();
    isOwner = account.toLowerCase() === contractOwner.toLowerCase();

    const adminMenuBtn = document.getElementById("adminMenuBtn");
    if (isOwner) {
        adminMenuBtn.classList.remove("hidden");
    } else {
        adminMenuBtn.classList.add("hidden");
    }
}

// ============================================================
// CONEXÃO COM METAMASK
// ============================================================

async function connectWallet() {
    hideAlert();

    if (!window.ethereum) {
        showAlert("MetaMask não encontrada. Instale a extensão MetaMask.", "error");
        return;
    }

    try {
        web3 = new Web3(window.ethereum);

        const accounts = await window.ethereum.request({
            method: "eth_requestAccounts"
        });

        if (!accounts.length) {
            throw new Error("Nenhuma carteira foi selecionada.");
        }

        account = accounts[0];

        await ensureSepolia();

        contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);

        await checkAdminAccess();

        document.getElementById("walletAddress").textContent =
            shortAddress(account) + (isOwner ? " (Admin)" : "");

        await updateWalletBalance();

        document.getElementById("walletShort").textContent =
            shortAddress(account);

        document.getElementById("networkStatus").textContent =
            "● Sepolia conectada";

        document.getElementById("networkName").textContent = "Sepolia";

        document.getElementById("connectBtn").textContent = "Carteira conectada";

        document.getElementById("contractAddress").textContent =
            CONTRACT_ADDRESS;

        document.getElementById("contractLink").href =
            EXPLORER_URL + "/address/" + CONTRACT_ADDRESS;

        showAlert(
            isOwner
                ? "Carteira de Administrador conectada à Ethereum Sepolia!"
                : "Carteira conectada com sucesso à Ethereum Sepolia!",
            "success"
        );

        await loadDashboard();

    } catch (error) {
        showAlert(error.message || "Erro ao conectar carteira.", "error");
    }
}

// Detecta troca de carteira ou de rede.
if (window.ethereum) {
    window.ethereum.on("accountsChanged", () => {
        location.reload();
    });

    window.ethereum.on("chainChanged", () => {
        location.reload();
    });
}

// ============================================================
// NAVEGAÇÃO
// ============================================================

function showTab(tabId, button) {
    document.querySelectorAll(".tab").forEach(tab => {
        tab.classList.add("hidden");
    });

    document.getElementById(tabId).classList.remove("hidden");

    document.querySelectorAll(".nav-btn").forEach(btn => {
        btn.classList.remove("active");
    });

    if (button) button.classList.add("active");

    hideAlert();

    if (tabId === "dashboard" && account) loadDashboard();
    if (tabId === "explorer" && account) loadExplorer();
    if (tabId === "audit" && account) loadProductSelectors();
    if (tabId === "admin" && account && isOwner) loadAdminPanel();
}

// ============================================================
// CARREGAMENTO DOS PRODUTOS
// ============================================================

async function loadProducts() {
    requireConnection();
    await ensureSepolia();

    const ids = await contract.methods.getAllProductIds().call();

    productsCache = [];

    for (const id of ids) {
        const product = await contract.methods.getProduct(id).call();
        const balance = await contract.methods.getProductBalance(id).call();

        productsCache.push({
            id: String(id),
            code: getProductField(product, "code", 1),
            name: getProductField(product, "name", 2),
            active: getProductField(product, "active", 6),
            balance: String(balance)
        });
    }

    return productsCache;
}

async function loadProductSelectors() {
    const products = await loadProducts();

    const activeSelectors = [
        document.getElementById("entryProduct"),
        document.getElementById("exitProduct"),
        document.getElementById("auditProduct")
    ];

    activeSelectors.forEach(select => {
        const previous = select.value;

        select.innerHTML = '<option value="">Selecione um produto</option>';

        products.filter(p => p.active).forEach(product => {
            const option = document.createElement("option");
            option.value = product.id;
            option.textContent = product.code + " - " + product.name;
            select.appendChild(option);
        });

        if (products.some(p => p.id === previous && p.active)) {
            select.value = previous;
        }
    });

    // O seletor do administrador lista TODOS os produtos (ativos e inativos)
    const adminSelect = document.getElementById("adminProduct");
    if (adminSelect) {
        const previousAdmin = adminSelect.value;
        adminSelect.innerHTML = '<option value="">Selecione um produto</option>';

        products.forEach(product => {
            const option = document.createElement("option");
            option.value = product.id;
            option.textContent = `${product.code} - ${product.name} (${product.active ? "Ativo" : "Inativo"})`;
            adminSelect.appendChild(option);
        });

        if (products.some(p => p.id === previousAdmin)) {
            adminSelect.value = previousAdmin;
        }
    }
}

// ============================================================
// DASHBOARD
// ============================================================

async function loadDashboard() {
    if (!account || !contract) return;

    try {
        await ensureSepolia();
        await updateWalletBalance();

        const totalProducts = await contract.methods.totalProducts().call();
        const totalMovements = await contract.methods.totalMovements().call();

        document.getElementById("totalProducts").textContent =
            totalProducts.toString();

        document.getElementById("totalMovements").textContent =
            totalMovements.toString();

        document.getElementById("walletShort").textContent =
            shortAddress(account);

        document.getElementById("networkName").textContent = "Sepolia";

        const products = await loadProducts();

        const table = document.getElementById("productTable");

        if (products.length === 0) {
            table.innerHTML =
                '<tr><td colspan="5" class="empty">Nenhum produto cadastrado.</td></tr>';
        } else {
            table.innerHTML = products.map(product => `
                <tr>
                    <td>#${escapeHTML(product.id)}</td>
                    <td>${escapeHTML(product.code)}</td>
                    <td>${escapeHTML(product.name)}</td>
                    <td><strong>${escapeHTML(product.balance)}</strong></td>
                    <td>${product.active ? "Ativo" : "Inativo"}</td>
                </tr>
            `).join("");
        }

        await loadProductSelectors();

    } catch (error) {
        showAlert("Erro ao atualizar painel: " + error.message, "error");
    }
}

// ============================================================
// PAINEL ADMINISTRATIVO (APENAS OWNER)
// ============================================================

async function loadAdminPanel() {
    if (!account || !contract || !isOwner) return;

    try {
        await ensureSepolia();
        await loadProductSelectors();

        const feesWei = await contract.methods.getAccumulatedFees().call({ from: account });
        const feesEth = web3.utils.fromWei(feesWei, "ether");

        document.getElementById("accumulatedFeesDisplay").textContent =
            `Saldo acumulado disponível para saque: ${feesEth} ETH`;

    } catch (error) {
        showAlert("Erro ao carregar painel administrativo: " + error.message, "error");
    }
}

async function handleWithdrawFees() {
    hideAlert();

    try {
        requireConnection();
        await ensureSepolia();

        if (!isOwner) {
            throw new Error("Apenas o administrador pode sacar as taxas.");
        }

        showAlert("Aguardando confirmação do saque na MetaMask...", "info");

        const receipt = await contract.methods.withdrawFees().send({ from: account });

        showAlert(
            "Taxas sacadas com sucesso! Transação: " + receipt.transactionHash,
            "success"
        );

        await updateWalletBalance();
        await loadAdminPanel();

    } catch (error) {
        showAlert("Falha ao sacar taxas: " + error.message, "error");
    }
}

document.getElementById("statusForm").addEventListener("submit", async event => {
    event.preventDefault();
    hideAlert();

    try {
        requireConnection();
        await ensureSepolia();

        if (!isOwner) {
            throw new Error("Apenas o administrador pode alterar o status de produtos.");
        }

        const productId = document.getElementById("adminProduct").value;
        const active = document.getElementById("adminStatus").value === "true";

        if (!productId) {
            throw new Error("Selecione um produto.");
        }

        showAlert("Aguardando confirmação da alteração de status na MetaMask...", "info");

        const receipt = await contract.methods.changeProductStatus(
            productId,
            active
        ).send({ from: account });

        showAlert(
            "Status do produto atualizado com sucesso! Transação: " + receipt.transactionHash,
            "success"
        );

        await loadAdminPanel();
        await loadDashboard();

    } catch (error) {
        showAlert("Falha ao alterar status: " + error.message, "error");
    }
});

// ============================================================
// CADASTRO DE PRODUTOS
// ============================================================

document.getElementById("registerForm").addEventListener("submit", async event => {
    event.preventDefault();
    hideAlert();

    try {
        requireConnection();
        await ensureSepolia();

        const code = document.getElementById("productCode").value.trim();
        const name = document.getElementById("productName").value.trim();
        const location = document.getElementById("productLocation").value.trim();

        if (!code || !name || !location) {
            throw new Error("Preencha todos os campos.");
        }

        showAlert("Aguardando confirmação da transação na MetaMask...", "info");

        const fee = await contract.methods.REGISTRATION_FEE().call();

        const receipt = await contract.methods.registerProduct(
            code, name, location
        ).send({
            from: account,
            value: fee
        });

        event.target.reset();

        showAlert(
            "Produto cadastrado com sucesso! Transação: " + receipt.transactionHash,
            "success"
        );

        await loadDashboard();

    } catch (error) {
        showAlert("Falha no cadastro: " + error.message, "error");
    }
});

// ============================================================
// ENTRADA DE ESTOQUE
// ============================================================

document.getElementById("entryForm").addEventListener("submit", async event => {
    event.preventDefault();
    hideAlert();

    try {
        requireConnection();
        await ensureSepolia();

        const productId = document.getElementById("entryProduct").value;
        const quantity = document.getElementById("entryQuantity").value;
        const location = document.getElementById("entryLocation").value.trim();

        if (!productId || !quantity || Number(quantity) <= 0 || !location) {
            throw new Error("Preencha os dados corretamente.");
        }

        showAlert("Aguardando confirmação da entrada na MetaMask...", "info");

        const receipt = await contract.methods.registerEntry(
            productId,
            quantity,
            location
        ).send({from:account});

        event.target.reset();

        showAlert(
            "Entrada registrada com sucesso! Transação: " + receipt.transactionHash,
            "success"
        );

        await loadDashboard();

    } catch (error) {
        showAlert("Entrada não realizada: " + error.message, "error");
    }
});

// ============================================================
// SALDO DISPONÍVEL PARA SAÍDA
// ============================================================

document.getElementById("exitProduct").addEventListener("change", async event => {
    const productId = event.target.value;
    const output = document.getElementById("availableBalance");

    if (!productId || !contract) {
        output.textContent = "Saldo disponível: —";
        return;
    }

    try {
        const balance = await contract.methods.getProductBalance(productId).call();
        output.textContent = "Saldo disponível: " + balance + " unidades";
    } catch (error) {
        output.textContent = "Não foi possível consultar o saldo.";
    }
});

// ============================================================
// SAÍDA DE ESTOQUE - PREVENÇÃO DE FRAUDE
// ============================================================

document.getElementById("exitForm").addEventListener("submit", async event => {
    event.preventDefault();
    hideAlert();

    try {
        requireConnection();
        await ensureSepolia();

        const productId = document.getElementById("exitProduct").value;
        const quantity = document.getElementById("exitQuantity").value;
        const location = document.getElementById("exitLocation").value.trim();

        if (!productId || !quantity || Number(quantity) <= 0 || !location) {
            throw new Error("Preencha os dados corretamente.");
        }

        const balance = await contract.methods.getProductBalance(productId).call();

        if (BigInt(quantity) > BigInt(balance)) {
            throw new Error(
                "OPERAÇÃO REJEITADA: estoque insuficiente. Saldo disponível: " +
                balance + " unidades."
            );
        }

        showAlert("Aguardando confirmação da retirada na MetaMask...", "info");

        const receipt = await contract.methods.registerExit(
            productId,
            quantity,
            location
        ).send({from:account});

        event.target.reset();

        document.getElementById("availableBalance").textContent =
            "Saldo disponível: —";

        showAlert(
            "Saída registrada com sucesso! Transação: " + receipt.transactionHash,
            "success"
        );

        await loadDashboard();

    } catch (error) {
        showAlert("Saída não realizada: " + error.message, "error");
    }
});

// ============================================================
// AUDITORIA E HISTÓRICO
// ============================================================

async function auditProduct() {
    hideAlert();

    try {
        requireConnection();
        await ensureSepolia();

        const productId = document.getElementById("auditProduct").value;

        if (!productId) {
            throw new Error("Selecione um produto.");
        }

        const product = await contract.methods.getProduct(productId).call();
        const balance = await contract.methods.getProductBalance(productId).call();

        document.getElementById("auditBalance").textContent =
            "Produto: " + getProductField(product, "name", 2) +
            " | Saldo auditado: " + balance + " unidades";

        const history = await contract.methods.getProductHistory(
            productId, 0, 50
        ).call();

        const results = document.getElementById("historyResults");

        if (history.length === 0) {
            results.innerHTML = '<p class="empty">Nenhuma movimentação encontrada.</p>';
            return;
        }

        results.innerHTML = history.map(movement => {
            const action = Number(getMovementField(movement, "action", 2));
            const quantity = getMovementField(movement, "quantity", 3);
            const location = getMovementField(movement, "location", 5);
            const operator = getMovementField(movement, "operator", 6);
            const timestamp = getMovementField(movement, "timestamp", 7);
            const movementId = getMovementField(movement, "id", 0);

            const isEntry = action === 0;

            return `
                <div class="history-item">
                    <h4>${isEntry ? "🟢 Entrada" : "🔴 Saída"} - ${escapeHTML(quantity)} unidades</h4>
                    <p>
                        <strong>Movimentação:</strong> #${escapeHTML(movementId)}<br>
                        <strong>Data:</strong> ${formatDate(timestamp)}<br>
                        <strong>Operador:</strong> ${escapeHTML(operator)}<br>
                        <strong>Local:</strong> ${escapeHTML(location)}<br>
                    </p>
                </div>
            `;
        }).join("");

    } catch (error) {
        showAlert("Erro na auditoria: " + error.message, "error");
    }
}

// ============================================================
// EXPLORADOR DE MOVIMENTAÇÕES
// ============================================================

async function loadExplorer() {
    if (!account || !contract) return;

    const output = document.getElementById("explorerResults");

    try {
        await ensureSepolia();

        output.innerHTML = '<p class="empty">Consultando movimentações...</p>';

        const events = await contract.getPastEvents("MovementRecorded", {
            fromBlock: 0,
            toBlock: "latest"
        });

        if (events.length === 0) {
            output.innerHTML = '<p class="empty">Nenhuma movimentação registrada.</p>';
            return;
        }

        const sorted = [...events].reverse();

        output.innerHTML = sorted.map(event => {
            const data = event.returnValues;
            const action = Number(data.action);
            const hash = event.transactionHash;

            return `
                <div class="history-item">
                    <h4>${action === 0 ? "🟢 Entrada" : "🔴 Saída"} - 
                        ${escapeHTML(data.quantity)} unidades
                    </h4>
                    <p>
                        <strong>Produto ID:</strong> ${escapeHTML(data.productId)}<br>
                        <strong>Movimentação:</strong> ${escapeHTML(data.movementId)}<br>
                        <strong>Operador:</strong> ${escapeHTML(data.operator)}<br>
                        <strong>Local:</strong> ${escapeHTML(data.location)}<br>
                        <strong>Data:</strong> ${formatDate(data.timestamp)}<br>
                        <strong>Bloco:</strong> ${escapeHTML(event.blockNumber)}
                    </p>
                    <a href="${EXPLORER_URL}/tx/${encodeURIComponent(hash)}"
                       target="_blank" rel="noopener">
                       Consultar transação no Etherscan ↗
                    </a>
                </div>
            `;
        }).join("");

    } catch (error) {
        output.innerHTML = '<p class="empty">Não foi possível consultar os eventos.</p>';
        showAlert("Erro no explorador: " + error.message, "error");
    }
}

// ============================================================
// INICIALIZAÇÃO
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("contractAddress").textContent =
        CONTRACT_ADDRESS;

    document.getElementById("contractLink").href =
        EXPLORER_URL + "/address/" + CONTRACT_ADDRESS;

    if (window.ethereum) {
        web3 = new Web3(window.ethereum);
    }
});
