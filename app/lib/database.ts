import { prisma } from './prisma';

export async function saveOrder(orderData: {
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
  const order = await prisma.order.create({
    data: {
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
  return order.id;
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