let tools = [];
let movements = [];
let suppliers = [];

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

  if (tabName === 'SaldoFornecedor') {
    fillSupplierDropdownInBalanceTab();
  }
}

function addTool(event) {
  event.preventDefault(); 
  const toolNameInput = document.getElementById('tool-name').value.trim(); 
  const toolNameLowerCase = toolNameInput.toLowerCase(); 
  const quantity = parseInt(document.getElementById('quantity').value);
  const currentDate = new Date().toLocaleDateString('pt-BR');
  const existingTool = tools.find(tool => tool.name.toLowerCase() === toolNameLowerCase);
  if (existingTool) {
    alert('Essa ferramenta já foi cadastrada.');
    return;
  }

  const tool = {
    id: tools.length + 1, 
    name: toolNameInput, 
    quantity: quantity,
    date: currentDate
  };
  tools.push(tool);
  saveData('tools', tools); 
  displayToolList();
  document.getElementById('add-tool-form').reset();
  fillToolDropdown(); 
}

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

function fillToolDropdown() {
  const toolDropdown = document.getElementById('tool-id');
  toolDropdown.innerHTML = '<option value="">Selecione a Ferramenta</option>';
  tools.forEach(tool => {
    const option = document.createElement('option');
    option.value = tool.name;
    option.textContent = tool.name; 
    toolDropdown.appendChild(option);
  });
}

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

function updateSupplierDropdownInBalanceTab() {
  const supplierDropdown = document.getElementById('select-supplier'); 
  const currentSupplierValue = supplierDropdown.value;
  fillSupplierDropdownInBalanceTab();
  if (currentSupplierValue && [...supplierDropdown.options].some(option => option.value === currentSupplierValue)) {
    supplierDropdown.value = currentSupplierValue;
  }
}

function registerMovement(event) {
  updateSupplierDropdownInBalanceTab();
}

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

  Object.values(groupedMovements).forEach(movement => {
    if (movement.totalQuantity !== 0) {
      suppliersWithBalance.push({ name: movement.supplier });
    }
  });

  const uniqueSuppliersWithBalance = [...new Set(suppliersWithBalance.map(supplier => supplier.name))].map(name => {
    return { name };
  });

  return uniqueSuppliersWithBalance;
}

function updateSupplierBalance() {
  const selectedSupplierIndex = document.getElementById('select-supplier').selectedIndex;
  const selectedSupplierName = document.getElementById('select-supplier').options[selectedSupplierIndex].text;

  if (selectedSupplierName === "") {
    document.getElementById('supplier-balance').style.display = 'none';
    return;
  }

  const filteredMovements = movements.filter(movement => movement.supplier === selectedSupplierName);
  displayFilteredSupplierBalance(filteredMovements);
}

function loadSupplierBalance() {
  const selectedSupplier = document.getElementById('select-supplier').value;
  displaySupplierBalanceBySupplier(selectedSupplier);
}

function displayFilteredSupplierBalance(filteredMovements) {
  const supplierBalanceTable = document.getElementById('supplier-balance-body');
  supplierBalanceTable.innerHTML = '';
  const groupedMovements = {};
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

  const filteredTools = Object.values(groupedMovements).filter(movement => movement.totalQuantity !== 0);

  filteredTools.forEach(movement => {
    const row = supplierBalanceTable.insertRow();
    const cellToolName = row.insertCell(0);
    const cellTotalQuantity = row.insertCell(1);

    cellToolName.textContent = movement.toolName;
    cellTotalQuantity.textContent = Math.abs(movement.totalQuantity);
  });
}

document.getElementById('select-supplier').addEventListener('change', updateSupplierBalance);

document.getElementById('tool-id').addEventListener('change', updateQuantityDisplay);

function updateQuantityDisplay() {
  const selectedToolName = this.value;
  const selectedTool = tools.find(tool => tool.name === selectedToolName);
  const toolQuantitySpan = document.getElementById('tool-quantity');
  
  if (selectedTool) {
    toolQuantitySpan.textContent = `Quantidade disponível: ${selectedTool.quantity}`;
    toolQuantitySpan.style.color = 'green'; 
  } else {
    toolQuantitySpan.textContent = 'Quantidade disponível: N/A';
    toolQuantitySpan.style.color = 'black'; 
  }
}

document.getElementById('tool-id').addEventListener('change', updateQuantityDisplay);
document.getElementById('movement-type').addEventListener('change', function(event) {
  const requester = document.getElementById('requester');
  const selectedType = event.target.value;


  requester.disabled = selectedType === 'entrada';

  if (selectedType === 'entrada' && requester.value.trim() !== '') {
    requester.value = ''; 
  }
});

