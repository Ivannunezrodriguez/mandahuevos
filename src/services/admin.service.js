
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DbAdapter } from './db.adapter';
import { OrderService } from './order.service';

export const AdminService = {
    // 1. Notificación a Ivan (Simulado por ahora)
    notifyNewOrder: async (orderData) => {
        console.log(`[NOTIFICACIÓN] Enviando informe a ivann20@gmail.com sobre el pedido ${orderData.invoiceNumber || orderData.id}`);
        // Aquí iría la llamada a Supabase Edge Function o API de Email
        return true;
    },

    // 2. Generación de Albarán PDF
    generateDeliveryNote: (order, userProfile) => {
        const doc = new jsPDF();
        const primaryColor = [251, 191, 36]; // #fbbf24

        // Cabecera
        doc.setFillColor(23, 23, 23);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text('Mandahuevos.com', 20, 25);

        doc.setFontSize(10);
        doc.text('ALBARÁN DE ENTREGA', 160, 25);

        // Info Cliente
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.text('DATOS DEL CLIENTE', 20, 55);
        doc.setFontSize(10);
        doc.text(`Nombre: ${userProfile?.full_name || order.userId}`, 20, 65);
        doc.text(`Dirección: ${userProfile?.address || 'No especificada'}`, 20, 72);
        doc.text(`Población: ${order.deliveryDate ? 'Cita programada' : 'N/A'}`, 20, 79);
        doc.text(`Teléfono: ${userProfile?.phone || 'N/A'}`, 20, 86);

        // Info Pedido
        doc.text('DATOS DEL PEDIDO', 120, 55);
        doc.text(`Nº Albarán: ${order.invoiceNumber}`, 120, 65);
        doc.text(`Fecha Pedido: ${new Date(order.createdAt).toLocaleDateString()}`, 120, 72);
        doc.text(`Entrega: ${new Date(order.deliveryDate).toLocaleDateString()}`, 120, 79);
        doc.text(`Pago: ${order.paymentMethod === 'transfer' ? 'Transferencia' : 'Bizum'}`, 120, 86);

        // Tabla de Productos
        const products = OrderService.getProducts();
        const tableBody = order.items.map(item => {
            const product = products.find(p => p.id === item.id);
            return [
                product?.name || item.id,
                item.quantity,
                `${item.price.toFixed(2)} €`,
                `${(item.quantity * item.price).toFixed(2)} €`
            ];
        });

        autoTable(doc, {
            startY: 100,
            head: [['Producto', 'Cant.', 'Precio Un.', 'Total']],
            body: tableBody,
            headStyles: { fillColor: primaryColor, textColor: [0, 0, 0] },
            alternateRowStyles: { fillColor: [249, 250, 251] }
        });

        // Total
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(14);
        doc.text(`TOTAL: ${order.total.toFixed(2)} €`, 160, finalY);

        // Pie
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('Gracias por confiar en Mandahuevos.com - Los huevos más frescos del corral a tu mesa.', 105, 280, null, null, 'center');

        doc.save(`albaran_${order.invoiceNumber}.pdf`);
    },

    // 3. Obtener todos los pedidos con info de usuario
    getOrdersWithProfiles: async () => {
        const orders = await DbAdapter.getAllOrders();
        return orders;
    },

    // 4. Generación Masiva de Albaranes
    generateBulkDeliveryNotes: async (orders) => {
        const doc = new jsPDF();

        for (let i = 0; i < orders.length; i++) {
            const order = orders[i];

            // Obtener perfil (puede ser lento en bucle, idealmente pasarlo ya cargado, pero para MVP ok)
            // Optimizacion: Usar Promise.all fuera o cachear, pero aquí hacemos fetch one-by-one safe
            let profile;
            try {
                // Reuse logic from DbAdapter to handle email/id
                profile = await DbAdapter.getUserById(order.userId);
            } catch (e) {
                console.warn("Error fetching profile for bulk print:", e);
                profile = { full_name: order.userId, email: order.userId };
            }

            if (i > 0) doc.addPage();

            // --- RENDER PAGE LOGIC (DUPLICATED FROM SIMPLER METHOD FOR ROBUSTNESS HERE) ---
            const primaryColor = [251, 191, 36]; // #fbbf24

            // Cabecera
            doc.setFillColor(23, 23, 23);
            doc.rect(0, 0, 210, 40, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.text('Mandahuevos.com', 20, 25);
            doc.setFontSize(10);
            doc.text('ALBARÁN DE ENTREGA', 160, 25);

            // Info Cliente
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(12);
            doc.text('DATOS DEL CLIENTE', 20, 55);
            doc.setFontSize(10);
            doc.text(`Nombre: ${profile?.full_name || order.userId}`, 20, 65);
            doc.text(`Dirección: ${profile?.address || 'No especificada'}`, 20, 72);
            doc.text(`Población: ${order.deliveryDate ? 'Cita programada' : 'N/A'}`, 20, 79);
            doc.text(`Teléfono: ${profile?.phone || 'N/A'}`, 20, 86);

            // Info Pedido
            doc.text('DATOS DEL PEDIDO', 120, 55);
            doc.text(`Nº Albarán: ${order.invoiceNumber}`, 120, 65);
            doc.text(`Fecha Pedido: ${new Date(order.createdAt).toLocaleDateString()}`, 120, 72);
            doc.text(`Entrega: ${new Date(order.deliveryDate).toLocaleDateString()}`, 120, 79);
            doc.text(`Pago: ${order.paymentMethod === 'transfer' ? 'Transferencia' : 'Bizum'}`, 120, 86);

            // Tabla
            const products = OrderService.getProducts();
            const tableBody = order.items.map(item => {
                const p = products.find(prod => prod.id === item.id);
                return [
                    p?.name || item.id,
                    item.quantity,
                    `${item.price.toFixed(2)} €`,
                    `${(item.quantity * item.price).toFixed(2)} €`
                ];
            });

            autoTable(doc, {
                startY: 100,
                head: [['Producto', 'Cant.', 'Precio Un.', 'Total']],
                body: tableBody,
                headStyles: { fillColor: primaryColor, textColor: [0, 0, 0] },
                alternateRowStyles: { fillColor: [249, 250, 251] }
            });
            // --- END RENDER ---
        }

        doc.save(`albaranes_lote_${new Date().toISOString().slice(0, 10)}.pdf`);
    }
};
