import { NextRequest, NextResponse } from "next/server";
import { IncomingWebhook } from "@slack/webhook";
import { z } from "zod";
import { validateRequest, sanitizeObject } from "@/app/lib/security/validation";
import { safeLog, safeLogError } from "@/app/lib/security/logging";
import { withUpstashRateLimit } from "@/app/lib/security/upstashRateLimit";

// Slack webhook will be initialized in the function

// Functions to mask sensitive data
function maskEmail(email: string): string {
  if (!email) return "";
  const [localPart, domain] = email.split("@");
  if (!domain) return email;
  const maskedLocal =
    localPart.length > 2
      ? localPart.substring(0, 2) + "*".repeat(localPart.length - 2)
      : localPart;
  return `${maskedLocal}@${domain}`;
}

function maskPhone(phone: string): string {
  if (!phone) return "";
  if (phone.length <= 4) return phone;
  return (
    phone.substring(0, 2) +
    "*".repeat(phone.length - 4) +
    phone.substring(phone.length - 2)
  );
}

function maskAddress(address: string): string {
  if (!address) return "";
  const parts = address.split(",");
  if (parts.length <= 1) return address.substring(0, 10) + "...";
  // Show only city and state, mask detailed address
  return `*****, ${parts.slice(-2).join(",").trim()}`;
}

// Validation schemas
const orderItemSchema = z.object({
  name: z
    .string()
    .min(1, "Item name is required")
    .max(200, "Item name too long"),
  quantity: z.number().int().positive("Quantity must be positive"),
  price: z.number().positive("Price must be positive"),
});

const customerDataSchema = z.object({
  name: z
    .string()
    .min(1, "Customer name is required")
    .max(100, "Name too long"),
  email: z.string().email("Invalid email format").max(255, "Email too long"),
  phone: z
    .string()
    .min(10, "Phone number too short")
    .max(15, "Phone number too long"),
  address: z
    .string()
    .min(1, "Address is required")
    .max(500, "Address too long"),
});

const orderDataSchema = z.object({
  id: z
    .string()
    .min(1, "Order ID is required")
    .regex(/^[a-zA-Z0-9_-]+$/, "Invalid order ID format"),
  items: z.array(orderItemSchema).min(1, "Order must have at least one item"),
  total: z.number().positive("Total must be positive"),
  paymentId: z.string().min(1, "Transaction ID is required"),
});

const slackNotificationSchema = z.object({
  orderData: orderDataSchema,
  customerData: customerDataSchema,
});

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface CustomerData {
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface OrderData {
  id: string;
  items: OrderItem[];
  total: number;
  paymentId: string;
}

export const POST = withUpstashRateLimit("moderate")(async (request: NextRequest) => {
  try {
    safeLog("info", "Slack notification API called");

    // Validate request body
    const validationResult = await validateRequest(
      request,
      slackNotificationSchema,
    );
    if (!validationResult.success) {
      safeLog("error", "Validation failed", {
        error: "Invalid notification data",
      });
      return NextResponse.json(
        { success: false, error: "Invalid notification data" },
        { status: 400 },
      );
    }

    safeLog("info", "Validation passed");

    // Extract validated data (already validated by Zod schema)
    const {
      orderData,
      customerData,
    }: { orderData: OrderData; customerData: CustomerData } =
      validationResult.data;

    safeLog("info", "Processing order notification", {
      orderId: orderData.id,
      total: orderData.total,
      customerName: customerData.name,
      customerEmail: maskEmail(customerData.email),
    });

    // Use SLACK_CONTACT_URL as the primary webhook since SLACK_WEBHOOK_URL is invalid
    const webhookUrl =process.env.SLACK_WEBHOOK_URL;
    
    if (!webhookUrl) {
      safeLog("warn", "Slack webhook URL not configured");
      return NextResponse.json({
        success: true,
        message: "Slack webhook not configured",
      });
    }

    safeLog("info", "Slack webhook configured, creating instance");

    // Initialize Slack webhook inside the function
    const webhook = new IncomingWebhook(webhookUrl);

    // Create a beautiful Slack message
    const itemsList = orderData.items
      .map((item) => `• ${item.name} x${item.quantity} - ₹${item.price}`)
      .join("\n");

    const totalFormatted = `₹${orderData.total.toLocaleString('en-IN')}`;

    const slackMessage = {
      text: "🎉 *New Order Received!*",
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "🎉 New Order Received!",
            emoji: true,
          },
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Order ID:*\n\`${orderData.id}\``,
            },
            {
              type: "mrkdwn",
              text: `*Transaction ID:*\n\`${orderData.paymentId}\``,
            },
            {
              type: "mrkdwn",
              text: `*Total Amount:*\n*${totalFormatted}*`,
            },
            {
              type: "mrkdwn",
              text: `*Order Date:*\n${new Date().toLocaleString("en-IN")}`,
            },
          ],
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*📦 Order Items:*",
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: itemsList,
          },
        },
        {
          type: "divider",
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*👤 Customer Details:*",
          },
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Name:*\n${customerData.name}`,
            },
            {
              type: "mrkdwn",
              text: `*Email:*\n${maskEmail(customerData.email)}`,
            },
            {
              type: "mrkdwn",
              text: `*Phone:*\n${maskPhone(customerData.phone)}`,
            },
          ],
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*📍 Address:*\n${maskAddress(customerData.address)}`,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*🔗 View Full Details:*",
          },
          accessory: {
            type: "button",
            text: {
              type: "plain_text",
              text: "View in Admin Panel",
              emoji: true,
            },
            url: `${process.env.APP_URL || "http://localhost:3000"}/admin/orders/${orderData.id}`,
            action_id: "view_order_details",
          },
        },
        {
          type: "divider",
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: "🛍️ BubbleBeads E-commerce Order",
            },
          ],
        },
      ],
    };

    // Generate admin URL
    const adminUrl = `${process.env.APP_URL || "http://localhost:3000"}/admin/orders/${orderData.id}`;
    safeLog("info", "Generated admin URL for order", { orderId: orderData.id });

    // Send to Slack
    safeLog("info", "Sending message to Slack");

    let result;
    try {
      result = await webhook.send(slackMessage);
      safeLog("info", "Slack message sent successfully");
    } catch (webhookError) {
      safeLogError("Webhook send error", webhookError);
      const errorMessage =
        webhookError &&
        typeof webhookError === "object" &&
        "message" in webhookError
          ? (webhookError as any).message
          : "Unknown webhook error";
      throw new Error(`Webhook send failed: ${errorMessage}`);
    }

    return NextResponse.json({
      success: true,
      message: "Slack notification sent successfully",
      slackResponse: result,
    });
  } catch (error) {
    safeLogError("Failed to send Slack notification", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to send Slack notification",
      },
      { status: 500 },
    );
  }
});
