"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../context/auth-context";
import { db } from "../lib/firebase";
import {
  query,
  collection,
  where,
  getDocs,
} from "firebase/firestore";
import { startOfDay, endOfDay } from "date-fns";
import Link from "next/link";

export default function ReportPage() {
  const { user } = useAuth();
  const [report, setReport] = useState({ bottles: 0, income: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      if (!user?.uid) return;

      const todayStart = startOfDay(new Date());
      const todayEnd = endOfDay(new Date());

      try {
        // Today's Deliveries
        const deliveryQuery = query(
          collection(db, "users", user.uid, "customers"),
          where("date", ">=", todayStart),
          where("date", "<=", todayEnd)
        );
        const deliverySnapshot = await getDocs(deliveryQuery);

        let totalBottles = 0;
        for (const customerDoc of deliverySnapshot.docs) {
          const deliveriesQuery = query(
            collection(db, "users", user.uid, "customers", customerDoc.id, "deliveries"),
            where("date", ">=", todayStart),
            where("date", "<=", todayEnd)
          );
          const customerDeliveries = await getDocs(deliveriesQuery);
          customerDeliveries.forEach((doc) => {
            totalBottles += doc.data().bottles || 0;
          });
        }

        // Today's Payments
        let totalIncome = 0;
        for (const customerDoc of deliverySnapshot.docs) {
          const paymentsQuery = query(
            collection(db, "users", user.uid, "customers", customerDoc.id, "payments"),
            where("date", ">=", todayStart),
            where("date", "<=", todayEnd)
          );
          const customerPayments = await getDocs(paymentsQuery);
          customerPayments.forEach((doc) => {
            totalIncome += doc.data().amount || 0;
          });
        }

        setReport({ bottles: totalBottles, income: totalIncome });
      } catch (error) {
        console.error("Error fetching report:", error);
        alert("Failed to fetch report.");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [user]);

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-purple-700">
        📊 Today's Report
      </h1>

      {loading ? (
        <p>Loading report...</p>
      ) : (
        <div className="bg-white border p-4 rounded shadow">
          <p className="text-lg mb-2 text-black">
            🧴 <strong>Total Bottles Delivered:</strong> {report.bottles}
          </p>
          <p className="text-lg mb-2 text-black">
            💰 <strong>Total Income:</strong> ₹{report.income}
          </p>
        </div>
      )}

      <Link href="/">
        <button className="mt-6 bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800">
          ⬅ Back to Home
        </button>
      </Link>
    </div>
  );
}
