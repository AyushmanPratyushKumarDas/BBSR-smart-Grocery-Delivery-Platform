import { 
  Truck, 
  Shield, 
  Users, 
  Award, 
  MapPin, 
  Phone, 
  Mail, 
  Clock,
  Heart,
  Star,
  Zap,
  Leaf
} from 'lucide-react';

const AboutPage = () => {
  const stats = [
    { label: 'Happy Customers', value: '10,000+', icon: Users },
    { label: 'Products Available', value: '5,000+', icon: Award },
    { label: 'Delivery Partners', value: '200+', icon: Truck },
    { label: 'Cities Served', value: '1', icon: MapPin },
  ];

  const values = [
    {
      icon: Heart,
      title: 'Customer First',
      description: 'We prioritize our customers\' needs and satisfaction above everything else.',
    },
    {
      icon: Shield,
      title: 'Quality Assurance',
      description: 'Every product is carefully selected and quality-checked before delivery.',
    },
    {
      icon: Zap,
      title: 'Fast Delivery',
      description: 'Get your groceries delivered within 2 hours of ordering.',
    },
    {
      icon: Leaf,
      title: 'Fresh & Local',
      description: 'We source fresh products directly from local farmers and suppliers.',
    },
  ];

  const team = [
    {
      name: 'Rahul Sharma',
      role: 'Founder & CEO',
      image: '/team/rahul.jpg',
      bio: 'Passionate about revolutionizing grocery delivery in Bhubaneswar.',
    },
    {
      name: 'Priya Patel',
      role: 'Head of Operations',
      image: '/team/priya.jpg',
      bio: 'Ensuring smooth operations and excellent customer service.',
    },
    {
      name: 'Amit Kumar',
      role: 'Head of Technology',
      image: '/team/amit.jpg',
      bio: 'Building innovative solutions for seamless shopping experience.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          About BBSR Grocery
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          We're on a mission to make grocery shopping convenient, fast, and reliable 
          for the people of Bhubaneswar. Our smart delivery platform connects local 
          stores with customers, ensuring fresh products reach your doorstep.
        </p>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="flex justify-center mb-4">
              <stat.icon className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
            <div className="text-sm text-gray-600">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Story Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
          <div className="space-y-4 text-gray-600">
            <p>
              BBSR Grocery was born from a simple observation: the people of Bhubaneswar 
              needed a better way to shop for groceries. Traditional grocery shopping 
              was time-consuming, and existing delivery services were unreliable.
            </p>
            <p>
              Founded in 2023, we started with a vision to create a seamless grocery 
              delivery experience that would save time and provide quality products 
              to our community. Today, we're proud to serve thousands of customers 
              across Bhubaneswar with our innovative platform.
            </p>
            <p>
              Our journey has been driven by customer feedback and continuous 
              improvement. We've built strong partnerships with local stores and 
              farmers, ensuring that our customers get the freshest products while 
              supporting the local economy.
            </p>
          </div>
        </div>
        <div className="bg-gray-100 rounded-lg p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Why Choose Us?</h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Star className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Quality Products</h4>
                <p className="text-sm text-gray-600">Carefully selected fresh groceries</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Truck className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Fast Delivery</h4>
                <p className="text-sm text-gray-600">Within 2 hours of ordering</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">Secure Payments</h4>
                <p className="text-sm text-gray-600">Multiple payment options available</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Users className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900">24/7 Support</h4>
                <p className="text-sm text-gray-600">Always here to help you</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Values</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((value) => (
            <div key={value.title} className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <value.icon className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{value.title}</h3>
              <p className="text-gray-600">{value.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mission & Vision */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        <div className="bg-green-50 rounded-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
          <p className="text-gray-600">
            To revolutionize grocery shopping in Bhubaneswar by providing a 
            convenient, reliable, and efficient delivery service that saves 
            time and ensures quality products reach every household.
          </p>
        </div>
        <div className="bg-blue-50 rounded-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h3>
          <p className="text-gray-600">
            To become the leading grocery delivery platform in Odisha, 
            connecting communities with fresh, quality products while 
            supporting local businesses and promoting sustainable practices.
          </p>
        </div>
      </div>

      {/* Team Section */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Meet Our Team</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {team.map((member) => (
            <div key={member.name} className="text-center">
              <div className="w-32 h-32 mx-auto mb-4 bg-gray-200 rounded-full overflow-hidden">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  <Users className="h-8 w-8" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{member.name}</h3>
              <p className="text-green-600 font-medium mb-2">{member.role}</p>
              <p className="text-gray-600 text-sm">{member.bio}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-gray-50 rounded-lg p-8">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Get in Touch</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <MapPin className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Address</h3>
            <p className="text-gray-600">
              BBSR Grocery<br />
              Bhubaneswar, Odisha<br />
              India
            </p>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Phone className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Phone</h3>
            <p className="text-gray-600">+91 98765 43210</p>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
            <p className="text-gray-600">support@bbsrgrocery.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
