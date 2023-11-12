import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { ThreeCircles } from "react-loader-spinner";

function fileTypeValidator(file) {
  const validTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/tiff",
    "image/svg+xml",
  ];
  if (!validTypes.includes(file.type)) {
    return {
      code: "invalid-file-type",
      message:
        "Invalid file type. Only JPEG, PNG, WebP, TIFF and SVG images are allowed.",
    };
  }
  return null;
}

const getPresignedUrl = async (filename) => {
  const response = await fetch(
    `http://datacraftlb-536406570.ap-southeast-2.elb.amazonaws.com:5000/upload-url?filename=${filename}`
  );
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  const data = await response.json();
  if (data.status === "success") {
    return data.uploadUrl;
  } else {
    throw new Error(data.message);
  }
};

const sendMetadataToBackend = async (jobID, filesMetadata) => {
  try {
    const response = await fetch(
      "http://datacraftlb-536406570.ap-southeast-2.elb.amazonaws.com:5000/metadata",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobID, images: filesMetadata }),
      }
    );
    const data = await response.json();
    if (data.status !== "success") {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error("Error sending metadata to backend:", error);
    throw error;
  }
};

const getExtension = (filename) => {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
};

const DropZoneBox = ({ onFilesReceived }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const navigate = useNavigate();

  const onDrop = async (acceptedFiles, fileRejections) => {
    if (fileRejections.length > 0) {
      alert(fileRejections[0]?.errors[0]?.message || "An error occurred.");
      return;
    }

    const jobID = uuidv4();
    setIsLoading(true);

    try {
      const filesMetadata = acceptedFiles.map((file) => ({
        name: file.name,
        type: file.type,
        size: file.size,
      }));

      for (const file of acceptedFiles) {
        const formattedName = `original_${file.name}_${jobID}.${getExtension(
          file.name
        )}`;
        const uploadUrl = await getPresignedUrl(formattedName);
        await fetch(uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": file.type,
          },
          body: file,
        });
      }

      await sendMetadataToBackend(jobID, filesMetadata);

      setIsLoading(false);
      setFiles(acceptedFiles);
      onFilesReceived();
      navigate("/options", { state: { jobID } });
    } catch (error) {
      setIsLoading(false);
      alert("An error occurred while processing the file.");
      console.error("Error:", error);
    }
  };

  const dropzoneConfig = {
    onDrop,
    validator: fileTypeValidator,
    disabled: isLoading,
  };

  const { getRootProps, getInputProps, isDragActive } =
    useDropzone(dropzoneConfig);

  const rootProps = isLoading ? {} : getRootProps();

  return (
    <div className="grid justify-items-center -mt-16">
      <div className="bg-white border-dashed border-2 border-gray-400 rounded-[30px] mb-10 w-1/2">
        <div
          {...rootProps}
          className={
            "text-center h-full w-full transition-colors duration-500 ease-in-out" +
            (isDragActive
              ? " border-blue-500 bg-blue-100 rounded-[30px] cursor-pointer"
              : isLoading
              ? " cursor-not-allowed opacity-70"
              : " cursor-pointer")
          }
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center mt-10">
              <ThreeCircles
                height="100"
                width="100"
                color="#4fa94d"
                wrapperStyle={{}}
                wrapperClass=""
                visible={true}
                ariaLabel="three-circles-rotating"
                outerCircleColor="#31327A"
                innerCircleColor="#31327A"
                middleCircleColor="#31327A"
              />
              <p className="py-10 text-[#31327A] text-xl">Uploading Files...</p>
            </div>
          ) : (
            <>
              {files.length === 0 && !isLoading && (
                <input {...getInputProps()} />
              )}
              {files.length === 0 ? (
                <p className="py-10 text-[#31327A] text-xl">
                  Drag & Drop files to upload files <br />
                  <strong>Browse Files</strong>
                </p>
              ) : (
                files.map((file, idx) => (
                  <div key={idx}>
                    <span>🖼️</span> {file.name}
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DropZoneBox;
