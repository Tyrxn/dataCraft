import React from 'react';

const Instructions = ({ list, onDelete }) => {
    if (list.length < 1) {
        return null; 
    }

    return (
        <div className="p-4 bg-white rounded-[20px] text-[#31327A] w-64">
            <p className="text-3xl">Augmentations</p>
            <ul>
                {list.map((instruction, index) => (
                    <li key={index} className="flex justify-between items-center">
                        <div className="flex-grow truncate">
                            {instruction}
                        </div>
                        <button onClick={() => onDelete(index)} className="ml-2 text-red-500 flex-shrink-0">Delete</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default Instructions;
