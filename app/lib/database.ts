import { prisma } from './prisma';

export async function saveOrder(orderData: {
  razorpayOrderId: string;
  paymentId: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  total: number;
}) {
  console.log('saveOrder called with data:', JSON.stringify(orderData, null, 2));
  
  try {
    const order = await prisma.order.create({
      data: {
        razorpayOrderId: orderData.razorpayOrderId,
        paymentId: orderData.paymentId,
        customerName: `${orderData.customer.firstName} ${orderData.customer.lastName}`,
        customerEmail: orderData.customer.email,
        customerPhone: orderData.customer.phone,
        address: `${orderData.customer.address}, ${orderData.customer.city}, ${orderData.customer.state} ${orderData.customer.pincode}`,
        total: orderData.total,
        items: {
          create: orderData.items.map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
        },
      },
      include: { items: true },
    });
    
    console.log('Order created successfully:', order);
    return order.id;
  } catch (error) {
    console.error('Error in saveOrder:', error);
    throw error;
  }
}

export async function getOrder(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
}

export async function getAllOrders() {
  return prisma.order.findMany({
    include: { items: true },
    orderBy: { orderDate: 'desc' },
  });
} 