import React from 'react';

const MainContent = ({ mainText }) => {
    return (
        <div className="grid justify-items-center">
            <div className="text-center py-20 w-3/4 bg-[#fbf2ff] rounded-[30px]">
                <h1 className="text-4xl font-bold text-[#31327A]">{mainText.title}</h1>
                <p className="text-xl mt-2 text-[#31327A]">{mainText.description}</p>
            </div>
        </div>
    );
}

export default MainContent;
