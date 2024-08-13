// Array para armazenar as ferramentas
let tools = [];

// Array para armazenar as movimentações registradas
let movements = [];

// Array para armazenar os fornecedores cadastrados
let suppliers = [];

// Função para abrir uma aba
function openTab(evt, tabName) {
  const tabcontent = document.getElementsByClassName('tabcontent');
  for (let i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = 'none';
  }
  const tablinks = document.getElementsByClassName('tablinks');
  for (let i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(' active', '');
  }
  document.getElementById(tabName).style.display = 'block';
  evt.currentTarget.className += ' active';

  // Verificar se a aba aberta é "Saldo Fornecedor" e preencher o menu suspenso de fornecedores
  if (tabName === 'SaldoFornecedor') {
    fillSupplierDropdownInBalanceTab();
  }
}


// Função para adicionar uma ferramenta
function addTool(event) {
  event.preventDefault(); // Evita o recarregamento da página
  const toolNameInput = document.getElementById('tool-name').value.trim(); // Obtém o nome da ferramenta do input
  const toolNameLowerCase = toolNameInput.toLowerCase(); // Converte o nome da ferramenta para minúsculas
  const quantity = parseInt(document.getElementById('quantity').value);
  const currentDate = new Date().toLocaleDateString('pt-BR');

  // Verifica se a ferramenta já existe na lista, ignorando a capitalização
  const existingTool = tools.find(tool => tool.name.toLowerCase() === toolNameLowerCase);
  if (existingTool) {
    alert('Essa ferramenta já foi cadastrada.');
    return;
  }

  // Se a ferramenta não existir, adiciona à lista
  const tool = {
    id: tools.length + 1, 
    name: toolNameInput, // Armazena o nome original da ferramenta
    quantity: quantity,
    date: currentDate
  };
  tools.push(tool);
  saveData('tools', tools); 
  displayToolList();
  document.getElementById('add-tool-form').reset();
  fillToolDropdown(); 
}

