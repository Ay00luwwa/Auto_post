export const AuthIllustration = () => {
  return (
    <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-center bg-gradient-to-br from-primary-600 via-primary-500 to-primary-700 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 p-12 transition-colors duration-200">
      <div className="w-full max-w-md">
        <div className="text-white mb-8">
          <h1 className="text-4xl font-bold mb-4">Automate Your Social Media</h1>
          <p className="text-primary-100 text-lg">
            Schedule and manage posts across multiple platforms from one place
          </p>
        </div>
        
        {/* SVG Illustration */}
        <div className="mt-12">
          <svg
            viewBox="0 0 400 300"
            className="w-full h-auto"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Social Media Icons */}
            <g opacity="0.3">
              {/* Twitter/X */}
              <circle cx="80" cy="80" r="40" fill="white" />
              <path
                d="M65 80 L75 90 L95 70"
                stroke="#1DA1F2"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              
              {/* Instagram */}
              <circle cx="200" cy="80" r="40" fill="white" />
              <rect x="170" y="50" width="60" height="60" rx="15" stroke="#E4405F" strokeWidth="3" fill="none" />
              <circle cx="200" cy="80" r="12" fill="#E4405F" />
              <circle cx="220" cy="60" r="4" fill="#E4405F" />
              
              {/* LinkedIn */}
              <circle cx="320" cy="80" r="40" fill="white" />
              <path
                d="M300 70 L310 100 L330 100 L340 70"
                stroke="#0077B5"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <circle cx="305" cy="75" r="3" fill="#0077B5" />
              
              {/* YouTube */}
              <circle cx="140" cy="200" r="40" fill="white" />
              <path
                d="M125 190 L155 210 L125 230 Z"
                fill="#FF0000"
              />
              
              {/* Facebook */}
              <circle cx="260" cy="200" r="40" fill="white" />
              <path
                d="M240 180 Q260 170 280 180 L280 220 Q260 230 240 220 Z"
                fill="#1877F2"
              />
            </g>
            
            {/* Central Connection Lines */}
            <g stroke="white" strokeWidth="2" opacity="0.4" strokeDasharray="5,5">
              <line x1="120" y1="120" x2="160" y2="160" />
              <line x1="240" y1="120" x2="200" y2="160" />
              <line x1="280" y1="120" x2="240" y2="160" />
            </g>
            
            {/* Calendar/Schedule Icon */}
            <g transform="translate(150, 220)">
              <rect x="0" y="0" width="100" height="80" rx="8" fill="white" opacity="0.2" />
              <rect x="10" y="10" width="80" height="50" rx="4" fill="white" opacity="0.3" />
              <line x1="30" y1="30" x2="70" y2="30" stroke="white" strokeWidth="2" />
              <line x1="30" y1="45" x2="50" y2="45" stroke="white" strokeWidth="2" />
              <line x1="30" y1="60" x2="60" y2="60" stroke="white" strokeWidth="2" />
            </g>
          </svg>
        </div>
        
        {/* Features List */}
        <div className="mt-12 space-y-4">
          <div className="flex items-center text-white">
            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Schedule posts across multiple platforms</span>
          </div>
          <div className="flex items-center text-white">
            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Manage all your accounts in one place</span>
          </div>
          <div className="flex items-center text-white">
            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Track performance and analytics</span>
          </div>
        </div>
      </div>
    </div>
  );
};

