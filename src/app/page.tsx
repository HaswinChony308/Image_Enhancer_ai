"use client";

import { useState, useCallback } from "react";
import { UploadCloud, Wand2, ArrowRight, Image as ImageIcon, Sparkles } from "lucide-react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import ComparisonSlider from "@/components/ComparisonSlider";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [result, setResult] = useState<{ enhancedImage: string; description: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Create a local URL so the user can see what they just uploaded
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setResult(null);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".png", ".jpg", ".webp"],
    },
    maxFiles: 1,
    multiple: false,
  });

  const handleEnhance = async () => {
    if (!file) return;

    setIsEnhancing(true);
    setError(null);

    try {
      // 1. Convert the File to a Base64 string so we can send it in JSON
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = async () => {
        const base64Image = reader.result as string;

        // 2. Send the image to our securely created backend API
        const response = await fetch("/api/enhance", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ image: base64Image }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to enhance image");
        }

        // 3. Save the result to state to display it
        setResult(data);
      };
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-zinc-950 font-sans text-zinc-50 selection:bg-indigo-500/30 overflow-x-hidden">
      <main className="flex w-full max-w-6xl flex-1 flex-col items-center justify-start px-6 py-20 sm:py-24">

        {/* Header Section */}
        <div className="text-center space-y-4 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="inline-flex items-center justify-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            <span>Powered by OpenAI & Replicate</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-br from-white via-white/90 to-white/40 bg-clip-text text-transparent">
            AI Image Enhancer
          </h1>
          <p className="max-w-xl mx-auto text-lg sm:text-lg text-zinc-400 font-medium">
            Upload your low-resolution images and watch AI magically restore, upscale, and analyze them in seconds.
          </p>
        </div>

        {/* Dynamic Content Area */}
        <div className="w-full flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150 fill-mode-both">

          <div className={`w-full grid gap-8 ${result ? 'lg:grid-cols-2' : 'max-w-2xl'}`}>

            {/* Left Column: Upload / Original Image */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-lg font-semibold text-zinc-200 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-zinc-400" />
                  Original Image
                </h2>
                {file && (
                  <button onClick={() => { setFile(null); setPreviewUrl(null); setResult(null); }} className="text-sm border-b border-zinc-700 text-zinc-400 hover:text-white pb-0.5 transition-colors">
                    Upload another
                  </button>
                )}
              </div>

              {!previewUrl ? (
                // Upload Area
                <div
                  {...getRootProps()}
                  className={`group relative flex flex-col items-center justify-center w-full h-80 sm:h-96 border-2 border-dashed rounded-3xl bg-zinc-900/40 transition-all cursor-pointer overflow-hidden backdrop-blur-sm
                    ${isDragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-zinc-800 hover:bg-zinc-900/80 hover:border-indigo-500/50'}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <input {...getInputProps()} />

                  <div className="relative flex flex-col items-center space-y-4 p-6 text-center">
                    <div className={`p-4 rounded-full transition-all duration-300 ${isDragActive ? 'bg-indigo-500/20 scale-110' : 'bg-zinc-800/80 group-hover:scale-110 group-hover:bg-indigo-500/10'}`}>
                      <UploadCloud className={`w-8 h-8 transition-colors ${isDragActive ? 'text-indigo-400' : 'text-zinc-400 group-hover:text-indigo-400'}`} />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-zinc-200 group-hover:text-white transition-colors">
                        {isDragActive ? "Drop the image here..." : "Click to upload or drag & drop"}
                      </p>
                      <p className="text-sm text-zinc-500 mt-1">PNG, JPG or WEBP (Max 5MB)</p>
                    </div>
                  </div>
                </div>
              ) : (
                // Original Image Preview
                <div className="relative w-full h-80 sm:h-96 rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-xl group">
                  <Image
                    src={previewUrl}
                    alt="Original"
                    fill
                    className="object-contain" // Use contain so the whole image is visible
                  />
                  {/* Blur effect behind image */}
                  <Image
                    src={previewUrl}
                    alt=""
                    fill
                    className="object-cover opacity-20 blur-2xl -z-10 absolute inset-0"
                  />
                </div>
              )}

              {/* Action Button */}
              {previewUrl && !result && (
                <button
                  onClick={handleEnhance}
                  disabled={isEnhancing}
                  className={`mt-4 w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 shadow-xl
                    ${isEnhancing
                      ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:shadow-indigo-500/20'}`}
                >
                  {isEnhancing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                      Enhancing your image...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5" />
                      Enhance with AI
                    </>
                  )}
                </button>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-4 mt-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center font-medium">
                  {error}
                </div>
              )}
            </div>

            {/* Right Column: Loading or Result */}
            {(isEnhancing || result) && (
              <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex items-center px-2">
                  <h2 className="text-lg font-semibold text-indigo-400 flex items-center gap-2">
                    <Wand2 className="w-5 h-5" />
                    Enhanced Result
                  </h2>
                </div>

                {isEnhancing ? (
                  // Loading Skeleton
                  <div className="relative w-full h-80 sm:h-96 rounded-3xl border border-zinc-800 bg-zinc-900/50 flex flex-col items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-800/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                    <Wand2 className="w-10 h-10 text-indigo-500/50 animate-pulse mb-4" />
                    <p className="text-zinc-400 font-medium animate-pulse">Running AI models...</p>
                    <p className="text-zinc-600 text-sm mt-2">This might take 10-20 seconds.</p>
                  </div>
                ) : result && (
                  // Result Image
                  <div className="relative flex flex-col gap-6 h-full">

                    {/* Interactive Comparison Slider */}
                    {previewUrl && result.enhancedImage && (
                      <ComparisonSlider
                        originalImage={previewUrl}
                        enhancedImage={result.enhancedImage}
                      />
                    )}

                    {/* AI Description Card */}
                    <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                      <div className="flex items-start gap-4">
                        <Sparkles className="w-6 h-6 text-indigo-400 shrink-0 mt-1" />
                        <div>
                          <h3 className="text-sm font-semibold text-zinc-400 mb-1 uppercase tracking-wider">OpenAI Vision Analysis</h3>
                          <p className="text-zinc-200 leading-relaxed font-medium">
                            "{result.description}"
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Download Button */}
                    <a
                      href={result.enhancedImage}
                      download="enhanced-image.jpg"
                      target="_blank"
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors font-medium mt-auto"
                    >
                      Download High-Res Image
                    </a>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-zinc-600 text-sm border-t border-zinc-900/50 bg-zinc-950/80 backdrop-blur-md">
        Built with Next.js App Router, Tailwind CSS, OpenAI, and Replicate.
      </footer>
    </div>
  );
}
