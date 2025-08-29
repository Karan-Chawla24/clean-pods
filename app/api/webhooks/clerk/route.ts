import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/app/lib/prisma";
import prismaVercel from "@/app/lib/prisma-vercel";

// Use Vercel-optimized Prisma client in production
const db = process.env.VERCEL ? prismaVercel : prisma;
import { safeLog, safeLogError } from "@/app/lib/security/logging";

export async function POST(req: Request) {
  // You can find this in the Clerk Dashboard -> Webhooks -> choose the webhook
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error(
      "Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local",
    );
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.text();
  const body = JSON.parse(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    safeLogError("Clerk webhook signature verification failed", err);
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  // Handle the webhook
  const { id } = evt.data;
  const eventType = evt.type;

  safeLog("info", "Clerk webhook received", { id, eventType });

  try {
    switch (eventType) {
      case "user.created":
        await handleUserCreated(evt.data);
        break;
      case "user.updated":
        await handleUserUpdated(evt.data);
        break;
      case "user.deleted":
        await handleUserDeleted(evt.data);
        break;
      default:
        safeLog("warn", "Unhandled Clerk webhook event type", { eventType });
    }
  } catch (error) {
    safeLogError("Error handling Clerk webhook", error);
    return new Response("Error processing webhook", { status: 500 });
  }

  return new Response("", { status: 200 });
}

async function handleUserCreated(userData: any) {
  const { id, email_addresses, first_name, last_name, image_url } = userData;

  const primaryEmail = email_addresses.find(
    (email: any) => email.id === userData.primary_email_address_id,
  );

  if (!primaryEmail) {
    console.error("No primary email found for user:", id);
    return;
  }

  try {
    await db.user.create({
      data: {
        id: id,
        email: primaryEmail.email_address,
        firstName: first_name || "",
        lastName: last_name || "",
        name: `${first_name || ""} ${last_name || ""}`.trim() || null,
        image: image_url || null,
        emailVerified:
          primaryEmail.verification?.status === "verified" ? new Date() : null,
      },
    });
    console.log("User created in database:", id);
  } catch (error) {
    console.error("Error creating user in database:", error);
  }
}

async function handleUserUpdated(userData: any) {
  const { id, email_addresses, first_name, last_name, image_url } = userData;

  const primaryEmail = email_addresses.find(
    (email: any) => email.id === userData.primary_email_address_id,
  );

  if (!primaryEmail) {
    console.error("No primary email found for user:", id);
    return;
  }

  try {
    await db.user.update({
      where: { id: id },
      data: {
        email: primaryEmail.email_address,
        firstName: first_name || "",
        lastName: last_name || "",
        name: `${first_name || ""} ${last_name || ""}`.trim() || null,
        image: image_url || null,
        emailVerified:
          primaryEmail.verification?.status === "verified" ? new Date() : null,
      },
    });
    console.log("User updated in database:", id);
  } catch (error) {
    console.error("Error updating user in database:", error);
  }
}

async function handleUserDeleted(userData: any) {
  const { id } = userData;

  try {
    await db.user.delete({
      where: { id: id },
    });
    safeLog("info", "User deleted from database", { userId: id });
  } catch (error) {
    safeLogError("Error deleting user from database", error);
  }
}
