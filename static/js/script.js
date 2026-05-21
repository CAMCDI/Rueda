document.addEventListener('DOMContentLoaded', () => {
    // Original A* elements
    const solveBtn = document.getElementById('solve-btn');
    const resultsSection = document.getElementById('results-section');
    const assignmentsList = document.getElementById('assignments-list');
    const totalCostSpan = document.getElementById('total-cost');
    const nodesExploredSpan = document.getElementById('nodes-explored');
    const timeTakenSpan = document.getElementById('time-taken');

    // Dynamic editing elements
    const modifyBtn = document.getElementById('modify-btn');
    const editActions = document.getElementById('edit-actions');
    const saveBtn = document.getElementById('save-btn');
    const clearBtn = document.getElementById('clear-btn');
    const resetBtn = document.getElementById('reset-btn');
    const cancelBtn = document.getElementById('cancel-btn');

    const viewModes = document.querySelectorAll('.view-mode');
    const editModeInputs = document.querySelectorAll('.edit-mode-input');

    // --- TOAST NOTIFICATIONS ---
    function showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let icon = 'info';
        if (type === 'success') icon = 'check-circle';
        if (type === 'error') icon = 'alert-triangle';
        if (type === 'warning') icon = 'help-circle';

        toast.innerHTML = `
            <i data-lucide="${icon}"></i>
            <span>${message}</span>
        `;
        container.appendChild(toast);
        lucide.createIcons();

        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);

        // Remove toast
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 3500);
    }

    // --- TOGGLE EDIT MODE ---
    function toggleEditMode(editing) {
        if (editing) {
            modifyBtn.classList.add('hidden');
            editActions.classList.remove('hidden');
            viewModes.forEach(span => span.classList.add('hidden'));
            editModeInputs.forEach(input => input.classList.remove('hidden'));
        } else {
            modifyBtn.classList.remove('hidden');
            editActions.classList.add('hidden');
            viewModes.forEach(span => span.classList.remove('hidden'));
            editModeInputs.forEach(input => input.classList.add('hidden'));
        }
    }

    // Modify Button
    modifyBtn.addEventListener('click', () => {
        toggleEditMode(true);
        showToast('Modo edición activado. Puedes editar celdas y nombres.', 'info');
    });

    // Cancel Button
    cancelBtn.addEventListener('click', () => {
        // Restore inputs from existing static texts
        editModeInputs.forEach(input => {
            const span = input.previousElementSibling;
            if (span) {
                input.value = span.textContent.trim();
            }
        });
        toggleEditMode(false);
        showToast('Modificaciones canceladas.', 'info');
    });

    // Clear Button (Limpiar)
    clearBtn.addEventListener('click', () => {
        editModeInputs.forEach(input => {
            input.value = '';
        });
        showToast('Matriz vaciada. Ingresa nuevos datos.', 'warning');
    });

    // Reset Button (Restablecer)
    resetBtn.addEventListener('click', async () => {
        if (!confirm('¿Estás seguro de que deseas restablecer los datos a los valores originales?')) {
            return;
        }

        resetBtn.disabled = true;
        resetBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Restableciendo...';
        lucide.createIcons();

        try {
            const response = await fetch('/api/reset', {
                method: 'POST'
            });

            if (response.ok) {
                // Fetch the default data to populate UI
                const dataRes = await fetch('/api/data');
                const defaultData = await dataRes.json();

                // Update inputs and view spans
                const wheelInputs = document.querySelectorAll('.wheel-input');
                defaultData.wheel_types.forEach((wt, idx) => {
                    wheelInputs[idx].value = wt;
                    wheelInputs[idx].previousElementSibling.textContent = wt;
                });

                const companyInputs = document.querySelectorAll('.company-input');
                defaultData.companies.forEach((c, idx) => {
                    companyInputs[idx].value = c;
                    companyInputs[idx].previousElementSibling.textContent = c;
                });

                const rows = document.querySelectorAll('tbody tr');
                rows.forEach((row, i) => {
                    const costInputs = row.querySelectorAll('.cost-input');
                    costInputs.forEach((input, j) => {
                        input.value = defaultData.costs[i][j];
                        input.previousElementSibling.textContent = defaultData.costs[i][j];
                    });
                });

                toggleEditMode(false);
                showToast('Datos restablecidos a los valores por defecto.', 'success');
                resultsSection.classList.add('hidden'); // Hide outdated optimization results
            } else {
                showToast('Error al restablecer los datos.', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Error de conexión con el servidor.', 'error');
        } finally {
            resetBtn.disabled = false;
            resetBtn.innerHTML = '<i data-lucide="rotate-ccw"></i> Restablecer';
            lucide.createIcons();
        }
    });

    // Save Button (Guardar)
    saveBtn.addEventListener('click', async () => {
        // Collect and trim wheel types
        const wheelInputs = document.querySelectorAll('.wheel-input');
        const wheel_types = Array.from(wheelInputs).map(input => input.value.trim());

        // Collect and trim company names
        const companyInputs = document.querySelectorAll('.company-input');
        const companies = Array.from(companyInputs).map(input => input.value.trim());

        // Validate text values
        if (wheel_types.some(v => v === '') || companies.some(v => v === '')) {
            showToast('Los nombres de empresas o tipos de ruedas no pueden estar vacíos.', 'error');
            return;
        }

        // Collect and validate costs grid
        const costs = [];
        const rows = document.querySelectorAll('tbody tr');
        let hasError = false;

        rows.forEach((row, i) => {
            const rowCosts = [];
            const costInputs = row.querySelectorAll('.cost-input');
            costInputs.forEach((input, j) => {
                const val = parseFloat(input.value);
                if (isNaN(val) || val < 0) {
                    hasError = true;
                }
                rowCosts.push(isNaN(val) ? 0 : val);
            });
            costs.push(rowCosts);
        });

        if (hasError) {
            showToast('Todos los costos deben ser números válidos y no negativos.', 'error');
            return;
        }

        // Save process loading state
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Guardando...';
        lucide.createIcons();

        try {
            const response = await fetch('/api/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    companies,
                    wheel_types,
                    costs
                })
            });

            if (response.ok) {
                // Update text content of static views from input values
                editModeInputs.forEach(input => {
                    const span = input.previousElementSibling;
                    if (span) {
                        span.textContent = input.value;
                    }
                });

                toggleEditMode(false);
                showToast('¡Matriz de costos guardada exitosamente!', 'success');
                resultsSection.classList.add('hidden'); // Hide outdated optimization results
            } else {
                showToast('Error al guardar datos en el servidor.', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Error de conexión con el servidor.', 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i data-lucide="save"></i> Guardar';
            lucide.createIcons();
        }
    });

    // --- SOLVE OPTIMIZATION A* ---
    solveBtn.addEventListener('click', async () => {
        // Show loading state
        solveBtn.disabled = true;
        solveBtn.querySelector('.btn-content').innerHTML = `
            <i data-lucide="loader-2" class="spin"></i>
            Procesando A*...
        `;
        lucide.createIcons();

        try {
            const response = await fetch('/solve', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                renderResults(data);
                showToast('Asignación óptima A* completada.', 'success');
            } else {
                showToast('Error al ejecutar el algoritmo.', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Error de conexión con el servidor.', 'error');
        } finally {
            solveBtn.disabled = false;
            solveBtn.querySelector('.btn-content').innerHTML = `
                <i data-lucide="zap"></i>
                Ejecutar Optimización A*
            `;
            lucide.createIcons();
        }
    });

    // --- RENDER RESULTS ---
    function renderResults(data) {
        // Clear previous results
        assignmentsList.innerHTML = '';

        // Inhibit hidden and scroll to results
        resultsSection.classList.remove('hidden');
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Populate assignments with staggered animation
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

        // Update total and stats
        totalCostSpan.innerText = `$${data.total_cost}`;
        nodesExploredSpan.innerText = data.stats.nodes_explored;
        timeTakenSpan.innerText = data.stats.time_taken;
    }
});

// Add spin animation to loader icon
const style = document.createElement('style');
style.innerHTML = `
    .spin {
        animation: spin 1s linear infinite;
    }
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);
