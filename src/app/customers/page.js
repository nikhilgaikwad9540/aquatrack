"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import HistoryModal from "../components/HistoryModal";

export default function CustomersPage() {
  const [user] = useAuthState(auth);
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      if (!user) return;

      try {
        const querySnapshot = await getDocs(
          collection(db, "users", user.uid, "customers")
        );

        const data = await Promise.all(
          querySnapshot.docs.map(async (doc) => {
            const customerData = doc.data();
            const bottlePrice = customerData.bottlePrice || 0;

            const deliveriesSnapshot = await getDocs(
              collection(db, "users", user.uid, "customers", doc.id, "deliveries")
            );
            let totalBottles = 0;
            deliveriesSnapshot.forEach((deliveryDoc) => {
              totalBottles += deliveryDoc.data().bottles || 0;
            });

            const paymentsSnapshot = await getDocs(
              collection(db, "users", user.uid, "customers", doc.id, "payments")
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
        setFilteredCustomers(data);
      } catch (error) {
        console.error("Error fetching customers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [user]);

  useEffect(() => {
    const query = searchQuery.toLowerCase();
    const filtered = customers.filter(
      (cust) =>
        cust.name.toLowerCase().includes(query) ||
        cust.building.toLowerCase().includes(query) ||
        cust.contact.toLowerCase().includes(query)
    );
    setFilteredCustomers(filtered);
  }, [searchQuery, customers]);

  const handleAddBottle = async (customerId) => {
    const bottles = prompt("Enter number of bottles delivered:");
    const count = parseInt(bottles);

    if (isNaN(count) || count <= 0) {
      alert("Please enter a valid bottle number.");
      return;
    }

    try {
      await addDoc(
        collection(db, "users", user.uid, "customers", customerId, "deliveries"),
        {
          bottles: count,
          date: serverTimestamp(),
        }
      );
      alert("Bottle entry added successfully! Please refresh.");
    } catch (error) {
      console.error("Error adding delivery:", error);
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
        collection(db, "users", user.uid, "customers", customerId, "payments"),
        {
          amount: amt,
          date: serverTimestamp(),
        }
      );
      alert("Payment recorded successfully! Please refresh.");
    } catch (error) {
      console.error("Error recording payment:", error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto mt-10 p-4">
      <h2 className="text-2xl font-bold mb-4">All Customers</h2>

      <input
        type="text"
        placeholder="Search by name, building, or contact"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="mb-4 p-2 border border-gray-300 rounded w-full max-w-md"
      />

      {loading ? (
        <p>Loading...</p>
      ) : filteredCustomers.length === 0 ? (
        <p>No customers found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm text-left">
            <thead className="bg-gray-100 text-red-800">
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
              {filteredCustomers.map((cust) => (
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
