// Importar módulos necessários
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

// Definir o esquema do Mongoose para uma reserva
const reservationSchema = new mongoose.Schema({
    nome_hospede: String,
    telefone: String,
    cpf: String,
    email: String,
    cep: String,
    cidade: String,
    endereco: String,
    numero_quarto: String,
    data_checkin: String,  // Armazenar como String para manter o formato "dd/mm/yyyy"
    data_checkout: String,  // Armazenar como String para manter o formato "dd/mm/yyyy"
    cafe_da_manha: Boolean,
    estacionamento: Boolean,
    entradaCar: String,  // Armazenar como String para manter o formato "dd/mm/yyyy"
    saidaCar: String,  // Armazenar como String para manter o formato "dd/mm/yyyy"
    valorReserva: String
});

// Função utilitária para formatar datas
function formatDate(date) {
    if (!date) return null;
    const d = new Date(date);
    const day = (`0${d.getDate()}`).slice(-2);
    const month = (`0${d.getMonth() + 1}`).slice(-2);
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

// Criar o modelo de reserva
const Reservation = mongoose.model('Reservation', reservationSchema);

// Função para criar uma nova reserva
exports.createReservation = async (req, res) => {
    try {
        // Formatar as datas
        req.body.data_checkin = formatDate(req.body.data_checkin);
        req.body.data_checkout = formatDate(req.body.data_checkout);
        if (req.body.entradaCar) {
            req.body.entradaCar = formatDate(req.body.entradaCar);
        }
        if (req.body.saidaCar) {
            req.body.saidaCar = formatDate(req.body.saidaCar);
        }

        // Criar uma nova reserva com os dados do corpo da requisição
        const reservation = new Reservation(req.body);
        await reservation.save();
        res.status(201).json(reservation);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Função para obter reservas com filtros
exports.getReservations = async (req, res) => {
    try {
        const { nome, mes } = req.query;
        let query = {};

        if (nome) {
            query.nome_hospede = new RegExp(nome, 'i');
        }

        if (mes) {
            const [ano, mesNum] = mes.split('-');
            query.data_checkin = {
                $gte: new Date(`${ano}-${mesNum}-01T00:00:00Z`),
                $lt: new Date(`${ano}-${Number(mesNum) + 1}-01T00:00:00Z`)
            };
        }

        const reservations = await Reservation.find(query);
        res.json(reservations);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Função para obter uma reserva específica pelo ID
exports.getReservationById = async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            return res.status(404).json({ error: 'Reserva não encontrada' });
        }
        res.json(reservation);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Função para deletar uma reserva específica pelo ID
exports.deleteReservation = async (req, res) => {
    try {
        const reservation = await Reservation.findByIdAndDelete(req.params.id);
        if (!reservation) {
            return res.status(404).json({ error: 'Reserva não encontrada' });
        }
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Função para gerar e baixar o voucher em PDF
exports.downloadVoucherPDF = async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            return res.status(404).json({ error: 'Reserva não encontrada' });
        }

        // Criar um novo documento PDF
        const doc = new PDFDocument();
        const fileName = `voucher-${reservation.id}.pdf`;
        
        // Definir o cabeçalho para download
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        res.setHeader('Content-Type', 'application/pdf');

        // Adicionar conteúdo ao PDF
        doc.fontSize(25).text('Voucher de Reserva', { align: 'center' });
        doc.moveDown();
        doc.fontSize(16).text(`Nome do Hóspede: ${reservation.nome_hospede}`);
        doc.text(`Telefone: ${reservation.telefone}`);
        doc.text(`Número do Quarto: ${reservation.numero_quarto}`);
        doc.text(`Data de Check-in: ${reservation.data_checkin.toDateString()}`);
        doc.text(`Data de Check-out: ${reservation.data_checkout.toDateString()}`);
        doc.text(`Café da Manhã: ${reservation.cafe_da_manha ? 'Sim' : 'Não'}`);

        // Finalizar e enviar o PDF
        doc.pipe(res);
        doc.end();
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Função para exportar dados para SVG
exports.exportToSVG = async (req, res) => {
    try {
        // Buscar todas as reservas do banco de dados
        const reservations = await Reservation.find();
        
        // Iniciar o conteúdo SVG
        let svgContent = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">';
        let y = 20; // Posição inicial para o texto

        // Adicionar um título
        svgContent += '<text x="10" y="20" font-family="Arial" font-size="20">Reservas:</text>';
        y += 30; // Espaço para o título

        // Adicionar cada reserva ao SVG
        reservations.forEach(reservation => {
            svgContent += `<text x="10" y="${y}" font-family="Arial" font-size="14">Nome: ${reservation.nome_hospede}</text>`;
            svgContent += `<text x="10" y="${y + 20}" font-family="Arial" font-size="14">Telefone: ${reservation.telefone}</text>`;
            svgContent += `<text x="10" y="${y + 40}" font-family="Arial" font-size="14">Quarto: ${reservation.numero_quarto}</text>`;
            svgContent += `<text x="10" y="${y + 60}" font-family="Arial" font-size="14">Check-in: ${reservation.data_checkin.toDateString()}</text>`;
            svgContent += `<text x="10" y="${y + 80}" font-family="Arial" font-size="14">Check-out: ${reservation.data_checkout.toDateString()}</text>`;
            svgContent += `<text x="10" y="${y + 100}" font-family="Arial" font-size="14">Café da manhã: ${reservation.cafe_da_manha ? 'Sim' : 'Não'}</text>`;
            
            y += 120; // Espaço entre reservas
        });

        // Fechar a tag SVG
        svgContent += '</svg>';

        // Definir o cabeçalho para download
        res.setHeader('Content-Disposition', 'attachment; filename=reservas.svg');
        res.setHeader('Content-Type', 'image/svg+xml');

        // Enviar o conteúdo SVG
        res.send(svgContent);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};


// Função para exportar dados para Excel
const XLSX = require('xlsx');

// Função para exportar dados para Excel
exports.exportToExcel = async (req, res) => {
    try {
        // Buscar todas as reservas do banco de dados
        const reservations = await Reservation.find();
        
        // Criar uma nova planilha
        const ws = XLSX.utils.json_to_sheet(reservations.map(reservation => ({
            'Nome do Hóspede': reservation.nome_hospede,
            'Telefone': reservation.telefone,
            'Número do Quarto': reservation.numero_quarto,
            'Data de Check-in': reservation.data_checkin.toDateString(),
            'Data de Check-out': reservation.data_checkout.toDateString(),
            'Café da Manhã': reservation.cafe_da_manha ? 'Sim' : 'Não'
        })));
        
        // Criar um novo livro de trabalho
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Reservas');

        // Definir o cabeçalho para download
        res.setHeader('Content-Disposition', 'attachment; filename=reservas.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        // Enviar o conteúdo do Excel
        const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
        res.send(buffer);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
