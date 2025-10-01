export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="text-center px-4">
        <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          EduMyles
        </h1>
        <p className="text-2xl text-gray-700 mb-4">
          Modern School Management Platform
        </p>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          A comprehensive, modular school management system with multi-tenant architecture. 
          Manage academics, finances, communications, and more.
        </p>
      </div>
    </main>
  );
}