// Função para listar todas as ferramentas com seus saldos disponíveis
function displayToolList() {
  const toolList = document.getElementById('tool-list');
  toolList.innerHTML = '';
  tools.forEach(tool => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${tool.name}</td>
      <td>${tool.quantity}</td>
      <td>${tool.date}</td>
      <td>
        <button onclick="deleteTool(${tool.id})">Excluir</button>
      </td>
    `;
    toolList.appendChild(tr);
  });
}


// Função para preencher o menu suspenso de ferramentas disponíveis na aba "Registrar Movimentação"
function fillToolDropdown() {
  const toolDropdown = document.getElementById('tool-id');
  toolDropdown.innerHTML = '<option value="">Selecione a Ferramenta</option>';
  tools.forEach(tool => {
    const option = document.createElement('option');
    option.value = tool.name;
    option.textContent = tool.name; // Apenas o nome da ferramenta
    toolDropdown.appendChild(option);
  });
}

// Função para atualizar o menu suspenso de fornecedores disponíveis na aba "Registrar Movimentação"
function fillSupplierDropdown() {
  const supplierDropdown = document.getElementById('supplier');
  supplierDropdown.innerHTML = '<option value="">Selecione o Fornecedor</option>';
  suppliers.forEach(supplier => {
    const option = document.createElement('option');
    option.value = supplier.name;
    option.textContent = supplier.name;
    supplierDropdown.appendChild(option);
  });
}

// Função para preencher o menu suspenso de fornecedores na aba "Saldo Fornecedor"
function fillSupplierDropdownInBalanceTab() {
  const supplierDropdown = document.getElementById('select-supplier'); 
  supplierDropdown.innerHTML = '<option value="">Selecione o Fornecedor</option>';
  
  const suppliersWithBalance = getSuppliersWithBalance();

  suppliersWithBalance.forEach(supplier => {
    const option = document.createElement('option');
    option.value = supplier.name;
    option.textContent = supplier.name;
    supplierDropdown.appendChild(option);
  });
}

// Função para atualizar o menu suspenso de fornecedores na aba "Saldo Fornecedor" sempre que houver uma nova movimentação registrada
function updateSupplierDropdownInBalanceTab() {
  const supplierDropdown = document.getElementById('select-supplier'); 
  const currentSupplierValue = supplierDropdown.value;

  // Preencher o menu suspenso novamente
  fillSupplierDropdownInBalanceTab();

  // Manter a seleção do fornecedor se ainda estiver disponível após a atualização
  if (currentSupplierValue && [...supplierDropdown.options].some(option => option.value === currentSupplierValue)) {
    supplierDropdown.value = currentSupplierValue;
  }
}

// Dentro da função registerMovement(), após registrar a movimentação, chame a função updateSupplierDropdownInBalanceTab() para atualizar o menu suspenso de fornecedores na aba "Saldo Fornecedor"
function registerMovement(event) {
  // Seu código existente para registrar a movimentação...

  // Após registrar a movimentação, atualizar o menu suspenso de fornecedores na aba "Saldo Fornecedor"
  updateSupplierDropdownInBalanceTab();
}

// Função para calcular os fornecedores com saldo com base nas movimentações registradas
function getSuppliersWithBalance() {
  const suppliersWithBalance = [];

  const groupedMovements = {};
  movements.forEach(movement => {
    const key = `${movement.supplier}-${movement.toolName}`;
    if (!groupedMovements[key]) {
      groupedMovements[key] = {
        supplier: movement.supplier,
        toolName: movement.toolName,
        totalQuantity: 0
      };
    }
    if (movement.type === 'saída') {
      groupedMovements[key].totalQuantity -= movement.quantity;
    } else {
      groupedMovements[key].totalQuantity += movement.quantity;
    }
  });

 // Verifica se o saldo é maior que zero e adiciona o fornecedor à lista
  Object.values(groupedMovements).forEach(movement => {
    if (movement.totalQuantity !== 0) {
      suppliersWithBalance.push({ name: movement.supplier });
    }
  });

  // Remove fornecedores duplicados
  const uniqueSuppliersWithBalance = [...new Set(suppliersWithBalance.map(supplier => supplier.name))].map(name => {
    return { name };
  });

  return uniqueSuppliersWithBalance;
}


// Função para atualizar o saldo do fornecedor selecionado
function updateSupplierBalance() {
  const selectedSupplierIndex = document.getElementById('select-supplier').selectedIndex;
  const selectedSupplierName = document.getElementById('select-supplier').options[selectedSupplierIndex].text;

  // Se nenhum fornecedor estiver selecionado, oculta a tabela de saldo
  if (selectedSupplierName === "") {
    document.getElementById('supplier-balance').style.display = 'none';
    return;
  }

  const filteredMovements = movements.filter(movement => movement.supplier === selectedSupplierName);
  displayFilteredSupplierBalance(filteredMovements);
}

// Função para carregar o saldo do fornecedor selecionado
function loadSupplierBalance() {
  const selectedSupplier = document.getElementById('select-supplier').value;
  displaySupplierBalanceBySupplier(selectedSupplier);
}


function displayFilteredSupplierBalance(filteredMovements) {
  const supplierBalanceTable = document.getElementById('supplier-balance-body');
  supplierBalanceTable.innerHTML = '';

  const groupedMovements = {};

  // Agrupa as movimentações filtradas por ferramenta
  filteredMovements.forEach(movement => {
    const key = movement.toolName; 
    if (!groupedMovements[key]) {
      groupedMovements[key] = {
        toolName: movement.toolName,
        totalQuantity: 0
      };
    }
    if (movement.type === 'entrada') {
      groupedMovements[key].totalQuantity += movement.quantity;
    } else {
      groupedMovements[key].totalQuantity -= movement.quantity;
    }
  });

  // Filtra as ferramentas com saldo diferente de zero
  const filteredTools = Object.values(groupedMovements).filter(movement => movement.totalQuantity !== 0);

  // Exibe as ferramentas com saldo diferente de zero na tabela
  filteredTools.forEach(movement => {
    const row = supplierBalanceTable.insertRow();
    const cellToolName = row.insertCell(0);
    const cellTotalQuantity = row.insertCell(1);

    cellToolName.textContent = movement.toolName;
    // Exibir o saldo como um número positivo usando Math.abs()
    cellTotalQuantity.textContent = Math.abs(movement.totalQuantity);
  });
}


// Adicione um event listener ao menu suspenso de seleção de fornecedor na aba "Saldo Fornecedor"
document.getElementById('select-supplier').addEventListener('change', updateSupplierBalance);


// Adicionar event listener para o menu suspenso de ferramentas
document.getElementById('tool-id').addEventListener('change', updateQuantityDisplay);

// Função para atualizar a quantidade disponível exibida
function updateQuantityDisplay() {
  const selectedToolName = this.value;
  const selectedTool = tools.find(tool => tool.name === selectedToolName);
  const toolQuantitySpan = document.getElementById('tool-quantity');
  
  if (selectedTool) {
    toolQuantitySpan.textContent = `Quantidade disponível: ${selectedTool.quantity}`;
    toolQuantitySpan.style.color = 'green'; // Ajusta a cor para verde
  } else {
    toolQuantitySpan.textContent = 'Quantidade disponível: N/A';
    toolQuantitySpan.style.color = 'black'; // Ajusta a cor para preto
  }
}

// Adicionar event listener para o campo de seleção da ferramenta
document.getElementById('tool-id').addEventListener('change', updateQuantityDisplay);

// Adicionar event listener para o campo de seleção do tipo de movimentação
document.getElementById('movement-type').addEventListener('change', function(event) {
  const requester = document.getElementById('requester');
  const selectedType = event.target.value;

  // Se o tipo de movimentação for "Saída", habilita o campo "Solicitante", caso contrário, desabilita
  requester.disabled = selectedType === 'entrada';

  // Se o tipo de movimentação for "Entrada" e houver algo no campo "Solicitante", limpa-o
  if (selectedType === 'entrada' && requester.value.trim() !== '') {
    requester.value = ''; // Limpa o campo "Solicitante"
  }
});

// Função para registrar uma movimentação
function registerMovement(event) {
  event.preventDefault(); // Evita o recarregamento da página

  const selectedToolName = document.getElementById('tool-id').value;
  const selectedTool = tools.find(tool => tool.name === selectedToolName);
  const movementQuantity = parseInt(document.getElementById('movement-quantity').value);
  const supplier = document.getElementById('supplier').value;
  const movementType = document.getElementById('movement-type').value;
  const currentDate = new Date().toLocaleDateString('pt-BR');
  const requester = document.getElementById('requester').value.trim();
  const nft = document.getElementById('nft').value.trim(); // Corrigido para capturar o valor do campo "Nota Fiscal"

if (!selectedToolName || !movementQuantity || !supplier || !nft) {
    alert('Por favor, preencha todos os campos.');
    return;
  }

// Verifica se a quantidade é válida
  if (movementQuantity <= 0) {
    alert('A quantidade deve ser maior que zero.');
    return;
  }


    // Agrupa as movimentações por item e por fornecedor
  const groupedMovements = {};
  movements.forEach(movement => {
    const key = `${movement.toolName}-${movement.supplier}`;
    if (!groupedMovements[key]) {
      groupedMovements[key] = {
        totalSentBySupplier: 0,
        totalReceived: 0
      };
    }

    if (movement.type === 'saída') {
      groupedMovements[key].totalSentBySupplier += movement.quantity;
    } else {
      groupedMovements[key].totalReceived += movement.quantity;
    }
  });

 // Verifica se a quantidade sendo registrada excede a quantidade esperada restante
  const key = `${selectedToolName}-${supplier}`;
  const expectedRemaining = (groupedMovements[key]?.totalSentBySupplier || 0) - (groupedMovements[key]?.totalReceived || 0);

  if (movementType === 'entrada' && movementQuantity > expectedRemaining) {
    alert(`A quantidade de entrada excede a quantidade esperada restante (${expectedRemaining}).`);
    return;
  }

  // Se o tipo de movimentação for "saída"
  if (movementType === 'saída') {
    // Verifica se a quantidade de saída excede a quantidade disponível
    if (movementQuantity > selectedTool.quantity) {
      alert('A quantidade de saída excede a quantidade disponível da ferramenta selecionada.');
      return;
    }
  }

// Cria o objeto de movimentação
 const movement = {
  date: currentDate,
  toolName: selectedToolName,
  requester: requester,
  nft: nft, // Usa o valor do campo NFT
  quantity: movementQuantity,
  supplier: supplier,
  type: movementType
};

 // Adiciona a movimentação ao array e salva os dados
  movements.push(movement);
  saveData('movements', movements); 
  displayMovementList(); 

 // Atualizar quantidade da ferramenta
  if (movementType === 'entrada') {
    selectedTool.quantity += movementQuantity;
  } else if (movementType === 'saída') {
    selectedTool.quantity -= movementQuantity;
  }


  saveData('tools', tools); // Salva os dados atualizados da ferramenta no localStorage
  displayToolList(); // Atualiza a lista de ferramentas exibida na interface
  fillToolDropdown(); // Atualiza o menu suspenso de ferramentas disponíveis na aba "Registrar Movimentação"


 document.getElementById('movement-form').reset();
  document.getElementById('movement-type').value = 'saída';
  document.getElementById('requester').disabled = false; 

   updateSupplierBalance();

  // Atualizar o campo de seleção de fornecedor na aba "Saldo Fornecedor" para manter o fornecedor selecionado
  const supplierDropdown = document.getElementById('supplier-balance');
  supplierDropdown.value = supplier;

  // Atualizar a exibição da quantidade disponível da ferramenta
  updateQuantityDisplay.call(document.getElementById('tool-id'));

 // Atualizar o menu suspenso de fornecedores na aba "Saldo Fornecedor"
  updateSupplierDropdownInBalanceTab();
}


// Função para exibir as movimentações registradas
function displayMovementList() {
  const movementList = document.getElementById('movement-list');
  movementList.innerHTML = '';
  movements.forEach(movement => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${movement.date}</td>
      <td>${movement.toolName}</td>
      <td>${movement.requester}</td>
      <td>${movement.nft}</td>
      <td>${movement.quantity}</td>
      <td>${movement.supplier}</td>
      <td>${movement.type}</td>
    `;
    movementList.appendChild(tr);
  });
}

