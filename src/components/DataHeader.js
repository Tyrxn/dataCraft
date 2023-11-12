import { Link } from 'react-router-dom';

const DataHeader = ({ jobID }) => { 
    return(
        <div className="flex justify-between items-center mb-8">
            <div className="flex items-center">
                <div className="mr-4">
                </div>
                <div className="text-xl">
                    <Link to="/options" state={{ jobID: jobID }} className="mr-6 hover:underline">
                        Back to Options
                    </Link>
                </div>
            </div>
            <div>
            <a href="/donate" className="bg-[#31327A] text-white px-4 py-3 rounded">Donate</a>
            </div>
        </div>
    );
}

export default DataHeader;
