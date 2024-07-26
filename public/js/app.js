document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('reservation-form');
    const reservationsTable = document.getElementById('reservations-table').getElementsByTagName('tbody')[0];
    const filterNameInput = document.getElementById('filter-name');
    const filterMonthInput = document.getElementById('filter-month');
    const filterButton = document.getElementById('filter-button');
    const exportExcelButton = document.getElementById('export-excel');
    const exportSvgButton = document.getElementById('export-svg');
    const exportPdfButton = document.getElementById('export-pdf');

    // Adicionar reserva
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const data = {
            nome_hospede: formData.get('nome'),
            telefone: formData.get('telefone'),
            numero_quarto: formData.get('quarto'),
            data_checkin: formData.get('checkin'),
            data_checkout: formData.get('checkout'),
            cafe_da_manha: formData.get('cafe') === 'sim'
        };

        try {
            await fetch('/api/reservas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            form.reset();
            loadReservations();
        } catch (error) {
            console.error('Erro ao adicionar reserva:', error);
        }
    });

    // Carregar reservas com filtros
    async function loadReservations(name = '', month = '') {
        try {
            let url = '/api/reservas';
            const params = new URLSearchParams();
            if (name) params.append('nome', name);
            if (month) params.append('mes', month);
            if (params.toString()) url += `?${params.toString()}`;

            const response = await fetch(url);
            const reservations = await response.json();
            reservationsTable.innerHTML = '';
            reservations.forEach(reservation => {
                const row = reservationsTable.insertRow();
                row.insertCell(0).textContent = reservation.nome_hospede;
                row.insertCell(1).textContent = reservation.telefone;
                row.insertCell(2).textContent = reservation.numero_quarto;
                row.insertCell(3).textContent = new Date(reservation.data_checkin).toLocaleDateString();
                row.insertCell(4).textContent = new Date(reservation.data_checkout).toLocaleDateString();
                row.insertCell(5).textContent = reservation.cafe_da_manha ? 'Sim' : 'Não';
                const actionsCell = row.insertCell(6);
                actionsCell.innerHTML = `<button onclick="downloadPDF('${reservation._id}')">PDF</button>`;
            });
        } catch (error) {
            console.error('Erro ao carregar reservas:', error);
        }
    }

    // Baixar PDF
    window.downloadPDF = async (id) => {
        try {
            const response = await fetch(`/api/reservas/${id}/pdf`);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `voucher-${id}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (error) {
            console.error('Erro ao baixar PDF:', error);
        }
    };

    // Exportar para Excel
    exportExcelButton.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/export/excel');
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'reservas.xlsx';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (error) {
            console.error('Erro ao exportar para Excel:', error);
        }
    });

    // Exportar para SVG
    exportSvgButton.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/export/svg');
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'reservas.svg';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (error) {
            console.error('Erro ao exportar para SVG:', error);
        }
    });

    // Filtrar reservas
    filterButton.addEventListener('click', () => {
        const name = filterNameInput.value.trim();
        const month = filterMonthInput.value.trim();
        if (name || month) {
            loadReservations(name, month);
        } else {
            reservationsTable.innerHTML = ''; // Limpar a tabela se nenhum filtro for aplicado
        }
    });

    // Carregar reservas ao iniciar a página
    loadReservations();
});
