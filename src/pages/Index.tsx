
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Hero Section */}
      <section className="container mx-auto pt-20 pb-16 px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Shaurya Career Connect
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Connecting students with the right opportunities and employers with the right talent.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/student/login">Student Login</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/admin/login">Admin Login</Link>
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 my-16">
          <Card>
            <CardHeader>
              <CardTitle>For Students</CardTitle>
              <CardDescription>Find opportunities aligned with your skills</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Apply to jobs from top companies</li>
                <li>Track your application status</li>
                <li>Manage your profile and resume</li>
                <li>Get personalized job recommendations</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>For Recruiters</CardTitle>
              <CardDescription>Find the right talent for your organization</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Post job opportunities</li>
                <li>Review student applications</li>
                <li>Filter candidates based on criteria</li>
                <li>Schedule interviews and send offers</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>For Administrators</CardTitle>
              <CardDescription>Manage the platform efficiently</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Verify student profiles</li>
                <li>Approve job postings</li>
                <li>Monitor application processes</li>
                <li>Generate reports and analytics</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6">
        <div className="container mx-auto px-4 text-center">
          <p>© {new Date().getFullYear()} Shaurya Career Connect. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
