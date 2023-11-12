import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import MainContent from "../components/MainContent";
import Header from "../components/Header";
import ImagePreview from "../components/ImagePreview";
import axios from "axios";
import { ThreeCircles } from "react-loader-spinner";

const Results = () => {
  const location = useLocation();
  const [jobProgress, setJobProgress] = useState(0);  
  const [jobCompleted, setJobCompleted] = useState(false);
  const { jobID } = location.state || {};
  const [mainText, setMainText] = useState({
    title: "Images Being Transformed",
    description: "Please wait while your images process",
  });
  const [imageNames, setImageNames] = useState([]);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);

  const fetchJobStatus = () => {
    axios
      .get(`http://datacraftlb-536406570.ap-southeast-2.elb.amazonaws.com:5000/job-status/${jobID}`)
      .then(response => {
        if (response.data.status === "success") {
          const processedImages = parseInt(response.data.processedImages, 10);
          const totalImages = parseInt(response.data.totalImages, 10);
          const percentageComplete = Math.min(100, (processedImages / totalImages) * 100);
  
          setJobProgress(percentageComplete);
  
          // Update job completion status based on the response from the server
          setJobCompleted(response.data.jobCompleted);
        }
      })
      .catch(error => {
        console.error("Error fetching job status:", error);
      });
  };
  
  
  useEffect(() => {
    const interval = setInterval(() => {
      if (!jobCompleted) {
        fetchJobStatus();
      } else {
        clearInterval(interval);
      }
    }, 3000);
    if (jobCompleted) {
      setMainText({
        title: "Images Have Been Transformed",
        description: "Download your images below!",
      });
    }
    return () => clearInterval(interval);  
  }, [jobID, jobCompleted]);
  

  useEffect(() => {
    if (jobID && jobCompleted) {
      axios
        .get(
          `http://datacraftlb-536406570.ap-southeast-2.elb.amazonaws.com:5000/metadata/${jobID}`
        )
        .then((response) => {
          if (response.data.status === "success") {
            const names = response.data.images.map((image) => image.name);
            setImageNames(names);
          }
        })
        .catch((error) => {
          console.error("Error fetching metadata:", error);
        });
    }
  }, [jobID, jobCompleted]);

  const handleImageClick = (imageName) => {
    const fileExtension = imageName.split(".").pop();
    const allowedExtensions = [
      "jpeg",
      "jpg",
      "png",
      "webp",
      "gif",
      "avif",
      "tiff",
      "svg",
    ];
    if (!allowedExtensions.includes(fileExtension.toLowerCase())) {
      alert("Unsupported file format!");
      return;
    }

    const formattedKey = `processed_${imageName}_${jobID}.${fileExtension}`;
    setSelectedImageUrl(formattedKey);
  };

  const handleDownloadClick = async () => {
    if (imageNames.length === 0) {
      alert("No images to download.");
      return;
    }

    const downloadImage = async (imageName, index) => {
      const fileExtension = imageName.split(".").pop();
      const formattedKey = `processed_${imageName}_${jobID}.${fileExtension}`;

      try {
        const response = await fetch(
          `http://datacraftlb-536406570.ap-southeast-2.elb.amazonaws.com:5000/download-url?key=${formattedKey}`
        );
        const data = await response.json();

        if (data.status === "success") {
          const a = document.createElement("a");
          a.href = data.downloadUrl;
          a.download = formattedKey;
          a.style.display = "none";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          if (index < imageNames.length - 1) {
            setTimeout(
              () => downloadImage(imageNames[index + 1], index + 1),
              1000
            );
          }
        } else {
          console.error("Error fetching download URL:", data.message);
        }
      } catch (err) {
        console.error("Error fetching download URL:", err);
      }
    };

    downloadImage(imageNames[0], 0);
  };

  return (
    <div className="flex items-center ">
      <div className="container mx-auto px-4 py-4 border rounded-[40px] bg-white">
        <Header />
        <MainContent mainText={mainText} />
        {!jobCompleted && (
          <div className="flex flex-col items-center justify-center space-y-4">
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
            <p className="text-[#31327A] text-xl">Processing...</p>
          </div>
        )}

        <div className="flex justify-center">
          <ImagePreview imageKey={selectedImageUrl} />
        </div>

        <div className="grid grid-cols-1 gap-4 w-1/2 mx-auto">
            {imageNames.map((imageName, index) => (
              <div
                key={index}
                className={`text-center mb-2 cursor-pointer hover:bg-gray-300 ${
                  selectedImageUrl === imageName ? "bg-blue-500 text-white" : ""
                }`}
                onClick={() => handleImageClick(imageName)}
              >
                🖼️ {imageName}
              </div>
            ))}
        </div>

        <div className="flex items-center justify-center mt-4">
          <div className="w-1/2 grid justify-items-center">
          {jobCompleted &&
            <button
              onClick={handleDownloadClick}
              className="w-40 bg-[#31327A] text-white px-4 py-2 rounded"
            >
              Download All
            </button>
            }
          </div>
        </div>
        {jobCompleted &&
        <p className="text-center text-gray-600" style={{ paddingTop: "15px" }}>
          Select an image to preview
        </p>
        } 
      </div>
    </div>
  );
};


export default Results;
