import React, { useState, useEffect } from "react";
import MainContent from "../components/MainContent";
import { useLocation } from "react-router-dom";
import DataHeader from "../components/DataHeader";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import Instructions from "../components/Instructions";
import ApplyButton from "../components/ApplyButton";
import axios from "axios";

const ResizeImages = () => {
  const [mainText] = useState({
    title: "Resize Your Images",
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

  const handleDelete = (index) => {
    let instructionToDelete = instructionList[index];

    let prefixToDelete;
    if (instructionToDelete.startsWith("Resize")) {
      prefixToDelete = "Resize";
    } else if (instructionToDelete.startsWith("Extend")) {
      prefixToDelete = "Extend";
    } else if (
      instructionToDelete.startsWith("Left Offset") ||
      instructionToDelete.startsWith("Top Offset") ||
      instructionToDelete.startsWith("Extract")
    ) {
      prefixToDelete = "Extract";
    } else if (
      instructionToDelete.startsWith("Background Colour") ||
      instructionToDelete.startsWith("Threshold")
    ) {
      prefixToDelete = "Trim";
    }

    const newList = instructionList.filter((inst) => {
      if (prefixToDelete === "Extract") {
        return !(
          inst.startsWith("Left Offset") ||
          inst.startsWith("Top Offset") ||
          inst.startsWith("Extract")
        );
      } else if (prefixToDelete === "Trim") {
        return !(
          inst.startsWith("Background Colour") || inst.startsWith("Threshold")
        );
      }
      return !inst.startsWith(prefixToDelete);
    });

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

  const addInstructions = (newInstructions) => {
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

  const MySwal = withReactContent(Swal);

  const handleOptionClick = (option) => {
    switch (option) {
      case "Resize":
        MySwal.fire({
          title: <p>Enter resize dimensions</p>,
          html: `
                        <div class="mb-2">
                            <label class="block text-sm font-bold mb-1" for="width">Width</label>
                            <input id="width" class="shadow appearance-none border rounded w-full py-2 px-3 leading-tight" type="number">
                        </div>
                        <div class="mb-2">
                            <label class="block text-sm font-bold mb-1" for="height">Height</label>
                            <input id="height" class="shadow appearance-none border rounded w-full py-2 px-3 leading-tight" type="number">
                        </div>
                    `,
          focusConfirm: false,
          preConfirm: () => {
            return {
              width: document.getElementById("width").value,
              height: document.getElementById("height").value,
            };
          },
        }).then((result) => {
          if (result.isConfirmed) {
            addInstructions([
              `Resize Width: ${result.value.width}`,
              `Resize Height: ${result.value.height}`,
            ]);
          }
        });
        break;
      case "Extend":
        MySwal.fire({
          title: <p>Enter extend dimensions</p>,
          html: `
                        <div class="mb-2">
                            <label class="block text-sm font-bold mb-1" for="width">Width</label>
                            <input id="width" class="shadow appearance-none border rounded w-full py-2 px-3 leading-tight" type="number">
                        </div>
                        <div class="mb-2">
                            <label class="block text-sm font-bold mb-1" for="height">Height</label>
                            <input id="height" class="shadow appearance-none border rounded w-full py-2 px-3 leading-tight" type="number">
                        </div>
                    `,
          focusConfirm: false,
          preConfirm: () => {
            return {
              width: document.getElementById("width").value,
              height: document.getElementById("height").value,
            };
          },
        }).then((result) => {
          if (result.isConfirmed) {
            addInstructions([
              `Extend Width: ${result.value.width}`,
              `Extend Height: ${result.value.height}`,
            ]);
          }
        });
        break;
      case "Extract":
        MySwal.fire({
          title: <p>Enter region to extract</p>,
          html: `
                        <div class="mb-2">
                            <label class="block text-sm font-bold mb-1" for="leftOffset">Left Offset</label>
                            <input id="leftOffset" class="shadow appearance-none border rounded w-full py-2 px-3 leading-tight" type="number">
                        </div>
                        <div class="mb-2">
                            <label class="block text-sm font-bold mb-1" for="topOffset">Top Offset</label>
                            <input id="topOffset" class="shadow appearance-none border rounded w-full py-2 px-3 leading-tight" type="number">
                        </div>
                        <div class="mb-2">
                            <label class="block text-sm font-bold mb-1" for="width">Width</label>
                            <input id="width" class="shadow appearance-none border rounded w-full py-2 px-3 leading-tight" type="number">
                        </div>
                        <div class="mb-2">
                            <label class="block text-sm font-bold mb-1" for="height">Height</label>
                            <input id="height" class="shadow appearance-none border rounded w-full py-2 px-3 leading-tight" type="number">
                        </div>
                    `,
          focusConfirm: false,
          preConfirm: () => {
            return {
              leftOffset: document.getElementById("leftOffset").value,
              topOffset: document.getElementById("topOffset").value,
              width: document.getElementById("width").value,
              height: document.getElementById("height").value,
            };
          },
        }).then((result) => {
          if (result.isConfirmed) {
            addInstructions([
              `Left Offset: ${result.value.leftOffset}`,
              `Top Offset: ${result.value.topOffset}`,
              `Extract Width: ${result.value.width}`,
              `Extract Height: ${result.value.height}`,
            ]);
          }
        });
        break;
      case "Trim":
        MySwal.fire({
          title: <p>Enter trim options</p>,
          html: `
                        <div class="mb-2">
                            <select id="colour" class="shadow appearance-none border rounded w-full py-2 px-3 leading-tight">
                                <option value="Select a colour" selected disabled>Select a colour</option>
                                <option value="red">Red</option>
                                <option value="orange">Orange</option>
                                <option value="yellow">Yellow</option>
                                <option value="green">Green</option>
                                <option value="blue">Blue</option>
                                <option value="purple">Purple</option>
                            </select>
                        </div>
                        <div class="mb-2">
                            <label class="block text-sm font-bold mb-1" for="threshold">Threshold</label>
                            <input id="threshold" class="shadow appearance-none border rounded w-full py-2 px-3 leading-tight" placeholder="0 - 100" type="number" min="0" max="100" value="1">
                        </div>
                    `,
          focusConfirm: false,
          preConfirm: () => {
            return {
              colour: document.getElementById("colour").value,
              threshold: document.getElementById("threshold").value,
            };
          },
        }).then((result) => {
          if (result.isConfirmed) {
            addInstructions([
              `Background Colour: ${result.value.colour}`,
              `Threshold: ${result.value.threshold}`,
            ]);
          }
        });
        break;
      default:
        break;
    }
  };

  const renderOptions = () => {
    const options = ["Resize", "Extend", "Extract", "Trim"];

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
    <div className="container mx-auto px-4 py-4 border rounded-[40px] bg-white">
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
      <div className="fixed top-20 right-10">
        <Instructions list={instructionList} onDelete={handleDelete} />
      </div>
    </div>
  );
};

export default ResizeImages;
