import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-6">
      <div className="bg-white shadow-lg rounded-3xl p-10 max-w-lg w-full text-center">

        <AlertTriangle
          size={70}
          className="mx-auto text-red-500 mb-6"
        />

        <h1 className="text-6xl font-extrabold text-gray-800">
          404
        </h1>

        <h2 className="text-2xl font-semibold mt-4">
          Page Not Found
        </h2>

        <p className="text-gray-500 mt-3 leading-relaxed">
          The page you are looking for doesn't exist,
          may have been moved, or the link is incorrect.
        </p>

        <Link
          to="/"
          className="
            inline-block
            mt-8
            bg-blue-600
            hover:bg-blue-700
            text-white
            px-6
            py-3
            rounded-xl
            transition
          "
        >
          Back to Login
        </Link>

      </div>
    </div>
  );
};

export default NotFound;