import React from 'react';
import { useNavigate } from 'react-router-dom';

const Consultation = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
              Your Mental Wellness Journey Starts Here
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Professional support from licensed psychiatrists to help you navigate life's challenges. 
              Take the first step towards better mental health with our confidential and personalized consultations.
            </p>
            <button
              onClick={() => navigate('/book-appointment')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-300 shadow-lg hover:shadow-xl"
            >
              Book a Session
            </button>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <img
              src="/images/consultation-hero.avif"
              alt="Professional Mental Health Consultation"
              className="w-full max-w-lg rounded-lg shadow-2xl transform hover:scale-105 transition duration-300"
            />
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Why Choose Professional Support?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-blue-50 p-6 rounded-lg shadow-md hover:shadow-lg transition duration-300">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Expert Guidance</h3>
              <p className="text-gray-600">
                Get professional advice from licensed psychiatrists who understand your unique needs.
              </p>
            </div>
            <div className="bg-blue-50 p-6 rounded-lg shadow-md hover:shadow-lg transition duration-300">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Confidential Space</h3>
              <p className="text-gray-600">
                Your privacy is our priority. All sessions are completely confidential and secure.
              </p>
            </div>
            <div className="bg-blue-50 p-6 rounded-lg shadow-md hover:shadow-lg transition duration-300">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Personalized Care</h3>
              <p className="text-gray-600">
                Receive tailored treatment plans and strategies that work for you.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">
          Ready to Take the First Step?
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          Book your consultation today and start your journey to better mental health.
        </p>
        <button
          onClick={() => navigate('/book-appointment')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-300 shadow-lg hover:shadow-xl"
        >
          Schedule Your Session
        </button>
      </div>
    </div>
  );
};

export default Consultation; 