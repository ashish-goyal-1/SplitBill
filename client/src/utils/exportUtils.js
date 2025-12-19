/**
 * Export utilities for generating reports
 * Uses browser's native print-to-PDF functionality
 */

/**
 * Generate a printable expense report and trigger print dialog
 * @param {Object} data - Report data
 * @param {string} data.groupName - Name of the group
 * @param {string} data.currency - Currency symbol
 * @param {number} data.totalExpense - Total expense amount
 * @param {Array} data.expenses - Array of expense objects
 * @param {Array} data.settlements - Array of settlement objects
 * @param {Array} data.members - Array of member emails
 */
export function exportToPDF(data) {
    const { groupName, currency, totalExpense, expenses, settlements, members } = data;

    // Format date
    const reportDate = new Date().toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Create print window content
    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${groupName} - Expense Report</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    padding: 40px;
                    color: #333;
                    line-height: 1.6;
                }
                .header {
                    text-align: center;
                    border-bottom: 3px solid #667eea;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .header h1 {
                    color: #667eea;
                    font-size: 28px;
                    margin-bottom: 5px;
                }
                .header .subtitle {
                    color: #666;
                    font-size: 14px;
                }
                .summary {
                    display: flex;
                    justify-content: space-around;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 10px;
                    margin-bottom: 30px;
                }
                .summary-item {
                    text-align: center;
                }
                .summary-item .label {
                    font-size: 12px;
                    opacity: 0.9;
                }
                .summary-item .value {
                    font-size: 24px;
                    font-weight: bold;
                }
                .section {
                    margin-bottom: 30px;
                }
                .section h2 {
                    color: #667eea;
                    font-size: 18px;
                    border-bottom: 2px solid #eee;
                    padding-bottom: 10px;
                    margin-bottom: 15px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                th, td {
                    padding: 12px;
                    text-align: left;
                    border-bottom: 1px solid #eee;
                }
                th {
                    background: #f8f9fa;
                    font-weight: 600;
                    color: #555;
                }
                tr:hover {
                    background: #f8f9fa;
                }
                .amount {
                    font-weight: 600;
                    color: #667eea;
                }
                .settlement-card {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 10px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .settlement-arrow {
                    color: #667eea;
                    font-weight: bold;
                }
                .members-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                }
                .member-chip {
                    background: #e8eaf6;
                    padding: 5px 15px;
                    border-radius: 20px;
                    font-size: 13px;
                }
                .footer {
                    margin-top: 40px;
                    text-align: center;
                    color: #999;
                    font-size: 12px;
                    border-top: 1px solid #eee;
                    padding-top: 20px;
                }
                /* Hide browser's default print headers and footers (removes "about:blank") */
                @page {
                    margin: 15mm;
                    /* Remove browser headers/footers */
                }
                @media print {
                    body { padding: 20px; }
                    .no-print { display: none; }
                    /* Additional print cleanup */
                    @page {
                        margin-top: 10mm;
                        margin-bottom: 10mm;
                    }
                }
            </style>

        </head>
        <body>
            <div class="header">
                <h1>📊 ${groupName}</h1>
                <div class="subtitle">Expense Report • Generated on ${reportDate}</div>
            </div>

            <div class="summary">
                <div class="summary-item">
                    <div class="label">Total Expenses</div>
                    <div class="value">${currency} ${totalExpense?.toLocaleString() || 0}</div>
                </div>
                <div class="summary-item">
                    <div class="label">Members</div>
                    <div class="value">${members?.length || 0}</div>
                </div>
                <div class="summary-item">
                    <div class="label">Transactions</div>
                    <div class="value">${expenses?.length || 0}</div>
                </div>
            </div>

            ${expenses && expenses.length > 0 ? `
            <div class="section">
                <h2>💰 Expense Details</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Paid By</th>
                            <th>Date</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${expenses.map(exp => `
                            <tr>
                                <td>${exp.expenseName}</td>
                                <td>${exp.expenseOwner}</td>
                                <td>${new Date(exp.expenseDate).toLocaleDateString()}</td>
                                <td class="amount">${currency} ${exp.expenseAmount?.toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ` : ''}

            ${settlements && settlements.length > 0 ? `
            <div class="section">
                <h2>🤝 Settlements Required</h2>
                ${settlements.map(s => `
                    <div class="settlement-card">
                        <span>${s[0]}</span>
                        <span class="settlement-arrow">→ pays ${currency} ${s[2]} to →</span>
                        <span>${s[1]}</span>
                    </div>
                `).join('')}
            </div>
            ` : '<div class="section"><h2>🤝 Settlements</h2><p>All settled! No pending payments.</p></div>'}

            ${members && members.length > 0 ? `
            <div class="section">
                <h2>👥 Group Members</h2>
                <div class="members-list">
                    ${members.map(m => `<span class="member-chip">${m}</span>`).join('')}
                </div>
            </div>
            ` : ''}

            <div class="footer">
                Generated by SplitBill • ${reportDate}
            </div>
        </body>
        </html>
    `;

    // Open print window using a data URL to avoid "about:blank" appearing in print
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();

        // Set document title for proper print header
        printWindow.document.title = `${groupName} - Expense Report`;

        // Wait for content to load, then trigger print
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
        }, 250);
    } else {
        alert('Please allow popups to generate the PDF report');
    }
}


/**
 * Export group data to CSV format
 * @param {Array} expenses - Array of expense objects
 * @param {string} groupName - Name of the group
 */
export function exportToCSV(expenses, groupName) {
    if (!expenses || expenses.length === 0) {
        alert('No expenses to export');
        return;
    }

    const headers = ['Name', 'Description', 'Amount', 'Paid By', 'Date', 'Category'];
    const rows = expenses.map(exp => [
        exp.expenseName,
        exp.expenseDescription || '',
        exp.expenseAmount,
        exp.expenseOwner,
        new Date(exp.expenseDate).toLocaleDateString(),
        exp.expenseCategory || 'Others'
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${groupName.replace(/\s+/g, '_')}_expenses.csv`;
    link.click();
}
