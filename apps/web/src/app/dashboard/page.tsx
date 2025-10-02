'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useTenant } from '@/contexts/tenant-context';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  TrendingUp, 
  Calendar,
  Bell,
  Settings,
  LogOut,
  School,
  UserCheck,
  Activity
} from 'lucide-react';
import { academicApi, studentApi } from '@/lib/api-client';

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  activeAcademicYears: number;
  recentEnrollments: number;
  pendingApprovals: number;
}

export default function DashboardPage() {
  const { user, logout, hasRole, hasPermission } = useAuth();
  const { tenant } = useTenant();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    activeAcademicYears: 0,
    recentEnrollments: 0,
    pendingApprovals: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);

        // Fetch data in parallel
        const [studentsResponse, academicYearsResponse, classesResponse] = await Promise.all([
          studentApi.getAll({ page: 1, limit: 1 }),
          academicApi.getAcademicYears(false),
          academicApi.getClasses(),
        ]);

        setStats({
          totalStudents: studentsResponse.data?.pagination?.total || 0,
          totalTeachers: 25, // Mock data - would come from teacher API
          totalClasses: classesResponse.data?.classes?.length || 0,
          activeAcademicYears: academicYearsResponse.data?.academicYears?.length || 0,
          recentEnrollments: 12, // Mock data
          pendingApprovals: 5, // Mock data
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      SUPER_ADMIN: 'Super Administrator',
      TENANT_ADMIN: 'Administrator',
      PRINCIPAL: 'Principal',
      VICE_PRINCIPAL: 'Vice Principal',
      TEACHER: 'Teacher',
      STUDENT: 'Student',
      PARENT: 'Parent',
      STAFF: 'Staff',
      LIBRARIAN: 'Librarian',
      ACCOUNTANT: 'Accountant',
    };
    return roleMap[role] || role;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (!user || !tenant) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <School className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {tenant.name}
                </h1>
                <p className="text-sm text-gray-500">
                  {tenant.subdomain}.edumyles.com
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logout()}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            {getGreeting()}, {user.firstName}!
          </h2>
          <div className="mt-2 flex items-center space-x-4">
            <Badge variant="secondary">
              {getRoleDisplayName(user.role)}
            </Badge>
            <span className="text-gray-500">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {/* Total Students */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {isLoading ? '...' : stats.totalStudents.toLocaleString()}
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Teachers */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Teachers</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {isLoading ? '...' : stats.totalTeachers.toLocaleString()}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Classes */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Classes</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {isLoading ? '...' : stats.totalClasses.toLocaleString()}
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Academic Years */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Academic Years</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {isLoading ? '...' : stats.activeAcademicYears.toLocaleString()}
                  </p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasPermission(['student:create', 'admin:all']) && (
                <Button className="w-full justify-start" variant="outline">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Register New Student
                </Button>
              )}
              {hasPermission(['academic:create', 'admin:all']) && (
                <Button className="w-full justify-start" variant="outline">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Create New Class
                </Button>
              )}
              {hasRole(['PRINCIPAL', 'VICE_PRINCIPAL', 'TENANT_ADMIN']) && (
                <Button className="w-full justify-start" variant="outline">
                  <Activity className="h-4 w-4 mr-2" />
                  View Reports
                </Button>
              )}
              <Button className="w-full justify-start" variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Event
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="h-2 w-2 bg-green-500 rounded-full mt-2"></div>
                  <div className="text-sm">
                    <p className="font-medium">New student registered</p>
                    <p className="text-gray-500">John Doe - Grade 10</p>
                    <p className="text-xs text-gray-400">2 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="h-2 w-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="text-sm">
                    <p className="font-medium">Class schedule updated</p>
                    <p className="text-gray-500">Mathematics - Grade 9A</p>
                    <p className="text-xs text-gray-400">4 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="h-2 w-2 bg-purple-500 rounded-full mt-2"></div>
                  <div className="text-sm">
                    <p className="font-medium">New teacher added</p>
                    <p className="text-gray-500">Jane Smith - Science Department</p>
                    <p className="text-xs text-gray-400">1 day ago</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="h-2 w-2 bg-orange-500 rounded-full mt-2"></div>
                  <div className="text-sm">
                    <p className="font-medium">Academic year created</p>
                    <p className="text-gray-500">2024-2025 Academic Year</p>
                    <p className="text-xs text-gray-400">2 days ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Module Status */}
        {hasRole(['SUPER_ADMIN', 'TENANT_ADMIN']) && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Installed Modules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {user.installedModules?.map((module: any) => (
                  <Badge key={module.id} variant="secondary">
                    {module.module?.name || module.id} v{module.version}
                  </Badge>
                )) || (
                  <p className="text-gray-500">No modules installed</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}