// Variable global para el gráfico de Chart.js
let myChart = null;

// --- INICIALIZACIÓN Y EVENTOS ---
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Configurar Simulación
    const form = document.getElementById('simulationForm');
    if(form){
        form.addEventListener('submit', function(event) {
            event.preventDefault(); 
            runSimulation();
        });
    }

    // 2. Lógica del Diagrama SVG (Actualización en tiempo real)
    const inputs = document.querySelectorAll('#inputR, #unitR, #inputC, #unitC, #inputV, #unitV');
    inputs.forEach(input => {
        input.addEventListener('input', updateSchematic);
        input.addEventListener('change', updateSchematic);
    });
    // Llamada inicial para que no aparezca en "0"
    updateSchematic(); 

    // 3. Abrir Modal de Introducción automáticamente
    setTimeout(() => {
        const introModal = document.getElementById('introModal');
        if(introModal) {
            introModal.classList.remove('hidden');
            introModal.classList.add('flex');
        }
    }, 600); // Pequeño retraso para una entrada suave
});


// --- LÓGICA DE SIMULACIÓN Y CÁLCULO ---
function runSimulation() {
    // A. Obtener Valores Normalizados
    const valR = parseFloat(document.getElementById('inputR').value) || 0;
    const multR = parseFloat(document.getElementById('unitR').value) || 1;
    const R = valR * multR; 

    const valC = parseFloat(document.getElementById('inputC').value) || 0;
    const multC = parseFloat(document.getElementById('unitC').value) || 1;
    const C = valC * multC; 

    const valV = parseFloat(document.getElementById('inputV').value) || 0;
    const multV = parseFloat(document.getElementById('unitV').value) || 1;
    const Vs = valV * multV; 

    const valT = parseFloat(document.getElementById('inputT').value) || 0;
    const multT = parseFloat(document.getElementById('unitT').value) || 1;
    const T_total = valT * multT; 

    // B. Cálculo de Tau
    const tau = R * C; 

    // C. Actualizar Dashboard
    document.getElementById('displayTau').textContent = formatEngineering(tau) + "s";
    document.getElementById('displayVmax').textContent = formatEngineering(Vs) + "V";
    document.getElementById('displayStatus').textContent = "Calculado";

    // D. Generar Datos para Gráfico y Tabla
    const steps = 100;
    const timeStep = T_total / steps;
    const labels = [];
    const dataCharge = [];
    const dataDischarge = [];
    const tableBody = document.getElementById('dataTableBody');
    tableBody.innerHTML = ''; 

    for (let i = 0; i <= steps; i++) {
        const t = i * timeStep;
        
        // Fórmulas EDO
        const v_charge = Vs * (1 - Math.exp(-t / tau));
        const v_discharge = Vs * Math.exp(-t / tau);

        labels.push(t.toPrecision(3)); 
        dataCharge.push(v_charge);
        dataDischarge.push(v_discharge);

        // Llenar tabla (muestreo reducido cada 10 pasos)
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

// --- ACTUALIZAR TEXTOS DEL SVG ---
function updateSchematic() {
    const valR = document.getElementById('inputR').value || '0';
    const txtUnitR = document.getElementById('unitR').options[document.getElementById('unitR').selectedIndex].text;
    
    const valC = document.getElementById('inputC').value || '0';
    const txtUnitC = document.getElementById('unitC').options[document.getElementById('unitC').selectedIndex].text;

    const valV = document.getElementById('inputV').value || '0';
    const txtUnitV = document.getElementById('unitV').options[document.getElementById('unitV').selectedIndex].text;

    document.getElementById('schematicR').textContent = `${valR} ${txtUnitR}`;
    document.getElementById('schematicC').textContent = `${valC} ${txtUnitC}`;
    document.getElementById('schematicV').textContent = `${valV} ${txtUnitV}`;
}

// --- UTILIDADES DE FORMATO ---
function formatEngineering(num) {
    if (num === 0) return "0";
    if (Math.abs(num) >= 1000) return (num/1000).toFixed(2) + "k";
    if (Math.abs(num) < 0.001 && Math.abs(num) > 0) return (num*1000000).toFixed(2) + "μ";
    if (Math.abs(num) < 1 && Math.abs(num) > 0) return (num*1000).toFixed(2) + "m";
    return num.toFixed(2);
}

// --- RENDERIZADO DEL GRÁFICO ---
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

// --- GESTIÓN DE MODALES ---

// Modal Introducción
function closeIntro() {
    const introModal = document.getElementById('introModal');
    if(introModal) {
        introModal.style.opacity = '0';
        setTimeout(() => {
            introModal.classList.add('hidden');
            introModal.classList.remove('flex');
            introModal.style.opacity = '1';
        }, 300);
    }
}
window.closeIntro = closeIntro;

// Modal Memoria de Cálculo
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
window.toggleModal = toggleModal;

// Actualizar valores en la memoria de cálculo
function updateMathModal() {
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
    
    const displayR = R >= 1000 ? (R/1000) + "k" : R;
    const displayC = C.toExponential(2); 
    const displayTau = tau.toFixed(4);

    document.getElementById('mathVs').textContent = Vs;
    document.getElementById('mathVs2').textContent = Vs;
    document.getElementById('mathTau').textContent = displayTau;
    document.getElementById('mathTau2').textContent = displayTau;
}