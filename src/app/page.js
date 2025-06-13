import ProtectedRoute from "./components/ProtectedRoute";
import HomePage from "./home"; // Rename your homepage logic to this file

export default function Page() {
  return (
    <ProtectedRoute>
      <HomePage />
    </ProtectedRoute>
  );
}
