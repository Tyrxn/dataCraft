import React, { useEffect, useState } from "react";

function ImagePreview({ imageKey }) {
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    async function fetchImageUrl() {
      if (!imageKey) return;

      try {
        const response = await fetch(
          `http://datacraftlb-536406570.ap-southeast-2.elb.amazonaws.com:5000/download-url?key=${imageKey}`
        );
        const data = await response.json();

        if (data.status === "success") {
          setImageUrl(data.downloadUrl);
        } else {
          console.error("Error fetching image URL:", data.message);
        }
      } catch (err) {
        console.error("Error fetching image URL:", err);
      }
    }

    fetchImageUrl();
  }, [imageKey]);

  return (
    <div className="w-80">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Preview"
          style={{ maxWidth: "100%", maxHeight: "100%" }}
        />
      ) : (
        ""
      )}
    </div>
  );
}

export default ImagePreview;
