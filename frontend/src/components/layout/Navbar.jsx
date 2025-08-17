import { Link } from 'react-router-dom'

const Navbar = () => {
  return (
    <nav className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-xl font-bold">BBSR Grocery</Link>
          <div className="hidden md:flex space-x-6">
            <Link to="/" className="hover:text-accent transition-colors">Home</Link>
            <Link to="/products" className="hover:text-accent transition-colors">Products</Link>
            <Link to="/stores" className="hover:text-accent transition-colors">Stores</Link>
            <Link to="/about" className="hover:text-accent transition-colors">About</Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/cart" className="hover:text-accent transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </Link>
            <Link to="/login" className="bg-white text-primary px-4 py-2 rounded-md hover:bg-accent hover:text-white transition-colors">Login</Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar