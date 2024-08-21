document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('reservation-form');
    const reservationsTable = document.getElementById('reservations-table').getElementsByTagName('tbody')[0];
    const filterNameInput = document.getElementById('filter-name');
    const filterMonthInput = document.getElementById('filter-month');
    const filterButton = document.getElementById('filter-button');
    const exportExcelButton = document.getElementById('export-excel');
    const exportSvgButton = document.getElementById('export-svg');

    // Função para adicionar uma nova reserva
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const estacionamento = formData.get('estacionamento') === 'sim';
        const data = {
            nome_hospede: formData.get('nome'),
            telefone: formData.get('telefone'),
            cpf: formData.get('CPF'),
            email: formData.get('email'),
            cep: formData.get('CEP'),
            cidade: formData.get('cidade'),
            bairro: formData.get('bairro'),
            endereco: formData.get('endereço'),
            uf: formData.get('uf'),
            numero_quarto: formData.get('quarto'),
            data_checkin: formatDate(formData.get('checkin')),  
            data_checkout: formatDate(formData.get('checkout')),  
            cafe_da_manha: formData.get('cafe') === 'sim',
            estacionamento: estacionamento,
            entradaCar: estacionamento ? formatDate(formData.get('entradaCar')) : null,  
            saidaCar: estacionamento ? formatDate(formData.get('saidaCar')) : null, 
            valorReserva: formData.get('valor-reserva')
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

    function formatDate(date) {
        const d = new Date(date);
        const day = (`0${d.getDate()}`).slice(-2);
        const month = (`0${d.getMonth() + 1}`).slice(-2);
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    }

    // Função para carregar reservas com filtros
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
                row.insertCell(3).textContent = reservation.data_checkin;
                row.insertCell(4).textContent = reservation.data_checkout;
                row.insertCell(5).textContent = reservation.estacionamento ? 'Sim' : 'Não';
                row.insertCell(6).textContent = reservation.valorReserva;
                const actionsCell = row.insertCell(7);
                actionsCell.innerHTML =
                    `<button onclick="downloadPDF('${reservation._id}')">PDF</button>
            <button onclick="deleteReservation('${reservation._id}')">Deletar</button>
            `;
            });
        } catch (error) {
            console.error('Erro ao carregar reservas:', error);
        }
    }

    //Função para deletar Reservas
    window.deleteReservation = async (id) => {
        if (confirm("Você tem certeza que deseja deletar esta reserva?")) {
            try {
                const response = await fetch(`/api/reservas/${id}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    alert('Reserva deletada com sucesso!');
                    loadReservations(); // Recarrega a tabela de reservas
                } else {
                    const errorData = await response.json();
                    alert('Erro ao deletar reserva: ' + errorData.error);
                }
            } catch (error) {
                console.error('Erro ao deletar reserva:', error);
            }
        }
    };

    //Função para puxar endereço da API
    document.getElementById('CEP').addEventListener('focusout', pesquisaCEP)
    async function pesquisaCEP() {
        var cep = document.getElementById('CEP').value.trim();
        if (cep.length === 8) {
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
                if (response.ok) {
                    const data = await response.json();
                    document.getElementById('cidade').value = data.localidade;
                    document.getElementById('endereço').value = data.logradouro;
                    document.getElementById('bairro').value = data.bairro;
                    document.getElementById('uf').value = data.uf;
                } else {
                    throw new Error("Cep não encontrado")
                }
            } catch (error) {
                console.error("Erro ao buscar CEP: ", error)
            }
        } else {
            console.error('CEP Inválido')
        }
    }

    // Função para baixar o PDF do voucher
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

    // Função para exportar dados para Excel
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

    // Função para exportar dados para SVG
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

    // Função para filtrar reservas
    filterButton.addEventListener('click', () => {
        const name = filterNameInput.value.trim();
        const month = filterMonthInput.value.trim();
        loadReservations(name, month);
    });
    //Não está funcionando
    // Carregar reservas ao iniciar a página com filtro do mês atual
    const today = new Date();
    const currentMonth = today.toISOString().slice(0, 7); // Formato YYYY-MM
    loadReservations('', currentMonth);
});

//dropdow do estacionamento
function checkinCar() {
    const estacionamento = document.getElementById("estacionamento").value;
    const displayEstacionamento = document.querySelector('.estacionamentoDisplay');

    if (estacionamento == "sim") {
        displayEstacionamento.style.display = 'inline-block';
    } else {
        displayEstacionamento.style.display = 'none'
    }
}

