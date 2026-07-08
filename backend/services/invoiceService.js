import PDFDocument from 'pdfkit';

export function generateInvoicePDF(order, res) {
  const doc = new PDFDocument({ margin: 50 });

  // Stream PDF directly to HTTP response
  doc.pipe(res);

  // Colors
  const darkColor = '#121212';
  const lightGrey = '#777777';
  const tableHeaderBg = '#F5F5F7';

  // Logo & Header
  doc
    .fillColor(darkColor)
    .fontSize(22)
    .font('Helvetica-Bold')
    .text('PREMIUM BOUTIQUE', 50, 50);

  doc
    .fontSize(10)
    .font('Helvetica')
    .fillColor(lightGrey)
    .text('Style & Élégance Zara, Nike, ASOS', 50, 75)
    .text('contact@premium-boutique.com', 50, 90)
    .text('+242 06 000 00 00', 50, 105);

  // Invoice Title
  doc
    .fillColor(darkColor)
    .fontSize(16)
    .font('Helvetica-Bold')
    .text('FACTURE', 400, 50, { align: 'right' });

  doc
    .fontSize(10)
    .font('Helvetica')
    .fillColor(lightGrey)
    .text(`Facture N° : ${order.orderNumber}`, 400, 75, { align: 'right' })
    .text(`Date : ${new Date(order.createdAt).toLocaleDateString('fr-FR')}`, 400, 90, { align: 'right' })
    .text(`Statut : ${order.status.toUpperCase()}`, 400, 105, { align: 'right' });

  doc.moveDown(2);

  // Horizontal line separator
  doc
    .strokeColor('#CCCCCC')
    .lineWidth(1)
    .moveTo(50, 135)
    .lineTo(550, 135)
    .stroke();

  // Shipping details
  const shipping = order.shippingAddress;
  doc
    .fillColor(darkColor)
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('DESTINATAIRE', 50, 155)
    .fontSize(10)
    .font('Helvetica')
    .fillColor('#333333')
    .text(shipping.name || '', 50, 175)
    .text(shipping.phone || '', 50, 190)
    .text(`${shipping.street || ''}, ${shipping.city || ''}`, 50, 205)
    .text(shipping.country || '', 50, 220);

  // Payment details
  doc
    .fillColor(darkColor)
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('PAIEMENT & LIVRAISON', 300, 155)
    .fontSize(10)
    .font('Helvetica')
    .fillColor('#333333')
    .text(`Méthode de livraison : ${order.shippingMethod.toUpperCase()}`, 300, 175)
    .text(`Mode de paiement : ${order.paymentMethod.toUpperCase()}`, 300, 190);

  if (order.couponCode) {
    doc.text(`Code Promo appliqué : ${order.couponCode}`, 300, 205);
  }

  doc.moveDown(3);

  // Table header
  let y = 260;
  doc
    .rect(50, y, 500, 20)
    .fill(tableHeaderBg);

  doc
    .fillColor(darkColor)
    .font('Helvetica-Bold')
    .fontSize(9)
    .text('Description', 60, y + 6)
    .text('Couleur', 260, y + 6)
    .text('Taille', 330, y + 6)
    .text('Qté', 400, y + 6)
    .text('Prix Unitaire', 450, y + 6)
    .text('Total', 510, y + 6);

  // Table items
  y += 20;
  doc.font('Helvetica').fillColor('#333333');

  order.items.forEach((item) => {
    const itemTotal = (item.quantity * parseFloat(item.price)).toFixed(2);
    
    // Draw row bottom border
    doc
      .strokeColor('#EEEEEE')
      .lineWidth(0.5)
      .moveTo(50, y + 20)
      .lineTo(550, y + 20)
      .stroke();

    doc
      .text(item.product ? item.product.name : 'Produit', 60, y + 6, { width: 190, lineBreak: false })
      .text(item.color ? item.color.name : '-', 260, y + 6)
      .text(item.size ? item.size.name : '-', 330, y + 6)
      .text(item.quantity.toString(), 400, y + 6)
      .text(`${parseFloat(item.price).toFixed(2)} €`, 450, y + 6)
      .text(`${itemTotal} €`, 510, y + 6);

    y += 22;
  });

  // Summary section
  y += 10;
  doc.font('Helvetica');
  
  doc.text('Sous-total :', 380, y).text(`${parseFloat(order.subtotal).toFixed(2)} €`, 480, y, { align: 'right' });
  y += 15;
  doc.text('Frais de livraison :', 380, y).text(`${parseFloat(order.shippingFee).toFixed(2)} €`, 480, y, { align: 'right' });
  
  if (parseFloat(order.discountAmount) > 0) {
    y += 15;
    doc.text('Réduction :', 380, y).text(`-${parseFloat(order.discountAmount).toFixed(2)} €`, 480, y, { align: 'right' });
  }

  y += 20;
  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor(darkColor);
  doc.text('TOTAL GENERAL :', 380, y).text(`${parseFloat(order.total).toFixed(2)} €`, 480, y, { align: 'right' });

  // QR Code placeholder / info
  if (order.qrCode) {
    y += 40;
    doc
      .fontSize(9)
      .font('Helvetica-Oblique')
      .fillColor(lightGrey)
      .text('Scannez pour suivre la commande en temps réel :', 50, y);
    
    doc
      .font('Helvetica')
      .fillColor('#0047AB')
      .text(order.qrCode, 50, y + 15);
  }

  // Footer
  doc
    .fontSize(8)
    .font('Helvetica')
    .fillColor(lightGrey)
    .text('Merci pour votre confiance et à bientôt !', 50, 720, { align: 'center' })
    .text('Cette facture fait office de preuve d\'achat.', 50, 735, { align: 'center' });

  // End PDF stream
  doc.end();
}
