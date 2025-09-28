const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDuplicates() {
  try {
    console.log('Checking for duplicate order_no and invoice_no values...');
    
    // Check for duplicate order_no
    const orderNoDuplicates = await prisma.$queryRaw`
      SELECT order_no, COUNT(*) as count 
      FROM orders 
      WHERE order_no IS NOT NULL 
      GROUP BY order_no 
      HAVING COUNT(*) > 1
    `;

    // Check for duplicate invoice_no
    const invoiceNoDuplicates = await prisma.$queryRaw`
      SELECT invoice_no, COUNT(*) as count 
      FROM orders 
      WHERE invoice_no IS NOT NULL 
      GROUP BY invoice_no 
      HAVING COUNT(*) > 1
    `;

    console.log('Order No Duplicates:', orderNoDuplicates);
    console.log('Invoice No Duplicates:', invoiceNoDuplicates);

    if (orderNoDuplicates.length === 0 && invoiceNoDuplicates.length === 0) {
      console.log('✅ No duplicates found! Safe to add unique constraints.');
    } else {
      console.log('❌ Duplicates found! Need to fix before adding constraints.');
    }

    // Also show all current values
    const allOrders = await prisma.order.findMany({
      select: {
        id: true,
        orderNo: true,
        invoiceNo: true,
        orderDate: true
      },
      orderBy: {
        orderDate: 'asc'
      }
    });

    console.log('\nAll current order numbers:');
    allOrders.forEach(order => {
      console.log(`ID: ${order.id}, Order: ${order.orderNo}, Invoice: ${order.invoiceNo}, Date: ${order.orderDate}`);
    });

  } catch (error) {
    console.error('Error checking duplicates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDuplicates();