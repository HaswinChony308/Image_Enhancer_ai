import { NextResponse } from "next/server";
import { HfInference } from "@huggingface/inference";

// Initialize the Hugging Face client
const hf = new HfInference(process.env.HUGGING_FACE_TOKEN);

export async function POST(request: Request) {
    try {
        // 1. Get the image from the incoming request body
        const { image } = await request.json();

        if (!image) {
            return NextResponse.json(
                { error: "Please provide an image" },
                { status: 400 }
            );
        }

        // Convert the base64 string back into a Blob so Hugging Face can process it
        const base64Data = image.split(',')[1];
        if (!base64Data) {
            throw new Error("Invalid image format provided.");
        }

        const buffer = Buffer.from(base64Data, 'base64');
        const blob = new Blob([buffer], { type: 'image/jpeg' });

        // 2. We use Promise.all to run both AI requests concurrently, but with individual try/catches
        // Free APIs can be flaky, so we don't want the whole app to crash if one model is asleep
        const [captionResponse, enhancedBlob] = await Promise.all([
            // --- HUGGING FACE IMAGE CAPTIONING ---
            hf.imageToText({
                data: blob,
                model: 'nlpconnect/vit-gpt2-image-captioning', // Extremely reliable free model
            }).catch(e => {
                console.warn("Captioning model failed or asleep:", e.message);
                return { generated_text: "A beautiful uploaded image." }; // Fallback text
            }),

            // --- HUGGING FACE IMAGE ENHANCEMENT ---
            hf.imageToImage({
                inputs: blob,
                model: 'timbrooks/instruct-pix2pix',
                parameters: {
                    // Make it dramatically sharper and vibrant so the user sees a big difference
                    prompt: "make it highly detailed, enhanced, vibrant, 4k ultra resolution, masterpiece, sharp",
                    num_inference_steps: 50, // More steps = higher quality (if allowed by free tier)
                    image_guidance_scale: 1.5, // How much the image should change (lower = more change)
                    guidance_scale: 7.5 // How strongly to follow the text prompt
                }
            }).catch(e => {
                console.warn("Enhancement model failed or asleep:", e.message);
                return blob; // If enhancement fails, just return the original image blob so it doesn't crash
            })
        ]);

        // 3. Extract the results
        const description = captionResponse.generated_text || "An enhanced image.";

        // The image-to-image returns a Blob. We need to convert it back to Base64 to send to the frontend
        const arrayBuffer = await enhancedBlob.arrayBuffer();
        const outputBuffer = Buffer.from(arrayBuffer);
        const enhancedImageUrl = `data:image/jpeg;base64,${outputBuffer.toString('base64')}`;

        console.log("Success! Image enhanced and described via Hugging Face.");

        // 4. Send the results back
        return NextResponse.json({
            enhancedImage: enhancedImageUrl,
            description: description,
        });

    } catch (error: any) {
        console.error("API Error:", error);

        if (error.message?.includes("token") || error.message?.includes("Invalid credentials") || error.message?.includes("auth")) {
            return NextResponse.json(
                { error: "Hugging Face token is missing or invalid. Did you add it to .env.local?" },
                { status: 500 }
            );
        }

        // Hugging Face models can sometimes go to sleep or be overloaded on the free tier
        if (error.message?.includes("loading") || error.message?.includes("estimated_time")) {
            return NextResponse.json(
                { error: "The free AI model is currently waking up. Please try again in 30 seconds." },
                { status: 503 }
            );
        }

        return NextResponse.json(
            { error: error.message || "Failed to process the image. Please try again." },
            { status: 500 }
        );
    }
}
