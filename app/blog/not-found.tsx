import Link from 'next/link'

export default function BlogNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Blog Post Not Found
          </h2>
          <p className="text-gray-600 mb-8">
            The blog post you're looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link 
            href="/blog" 
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            View All Blog Posts
          </Link>
          
          <div>
            <Link 
              href="/" 
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}