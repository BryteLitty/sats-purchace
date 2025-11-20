import brandIcon from "@/assets/icon.png";

export function Maintenance() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        backgroundImage: `url("/images/hero-image.webp")`,
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }}
    >
      <div className="w-full max-w-md mx-auto p-6">
        <div className="backdrop-blur-xl bg-gray-900/80 rounded-3xl shadow-2xl border border-gray-700/50 p-8 sm:p-12">
          {/* Icon */}
          <div className="flex justify-center mb-8">
            <img
              src={brandIcon}
              alt="BitSpenda Logo"
              className="h-20 w-20 sm:h-24 sm:w-24 object-contain"
            />
          </div>

          {/* Brand Name */}
          <div className="text-center mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              BitSpenda
            </h1>
            <p className="text-sm text-gray-400">Buy Bitcoin Instantly</p>
          </div>

          {/* Maintenance Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <svg
                className="w-16 h-16 text-yellow-500 animate-pulse"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
          </div>

          {/* Main Message */}
          <div className="text-center space-y-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Under Maintenance
            </h2>
            <p className="text-gray-300 text-base sm:text-lg">
              We're currently performing scheduled maintenance to improve your experience.
            </p>
            <p className="text-gray-400 text-sm">
              We'll be back shortly. Thank you for your patience!
            </p>
          </div>

          {/* Decorative Loading Dots */}
          <div className="flex justify-center gap-2 mt-8">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce"></div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-700/50 text-center">
            <p className="text-xs text-gray-500">
              For urgent inquiries, please contact support
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
