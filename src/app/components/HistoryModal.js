import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../../context/auth-context"; // 👈 make sure you have auth context

export default function HistoryModal({ isOpen, onClose, customer }) {
  const [history, setHistory] = useState({ deliveries: [], payments: [] });
  const { user } = useAuth(); // 👈 Get current signed-in user

  useEffect(() => {
    if (!customer || !user?.uid) return;

    const fetchHistory = async () => {
      try {
        const [paymentsSnapshot, deliveriesSnapshot] = await Promise.all([
          getDocs(collection(db, "users", user.uid, "customers", customer.id, "payments")),
          getDocs(collection(db, "users", user.uid, "customers", customer.id, "deliveries")),
        ]);

        const payments = paymentsSnapshot.docs.map((doc) => {
          const d = doc.data();
          return {
            amount: d.amount,
            date: d.date?.toDate()?.toLocaleDateString() || "No Date",
          };
        });

        const deliveries = deliveriesSnapshot.docs.map((doc) => {
          const d = doc.data();
          return {
            bottles: d.bottles,
            date: d.date?.toDate()?.toLocaleDateString() || "No Date",
          };
        });

        setHistory({ deliveries, payments });
      } catch (error) {
        console.error("❌ Error fetching history:", error.message);
      }
    };

    fetchHistory();
  }, [customer, user]);

  if (!isOpen || !customer) return null;

  const totalPaid = history.payments.reduce((sum, p) => sum + p.amount, 0);
  const totalBottles = history.deliveries.reduce((sum, d) => sum + d.bottles, 0);
  const totalAmount = totalBottles * customer.bottlePrice;
  const outstanding = totalAmount - totalPaid;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-lg">
        <h2 className="text-xl font-bold mb-2 text-indigo-600">
          📜 History for {customer.name}
        </h2>

        <div className="mb-4">
          <h3 className="font-semibold text-black">🚚 Deliveries</h3>
          <ul className="list-disc list-inside text-sm text-gray-700">
            {history.deliveries.length > 0 ? (
              history.deliveries.map((d, i) => (
                <li key={i}>{d.bottles} bottle(s) on {d.date}</li>
              ))
            ) : (
              <li>No deliveries</li>
            )}
          </ul>
        </div>

        <div className="mb-4">
          <h3 className="font-semibold text-black">💰 Payments</h3>
          <ul className="list-disc list-inside text-sm text-gray-700">
            {history.payments.length > 0 ? (
              history.payments.map((p, i) => (
                <li key={i}>₹{p.amount} on {p.date}</li>
              ))
            ) : (
              <li>No payments</li>
            )}
          </ul>
        </div>

        <div className="mt-4 text-sm text-gray-800">
          <p><strong>Total Bottles:</strong> {totalBottles}</p>
          <p><strong>Total Amount:</strong> ₹{totalAmount}</p>
          <p><strong>Total Paid:</strong> ₹{totalPaid}</p>
          <p><strong>Outstanding:</strong> ₹{outstanding}</p>
        </div>

        <button
          onClick={onClose}
          className="mt-6 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
}
