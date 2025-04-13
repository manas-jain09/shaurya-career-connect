
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  Users, 
  Building, 
  FileCheck, 
  BarChart2, 
  Bell 
} from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-shaurya-primary">Shaurya</span>
              <span className="ml-2 text-sm bg-shaurya-light text-shaurya-primary px-2 py-0.5 rounded">
                Placement Portal
              </span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="nav-link">Features</a>
              <a href="#about" className="nav-link">About</a>
              <a href="#contact" className="nav-link">Contact</a>
            </nav>
            <div className="flex items-center space-x-4">
              <Link to="/login" className="btn-secondary">
                Login
              </Link>
              <Link to="/register" className="btn-primary">
                Register
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-shaurya-light to-blue-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:flex lg:items-center lg:justify-between">
            <div className="lg:w-1/2">
              <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
                Simplify Your <span className="text-shaurya-primary">Campus Placements</span>
              </h1>
              <p className="mt-6 text-xl text-gray-700">
                Shaurya streamlines the entire placement process for students and administrators,
                making it easier to connect talent with opportunities.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link to="/register" className="btn-primary text-center py-3 px-6">
                  Get Started
                </Link>
                <a 
                  href="#features" 
                  className="bg-white text-shaurya-primary border border-shaurya-primary font-medium rounded-md py-3 px-6 text-center hover:bg-shaurya-light transition-colors"
                >
                  Learn More
                </a>
              </div>
            </div>
            <div className="mt-10 lg:mt-0 lg:w-1/2 flex justify-center">
              <img 
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fHN0dWRlbnRzJTIwY29tcHV0ZXJ8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60" 
                alt="Students using placement portal" 
                className="rounded-lg shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Key Features</h2>
            <p className="mt-4 text-xl text-gray-600">
              Everything you need to streamline the placement process
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="dashboard-card p-6">
              <div className="h-12 w-12 bg-shaurya-light rounded-lg flex items-center justify-center text-shaurya-primary mb-4">
                <Users size={24} />
              </div>
              <h3 className="text-xl font-medium text-gray-900">Student Profiles</h3>
              <p className="mt-2 text-gray-600">
                Comprehensive student profiles with academic records, skills, and documents
              </p>
            </div>

            <div className="dashboard-card p-6">
              <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 mb-4">
                <Building size={24} />
              </div>
              <h3 className="text-xl font-medium text-gray-900">Job Listings</h3>
              <p className="mt-2 text-gray-600">
                Browse and apply to job opportunities from top companies
              </p>
            </div>

            <div className="dashboard-card p-6">
              <div className="h-12 w-12 bg-green-50 rounded-lg flex items-center justify-center text-green-500 mb-4">
                <FileCheck size={24} />
              </div>
              <h3 className="text-xl font-medium text-gray-900">Admin Verification</h3>
              <p className="mt-2 text-gray-600">
                Thorough profile verification process to ensure data accuracy
              </p>
            </div>

            <div className="dashboard-card p-6">
              <div className="h-12 w-12 bg-yellow-50 rounded-lg flex items-center justify-center text-yellow-500 mb-4">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-xl font-medium text-gray-900">Eligibility Filtering</h3>
              <p className="mt-2 text-gray-600">
                Intelligent matching of students to jobs based on eligibility criteria
              </p>
            </div>

            <div className="dashboard-card p-6">
              <div className="h-12 w-12 bg-purple-50 rounded-lg flex items-center justify-center text-purple-500 mb-4">
                <Bell size={24} />
              </div>
              <h3 className="text-xl font-medium text-gray-900">Notifications</h3>
              <p className="mt-2 text-gray-600">
                Real-time updates about application status and new opportunities
              </p>
            </div>

            <div className="dashboard-card p-6">
              <div className="h-12 w-12 bg-pink-50 rounded-lg flex items-center justify-center text-pink-500 mb-4">
                <BarChart2 size={24} />
              </div>
              <h3 className="text-xl font-medium text-gray-900">Placement Analytics</h3>
              <p className="mt-2 text-gray-600">
                Detailed reports and insights on placement statistics
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:flex lg:items-center lg:gap-16">
            <div className="lg:w-1/2">
              <h2 className="text-3xl font-bold text-gray-900">About Shaurya</h2>
              <p className="mt-4 text-lg text-gray-600">
                Shaurya is a comprehensive placement automation platform designed specifically for 
                educational institutions. Our mission is to bridge the gap between talented students 
                and industry opportunities through a streamlined, transparent process.
              </p>
              <p className="mt-4 text-lg text-gray-600">
                With Shaurya, institutions can manage the entire placement lifecycle - from student 
                registration and profile verification to job posting, application tracking, and 
                placement analytics - all in one integrated platform.
              </p>
            </div>
            <div className="mt-10 lg:mt-0 lg:w-1/2 flex justify-center">
              <img 
                src="https://images.unsplash.com/photo-1531482615713-2afd69097998?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGNvbGxlZ2UlMjBjYW1wdXN8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=500&q=60" 
                alt="College campus" 
                className="rounded-lg shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials/Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Trusted by Institutions</h2>
            <p className="mt-4 text-xl text-gray-600">
              See the impact Shaurya has made
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center dashboard-card p-6">
              <p className="text-5xl font-bold text-shaurya-primary">20+</p>
              <p className="mt-2 text-xl text-gray-600">Institutions</p>
            </div>
            <div className="text-center dashboard-card p-6">
              <p className="text-5xl font-bold text-shaurya-primary">15,000+</p>
              <p className="mt-2 text-xl text-gray-600">Students</p>
            </div>
            <div className="text-center dashboard-card p-6">
              <p className="text-5xl font-bold text-shaurya-primary">500+</p>
              <p className="mt-2 text-xl text-gray-600">Companies</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Get in Touch</h2>
            <p className="mt-4 text-xl text-gray-600">
              Have questions? We're here to help.
            </p>
          </div>

          <div className="mt-12 max-w-lg mx-auto">
            <form className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="form-label">Name</label>
                  <input id="name" type="text" className="form-input" placeholder="Your name" />
                </div>
                <div>
                  <label htmlFor="email" className="form-label">Email</label>
                  <input id="email" type="email" className="form-input" placeholder="Your email" />
                </div>
              </div>
              <div>
                <label htmlFor="subject" className="form-label">Subject</label>
                <input id="subject" type="text" className="form-input" placeholder="Subject" />
              </div>
              <div>
                <label htmlFor="message" className="form-label">Message</label>
                <textarea 
                  id="message" 
                  rows={4} 
                  className="form-input" 
                  placeholder="Your message"
                ></textarea>
              </div>
              <Button type="submit" className="w-full bg-shaurya-primary hover:bg-shaurya-dark">
                Send Message
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold">Shaurya</h3>
              <p className="mt-4 text-gray-400">
                Simplifying campus placements for institutions and students across India.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium">Quick Links</h3>
              <ul className="mt-4 space-y-2">
                <li><a href="#features" className="text-gray-400 hover:text-white">Features</a></li>
                <li><a href="#about" className="text-gray-400 hover:text-white">About</a></li>
                <li><a href="#contact" className="text-gray-400 hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium">Resources</h3>
              <ul className="mt-4 space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium">Contact Us</h3>
              <ul className="mt-4 space-y-2 text-gray-400">
                <li>info@shaurya.edu</li>
                <li>+91 123 456 7890</li>
                <li>Bangalore, India</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Shaurya. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