function registerMovement(event) {
  event.preventDefault();

  const selectedToolName = document.getElementById('tool-id').value;
  const selectedTool = tools.find(tool => tool.name === selectedToolName);
  const movementQuantity = parseInt(document.getElementById('movement-quantity').value);
  const supplier = document.getElementById('supplier').value;
  const movementType = document.getElementById('movement-type').value;
  const currentDate = new Date().toLocaleDateString('pt-BR');
  const requester = document.getElementById('requester').value.trim();
  const nft = document.getElementById('nft').value.trim(); 

if (!selectedToolName || !movementQuantity || !supplier || !nft) {
    alert('Por favor, preencha todos os campos.');
    return;
  }

  if (movementQuantity <= 0) {
    alert('A quantidade deve ser maior que zero.');
    return;
  }

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

  const key = `${selectedToolName}-${supplier}`;
  const expectedRemaining = (groupedMovements[key]?.totalSentBySupplier || 0) - (groupedMovements[key]?.totalReceived || 0);

  if (movementType === 'entrada' && movementQuantity > expectedRemaining) {
    alert(`A quantidade de entrada excede a quantidade esperada restante (${expectedRemaining}).`);
    return;
  }

  if (movementType === 'saída') {
    if (movementQuantity > selectedTool.quantity) {
      alert('A quantidade de saída excede a quantidade disponível da ferramenta selecionada.');
      return;
    }
  }

 const movement = {
  date: currentDate,
  toolName: selectedToolName,
  requester: requester,
  nft: nft,
  quantity: movementQuantity,
  supplier: supplier,
  type: movementType
};

  movements.push(movement);
  saveData('movements', movements); 
  displayMovementList(); 

  if (movementType === 'entrada') {
    selectedTool.quantity += movementQuantity;
  } else if (movementType === 'saída') {
    selectedTool.quantity -= movementQuantity;
  }

  saveData('tools', tools);
  displayToolList(); 
  fillToolDropdown(); 

 document.getElementById('movement-form').reset();
  document.getElementById('movement-type').value = 'saída';
  document.getElementById('requester').disabled = false; 

   updateSupplierBalance();

  const supplierDropdown = document.getElementById('supplier-balance');
  supplierDropdown.value = supplier;

  updateQuantityDisplay.call(document.getElementById('tool-id'));
  updateSupplierDropdownInBalanceTab();
}

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

function registerSupplier(event) {
  event.preventDefault(); 
  const supplierName = document.getElementById('supplier-name').value;
  const supplierEmail = document.getElementById('supplier-email').value;
  const supplierPhone = document.getElementById('supplier-phone').value;
  const currentDate = new Date().toLocaleDateString('pt-BR');
  const supplier = {
    name: supplierName,
    email: supplierEmail,
    phone: supplierPhone,
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
      <td>
        <button onclick="editSupplier('${supplier.name}')">Editar</button>
        <button onclick="showContact('${supplier.name}')">Contato</button>
      </td>
    `;
    supplierList.appendChild(tr);
  });
}

function showContact(supplierName) {
  const supplier = suppliers.find(s => s.name === supplierName);
  if (supplier) {
    alert(`E-mail: ${supplier.email}\nTelefone: ${supplier.phone}`);
  } else {
    alert('Fornecedor não encontrado.');
  }
}

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
        <button onclick="showContactInfo(${index})">Contato</button>
      </td>
    `;
    supplierList.appendChild(tr);
  });
}

function showContactInfo(index) {
  const supplier = suppliers[index];
  alert(`Fornecedor: ${supplier.name}\nE-mail: ${supplier.email}\nTelefone: ${supplier.phone}`);
}

