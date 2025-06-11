"use client";

import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import HistoryModal from "../components/HistoryModal"; // Make sure this path is correct

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "customers"));
        const data = await Promise.all(
          querySnapshot.docs.map(async (doc) => {
            const customerData = doc.data();
            const bottlePrice = customerData.bottlePrice || 0;

            // Deliveries
            const deliveriesSnapshot = await getDocs(
              collection(db, "customers", doc.id, "deliveries")
            );
            let totalBottles = 0;
            deliveriesSnapshot.forEach((deliveryDoc) => {
              totalBottles += deliveryDoc.data().bottles || 0;
            });

            // Payments
            const paymentsSnapshot = await getDocs(
              collection(db, "customers", doc.id, "payments")
            );
            let totalPaid = 0;
            paymentsSnapshot.forEach((paymentDoc) => {
              totalPaid += paymentDoc.data().amount || 0;
            });

            const totalAmount = totalBottles * bottlePrice;
            const remainingDue = totalAmount - totalPaid;

            return {
              id: doc.id,
              ...customerData,
              totalBottles,
              totalPaid,
              outstanding: totalAmount,
              remainingDue,
            };
          })
        );
        setCustomers(data);
      } catch (error) {
        console.error("Error fetching customers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const handleAddBottle = async (customerId) => {
    const bottles = prompt("Enter number of bottles delivered:");
    const count = parseInt(bottles);

    if (isNaN(count) || count <= 0) {
      alert("Please enter a valid bottle number.");
      return;
    }

    try {
      await addDoc(collection(db, "customers", customerId, "deliveries"), {
        bottles: count,
        date: serverTimestamp(),
      });

      alert("Bottle entry added successfully! Please refresh to see updates.");
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
      await addDoc(collection(db, "customers", customerId, "payments"), {
        amount: amt,
        date: serverTimestamp(),
      });

      alert("Payment recorded successfully! Please refresh to see updates.");
    } catch (error) {
      console.error("Error recording payment:", error);
      alert("Failed to record payment.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto mt-10 p-4">
      <h2 className="text-2xl font-bold mb-4">All Customers</h2>

      {loading ? (
        <p>Loading...</p>
      ) : customers.length === 0 ? (
        <p>No customers found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 border">Name</th>
                <th className="px-4 py-2 border">Bldg</th>
                <th className="px-4 py-2 border">Room</th>
                <th className="px-4 py-2 border">Contact</th>
                <th className="px-4 py-2 border">Bottle Price</th>
                <th className="px-4 py-2 border">Added On</th>
                <th className="px-4 py-2 border">Bottles</th>
                <th className="px-4 py-2 border">Total ₹</th>
                <th className="px-4 py-2 border">Paid ₹</th>
                <th className="px-4 py-2 border">Due ₹</th>
                <th className="px-4 py-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((cust) => (
                <tr key={cust.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border">{cust.name}</td>
                  <td className="px-4 py-2 border">{cust.building}</td>
                  <td className="px-4 py-2 border">{cust.room}</td>
                  <td className="px-4 py-2 border">{cust.contact}</td>
                  <td className="px-4 py-2 border">₹{cust.bottlePrice}</td>
                  <td className="px-4 py-2 border">
                    {cust.createdAt?.toDate
                      ? cust.createdAt.toDate().toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td className="px-4 py-2 border">{cust.totalBottles}</td>
                  <td className="px-4 py-2 border">₹{cust.outstanding}</td>
                  <td className="px-4 py-2 border">₹{cust.totalPaid}</td>
                  <td className="px-4 py-2 border text-red-600 font-semibold">
                    ₹{cust.remainingDue}</td>
                  <td className="px-4 py-2 border flex flex-col gap-1">
                    <button
                      onClick={() => handleAddBottle(cust.id)}
                      className="bg-green-600 text-white px-2 py-1 rounded text-xs"
                    >
                      ➕ Bottle
                    </button>
                    <button
                      onClick={() => handleAddPayment(cust.id)}
                      className="bg-blue-600 text-white px-2 py-1 rounded text-xs"
                    >
                      💰 Pay
                    </button>
                    <button
                      onClick={() => setSelectedCustomer(cust)}
                      className="bg-orange-600 text-white px-2 py-1 rounded text-xs"
                    >
                      📜 History
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedCustomer && (
        <HistoryModal
          isOpen={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          customer={selectedCustomer}
        />
      )}
    </div>
  );
}
