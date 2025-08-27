"use client";

import { useEffect, useState } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function SetupAdmin() {
  const { user, isLoaded } = useUser();
  const { isSignedIn, getToken } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<
    "loading" | "success" | "error" | "already-admin" | "unavailable"
  >("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) {
      setStatus("error");
      setMessage("Please sign in first");
      return;
    }

    // Check if user is already admin
    if (user.publicMetadata?.role === "admin") {
      setStatus("already-admin");
      setMessage("You already have admin privileges");
      return;
    }

    // Check bootstrap availability and attempt admin bootstrap
    const bootstrapAdmin = async () => {
      try {
        // First check if bootstrap is available
        const availabilityResponse = await fetch("/api/admin/bootstrap", {
          method: "GET",
        });

        if (availabilityResponse.ok) {
          const availabilityData = await availabilityResponse.json();

          if (!availabilityData.bootstrapAvailable) {
            setStatus("unavailable");
            setMessage(
              "Admin setup is no longer available. Admin users already exist in the system.",
            );
            return;
          }
        }

        // Attempt bootstrap
        const token = await getToken();
        const response = await fetch("/api/admin/bootstrap", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setStatus("success");
          setMessage(
            "Admin bootstrap successful! You are now the first admin user.",
          );

          // Redirect to admin page after 2 seconds
          setTimeout(() => {
            router.push("/admin");
          }, 2000);
        } else {
          const errorData = await response.json();
          if (response.status === 403) {
            setStatus("unavailable");
            setMessage(
              "Admin setup is no longer available. Admin users already exist in the system.",
            );
          } else {
            setStatus("error");
            setMessage(`Failed to setup admin: ${errorData.error}`);
          }
        }
      } catch (error) {
        setStatus("error");
        setMessage("An error occurred during admin setup");
        console.error("Admin bootstrap error:", error);
      }
    };

    bootstrapAdmin();
  }, [isLoaded, isSignedIn, user, getToken, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Admin Setup
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Setting up admin privileges for your account
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            {status === "loading" && (
              <>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">
                  Checking admin setup availability...
                </p>
              </>
            )}

            {status === "success" && (
              <>
                <div className="text-green-600 text-4xl mb-4">✅</div>
                <p className="text-green-600 font-medium">{message}</p>
                <p className="mt-2 text-sm text-gray-500">
                  Redirecting to admin dashboard...
                </p>
              </>
            )}

            {status === "already-admin" && (
              <>
                <div className="text-blue-600 text-4xl mb-4">👑</div>
                <p className="text-blue-600 font-medium">{message}</p>
                <button
                  onClick={() => router.push("/admin")}
                  className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Go to Admin Dashboard
                </button>
              </>
            )}

            {status === "unavailable" && (
              <>
                <div className="text-yellow-600 text-4xl mb-4">🔒</div>
                <p className="text-yellow-600 font-medium">{message}</p>
                <p className="mt-2 text-sm text-gray-500">
                  Admin setup is only available for the first admin user.
                </p>
                <button
                  onClick={() => router.push("/")}
                  className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  Go to Home
                </button>
              </>
            )}

            {status === "error" && (
              <>
                <div className="text-red-600 text-4xl mb-4">❌</div>
                <p className="text-red-600 font-medium">{message}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Try Again
                </button>
              </>
            )}
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            This is a one-time setup page. After admin privileges are granted,
            you can access the admin dashboard directly.
          </p>
        </div>
      </div>
    </div>
  );
}
