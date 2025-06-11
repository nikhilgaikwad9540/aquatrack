"use client";

import { useState } from "react";
// import { db } from "@/lib/firebase";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function AddCustomerPage() {
  const [form, setForm] = useState({
    name: "",
    building: "",
    room: "",
    contact: "",
    bottlePrice: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addDoc(collection(db, "customers"), {
        ...form,
        bottlePrice: Number(form.bottlePrice),
        createdAt: serverTimestamp(),
      });

      setSuccess("Customer added successfully!");
      setForm({
        name: "",
        building: "",
        room: "",
        contact: "",
        bottlePrice: "",
      });
    } catch (error) {
      console.error("Error adding customer:", error);
      alert("Failed to add customer. Check console.");
    }

    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded-lg shadow bg-white">
      <h2 className="text-2xl font-semibold mb-4">Add New Customer</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {["name", "building", "room", "contact", "bottlePrice"].map((field) => (
          <input
            key={field}
            name={field}
            type={field === "bottlePrice" ? "number" : "text"}
            placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
            value={form[field]}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded-md"
            required
          />
        ))}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? "Adding..." : "Add Customer"}
        </button>

        {success && <p className="text-green-600 text-sm">{success}</p>}
      </form>
    </div>
  );
}
