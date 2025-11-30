// Variable global para almacenar la instancia del gráfico
let myChart = null;

// Escuchar el evento submit del formulario cuando cargue la página
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('simulationForm');
    form.addEventListener('submit', function(event) {
        event.preventDefault(); // Evitar que la página se recargue
        runSimulation();
    });
});

function runSimulation() {
    // 1. Obtener valores del DOM
    const R = parseFloat(document.getElementById('inputR').value);
    const C_micro = parseFloat(document.getElementById('inputC').value);
    const Vs = parseFloat(document.getElementById('inputV').value);
    const T_total = parseFloat(document.getElementById('inputT').value);

    // 2. Conversiones y cálculos básicos
    // Convertir microfaradios a Faradios
    const C = C_micro * 1e-6; 
    const tau = R * C; // Tau = R * C

    // Actualizar tarjetas del dashboard
    document.getElementById('displayTau').textContent = tau.toFixed(4) + " s";
    document.getElementById('displayVmax').textContent = Vs.toFixed(2) + " V";
    document.getElementById('displayStatus').textContent = "Calculado";

    // 3. Generar puntos de datos para el gráfico
    const steps = 50; // Cantidad de puntos en la gráfica
    const timeStep = T_total / steps;
    
    const labels = [];
    const dataCharge = [];
    const dataDischarge = [];

    const tableBody = document.getElementById('dataTableBody');
    tableBody.innerHTML = ''; // Limpiar tabla anterior

    for (let i = 0; i <= steps; i++) {
        const t = i * timeStep;
        
        // --- ECUACIONES ---
        // Carga: V(t) = Vs * (1 - e^(-t/RC))
        const v_charge = Vs * (1 - Math.exp(-t / tau));
        
        // Descarga: V(t) = Vs * e^(-t/RC)
        const v_discharge = Vs * Math.exp(-t / tau);

        // Guardar para el gráfico
        labels.push(t.toFixed(2));
        dataCharge.push(v_charge);
        dataDischarge.push(v_discharge);

        // Llenar tabla (mostrando cada 5 iteraciones para no saturar)
        if (i % 5 === 0 || i === steps) {
            const percent = (v_charge / Vs) * 100;
            const row = `
                <tr class="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition">
                    <td class="px-4 py-2">${t.toFixed(3)}</td>
                    <td class="px-4 py-2 font-medium text-blue-600">${v_charge.toFixed(3)}</td>
                    <td class="px-4 py-2 text-red-500">${v_discharge.toFixed(3)}</td>
                    <td class="px-4 py-2 text-slate-500">${percent.toFixed(1)}%</td>
                </tr>
            `;
            tableBody.innerHTML += row;
        }
    }

    // 4. Renderizar Gráfico con Chart.js
    renderChart(labels, dataCharge, dataDischarge, Vs);
}

function renderChart(labels, dataCharge, dataDischarge, Vs) {
    const ctx = document.getElementById('rcChart').getContext('2d');
    
    if (myChart) {
        myChart.destroy();
    }

    let gradientCharge = ctx.createLinearGradient(0, 0, 0, 400);
    gradientCharge.addColorStop(0, 'rgba(60, 80, 224, 0.5)'); 
    gradientCharge.addColorStop(1, 'rgba(60, 80, 224, 0.0)');

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Carga (V)',
                    data: dataCharge,
                    borderColor: '#3C50E0', 
                    backgroundColor: gradientCharge,
                    borderWidth: 3,
                    pointRadius: 0,
                    fill: true,
                    tension: 0.4 
                },
                {
                    label: 'Descarga (V)',
                    data: dataDischarge,
                    borderColor: '#FF5733', 
                    borderWidth: 2,
                    borderDash: [5, 5], 
                    pointRadius: 0,
                    fill: false,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 10 } },
                tooltip: {
                    backgroundColor: '#1A222C', titleColor: '#fff', bodyColor: '#fff',
                    callbacks: { label: function(context) { return context.dataset.label + ': ' + context.parsed.y.toFixed(3) + ' V'; } }
                }
            },
            scales: {
                x: { grid: { display: false }, title: { display: true, text: 'Tiempo (t) en segundos' } },
                y: { border: { dash: [4, 4] }, grid: { color: '#e2e8f0' }, title: { display: true, text: 'Voltaje (V)' }, suggestedMax: Vs * 1.1 }
            }
        }
    });
}

// --- LÓGICA DE LA VENTANA MODAL DE MEMORIA ---
function toggleModal() {
    const modal = document.getElementById('mathModal');
    
    if (modal.classList.contains('hidden')) {
        updateMathModal();
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    } else {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function updateMathModal() {
    const R = document.getElementById('inputR').value || 0;
    const C_micro = document.getElementById('inputC').value || 0;
    const Vs = document.getElementById('inputV').value || 0;
    
    const C = parseFloat(C_micro) * 1e-6;
    let tau = 0;
    if(R && C) {
         tau = (parseFloat(R) * C).toFixed(4);
    }

    // Insertar valores en el HTML
    document.getElementById('mathVs').textContent = Vs;
    document.getElementById('mathVs2').textContent = Vs;
    document.getElementById('mathTau').textContent = tau;
    document.getElementById('mathTau2').textContent = tau;
    document.getElementById('mathR').textContent = R;
    document.getElementById('mathC').textContent = parseFloat(C_micro).toExponential(2) + "μ"; 
    document.getElementById('mathTauResult').textContent = tau;
}