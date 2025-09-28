const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function populateSequentialNumbers() {
  try {
    console.log('Starting to populate sequential numbers for existing orders...');
    
    // Get all orders ordered by creation date
    const orders = await prisma.order.findMany({
      orderBy: {
        orderDate: 'asc'
      }
    });

    console.log(`Found ${orders.length} orders to update`);

    let orderSequence = 2; // Start from 0002 as requested
    let invoiceSequence = 2; // Start from 0002 as requested

    for (const order of orders) {
      // Generate date string from order date
      const orderDate = new Date(order.orderDate);
      const dateStr = orderDate.toISOString().slice(0, 10).replace(/-/g, '');
      
      // Generate sequential numbers
      const orderNo = `ORD-${dateStr}-${orderSequence.toString().padStart(4, '0')}`;
      const invoiceNo = `W-${dateStr}-${invoiceSequence.toString().padStart(4, '0')}`;

      // Update the order
      await prisma.order.update({
        where: { id: order.id },
        data: {
          orderNo,
          invoiceNo
        }
      });

      console.log(`Updated order ${order.id}: ${orderNo}, ${invoiceNo}`);
      
      orderSequence++;
      invoiceSequence++;
    }

    console.log('Successfully populated all sequential numbers!');
  } catch (error) {
    console.error('Error populating sequential numbers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

populateSequentialNumbers();