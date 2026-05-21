document.addEventListener('DOMContentLoaded', () => {
    let currentData = JSON.parse(JSON.stringify(INITIAL_DATA));
    let backupData = null;
    let isEditMode = false;

    const solveBtn = document.getElementById('solve-btn');
    const resultsSection = document.getElementById('results-section');
    const assignmentsList = document.getElementById('assignments-list');
    const totalCostSpan = document.getElementById('total-cost');
    const nodesExploredSpan = document.getElementById('nodes-explored');
    const timeTakenSpan = document.getElementById('time-taken');
    const modifyBtn = document.getElementById('modify-btn');
    const editActions = document.getElementById('edit-actions');
    const saveBtn = document.getElementById('save-btn');
    const clearBtn = document.getElementById('clear-btn');
    const resetBtn = document.getElementById('reset-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const addRowBtn = document.getElementById('add-row-btn');
    const addColBtn = document.getElementById('add-col-btn');
    const addButtonsContainer = document.getElementById('add-buttons');
    const tableContainer = document.querySelector('.table-container');

    // --- INITIAL RENDER ---
    renderTable();

    // --- TOAST ---
    function showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        let icon = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-triangle' : type === 'warning' ? 'help-circle' : 'info';
        toast.innerHTML = `<i data-lucide="${icon}"></i><span>${message}</span>`;
        container.appendChild(toast);
        lucide.createIcons();
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 3500);
    }

    // --- RENDER TABLE ---
    function renderTable() {
        const table = document.createElement('table');

        // THEAD
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        const thEmpresa = document.createElement('th');
        thEmpresa.textContent = 'Empresa';
        headerRow.appendChild(thEmpresa);

        currentData.wheel_types.forEach((wt, colIdx) => {
            const th = document.createElement('th');
            if (isEditMode) {
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'edit-mode-input wheel-input';
                input.value = wt;
                input.placeholder = `Tipo ${colIdx + 1}`;
                th.appendChild(input);
                if (currentData.wheel_types.length > 1) {
                    const btn = document.createElement('button');
                    btn.className = 'remove-btn';
                    btn.title = 'Eliminar columna';
                    btn.innerHTML = '×';
                    btn.addEventListener('click', () => removeColumn(colIdx));
                    th.appendChild(btn);
                }
            } else {
                th.textContent = wt;
            }
            headerRow.appendChild(th);
        });

        if (isEditMode) {
            const thAction = document.createElement('th');
            thAction.style.width = '40px';
            headerRow.appendChild(thAction);
        }
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // TBODY
        const tbody = document.createElement('tbody');
        currentData.companies.forEach((company, rowIdx) => {
            const tr = document.createElement('tr');

            const tdCompany = document.createElement('td');
            tdCompany.className = 'company-name';
            if (isEditMode) {
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'edit-mode-input company-input';
                input.value = company;
                input.placeholder = `Empresa ${rowIdx + 1}`;
                tdCompany.appendChild(input);
            } else {
                tdCompany.textContent = company;
            }
            tr.appendChild(tdCompany);

            currentData.wheel_types.forEach((_, colIdx) => {
                const td = document.createElement('td');
                const val = (currentData.costs[rowIdx] && currentData.costs[rowIdx][colIdx] !== undefined) ? currentData.costs[rowIdx][colIdx] : 0;
                if (isEditMode) {
                    const input = document.createElement('input');
                    input.type = 'number';
                    input.className = 'edit-mode-input cost-input';
                    input.value = val;
                    input.min = '0';
                    input.placeholder = '0';
                    td.appendChild(input);
                } else {
                    td.textContent = val;
                }
                tr.appendChild(td);
            });

            if (isEditMode) {
                const tdAction = document.createElement('td');
                tdAction.className = 'action-cell';
                if (currentData.companies.length > 1) {
                    const btn = document.createElement('button');
                    btn.className = 'remove-btn';
                    btn.title = 'Eliminar fila';
                    btn.innerHTML = '×';
                    btn.addEventListener('click', () => removeRow(rowIdx));
                    tdAction.appendChild(btn);
                }
                tr.appendChild(tdAction);
            }

            tbody.appendChild(tr);
        });
        table.appendChild(tbody);

        tableContainer.innerHTML = '';
        tableContainer.appendChild(table);
        addButtonsContainer.classList.toggle('hidden', !isEditMode);
        lucide.createIcons();
    }

    // --- COLLECT DATA FROM INPUTS ---
    function collectDataFromTable() {
        const wheel_types = Array.from(tableContainer.querySelectorAll('.wheel-input')).map(i => i.value.trim());
        const companies = [];
        const costs = [];
        tableContainer.querySelectorAll('tbody tr').forEach(row => {
            const ci = row.querySelector('.company-input');
            companies.push(ci ? ci.value.trim() : '');
            costs.push(Array.from(row.querySelectorAll('.cost-input')).map(i => { const v = parseFloat(i.value); return isNaN(v) ? 0 : v; }));
        });
        return { companies, wheel_types, costs };
    }

    function syncFromInputs() { currentData = collectDataFromTable(); }

    // --- ADD / REMOVE ---
    function addRow() {
        syncFromInputs();
        currentData.companies.push(`Empresa ${currentData.companies.length + 1}`);
        currentData.costs.push(new Array(currentData.wheel_types.length).fill(0));
        renderTable();
        showToast('Nueva empresa agregada.', 'info');
    }
    function addColumn() {
        syncFromInputs();
        currentData.wheel_types.push(`TIPO ${currentData.wheel_types.length + 1}`);
        currentData.costs.forEach(row => row.push(0));
        renderTable();
        showToast('Nuevo tipo de rueda agregado.', 'info');
    }
    function removeRow(idx) {
        syncFromInputs();
        currentData.companies.splice(idx, 1);
        currentData.costs.splice(idx, 1);
        renderTable();
        showToast('Empresa eliminada.', 'warning');
    }
    function removeColumn(idx) {
        syncFromInputs();
        currentData.wheel_types.splice(idx, 1);
        currentData.costs.forEach(row => row.splice(idx, 1));
        renderTable();
        showToast('Tipo de rueda eliminado.', 'warning');
    }

    // --- MODE TOGGLE ---
    modifyBtn.addEventListener('click', () => {
        backupData = JSON.parse(JSON.stringify(currentData));
        isEditMode = true;
        modifyBtn.classList.add('hidden');
        editActions.classList.remove('hidden');
        renderTable();
        showToast('Modo edición activado.', 'info');
    });

    cancelBtn.addEventListener('click', () => {
        currentData = JSON.parse(JSON.stringify(backupData));
        isEditMode = false;
        modifyBtn.classList.remove('hidden');
        editActions.classList.add('hidden');
        renderTable();
        showToast('Modificaciones canceladas.', 'info');
    });

    clearBtn.addEventListener('click', () => {
        tableContainer.querySelectorAll('.edit-mode-input').forEach(i => { i.value = ''; });
        showToast('Campos limpiados.', 'warning');
    });

    resetBtn.addEventListener('click', async () => {
        if (!confirm('¿Restablecer los datos a los valores originales?')) return;
        resetBtn.disabled = true;
        try {
            await fetch('/api/reset', { method: 'POST' });
            const res = await fetch('/api/data');
            currentData = await res.json();
            isEditMode = false;
            modifyBtn.classList.remove('hidden');
            editActions.classList.add('hidden');
            renderTable();
            resultsSection.classList.add('hidden');
            showToast('Datos restablecidos.', 'success');
        } catch (e) { showToast('Error de conexión.', 'error'); }
        finally { resetBtn.disabled = false; }
    });

    saveBtn.addEventListener('click', async () => {
        const collected = collectDataFromTable();
        if (collected.wheel_types.some(v => !v) || collected.companies.some(v => !v)) {
            showToast('Los nombres no pueden estar vacíos.', 'error');
            return;
        }
        saveBtn.disabled = true;
        try {
            const res = await fetch('/api/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(collected)
            });
            if (res.ok) {
                currentData = collected;
                isEditMode = false;
                modifyBtn.classList.remove('hidden');
                editActions.classList.add('hidden');
                renderTable();
                resultsSection.classList.add('hidden');
                showToast('¡Datos guardados exitosamente!', 'success');
            } else { showToast('Error al guardar.', 'error'); }
        } catch (e) { showToast('Error de conexión.', 'error'); }
        finally { saveBtn.disabled = false; }
    });

    addRowBtn.addEventListener('click', addRow);
    addColBtn.addEventListener('click', addColumn);

    // --- SOLVE ---
    solveBtn.addEventListener('click', async () => {
        solveBtn.disabled = true;
        solveBtn.querySelector('.btn-content').innerHTML = '<i data-lucide="loader-2" class="spin"></i> Procesando A*...';
        lucide.createIcons();
        try {
            const res = await fetch('/solve', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
            const data = await res.json();
            if (data.success) {
                renderResults(data);
                showToast('Asignación óptima completada.', 'success');
            } else {
                showToast('No se encontró solución. Verifica que haya al menos tantas empresas como tipos de rueda.', 'error');
            }
        } catch (e) { showToast('Error de conexión.', 'error'); }
        finally {
            solveBtn.disabled = false;
            solveBtn.querySelector('.btn-content').innerHTML = '<i data-lucide="zap"></i> Ejecutar Optimización A*';
            lucide.createIcons();
        }
    });

    function renderResults(data) {
        assignmentsList.innerHTML = '';
        resultsSection.classList.remove('hidden');
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        data.assignments.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'assignment-item';
            div.style.animationDelay = `${index * 0.1}s`;
            div.innerHTML = `
                <div class="item-info">
                    <span class="item-wheel">${item.wheel}</span>
                    <span class="item-company">${item.company}</span>
                </div>
                <div class="item-price">$${item.price}</div>
            `;
            assignmentsList.appendChild(div);
        });
        totalCostSpan.innerText = `$${data.total_cost}`;
        nodesExploredSpan.innerText = data.stats.nodes_explored;
        timeTakenSpan.innerText = data.stats.time_taken;
    }
});

const style = document.createElement('style');
style.innerHTML = `.spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;
document.head.appendChild(style);
