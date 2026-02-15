
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const InvoiceService = {
    generateInvoice: (order, user) => {
        const doc = new jsPDF();

        // Configuración
        const pageWidth = doc.internal.pageSize.width;
        const margin = 20;

        // Header (Logo y Empresa)
        doc.setFontSize(22);
        doc.setTextColor(251, 191, 36); // #fbbf24 Gold
        doc.text('MANDAHUEVOS.COM', margin, 20);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text('Venta de Huevos al Por Mayor', margin, 26);
        doc.text('Polígono Industrial El Huevo, Nave 3', margin, 31);
        doc.text('28000 Madrid, España', margin, 36);
        doc.text('CIF: B-12345678', margin, 41);
        doc.text('Tel: +34 912 345 678', margin, 46);
        doc.text('Email: facturas@mandahuevos.com', margin, 51);

        // Datos del Cliente
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text('FACTURAR A:', margin, 70);

        doc.setFontSize(11);
        doc.text(user.name || 'Cliente', margin, 78);
        doc.text(`DNI/CIF: ${user.dni || 'No especificado'}`, margin, 84);
        doc.text(`Dirección: ${user.address || 'No especificada'}`, margin, 90);
        doc.text(`Teléfono: ${user.phone || 'No especificado'}`, margin, 96);

        // Datos de la Factura
        const date = new Date(order.createdAt).toLocaleDateString();
        doc.text(`Nº Factura: ${order.invoiceNumber}`, pageWidth - margin - 60, 78);
        doc.text(`Fecha: ${date}`, pageWidth - margin - 60, 84);
        doc.text(`Vencimiento: Contado`, pageWidth - margin - 60, 90);

        // Tabla de Productos
        const tableColumn = ["Producto", "Cantidad", "Precio Unit.", "Total"];
        const tableRows = [];

        order.items.forEach(item => {
            const itemData = [
                item.name,
                item.quantity,
                `${item.price.toFixed(2)} €`,
                `${(item.quantity * item.price).toFixed(2)} €`
            ];
            tableRows.push(itemData);
        });

        autoTable(doc, {
            startY: 110,
            head: [tableColumn],
            body: tableRows,
            theme: 'striped',
            headStyles: { fillColor: [251, 191, 36], textColor: [0, 0, 0] },
            styles: { fontSize: 10 },
        });

        // Totales
        const finalY = doc.lastAutoTable.finalY + 10;

        doc.text(`Subtotal:`, pageWidth - margin - 50, finalY);
        doc.text(`${order.total.toFixed(2)} €`, pageWidth - margin - 15, finalY, { align: 'right' });

        const iva = order.total * 0.10; // IVA 10% alimentación (Huevos) - wait, huevos reducidos? 4%? 10%? Asumimos 10%
        doc.text(`IVA (10%):`, pageWidth - margin - 50, finalY + 6);
        doc.text(`${iva.toFixed(2)} €`, pageWidth - margin - 15, finalY + 6, { align: 'right' });

        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(`TOTAL:`, pageWidth - margin - 70, finalY + 14);
        doc.text(`${(order.total + iva).toFixed(2)} €`, pageWidth - margin - 15, finalY + 14, { align: 'right' });

        // Pie de página legal
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(150);
        const footerText = "De conformidad con el Reglamento General de Protección de Datos (RGPD), le informamos que sus datos forman parte de un fichero responsabilidad de MANDAHUEVOS S.L. para la gestión administrativa y contable. Puede ejercer sus derechos de acceso, rectificación, cancelación y oposición.";
        const splitFooter = doc.splitTextToSize(footerText, pageWidth - (margin * 2));
        doc.text(splitFooter, margin, 270);

        // Guardar
        doc.save(`factura_${order.invoiceNumber}.pdf`);
    }
};
