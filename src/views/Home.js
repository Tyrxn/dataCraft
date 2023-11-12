import React, { useState } from 'react';
import MainContent from '../components/MainContent';
import DropZoneBox from '../components/DropZoneBox';
import Header from '../components/Header';

const Home = () => {
    const [mainText] = useState({
        title: "Transform Your Images with Precision",
        description: "From resizing and rotation to advanced adjustments!"
    });
    

    const onFilesReceived = () => {
    };

    return (
        <div className="container mx-auto px-4 py-4 border rounded-[40px] bg-white">
            <Header />
            <MainContent mainText={mainText} />
            <DropZoneBox onFilesReceived={onFilesReceived} />
            <p className="text-center text-gray-600">Accepted files: JPEG, PNG, WebP, TIFF and SVG</p>
        </div>
    )
}

export default Home;
