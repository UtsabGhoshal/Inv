// Local Storage helper functions
function getStoredInvoices() {
  const stored = localStorage.getItem('invoices');
  return stored ? JSON.parse(stored) : [];
}

function saveInvoiceToStorage(invoice) {
  const invoices = getStoredInvoices();
  invoice.id = Date.now(); // Simple ID generation
  invoice.created_at = new Date().toISOString();
  invoices.push(invoice);
  localStorage.setItem('invoices', JSON.stringify(invoices));
  return invoice;
}

console.log('Local storage invoice system initialized');

// Add a new item row
function addItemRow() {
  const table = document.getElementById("tableBody");
  const row = document.createElement("tr");

  row.innerHTML = `
    <td><input type="text" class="item" placeholder="Item Name"></td>
    <td><input type="number" class="qty" value="1" min="1" onchange="updateTotals()"></td>
    <td><input type="number" class="price" value="0" min="0" onchange="updateTotals()"></td>
    <td class="total">0.00</td>
    <td><button onclick="removeRow(this)">❌</button></td>
  `;

  table.appendChild(row);
  updateTotals();
}

// Remove item row
function removeRow(button) {
  const row = button.parentElement.parentElement;
  row.remove();
  updateTotals();
}

// Update totals whenever inputs change
function updateTotals() {
  const rows = document.querySelectorAll("#tableBody tr");
  let subtotal = 0;

  rows.forEach(row => {
    const qty = row.querySelector(".qty").value;
    const price = row.querySelector(".price").value;
    const total = parseFloat(qty) * parseFloat(price);
    row.querySelector(".total").textContent = total.toFixed(2);
    subtotal += total;
  });

  const tax = subtotal * 0.18;
  const grandTotal = subtotal + tax;

  document.getElementById("subtotal").textContent = subtotal.toFixed(2);
  document.getElementById("tax").textContent = tax.toFixed(2);
  document.getElementById("grandTotal").textContent = grandTotal.toFixed(2);
}

// Print the invoice
function printInvoice() {
  window.print();
}

// Check if table exists and create if needed
async function ensureTableExists() {
  try {
    console.log('Checking if invoices table exists...');

    // Try to select from the table to check if it exists
    const { data, error } = await supabase
      .from('invoices')
      .select('id')
      .limit(1);

    console.log('Table check result:', { data, error });

    if (error) {
      console.error('Table check error:', error);
      console.error('Table check error stringified:', JSON.stringify(error, null, 2));
      if (error.message && (error.message.includes('relation "public.invoices" does not exist') ||
                           error.message.includes('table "invoices" does not exist'))) {
        alert('The invoices table does not exist in your Supabase database. Please run the SQL file (setup_database.sql) in your Supabase SQL Editor first.');
        return false;
      }
      // For other errors, let's continue and see what happens
      console.warn('Table check failed but continuing anyway:', error.message);
    }

    console.log('Table exists or continuing anyway');
    return true;
  } catch (err) {
    console.error('Error checking table:', err);
    alert(`Error checking database connection: ${err.message}`);
    return false;
  }
}

// Save invoice to localStorage
function saveInvoice() {
  const clientName = document.getElementById('clientName').value;
  const invoiceDate = document.getElementById('invoiceDate').value;

  if (!clientName || !invoiceDate) {
    alert('Please fill in client name and invoice date before saving.');
    return;
  }

  // Collect all invoice items
  const items = [];
  const rows = document.querySelectorAll("#tableBody tr");

  rows.forEach(row => {
    const item = row.querySelector(".item").value;
    const qty = row.querySelector(".qty").value;
    const price = row.querySelector(".price").value;

    if (item && qty && price) {
      items.push({
        name: item,
        quantity: parseInt(qty),
        price: parseFloat(price),
        total: parseInt(qty) * parseFloat(price)
      });
    }
  });

  if (items.length === 0) {
    alert('Please add at least one item before saving.');
    return;
  }

  const subtotal = parseFloat(document.getElementById("subtotal").textContent);
  const tax = parseFloat(document.getElementById("tax").textContent);
  const grandTotal = parseFloat(document.getElementById("grandTotal").textContent);

  const invoiceData = {
    client_name: clientName,
    invoice_date: invoiceDate,
    items: items,
    subtotal: subtotal,
    tax: tax,
    grand_total: grandTotal
  };

  try {
    console.log('Saving invoice to localStorage:', invoiceData);
    const savedInvoice = saveInvoiceToStorage(invoiceData);
    console.log('Invoice saved successfully:', savedInvoice);
    alert('💾 Invoice saved successfully!');
  } catch (err) {
    console.error('Error saving invoice:', err);
    alert('Error saving invoice. Please try again.');
  }
}

// Load saved invoices from localStorage
function showSavedInvoices() {
  try {
    console.log('Loading invoices from localStorage...');
    const invoices = getStoredInvoices();
    console.log('Loaded invoices:', invoices);
    displaySavedInvoices(invoices);
  } catch (err) {
    console.error('Error loading invoices:', err);
    alert('Error loading invoices. Please try again.');
  }
}

// Display saved invoices in modal
function displaySavedInvoices(invoices) {
  const modal = document.getElementById('savedInvoicesModal');
  const list = document.getElementById('savedInvoicesList');

  if (invoices.length === 0) {
    list.innerHTML = '<p>No saved invoices found.</p>';
  } else {
    list.innerHTML = invoices.map(invoice => `
      <div class="saved-invoice-item">
        <div class="invoice-summary">
          <strong>${invoice.client_name}</strong>
          <span class="invoice-date">${new Date(invoice.invoice_date).toLocaleDateString()}</span>
          <span class="invoice-total">₹${invoice.grand_total.toFixed(2)}</span>
        </div>
        <button onclick="loadInvoice(${invoice.id})" class="load-invoice-btn">Load</button>
      </div>
    `).join('');
  }

  modal.style.display = 'block';
}

// Load specific invoice from localStorage
function loadInvoice(invoiceId) {
  try {
    console.log('Loading invoice with ID:', invoiceId);
    const invoices = getStoredInvoices();
    const invoice = invoices.find(inv => inv.id == invoiceId);

    if (!invoice) {
      alert('Invoice not found.');
      return;
    }

    // Clear existing table
    document.getElementById('tableBody').innerHTML = '';

    // Load client data
    document.getElementById('clientName').value = invoice.client_name;
    document.getElementById('invoiceDate').value = invoice.invoice_date;

    // Load items
    invoice.items.forEach(item => {
      addItemRow();
      const rows = document.querySelectorAll("#tableBody tr");
      const lastRow = rows[rows.length - 1];

      lastRow.querySelector(".item").value = item.name;
      lastRow.querySelector(".qty").value = item.quantity;
      lastRow.querySelector(".price").value = item.price;
    });

    updateTotals();
    closeSavedInvoicesModal();
    alert('📋 Invoice loaded successfully!');

  } catch (err) {
    console.error('Error loading invoice:', err);
    alert('Error loading invoice. Please try again.');
  }
}


// Close modal
function closeSavedInvoicesModal() {
  document.getElementById('savedInvoicesModal').style.display = 'none';
}