// Função para exibir o saldo dos fornecedores
function displaySupplierBalance() {
  const supplierBalanceBody = document.getElementById('supplier-balance-body');
  supplierBalanceBody.innerHTML = ''; 

  const groupedMovements = {};
  movements.forEach(movement => {
    const key = `${movement.supplier}-${movement.toolName}`;
    if (!groupedMovements[key]) {
      groupedMovements[key] = {
        supplier: movement.supplier,
        toolName: movement.toolName,
        totalQuantity: 0
      };
    }
    if (movement.type === 'saída') {
      groupedMovements[key].totalQuantity -= movement.quantity;
    } else {
      groupedMovements[key].totalQuantity += movement.quantity;
    }
  });

  // Preenche a tabela com os saldos dos fornecedores
  Object.values(groupedMovements).forEach(movement => {
    const row = document.createElement('tr');
    const absoluteQuantity = Math.abs(movement.totalQuantity); 
    row.innerHTML = `
      <td>${movement.toolName}</td>
      <td>${absoluteQuantity}</td>
    `;
    supplierBalanceBody.appendChild(row);
  });
}

// Função para cadastrar um fornecedor
function registerSupplier(event) {
  event.preventDefault(); 
  const supplierName = document.getElementById('supplier-name').value;
  const currentDate = new Date().toLocaleDateString('pt-BR');
  const supplier = {
    name: supplierName,
    date: currentDate
  };
  suppliers.push(supplier);
  saveData('suppliers', suppliers); 
  displaySupplierList();
  document.getElementById('supplier-registration-form').reset();
  
  fillSupplierDropdown();
  fillSupplierDropdownInBalanceTab();
}

