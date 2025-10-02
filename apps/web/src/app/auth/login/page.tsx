'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantSubdomain, setTenantSubdomain] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  // Auto-detect tenant from localStorage or domain
  useState(() => {
    const detectedSubdomain = localStorage.getItem('detected_subdomain');
    if (detectedSubdomain) {
      setTenantSubdomain(detectedSubdomain);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password, tenantSubdomain || undefined);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className=\"min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50\">
      <div className=\"w-full max-w-md space-y-6 px-4\">
        {/* Logo and Title */}
        <div className=\"text-center\">
          <h1 className=\"text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent\">
            EduMyles
          </h1>
          <p className=\"text-gray-600\">
            Sign in to your school management system
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className=\"space-y-4\">
              {/* Tenant Subdomain */}
              <div className=\"space-y-2\">
                <Label htmlFor=\"tenantSubdomain\">
                  School/Organization
                </Label>
                <Input
                  id=\"tenantSubdomain\"
                  type=\"text\"
                  placeholder=\"e.g., demo, myschool\"
                  value={tenantSubdomain}
                  onChange={(e) => setTenantSubdomain(e.target.value)}
                  disabled={isLoading}
                />
                <p className=\"text-xs text-gray-500\">
                  Your organization's subdomain identifier
                </p>
              </div>

              {/* Email */}
              <div className=\"space-y-2\">
                <Label htmlFor=\"email\">Email</Label>
                <Input
                  id=\"email\"
                  type=\"email\"
                  placeholder=\"Enter your email\"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Password */}
              <div className=\"space-y-2\">
                <Label htmlFor=\"password\">Password</Label>
                <Input
                  id=\"password\"
                  type=\"password\"
                  placeholder=\"Enter your password\"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Error Message */}
              {error && (
                <Alert variant=\"destructive\">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button 
                type=\"submit\" 
                className=\"w-full\" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className=\"mr-2 h-4 w-4 animate-spin\" />
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Additional Links */}
            <div className=\"mt-6 space-y-2 text-center text-sm\">
              <p className=\"text-gray-600\">
                Don't have an account?{' '}
                <button
                  onClick={() => router.push('/auth/register')}
                  className=\"text-blue-600 hover:text-blue-500 font-medium\"
                  disabled={isLoading}
                >
                  Sign up
                </button>
              </p>
              <p>
                <button
                  onClick={() => router.push('/auth/forgot-password')}
                  className=\"text-blue-600 hover:text-blue-500 font-medium\"
                  disabled={isLoading}
                >
                  Forgot your password?
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        <Card className=\"border-amber-200 bg-amber-50\">
          <CardContent className=\"pt-6\">
            <div className=\"text-center space-y-2\">
              <h3 className=\"font-semibold text-amber-800\">Demo Access</h3>
              <div className=\"text-sm text-amber-700 space-y-1\">
                <p><strong>Subdomain:</strong> demo</p>
                <p><strong>Admin:</strong> admin@demo.school / admin123</p>
                <p><strong>Teacher:</strong> teacher@demo.school / teacher123</p>
                <p><strong>Student:</strong> student@demo.school / student123</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}