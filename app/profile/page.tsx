"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import toast from "react-hot-toast";
import { safeLog, safeLogError } from "../lib/security/logging";

export default function Profile() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/auth/signin");
    }
  }, [isLoaded, isSignedIn, router]);

  // Load user data when user is available
  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        // Always use Clerk user data as the primary source
        setFormData({
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.primaryEmailAddress?.emailAddress || "",
          phone: user.phoneNumbers?.[0]?.phoneNumber || "",
          address: "",
        });

        // Try to load additional data from database (like address)
        try {
          const response = await fetch("/api/user/profile");
          if (response.ok) {
            const data = await response.json();
            // Only update fields that Clerk doesn't provide
            setFormData((prev) => ({
              ...prev,
              phone: data.user.phone || prev.phone,
              address: data.user.address || prev.address,
            }));
          }
        } catch (error) {
          safeLog("warn", "Could not load additional profile data", { error: error instanceof Error ? error.message : String(error) });
        }
      }
    };

    loadUserData();
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Profile updated successfully!");
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to update profile");
      }
    } catch (error) {
      safeLogError("Error updating profile", error);
      toast.error("An error occurred while updating your profile");
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-orange-50">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isSignedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-orange-50">
      <Header />

      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-amber-400 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
              {user?.firstName?.[0] ||
                user?.primaryEmailAddress?.emailAddress?.[0]?.toUpperCase()}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              My Profile
            </h1>
            <p className="text-gray-600">Manage your account information</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  placeholder="First name"
                />
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  placeholder="Last name"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                placeholder="Email address"
              />
              <p className="text-sm text-gray-500 mt-1">
                Email address cannot be changed
              </p>
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                placeholder="Phone number"
              />
            </div>

            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Address
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                placeholder="Your address"
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-orange-400 to-amber-400 text-white py-3 px-4 rounded-lg hover:from-orange-500 hover:to-amber-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? "Updating..." : "Update Profile"}
              </button>

              <button
                type="button"
                onClick={() => router.push("/orders")}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                View Orders
              </button>
            </div>
          </form>

          <div className="mt-8 pt-8 border-t">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Account Information
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Account created:</span>
                <span className="text-gray-900">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : "Recently"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Account type:</span>
                <span className="text-gray-900">Customer</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Sign-in method:</span>
                <span className="text-gray-900">
                  {user?.externalAccounts?.length
                    ? "OAuth Provider"
                    : "Email/Password"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
