#!/usr/bin/env node

/**
 * Admin Orders Script
 *
 * This script allows admins to securely fetch all orders from the database.
 * Usage: node scripts/admin-orders.js
 *
 * Requires ADMIN_ORDERS_KEY environment variable to be set.
 */

const https = require("https");
const http = require("http");
const { safeLog, safeLogError } = require("../app/lib/security/logging");

// Data masking functions for sensitive information
function maskEmail(email) {
  if (!email) return "N/A";
  const [username, domain] = email.split("@");
  if (!username || !domain) return "[MASKED]";
  const maskedUsername =
    username.length > 2
      ? username.substring(0, 2) + "*".repeat(username.length - 2)
      : "*".repeat(username.length);
  return `${maskedUsername}@${domain}`;
}

function maskPhone(phone) {
  if (!phone) return "N/A";
  const phoneStr = phone.toString();
  if (phoneStr.length < 4) return "[MASKED]";
  return (
    phoneStr.substring(0, 2) +
    "*".repeat(phoneStr.length - 4) +
    phoneStr.substring(phoneStr.length - 2)
  );
}

const SITE_URL = process.env.SITE_URL || "http://localhost:3000";
const ADMIN_KEY = process.env.ADMIN_ORDERS_KEY;

if (!ADMIN_KEY) {
  safeLogError("❌ ADMIN_ORDERS_KEY environment variable is required");
  safeLog("info", "Set it in your .env.local file or export it:");
  safeLog("info", 'export ADMIN_ORDERS_KEY="your_secret_admin_key_here"');
  process.exit(1);
}

async function fetchOrders() {
  const url = `${SITE_URL}/api/orders`;
  const requestModule = url.startsWith("https") ? https : http;

  safeLog("info", `🔍 Fetching orders from: ${url}`);

  const options = {
    method: "GET",
    headers: {
      "X-Admin-Key": ADMIN_KEY,
      "Content-Type": "application/json",
    },
  };

  return new Promise((resolve, reject) => {
    const req = requestModule.request(url, options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const jsonData = JSON.parse(data);

          if (res.statusCode === 200) {
            resolve(jsonData);
          } else {
            reject(
              new Error(`HTTP ${res.statusCode}: ${jsonData.error || data}`),
            );
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.end();
  });
}

async function main() {
  try {
    safeLog("info", "🔐 Admin Orders Dashboard");
    safeLog("info", "========================\n");

    const orders = await fetchOrders();

    if (!orders || orders.length === 0) {
      safeLog("info", "📪 No orders found in the database.\n");
      return;
    }

    safeLog("info", `📦 Found ${orders.length} orders:\n`);

    orders.forEach((order, index) => {
      safeLog("info", `Order #${index + 1}:`);
      safeLog("info", `  ID: ${order.id}`);
      safeLog("info", `  Transaction ID: ${order.paymentId}`);
      safeLog(
        "info",
        `  Customer: ${order.customer?.firstName} ${order.customer?.lastName}`,
      );
      safeLog("info", `  Email: ${maskEmail(order.customer?.email)}`);
      safeLog("info", `  Phone: ${maskPhone(order.customer?.phone)}`);
      safeLog("info", `  Total: ₹${order.total}`);
      safeLog("info", `  Items: ${order.items?.length || 0} items`);
      safeLog(
        "info",
        `  Created: ${new Date(order.createdAt).toLocaleString()}`,
      );
      safeLog("info", "  ---------------");
    });

    safeLog("info", `\n✅ Total orders: ${orders.length}`);
    safeLog(
      "info",
      `💰 Total revenue: ₹${orders.reduce((sum, order) => sum + (order.total || 0), 0)}`,
    );
  } catch (error) {
    safeLogError("❌ Error fetching orders", error);

    if (error.message && error.message.includes("403")) {
      safeLog(
        "info",
        "\n💡 Make sure your ADMIN_ORDERS_KEY is correct and matches the server configuration.",
      );
    }

    process.exit(1);
  }
}

main();
