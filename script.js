// Variable global para el gráfico
let myChart = null;

// Inicialización segura
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('simulationForm');
    if(form){
        form.addEventListener('submit', function(event) {
            event.preventDefault(); 
            runSimulation();
        });
    }
});

function runSimulation() {
    // 1. OBTENER VALORES Y MULTIPLICADORES
    // Multiplicamos el número (Input) por el factor de unidad (Select)
    
    // Resistencia
    const valR = parseFloat(document.getElementById('inputR').value) || 0;
    const multR = parseFloat(document.getElementById('unitR').value) || 1;
    const R = valR * multR; 

    // Capacitancia
    const valC = parseFloat(document.getElementById('inputC').value) || 0;
    const multC = parseFloat(document.getElementById('unitC').value) || 1;
    const C = valC * multC; 

    // Voltaje
    const valV = parseFloat(document.getElementById('inputV').value) || 0;
    const multV = parseFloat(document.getElementById('unitV').value) || 1;
    const Vs = valV * multV; 

    // Tiempo
    const valT = parseFloat(document.getElementById('inputT').value) || 0;
    const multT = parseFloat(document.getElementById('unitT').value) || 1;
    const T_total = valT * multT; 

    // 2. CÁLCULOS
    const tau = R * C; 

    // Actualizar tarjetas (Dashboard)
    document.getElementById('displayTau').textContent = formatEngineering(tau) + "s";
    document.getElementById('displayVmax').textContent = formatEngineering(Vs) + "V";
    document.getElementById('displayStatus').textContent = "Calculado";

    // 3. GENERAR DATOS
    const steps = 100;
    const timeStep = T_total / steps;
    const labels = [];
    const dataCharge = [];
    const dataDischarge = [];
    const tableBody = document.getElementById('dataTableBody');
    tableBody.innerHTML = ''; 

    for (let i = 0; i <= steps; i++) {
        const t = i * timeStep;
        
        // Ecuaciones Analíticas
        const v_charge = Vs * (1 - Math.exp(-t / tau));
        const v_discharge = Vs * Math.exp(-t / tau);

        // Guardar datos
        labels.push(t.toPrecision(3)); 
        dataCharge.push(v_charge);
        dataDischarge.push(v_discharge);

        // Llenar Tabla (Muestreo cada 10 pasos)
        if (i % 10 === 0 || i === steps) {
            const percent = (v_charge / Vs) * 100;
            const percentDisplay = isNaN(percent) ? "0.0" : percent.toFixed(1);
            
            const row = `
                <tr class="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition">
                    <td class="px-4 py-2 font-mono text-xs">${formatEngineering(t)}s</td>
                    <td class="px-4 py-2 font-medium text-blue-600">${formatEngineering(v_charge)}V</td>
                    <td class="px-4 py-2 text-red-500">${formatEngineering(v_discharge)}V</td>
                    <td class="px-4 py-2 text-slate-500">${percentDisplay}%</td>
                </tr>
            `;
            tableBody.innerHTML += row;
        }
    }

    renderChart(labels, dataCharge, dataDischarge, Vs);
}

// Función auxiliar: Formato Ingeniería (ej: 0.001 -> 1m)
function formatEngineering(num) {
    if (num === 0) return "0";
    if (Math.abs(num) >= 1000) return (num/1000).toFixed(2) + "k";
    if (Math.abs(num) < 0.001 && Math.abs(num) > 0) return (num*1000000).toFixed(2) + "μ";
    if (Math.abs(num) < 1 && Math.abs(num) > 0) return (num*1000).toFixed(2) + "m";
    return num.toFixed(2);
}

// Renderizado del Gráfico
function renderChart(labels, dataCharge, dataDischarge, Vs) {
    const ctx = document.getElementById('rcChart').getContext('2d');
    if (myChart) myChart.destroy();

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
                    callbacks: { label: function(context) { return context.dataset.label + ': ' + parseFloat(context.parsed.y).toFixed(3) + ' V'; } }
                }
            },
            scales: {
                x: { grid: { display: false }, title: { display: true, text: 'Tiempo (s)' }, ticks: { maxTicksLimit: 10 } },
                y: { border: { dash: [4, 4] }, grid: { color: '#e2e8f0' }, title: { display: true, text: 'Voltaje (V)' } }
            }
        }
    });
}

// --- LÓGICA DEL MODAL (VENTANA EMERGENTE) ---
function toggleModal() {
    const modal = document.getElementById('mathModal');
    if (!modal) return; 

    if (modal.classList.contains('hidden')) {
        updateMathModal();
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    } else {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}
// Hacer la función global para que el HTML la vea
window.toggleModal = toggleModal;

function updateMathModal() {
    // Recalcular valores para la memoria
    const valR = parseFloat(document.getElementById('inputR').value) || 0;
    const multR = parseFloat(document.getElementById('unitR').value) || 1;
    const R = valR * multR;

    const valC = parseFloat(document.getElementById('inputC').value) || 0;
    const multC = parseFloat(document.getElementById('unitC').value) || 1;
    const C = valC * multC;

    const valV = parseFloat(document.getElementById('inputV').value) || 0;
    const multV = parseFloat(document.getElementById('unitV').value) || 1;
    const Vs = valV * multV;

    const tau = R * C;
    
    // Formateo para mostrar en las fórmulas
    const displayR = R >= 1000 ? (R/1000) + "k" : R;
    const displayC = C.toExponential(2); 
    const displayTau = tau.toFixed(4);

    document.getElementById('mathVs').textContent = Vs;
    document.getElementById('mathVs2').textContent = Vs;
    document.getElementById('mathTau').textContent = displayTau;
    document.getElementById('mathTau2').textContent = displayTau;
    document.getElementById('mathR').textContent = displayR;
    document.getElementById('mathC').textContent = displayC; 
    document.getElementById('mathTauResult').textContent = displayTau;
}