function displaySupplierBalanceBySupplier(supplierName) {
  const supplierBalanceBody = document.getElementById('supplier-balance-body');
  supplierBalanceBody.innerHTML = '';

  const filteredMovements = movements.filter(movement => movement.supplier === supplierName);

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

  Object.entries(groupedMovements).forEach(([toolName, totalQuantity]) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${toolName}</td>
      <td>${totalQuantity >= 0 ? totalQuantity : 0}</td>
    `;
    supplierBalanceBody.appendChild(tr);
  });
}

function deleteTool(id) {
  const toolToDelete = tools.find(tool => tool.id === id);
  if (!toolToDelete) {
    alert('Ferramenta não encontrada!');
    return;
  }

  const confirmFirstDelete = confirm('Tem certeza de que deseja excluir esta ferramenta? Esta ação é irreversível.');
  if (!confirmFirstDelete) {
    return; 
  }

  const confirmSecondDelete = confirm(`Esta é sua última chance de confirmar a exclusão da ferramenta "${toolToDelete.name}". Tem certeza de que deseja continuar?`);
  if (!confirmSecondDelete) {
    return; 
  }

  const index = tools.findIndex(tool => tool.id === id);
  if (index === -1) {
    alert('Ferramenta não encontrada!');
    return;
  }

  tools.splice(index, 1);
  saveData('tools', tools); 
  displayToolList(); 
  fillToolDropdown(); 
}

function deleteSupplier(index) {
  if (index < 0 || index >= suppliers.length) {
    alert('Fornecedor não encontrado!');
    return;
  }

  const supplierToDelete = suppliers[index];

  const confirmFirstDelete = confirm('Tem certeza de que deseja excluir este fornecedor? Esta ação é irreversível.');
  if (!confirmFirstDelete) {
    return; 
  }

  const confirmSecondDelete = confirm(`Esta é sua última chance de confirmar a exclusão do fornecedor "${supplierToDelete.name}". Tem certeza de que deseja continuar?`);
  if (!confirmSecondDelete) {
    return; 
  }

  suppliers.splice(index, 1);
  saveData('suppliers', suppliers); 
  displaySupplierList(); 
  fillSupplierDropdown(); 
  fillSupplierButtons(); 
  fillSupplierDropdownInBalanceTab(); 
  updateSupplierInMovements(supplierToDelete.name, null); 
}

function editSupplier(name) {
  const confirmEdit = confirm(`Tem certeza de que deseja editar o nome do fornecedor "${name}"?`);
  if (!confirmEdit) {
    return; 
  }

  const newName = prompt('Digite o novo nome do fornecedor:');
  if (newName) {
    const index = suppliers.findIndex(supplier => supplier.name === name);
    if (index !== -1) {
      suppliers[index].name = newName;
      saveData('suppliers', suppliers); 
      displaySupplierList(); 
      fillSupplierDropdown(); 
      fillSupplierDropdownInBalanceTab(); 
      updateSupplierInMovements(name, newName); 
    } else {
      alert('Fornecedor não encontrado!');
    }
  }
}

function saveData(key, data) {
localStorage.setItem(key, JSON.stringify(data));
}

function loadData(key) {
const data = localStorage.getItem(key);
return data ? JSON.parse(data) : [];
}

function initialize() {
  tools = loadData('tools');
  movements = loadData('movements');
  suppliers = loadData('suppliers');

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

function scheduleExport() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  let millisTill1700 = 0;
  if (currentHour < 17 || (currentHour === 17 && currentMinute < 0)) {
    const next1700 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 0, 0, 0);
    millisTill1700 = next1700 - now;
  } else {

    const tomorrow1700 = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 17, 0, 0, 0);
    millisTill1700 = tomorrow1700 - now;
  }

  setTimeout(function() {
    exportData();

    setInterval(exportData, 24 * 60 * 60 * 1000);
  }, millisTill1700);
}

scheduleExport();
scheduleExport();
scheduleExport();

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

function processData(importedData) {
  if (!importedData) return; 
  if (importedData.tools && importedData.tools.length > 0) {
    tools = importedData.tools;
    saveData('tools', tools);
    displayToolList();
    fillToolDropdown();
  }

  if (importedData.movements && importedData.movements.length > 0) {
    movements = importedData.movements;
    saveData('movements', movements);
    displayMovementList();
    updateSupplierBalance(); 
  }

  if (importedData.suppliers && importedData.suppliers.length > 0) {
    suppliers = importedData.suppliers;
    saveData('suppliers', suppliers);
    displaySupplierList();
    fillSupplierDropdown();
    fillSupplierDropdownInBalanceTab(); 
  }
}

function filterMovements() {
  const toolFilter = document.getElementById('filter-tool').value.toLowerCase();
  const dateFilter = document.getElementById('filter-date').value;
  const typeFilter = document.getElementById('filter-type').value;
  const supplierFilter = document.getElementById('filter-supplier').value.toLowerCase();
  const nftFilter = document.getElementById('filter-nft').value.toLowerCase();
  const requesterFilter = document.getElementById('filter-requester').value.toLowerCase();
  const rows = document.querySelectorAll('#movement-table tbody tr');

  function parseDate(dateStr) {
    if (dateStr.includes('/')) {

      const [day, month, year] = dateStr.split('/').map(Number);
      return new Date(year, month - 1, day);
    } else if (dateStr.length === 8) {

      const day = parseInt(dateStr.slice(0, 2), 10);
      const month = parseInt(dateStr.slice(2, 4), 10);
      const year = parseInt(dateStr.slice(4, 8), 10);
      return new Date(year, month - 1, day);
    } else {
      throw new Error('Formato de data inválido.');
    }
  }

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

    const toolMatch = tool.includes(toolFilter);
    const dateMatch = !filterDate || rowDate.getTime() === filterDate.getTime();
    const typeMatch = typeFilter === '' || type === typeFilter;
    const supplierMatch = supplier.includes(supplierFilter);
    const nftMatch = nft.includes(nftFilter);
    const requesterMatch = requester.includes(requesterFilter);

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
    movementList.innerHTML = '<tr><td colspan="6">Nenhum movimento encontrado com os filtros selecionados.</td></tr>';
  }
}

window.onload = initialize;
