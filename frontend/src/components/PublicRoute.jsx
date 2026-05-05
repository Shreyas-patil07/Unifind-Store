import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PublicRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to dashboard if already authenticated
  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  // Render the public page if not authenticated
  return children;
};

export default PublicRoute;

