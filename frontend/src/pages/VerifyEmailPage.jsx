import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { Button } from '../components/ui/Button';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');
  const verificationAttempted = useRef(false);

  useEffect(() => {
    const verifyEmail = async () => {
      // Prevent duplicate calls using ref
      if (verificationAttempted.current) return;
      verificationAttempted.current = true;
      
      const token = searchParams.get('token');
      
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link');
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/verify-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage('Your email has been verified successfully!');
          setTimeout(() => navigate('/login'), 3000);
        } else {
          setStatus('error');
          setMessage(data.detail || 'Verification failed');
        }
      } catch (error) {
        setStatus('error');
        setMessage('An error occurred during verification');
      }
    };

    verifyEmail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        {status === 'verifying' && (
          <>
            <Loader className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Verifying Your Email
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Please wait while we verify your email address...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Email Verified!
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {message}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Redirecting to login...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Verification Failed
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {message}
            </p>
            <Button onClick={() => navigate('/login')} className="w-full">
              Go to Login
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
