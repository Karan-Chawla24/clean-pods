// Simple in-memory storage for development
// In production, you would use a proper database like PostgreSQL, MongoDB, etc.

interface OrderItem {
  id: string;
  order_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: string;
  customer_email: string;
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  total_amount: number;
  status: string;
  payment_status: string;
  payment_id: string;
  created_at: string;
  items: OrderItem[];
}

// In-memory storage
let orders: Order[] = [];
let orderItems: OrderItem[] = [];

// Save order to memory
export async function saveOrder(orderData: {
  id: string;
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
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }>;
  total: number;
  paymentId: string;
}) {
  // Create order
  const order: Order = {
    id: orderData.id,
    customer_email: orderData.customer.email,
    customer_name: `${orderData.customer.firstName} ${orderData.customer.lastName}`,
    customer_phone: orderData.customer.phone,
    shipping_address: `${orderData.customer.address}, ${orderData.customer.city}, ${orderData.customer.state} ${orderData.customer.pincode}`,
    total_amount: orderData.total,
    status: 'confirmed',
    payment_status: 'paid',
    payment_id: orderData.paymentId,
    created_at: new Date().toISOString(),
    items: []
  };

  // Create order items
  const items: OrderItem[] = orderData.items.map((item, index) => ({
    id: `${orderData.id}_item_${index}`,
    order_id: orderData.id,
    product_name: item.name,
    quantity: item.quantity,
    unit_price: item.price,
    total_price: item.price * item.quantity
  }));

  // Store in memory
  orders.push(order);
  orderItems.push(...items);

  return orderData.id;
}

// Get order by ID
export async function getOrder(orderId: string) {
  const order = orders.find(o => o.id === orderId);
  if (!order) return null;

  const items = orderItems.filter(item => item.order_id === orderId);
  return { ...order, items };
}

// Get all orders (for admin dashboard)
export async function getAllOrders() {
  return orders.map(order => {
    const items = orderItems.filter(item => item.order_id === order.id);
    return { ...order, items };
  });
} 