import React, { useState } from 'react';
import MainContent from '../components/MainContent';

const Donate = () => {
    const [mainText] = useState({
        title: "Support the Devs",
        description: "Evan Devoy & Tyran Wong-Tung"
    });

    const [showGif, setShowGif] = useState(false);

    const handlePaypalClick = () => {
        setShowGif(!showGif);
    };

    return (
        <div className="container mx-auto px-4 py-4 border rounded-2xl bg-white">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center">
                <div className="mr-4">

            </div>
            <div className="text-xl">
                <a href="/" className="mr-6 hover:underline">Home</a>
            </div>
            </div>
            </div>
            <MainContent mainText={mainText} />
            <div className="text-center mt-8 flex flex-col items-center mb-10">
            <button
                onClick={handlePaypalClick}
                className="bg-yellow-400 hover:bg-yellow-300 text-blue-800 font-semibold py-2 px-4 rounded-full inline-flex items-center"
            >
                <img
                    src="https://www.paypalobjects.com/paypal-ui/logos/svg/paypal-mark-color.svg"
                    alt="PayPal"
                    className="h-6 w-6 mr-2"
                />
                Donate With PayPal
            </button>
            {showGif && (
                <div className="mt-4">
                    <iframe src="https://giphy.com/embed/FbPsiH5HTH1Di" width="480" height="445" frameBorder="0" className="giphy-embed" allowFullScreen></iframe>
                </div>
            )}
        </div>
        </div>
    );
};

export default Donate;
