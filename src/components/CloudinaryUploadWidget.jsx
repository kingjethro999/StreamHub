import { useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { UploadCloud } from 'lucide-react';

export default function CloudinaryUploadWidget({ uwConfig, setPublicId, setVideoUrl, setThumbnailUrl }) {
    const cloudinaryRef = useRef();
    const widgetRef = useRef();

    useEffect(() => {
        // Store the global Cloudinary instance
        cloudinaryRef.current = window.cloudinary;

        if (!cloudinaryRef.current) {
            console.error("Cloudinary widget script not loaded");
            return;
        }

        // Initialize the widget
        widgetRef.current = cloudinaryRef.current.createUploadWidget(
            uwConfig,
            (error, result) => {
                if (!error && result && result.event === 'success') {
                    console.log('Upload success! Info: ', result.info);
                    setPublicId(result.info.public_id);
                    setVideoUrl(result.info.secure_url);

                    // Generate thumbnail URL if it's a video
                    if (result.info.resource_type === 'video') {
                        const thumbUrl = result.info.secure_url.replace(/\.[^/.]+$/, ".jpg");
                        setThumbnailUrl(thumbUrl);
                    } else {
                        setThumbnailUrl(result.info.secure_url);
                    }
                } else if (error) {
                    console.error("Upload Widget Error:", error);
                }
            }
        );
    }, [uwConfig, setPublicId, setVideoUrl, setThumbnailUrl]);

    return (
        <div
            onClick={() => widgetRef.current?.open()}
            className="border-2 border-dashed border-primary/50 bg-primary/5 rounded-lg p-8 text-center hover:bg-primary/10 transition-colors cursor-pointer relative group"
        >
            <UploadCloud className="mx-auto mb-2 text-primary group-hover:scale-110 transition-transform" size={48} />
            <p className="text-sm font-medium text-foreground">
                Click to open Upload Widget
            </p>
            <p className="text-xs text-muted-foreground mt-2">MP4, WebM, or OGG up to 100MB</p>
        </div>
    );
}
