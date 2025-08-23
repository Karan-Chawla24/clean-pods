import { prisma } from './prisma';

export async function saveOrder(orderData: {
  razorpayOrderId: string;
  paymentId: string;
  customer?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  address?: string;
  userId?: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  total: number;
}) {
  // saveOrder invoked
  
  try {
    // Handle both legacy format (with customer object) and new format (with direct fields)
    const customerName = orderData.customerName || 
      (orderData.customer ? `${orderData.customer.firstName} ${orderData.customer.lastName}` : '');
    const customerEmail = orderData.customerEmail || (orderData.customer?.email || '');
    const customerPhone = orderData.customerPhone || (orderData.customer?.phone || '');
    const address = orderData.address || 
      (orderData.customer ? `${orderData.customer.address}, ${orderData.customer.city}, ${orderData.customer.state} ${orderData.customer.pincode}` : '');
    
    const order = await prisma.order.create({
      data: {
        razorpayOrderId: orderData.razorpayOrderId,
        paymentId: orderData.paymentId,
        customerName,
        customerEmail,
        customerPhone,
        address,
        total: orderData.total,
        userId: orderData.userId, // Associate with user if provided
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
    
    // Order created
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