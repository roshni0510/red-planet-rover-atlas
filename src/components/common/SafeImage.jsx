import { useState } from "react";
import { ImageOff } from "lucide-react";

/** Image with an explicit "image unavailable" fallback for missing/broken files. */
export default function SafeImage({ src, alt, className = "" }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={`grid place-items-center bg-surface text-muted-foreground ${className}`}>
        <span className="flex flex-col items-center gap-1 text-[0.6875rem]">
          <ImageOff className="size-4" aria-hidden />
          Image unavailable
        </span>
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={`object-cover ${className}`} />;
}
