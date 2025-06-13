"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { db } from "./lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "../context/auth-context";
import { query, collectionGroup, where } from "firebase/firestore";
import { startOfDay, endOfDay } from "date-fns";

export default function HomePage() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      if (!user?.uid) return;

      try {
        const snapshot = await getDocs(
          collection(db, "users", user.uid, "customers")
        );
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCustomers(data);
      } catch (err) {
        console.error("Error fetching customers:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [user]);

  const handleSelectCustomer = async (cust) => {
    try {
      const [deliveriesSnap, paymentsSnap] = await Promise.all([
        getDocs(
          collection(
            db,
            "users",
            user.uid,
            "customers",
            cust.id,
            "deliveries"
          )
        ),
        getDocs(
          collection(db, "users", user.uid, "customers", cust.id, "payments")
        ),
      ]);

      let totalBottles = 0;
      let totalPaid = 0;

      deliveriesSnap.forEach((doc) => {
        totalBottles += doc.data().bottles || 0;
      });

      paymentsSnap.forEach((doc) => {
        totalPaid += doc.data().amount || 0;
      });

      const totalAmount = totalBottles * (cust.bottlePrice || 0);
      const remainingDue = totalAmount - totalPaid;

      setSelectedCustomer({
        ...cust,
        totalBottles,
        totalPaid,
        totalAmount,
        remainingDue,
      });
    } catch (error) {
      console.error("Error loading customer details:", error);
      alert("Failed to load customer history.");
    }
  };

  const handleAddBottle = async (customerId) => {
    const bottles = prompt("Enter number of bottles delivered:");
    const count = parseInt(bottles);
    if (isNaN(count) || count <= 0) {
      alert("Please enter a valid bottle number.");
      return;
    }

    try {
      await addDoc(
        collection(
          db,
          "users",
          user.uid,
          "customers",
          customerId,
          "deliveries"
        ),
        {
          bottles: count,
          date: serverTimestamp(),
        }
      );

      alert("Bottle entry added successfully!");
      location.reload();
    } catch (error) {
      console.error("Error adding delivery:", error);
      alert("Failed to add delivery.");
    }
  };

  const handleAddPayment = async (customerId) => {
    const amount = prompt("Enter amount paid:");
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    try {
      await addDoc(
        collection(
          db,
          "users",
          user.uid,
          "customers",
          customerId,
          "payments"
        ),
        {
          amount: amt,
          date: serverTimestamp(),
        }
      );

      alert("Payment recorded successfully!");
      location.reload();
    } catch (error) {
      console.error("Error recording payment:", error);
      alert("Failed to record payment.");
    }
  };

  const filteredCustomers = customers.filter((cust) => {
    const term = searchTerm.toLowerCase();
    return (
      cust.name?.toLowerCase().includes(term) ||
      cust.building?.toLowerCase().includes(term) ||
      cust.contact?.toString().includes(term)
    );
  });


  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">🚚 Water Bottle Delivery</h1>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by name, building or contact"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border px-4 py-2 w-full max-w-md rounded shadow-sm"
        />

        <button
          onClick={() => router.push("/customers")}
          className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded"
        >
          🔍 All Customer Detail
        </button>

        <Link href="/add-customer">
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            ➕ New Customer
          </button>
        </Link>

        <Link href="/report">
        <button className="bg-purple-600 text-white px-4 py-2 rounded mt-4">
          📊 Show Today Report
        </button>
      </Link>

        <button
          onClick={signOut}
          className="bg-red-600 text-white px-3 py-1 rounded"
        >
          🔓 Logout
        </button>
      </div>

      {loading ? (
        <p>Loading customers...</p>
      ) : selectedCustomer ? (
        <div className="bg-white border rounded p-4 shadow-md text-black">
          <h2 className="text-xl font-semibold mb-4 text-black">
            Details for {selectedCustomer.name}
          </h2>
          <p>
            <strong>Building:</strong> {selectedCustomer.building}
          </p>
          <p>
            <strong>Room:</strong> {selectedCustomer.room}
          </p>
          <p>
            <strong>Contact:</strong> {selectedCustomer.contact}
          </p>
          <p>
            <strong>Total Bottles:</strong> {selectedCustomer.totalBottles}
          </p>
          <p>
            <strong>Bottle Price:</strong> ₹{selectedCustomer.bottlePrice}
          </p>
          <p>
            <strong>Total Amount:</strong> ₹{selectedCustomer.totalAmount}
          </p>
          <p>
            <strong>Total Paid:</strong> ₹{selectedCustomer.totalPaid}
          </p>
          <p className="text-red-600 font-semibold">
            <strong>Due:</strong> ₹{selectedCustomer.remainingDue}
          </p>

          <div className="flex gap-4 mt-4">
            <button
              onClick={() => handleAddBottle(selectedCustomer.id)}
              className="bg-green-600 text-white px-3 py-1 rounded"
            >
              ➕ Bottle
            </button>
            <button
              onClick={() => handleAddPayment(selectedCustomer.id)}
              className="bg-blue-600 text-white px-3 py-1 rounded"
            >
              💰 Pay
            </button>
            <button
              onClick={() => setSelectedCustomer(null)}
              className="bg-gray-500 text-white px-3 py-1 rounded"
            >
              ⬅ Back
            </button>
          </div>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <p>No matching customers found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 border text-red-800">Name</th>
                <th className="px-4 py-2 border text-red-800">Building Name</th>
                <th className="px-4 py-2 border text-red-800">Room</th>
                <th className="px-4 py-2 border text-red-800">Contact</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((cust) => (
                <tr
                  key={cust.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleSelectCustomer(cust)}
                >
                  <td className="px-4 py-2 border">{cust.name}</td>
                  <td className="px-4 py-2 border">{cust.building}</td>
                  <td className="px-4 py-2 border">{cust.room}</td>
                  <td className="px-4 py-2 border">{cust.contact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
