'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { ThemeToggle } from './components/theme-toggle';

export default function Home() {
  const [image, setImage] = useState<File | null>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setImage(file);
      setSvg(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp']
    },
    multiple: false
  });

  // Simulate progress animation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (loading) {
      setProgress(0);
      
      // Calculate random total duration between 5-10 seconds
      const totalDuration = Math.floor(Math.random() * 5000) + 5000; // 5000-10000ms
      const steps = 200; // Increased steps for smoother animation
      const stepDuration = totalDuration / steps;
      
      let acceleration = 1;
      
      interval = setInterval(() => {
        setProgress(prev => {
          // Create a more natural easing curve
          if (prev < 30) {
            // Start faster
            acceleration = 1.2;
          } else if (prev < 60) {
            // Medium speed
            acceleration = 1;
          } else if (prev < 80) {
            // Slow down gradually
            acceleration = 0.8;
          } else {
            // Very slow at the end
            acceleration = 0.3;
          }
          
          const increment = (0.5 * acceleration);
          const newProgress = prev + increment;
          
          // Cap at 95% - the last 5% will be completed when the actual conversion finishes
          return newProgress >= 95 ? 95 : newProgress;
        });
      }, stepDuration);
    } else if (!loading && progress > 0) {
      // Complete the progress bar when loading is done
      setProgress(100);
      
      // Reset progress after animation completes
      const timeout = setTimeout(() => {
        setProgress(0);
      }, 1000);
      
      return () => clearTimeout(timeout);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loading, progress]);

  const convertToSvg = async () => {
    if (!image) return;

    setLoading(true);
    
    try {
      // Add artificial delay to show progress bar animation
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const formData = new FormData();
      formData.append('image', image);

      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Conversion failed');

      const data = await response.json();
      setSvg(data.svg);
    } catch (error) {
      console.error('Error converting image:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <style jsx global>{`
        @keyframes gradientMove {
          0% { background-position: 0% 0; }
          100% { background-position: 200% 0; }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scaleX(1); opacity: 0.2; }
          50% { transform: scaleX(1); opacity: 0.5; }
        }
      `}</style>
      <ThemeToggle />
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 font-madimi-one">
          Image to SVG Converter
        </h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
              isDragActive
                ? 'border-blue-500 bg-blue-50/10'
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
            }`}
          >
            <input {...getInputProps()} />
            <div className="space-y-4">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                />
              </svg>
              <p className="text-gray-600 dark:text-gray-400">
                {isDragActive
                  ? 'Drop the image here'
                  : 'Drag and drop an image, or click to select'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Supported formats: PNG, JPG, JPEG, BMP
              </p>
            </div>
          </div>

          {image && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Selected: {image.name}
              </p>
              
              {loading && (
                <div className="mb-6">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2 overflow-hidden shadow-inner">
                    <div 
                      className="bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 h-3 rounded-full transition-all duration-700 ease-in-out relative"
                      style={{ 
                        width: `${progress}%`,
                        backgroundSize: '200% 100%',
                        animation: 'gradientMove 2s linear infinite'
                      }}
                    >
                      <div className="absolute inset-0 overflow-hidden">
                        <div className="h-full w-full bg-white opacity-20" 
                             style={{
                               animation: 'pulse 1.5s ease-in-out infinite'
                             }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-madimi-one">
                    Converting... {Math.round(progress)}%
                  </p>
                </div>
              )}
              
              <button
                onClick={convertToSvg}
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-madimi-one"
              >
                {loading ? 'Converting...' : 'Convert to SVG'}
              </button>
            </div>
          )}
        </div>

        {svg && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
            <button
              onClick={() => {
                const blob = new Blob([svg], { type: 'image/svg+xml' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${image?.name.split('.')[0] || 'converted'}.svg`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors font-madimi-one"
            >
              Download SVG
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
