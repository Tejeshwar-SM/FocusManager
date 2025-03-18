import React, { useEffect, useState} from 'react';
import axios from 'axios';

const Home: React.FC = () => {
    //to set API connection status
    const [apiStatus, setApiStatus] = useState<string>('');

    useEffect(() => {
        const checkApiStatus  = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/`);
                setApiStatus(response.data);
            } catch (error) {
                console.error('Error connecting to API:', error);
                setApiStatus('Error connecting to the API');
            }
        };
        checkApiStatus();
    }, []);

    return (
        <div className="home">
            <h1>Focus Manager</h1>
            <p>Your productivity assistant</p>

            <div className="api-status">
                <h3>API Status:</h3>
                <p>{apiStatus || 'Checking...'}</p>
            </div>

            <div className="features">
                <h2>Upcoming</h2>
                <ul>
                    <li>Pomodoro Timer</li>
                    <li>TodoLists</li>
                    <li>Productivity Journals</li>
                    <li>Calendar </li>
                    <li>Leaderboards</li>
                </ul>
            </div>
        </div>
    )

}

export default Home;