import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import MainContent from "../components/MainContent";
import Header from "../components/Header";
import Instructions from "../components/Instructions";
import ApplyButton from "../components/ApplyButton";
import axios from "axios";

const Options = () => {
  const location = useLocation();
  const { jobID } = location.state || {};
  const navigate = useNavigate();
  const [mainText] = useState({
    title: "Choose Your Edits",
    description: "Select the modifications you'd like to apply to your image.",
  });
  const [instructionList, setInstructionList] = useState([]);
  const [imageNames, setImageNames] = useState([]);

  useEffect(() => {
    axios
      .get(
        `http://datacraftlb-536406570.ap-southeast-2.elb.amazonaws.com:5000/instructions?jobID=${jobID}`
      )
      .then((response) => {
        if (response.data.instructions.length === 0) {
          return axios.put(
            `http://datacraftlb-536406570.ap-southeast-2.elb.amazonaws.com:5000/instructions`,
            {
              jobID: jobID,
              instructions: [],
            }
          );
        }
        setInstructionList(response.data.instructions);
      })
      .then((response) => {
        if (response && response.data.status === "success") {
          setInstructionList(response.data.instructions || []);
        }
      })
      .catch((error) => {
        console.error("Error fetching or initializing instructions:", error);
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

  const options = [
    "Augment Images",
    "Resize Images",
    "Composite Images",
    "Colour Manipulation",
  ];
  const optionToSlug = (option) => option.toLowerCase().replace(/ /g, "-");

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

  return (
    <div className="container mx-auto px-4 py-4 border rounded-[40px] bg-white">
      <Header />
      <MainContent mainText={mainText} />
      <div className="text-center mb-20 w-3/4 mx-auto">
        <div className="grid grid-cols-2 gap-4 mt-5">
          {options.map((option, idx) => (
            <div
              onClick={() =>
                navigate(`/${optionToSlug(option)}`, {
                  state: { jobID: jobID },
                })
              }
              key={idx}
              className="block px-3 py-2 border rounded bg-[#fbf2ff] hover:bg-[#e5d9ff] cursor-pointer"
            >
              {option}
            </div>
          ))}
        </div>
      </div>
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
        <ApplyButton jobID={jobID} />
      </div>
      <div className="fixed top-20 right-10">
        <Instructions list={instructionList} onDelete={handleDelete} />
      </div>
    </div>
  );
};

export default Options;