function displaySupplierList() {
  const supplierList = document.getElementById('supplier-list');
  supplierList.innerHTML = '';
  suppliers.forEach(supplier => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${supplier.name}</td>
      <td>${supplier.date}</td>
      <td>
        <button onclick="editSupplier('${supplier.name}')">Editar</button>
        <button onclick="deleteSupplier('${supplier.name}')">Excluir</button>
      </td>
    `;
    supplierList.appendChild(tr);
  });
}

// Função para exibir a lista de fornecedores
function displaySupplierList() {
  const supplierList = document.getElementById('supplier-list');
  supplierList.innerHTML = '';
  suppliers.forEach((supplier, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${supplier.name}</td>
      <td>${supplier.date}</td>
      <td>
        <button onclick="editSupplier('${supplier.name}')">Editar</button>
        <button onclick="deleteSupplier(${index})">Excluir</button>
      </td>
    `;
    supplierList.appendChild(tr);
  });
}


// Função para exibir o saldo do fornecedor selecionado
function displaySupplierBalanceBySupplier(supplierName) {
  const supplierBalanceBody = document.getElementById('supplier-balance-body');
  supplierBalanceBody.innerHTML = '';

  // Filtrar as movimentações pelo fornecedor selecionado
  const filteredMovements = movements.filter(movement => movement.supplier === supplierName);

  // Agrupar as movimentações filtradas por ferramenta
  const groupedMovements = {};
  filteredMovements.forEach(movement => {
    const key = movement.toolName;
    if (!groupedMovements[key]) {
      groupedMovements[key] = 0;
    }
    if (movement.type === 'entrada') {
      groupedMovements[key] += movement.quantity;
    } else {
      groupedMovements[key] -= movement.quantity;
    }
  });

  // Exibir as informações do saldo do fornecedor selecionado
  Object.entries(groupedMovements).forEach(([toolName, totalQuantity]) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${toolName}</td>
      <td>${totalQuantity >= 0 ? totalQuantity : 0}</td>
    `;
    supplierBalanceBody.appendChild(tr);
  });
}

// Função para excluir uma ferramenta
function deleteTool(id) {
  const toolToDelete = tools.find(tool => tool.id === id);
  if (!toolToDelete) {
    alert('Ferramenta não encontrada!');
    return;
  }

  const confirmFirstDelete = confirm('Tem certeza de que deseja excluir esta ferramenta? Esta ação é irreversível.');
  if (!confirmFirstDelete) {
    return; // Se o usuário cancelar, saia da função
  }

  const confirmSecondDelete = confirm(`Esta é sua última chance de confirmar a exclusão da ferramenta "${toolToDelete.name}". Tem certeza de que deseja continuar?`);
  if (!confirmSecondDelete) {
    return; // Se o usuário cancelar, saia da função
  }

  const index = tools.findIndex(tool => tool.id === id);
  if (index === -1) {
    alert('Ferramenta não encontrada!');
    return;
  }

  tools.splice(index, 1);
  saveData('tools', tools); // Salva os dados atualizados das ferramentas
  displayToolList(); // Atualiza a lista de ferramentas exibida na interface
  fillToolDropdown(); // Atualiza o menu suspenso de ferramentas disponíveis na aba "Registrar Movimentação"
}




// Função para excluir um fornecedor
function deleteSupplier(index) {
  if (index < 0 || index >= suppliers.length) {
    alert('Fornecedor não encontrado!');
    return;
  }

  const supplierToDelete = suppliers[index];

  const confirmFirstDelete = confirm('Tem certeza de que deseja excluir este fornecedor? Esta ação é irreversível.');
  if (!confirmFirstDelete) {
    return; // Se o usuário cancelar, saia da função
  }

  const confirmSecondDelete = confirm(`Esta é sua última chance de confirmar a exclusão do fornecedor "${supplierToDelete.name}". Tem certeza de que deseja continuar?`);
  if (!confirmSecondDelete) {
    return; // Se o usuário cancelar, saia da função
  }

  suppliers.splice(index, 1);
  saveData('suppliers', suppliers); // Salva os dados atualizados dos fornecedores
  displaySupplierList(); // Atualiza a lista de fornecedores exibida na interface
  fillSupplierDropdown(); // Atualiza o menu suspenso de fornecedores disponíveis
  fillSupplierButtons(); // Atualiza os botões de fornecedores
  fillSupplierDropdownInBalanceTab(); // Atualiza o menu suspenso na aba de balanço
  updateSupplierInMovements(supplierToDelete.name, null); // Remove o fornecedor das movimentações
}

// Função para editar um fornecedor
function editSupplier(name) {
  const confirmEdit = confirm(`Tem certeza de que deseja editar o nome do fornecedor "${name}"?`);
  if (!confirmEdit) {
    return; // Se o usuário cancelar, saia da função
  }

  const newName = prompt('Digite o novo nome do fornecedor:');
  if (newName) {
    const index = suppliers.findIndex(supplier => supplier.name === name);
    if (index !== -1) {
      suppliers[index].name = newName;
      saveData('suppliers', suppliers); // Salva os dados atualizados do fornecedor
      displaySupplierList(); // Atualiza a lista de fornecedores exibida na interface
      fillSupplierDropdown(); // Atualiza o menu suspenso de fornecedores disponíveis
      fillSupplierDropdownInBalanceTab(); // Atualiza o menu suspenso na aba de balanço
      updateSupplierInMovements(name, newName); // Atualiza o nome do fornecedor nas movimentações
    } else {
      alert('Fornecedor não encontrado!');
    }
  }
}

// Função para salvar dados no localStorage
function saveData(key, data) {
localStorage.setItem(key, JSON.stringify(data));
}

// Função para carregar dados do localStorage
function loadData(key) {
const data = localStorage.getItem(key);
return data ? JSON.parse(data) : [];
}

// Dentro da função initialize(), atualize a chamada para preencher o menu suspenso de fornecedores na aba "Saldo Fornecedor"
function initialize() {
  // Carregar dados salvos do localStorage
  tools = loadData('tools');
  movements = loadData('movements');
  suppliers = loadData('suppliers');

  // Exibir informações iniciais
  displayToolList();
  displayMovementList();
  displaySupplierList(); 
  fillToolDropdown();
  fillSupplierDropdown();
  displaySupplierBalance();
  fillSupplierDropdownInBalanceTab(); 

  updateSupplierBalance();
  
  fillSupplierDropdownInBalanceTab();
}

// Função para exportar dados
function exportData() {
  const currentDate = new Date(); 
  const day = String(currentDate.getDate()).padStart(2, '0'); 
  const month = String(currentDate.getMonth() + 1).padStart(2, '0'); 
  const year = currentDate.getFullYear(); 
  const formattedDate = `${day}-${month}-${year}`; 
 
  const fileName = `DADO - ${formattedDate}.json`; 
  const data = {
    tools: tools,
    movements: movements,
    suppliers: suppliers
  };
  const jsonData = JSON.stringify(data);
  const blob = new Blob([jsonData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName; 
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Função para exportar dados automaticamente todos os dias às 17:00
function scheduleExport() {
  
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Calcular os milissegundos até a próxima execução (17:00)
  let millisTill1700 = 0;
  if (currentHour < 17 || (currentHour === 17 && currentMinute < 0)) {
    // Se ainda não passou das 17:00 hoje, calcular o tempo restante até 17:00 hoje
    const next1700 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 0, 0, 0);
    millisTill1700 = next1700 - now;
  } else {
    // Se já passou das 17:00 hoje, calcular o tempo restante até 17:00 amanhã
    const tomorrow1700 = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 17, 0, 0, 0);
    millisTill1700 = tomorrow1700 - now;
  }

  // Agendar a exportação automática para ocorrer no próximo horário especificado (17:00)
  setTimeout(function() {
    exportData();

    // Agendar a próxima execução para 24 horas depois
    setInterval(exportData, 24 * 60 * 60 * 1000);
  }, millisTill1700);
}

// Iniciar o agendamento da exportação automática
scheduleExport();

// Iniciar o agendamento da exportação automática
scheduleExport();

// Iniciar o agendamento da exportação automática
scheduleExport();


// Função para importar dados
function importData(event) {
  const fileInput = event.target;
  const file = fileInput.files[0];
  if (!file) {
    alert("Nenhum arquivo selecionado para importar.");
    return;
  }
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const importedData = JSON.parse(e.target.result);
      processData(importedData);
      alert("Dados importados com sucesso!");
    } catch (error) {
      alert("Ocorreu um erro ao importar os dados: " + error.message);
    }
  };
  reader.readAsText(file);
}

// Função para processar os dados importados
function processData(importedData) {

  if (!importedData) return; 

  if (importedData.tools && importedData.tools.length > 0) {
    tools = importedData.tools;
    saveData('tools', tools);
    displayToolList();
    fillToolDropdown();
  }

  // Atualizar as movimentações, se houver
  if (importedData.movements && importedData.movements.length > 0) {
    movements = importedData.movements;
    saveData('movements', movements);
    displayMovementList();
    updateSupplierBalance(); 
  }

  // Atualizar os fornecedores, se houver
  if (importedData.suppliers && importedData.suppliers.length > 0) {
    suppliers = importedData.suppliers;
    saveData('suppliers', suppliers);
    displaySupplierList();
    fillSupplierDropdown();
    fillSupplierDropdownInBalanceTab(); 
  }
}


// Função para filtrar movimentações com base nas ferramentas, data, tipo e fornecedor
function filterMovements() {
  const toolFilter = document.getElementById('filter-tool').value.toLowerCase();
  const dateFilter = document.getElementById('filter-date').value;
  const typeFilter = document.getElementById('filter-type').value;
  const supplierFilter = document.getElementById('filter-supplier').value.toLowerCase();
  const nftFilter = document.getElementById('filter-nft').value.toLowerCase();
  const requesterFilter = document.getElementById('filter-requester').value.toLowerCase();
  const rows = document.querySelectorAll('#movement-table tbody tr');

  // Função para converter data nos formatos DD/MM/YYYY e DDMYYYY para objeto Date
  function parseDate(dateStr) {
    if (dateStr.includes('/')) {
      // Formato DD/MM/YYYY
      const [day, month, year] = dateStr.split('/').map(Number);
      return new Date(year, month - 1, day);
    } else if (dateStr.length === 8) {
      // Formato DDMYYYY
      const day = parseInt(dateStr.slice(0, 2), 10);
      const month = parseInt(dateStr.slice(2, 4), 10);
      const year = parseInt(dateStr.slice(4, 8), 10);
      return new Date(year, month - 1, day);
    } else {
      throw new Error('Formato de data inválido.');
    }
  }

  // Converter a data do filtro, se fornecida
  let filterDate = null;
  if (dateFilter) {
    try {
      filterDate = parseDate(dateFilter);
      if (isNaN(filterDate.getTime())) {
        throw new Error('Data no formato inválido.');
      }
    } catch (e) {
      console.error(e.message);
      return;
    }
  }

  rows.forEach(row => {
    const tool = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
    const dateText = row.querySelector('td:nth-child(1)').textContent;
    const type = row.querySelector('td:nth-child(7)').textContent;
    const supplier = row.querySelector('td:nth-child(6)').textContent.toLowerCase();
    const nft = row.querySelector('td:nth-child(4)').textContent.toLowerCase();
    const requester = row.querySelector('td:nth-child(3)').textContent.toLowerCase();

    // Converter a data da célula para um objeto Date
    let rowDate = null;
    try {
      rowDate = parseDate(dateText);
      if (isNaN(rowDate.getTime())) {
        throw new Error('Data na tabela no formato inválido.');
      }
    } catch (e) {
      console.error(e.message);
      return;
    }

    // Checar se o item corresponde ao filtro
    const toolMatch = tool.includes(toolFilter);
    const dateMatch = !filterDate || rowDate.getTime() === filterDate.getTime();
    const typeMatch = typeFilter === '' || type === typeFilter;
    const supplierMatch = supplier.includes(supplierFilter);
    const nftMatch = nft.includes(nftFilter);
    const requesterMatch = requester.includes(requesterFilter);

    // Mostrar ou esconder a linha com base nos filtros
    if (toolMatch && dateMatch && typeMatch && supplierMatch && nftMatch && requesterMatch) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

function exportToExcel() {
    var wb = XLSX.utils.book_new();
    var ws = XLSX.utils.table_to_sheet(document.getElementById('movement-table'));
    XLSX.utils.book_append_sheet(wb, ws, "Movimentos");
    
    XLSX.writeFile(wb, "movimentos_registrados.xlsx");
}
  

function displayFilteredMovementList(filteredMovements) {
  const movementList = document.getElementById('movement-list');
  
  // Limpa a lista de movimentações antes de exibir os movimentos filtrados
  movementList.innerHTML = '';

  if (filteredMovements.length > 0) {
    filteredMovements.forEach(movement => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${movement.date}</td>
        <td>${movement.toolName}</td>
        <td>${movement.requester}</td>
        <td>${movement.quantity}</td>
        <td>${movement.supplier}</td>
        <td>${movement.type}</td>
      `;
      movementList.appendChild(tr);
    });
  } else {
    // Se não houver movimentações filtradas, exibe uma mensagem indicando isso
    movementList.innerHTML = '<tr><td colspan="6">Nenhum movimento encontrado com os filtros selecionados.</td></tr>';
  }
}

// Inicializar o aplicativo quando a página carregar
window.onload = initialize;