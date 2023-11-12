import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import MainContent from "../components/MainContent";
import DataHeader from "../components/DataHeader";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import Instructions from "../components/Instructions";
import ApplyButton from "../components/ApplyButton";
import axios from "axios";

const AugmentImages = () => {
  const [mainText] = useState({
    title: "Augment Your Images",
    description: "Select the modifications you'd like to apply to your image.",
  });
  const location = useLocation();
  const { jobID } = location.state || {};
  const [instructionList, setInstructionList] = useState([]);
  const [imageNames, setImageNames] = useState([]);

  useEffect(() => {
    axios
      .get(
        `http://datacraftlb-536406570.ap-southeast-2.elb.amazonaws.com:5000/instructions?jobID=${jobID}`
      )
      .then((response) => {
        setInstructionList(response.data.instructions);
      });
  }, [jobID]);

  useEffect(() => {
    if (jobID) {
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
  }, [jobID]);

  const addInstructions = (inputInstructions) => {
    const newInstructions = Array.isArray(inputInstructions)
      ? inputInstructions
      : [inputInstructions];
    const updatedInstructions = instructionList
      .filter(
        (inst) =>
          !newInstructions.some((newInst) =>
            inst.startsWith(newInst.split(":")[0])
          )
      )
      .concat(newInstructions);

    axios
      .put(
        "http://datacraftlb-536406570.ap-southeast-2.elb.amazonaws.com:5000/instructions",
        {
          jobID: jobID,
          instructions: updatedInstructions,
        }
      )
      .then((response) => {
        setInstructionList(updatedInstructions);
      })
      .catch((error) => {
        console.error("Failed to update instructions", error);
      });
  };

  const handleDelete = (index) => {
    const instructionToDelete = instructionList[index];
    let newList = [...instructionList];

    if (instructionToDelete.startsWith("Resize")) {
      newList = newList.filter((inst) => !inst.startsWith("Resize"));
    } else if (instructionToDelete.startsWith("Extend")) {
      newList = newList.filter((inst) => !inst.startsWith("Extend"));
    } else if (
      instructionToDelete.startsWith("Left Offset") ||
      instructionToDelete.startsWith("Top Offset") ||
      instructionToDelete.startsWith("Extract")
    ) {
      newList = newList.filter(
        (inst) =>
          !(
            inst.startsWith("Left Offset") ||
            inst.startsWith("Top Offset") ||
            inst.startsWith("Extract")
          )
      );
    } else if (
      instructionToDelete.startsWith("Background Colour") ||
      instructionToDelete.startsWith("Threshold")
    ) {
      newList = newList.filter(
        (inst) =>
          !(
            inst.startsWith("Background Colour") || inst.startsWith("Threshold")
          )
      );
    } else if (
      instructionToDelete.startsWith("Normal Lower") ||
      instructionToDelete.startsWith("Normal Upper")
    ) {
      newList = newList.filter(
        (inst) =>
          !inst.startsWith("Normal Lower") && !inst.startsWith("Normal Upper")
      );
    } else if (
      instructionToDelete.startsWith("Tint Red") ||
      instructionToDelete.startsWith("Tint Green") ||
      instructionToDelete.startsWith("Tint Blue")
    ) {
      newList = newList.filter(
        (inst) =>
          !inst.startsWith("Tint Red") &&
          !inst.startsWith("Tint Green") &&
          !inst.startsWith("Tint Blue")
      );
    } else {
      newList.splice(index, 1);
    }

    axios
      .put(
        "http://datacraftlb-536406570.ap-southeast-2.elb.amazonaws.com:5000/instructions",
        {
          jobID: jobID,
          instructions: newList,
        }
      )
      .then((response) => {
        setInstructionList(newList);
      });
  };

  const MySwal = withReactContent(Swal);

  const handleOptionClick = (option) => {
    switch (option) {
      case "Rotate Images":
        MySwal.fire({
          title: <p>Enter rotation angle</p>,
          input: "number",
          inputPlaceholder: "0-360",
          inputAttributes: {
            min: 0,
            max: 360,
          },
          inputValidator: (value) => {
            if (!value) {
              return "Please enter a rotation angle.";
            }
            const intValue = parseInt(value);
            if (intValue < 0 || intValue > 360) {
              return "Angle must be between 0 and 360 degrees";
            }
          },
        }).then((result) => {
          if (result.isConfirmed) {
            const angle = result.value;
            addInstructions(`Rotation Angle: ${angle}`);
          }
        });
        break;
      case "Flip Images":
        MySwal.fire({
          title: "Flip Images?",
          text: "Images will be Flipped Across X Axis",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
          confirmButtonText: "Yes, flip it!",
        }).then((result) => {
          addInstructions(`Flip Image: ${result.isConfirmed}`);
        });
        break;
      case "Gamma Correct Images":
        MySwal.fire({
          title: <p>Enter gamma correction factor</p>,
          input: "number",
          inputPlaceholder: "1-3",
          inputAttributes: {
            min: 1,
            max: 3,
          },
          inputValidator: (value) => {
            if (!value) {
              return "Please enter a gamma correction factor.";
            }
            if (parseInt(value) > 3) {
              return "Gamma correction factor must be below 3";
            }
          },
        }).then((result) => {
          if (result.isConfirmed) {
            const factor = result.value;
            addInstructions(`Correction Factor: ${factor}`);
          }
        });
        break;
      case "Normalise Images":
        MySwal.fire({
          title: <p>Enter Normalisation %</p>,
          html: `
                        <div class="mb-2">
                            <label class="block text-sm font-bold mb-1" for="lower">Lower Percentile</label>
                            <input id="lower" class="shadow appearance-none border rounded w-full py-2 px-3 leading-tight" placeholder="0 - 100" type="number" min="0" max="100" value="1">
                        </div>
                        <div class="mb-2">
                            <label class="block text-sm font-bold mb-1" for="upper">Upper Percentile</label>
                            <input id="upper" class="shadow appearance-none border rounded w-full py-2 px-3 leading-tight" placeholder="0 - 100" type="number" min="0" max="100" value="99">
                        </div>
                    `,
          focusConfirm: false,
          preConfirm: () => {
            return {
              lower: document.getElementById("lower").value,
              upper: document.getElementById("upper").value,
            };
          },
        }).then((result) => {
          if (result.isConfirmed) {
            addInstructions([
              `Normal Lower: ${result.value.lower}`,
              `Normal Upper: ${result.value.upper}`,
            ]);
          }
        });
        break;
      case "Blur Images":
        MySwal.fire({
          title: <p>Enter Blur degree</p>,
          input: "number",
          inputPlaceholder: "1-1000",
          inputAttributes: {
            min: 1,
            max: 1000,
          },
          inputValidator: (value) => {
            if (!value) {
              return "Please enter a blur degree.";
            }
            if (parseInt(value) > 1000) {
              return "Blur Degree must be below 1000 degrees";
            }
          },
        }).then((result) => {
          if (result.isConfirmed) {
            const degree = result.value;
            addInstructions(`Blur Degree: ${degree}`);
          }
        });
        break;
      case "Flop Images":
        MySwal.fire({
          title: "Flop Images?",
          text: "Images will be Flopped Across Y Axis",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
          confirmButtonText: "Yes, flop it!",
        }).then((result) => {
          addInstructions(`Flop Image: ${result.isConfirmed}`);
        });
        break;

      default:
        break;
    }
  };
  const renderOptions = () => {
    const options = [
      "Rotate Images",
      "Flip Images",
      "Gamma Correct Images",
      "Normalise Images",
      "Blur Images",
      "Flop Images",
    ];

    return (
      <div className="grid grid-cols-2 gap-4 mt-5">
        {options.map((option, idx) => (
          <button
            key={idx}
            className="block px-3 py-2 border rounded bg-[#fbf2ff] hover:bg-[#e5d9ff]"
            onClick={() => handleOptionClick(option)}
          >
            {option}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="flex">
      <div className="container mx-auto px-4 py-4 border rounded-[40px] bg-white flex-1">
        <DataHeader jobID={jobID} />
        <MainContent mainText={mainText} />
        <div className="text-center mb-20 w-3/4 mx-auto">{renderOptions()}</div>
        <div className="grid justify-items-center -mt-16">
          <div className="bg-white border-dashed border-2 border-gray-400 rounded-[30px] mb-10 w-1/2">
            <div className="flex flex-col justify-center">
              {imageNames.length === 0 && (
                <p className="text-gray-500 flex ">.</p>
              )}
              {imageNames.map((name, index) => (
                <div key={index} className="text-center">
                  <span>🖼️</span> {name}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <div className="w-1/2 grid justify-items-center">
            <ApplyButton jobID={jobID} />
          </div>
        </div>
      </div>
      <div className="fixed top-20 right-10">
        <Instructions list={instructionList} onDelete={handleDelete} />
      </div>
    </div>
  );
};

export default AugmentImages;
