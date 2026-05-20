document.addEventListener('DOMContentLoaded', () => {
    const solveBtn = document.getElementById('solve-btn');
    const resultsSection = document.getElementById('results-section');
    const assignmentsList = document.getElementById('assignments-list');
    const totalCostSpan = document.getElementById('total-cost');
    const nodesExploredSpan = document.getElementById('nodes-explored');
    const timeTakenSpan = document.getElementById('time-taken');

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
            } else {
                alert('Error al ejecutar el algoritmo.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error de conexión con el servidor.');
        } finally {
            solveBtn.disabled = false;
            solveBtn.querySelector('.btn-content').innerHTML = `
                <i data-lucide="zap"></i>
                Ejecutar Optimización A*
            `;
            lucide.createIcons();
        }
    });

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
