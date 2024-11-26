import React, { useState, useRef } from "react";
import axios from "axios";
import "./App.css";

const App = () => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorder = useRef(null);
    const audioChunks = useRef([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            mediaRecorder.current = new MediaRecorder(stream);

            mediaRecorder.current.ondataavailable = (event) => {
                audioChunks.current.push(event.data);
            };

            mediaRecorder.current.onstop = async () => {
                const audioBlob = new Blob(audioChunks.current, {
                    type: "audio/wav",
                });
                audioChunks.current = [];
                await sendAudioToAPI(audioBlob);
            };

            mediaRecorder.current.start();
            setIsRecording(true);
        } catch (error) {
            console.error("Error starting recording:", error);
        }
    };

    const handleInputChange = (e) => {
        setQuery(e.target.value);
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setResults([]);

        try {
            const response = await axios.post(
                "http://localhost:3001/assistant/search",
                {
                    query,
                },
                {
                    headers: {
                        "ngrok-skip-browser-warning": "true",
                    },
                }
            );
            setResults(response.data.data || []);
        } catch (err) {
            setError("An error occurred while searching");
        } finally {
            setLoading(false);
        }
    };

    const stopRecording = () => {
        if (mediaRecorder.current && isRecording) {
            mediaRecorder.current.stop();
            mediaRecorder.current.stream
                .getTracks()
                .forEach((track) => track.stop());
            setIsRecording(false);
        }
    };

    const sendAudioToAPI = async (audioBlob) => {
        try {
            const formData = new FormData();
            formData.append("audio", audioBlob);

            const uploadResponse = await axios.post(
                "http://localhost:3001/assistant/upload",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        "ngrok-skip-browser-warning": "true",
                    },
                }
            );

            setResults(uploadResponse.data.data || []);
        } catch (error) {
            console.error("Error sending audio to API:", error);
        }
    };

    return (
        <div className="app-container">
            <h1 className="title">Voice Search Assistant</h1>

            <div className="search-section">
                <div className="audio-recorder">
                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={isRecording ? "recording" : ""}
                    >
                        {isRecording ? "Stop Recording" : "Start Recording"}
                    </button>
                </div>

                <form className="search-form" onSubmit={handleSearch}>
                    <input
                        type="text"
                        value={query}
                        onChange={handleInputChange}
                        placeholder="Search for doctor, hospital, ratings, or location..."
                        className="search-input"
                    />
                    <button type="submit" className="search-button">
                        Search
                    </button>
                </form>
            </div>

            {loading && <div className="loading">Loading...</div>}
            {error && <div className="error">{error}</div>}

            {results.length > 0 && (
                <div className="results-container">
                    <h2>Search Results</h2>
                    <div className="table-wrapper">
                        <table className="results-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Type</th>
                                    <th>Category</th>
                                    <th>Sub-Category</th>
                                    <th>Rating</th>
                                    <th>Branches</th>
                                    <th>Zone</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((item, index) => (
                                    <tr key={item._id || index}>
                                        <td>{item.name}</td>
                                        <td>{item.type}</td>
                                        <td>{item.category}</td>
                                        <td>{item.subCategory.join(", ")}</td>
                                        <td>{item.rating}</td>
                                        <td>{item.branch.join(", ")}</td>
                                        <td>{item.zone.join(", ")}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
