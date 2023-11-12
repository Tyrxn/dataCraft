import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const ApplyButton = ({ jobID }) => {
  const navigate = useNavigate();
  const [imageNames, setImageNames] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (jobID) {
      fetch(
        `http://datacraftlb-536406570.ap-southeast-2.elb.amazonaws.com:5000/metadata/${jobID}`
      )
        .then((response) => response.json())
        .then((data) => {
          if (data.status === "success") {
            const names = data.images.map((image) => image.name);
            setImageNames(names);
          }
        })
        .catch((error) => {
          console.error("Error fetching metadata:", error);
        });
    }
  }, [jobID]);

  const handleApplyClick = async () => {
    try {
      setLoading(true);
      const instructionsResponse = await fetch(
        `http://datacraftlb-536406570.ap-southeast-2.elb.amazonaws.com:5000/instructions?jobID=${jobID}`
      );
      const instructionsData = await instructionsResponse.json();

      if (instructionsData.status !== "success") {
        throw new Error("Error fetching instructions.");
      }

      if (instructionsData.instructions.length === 0) {
        Swal.fire({
          icon: "warning",
          title: "Oops...",
          text: "Select an augmentation option!",
        });
        return;
      }

      const payload = {
        jobID,
        instructions: instructionsData.instructions,
        images: imageNames,
      };

      const augmentResponse = await fetch(
        `http://datacraftlb-536406570.ap-southeast-2.elb.amazonaws.com:5000/augment?jobID=${jobID}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!augmentResponse.ok) {
        throw new Error("Server responded with an error during augmentation.");
      }

      navigate("/results", { state: { jobID } });
    } catch (error) {
      console.error("There was an error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleApplyClick}
      className={`w-40 bg-[#31327A] text-white px-4 py-2 rounded`}
    >
      Apply
    </button>
  );
}
export default ApplyButton;
