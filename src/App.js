import React, { useState, useRef } from "react";
import axios from "axios";
import "./App.css";

const App = () => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [audioURL, setAudioURL] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);

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
                "http://localhost:3000/voice/search",
                {
                    query,
                }
            );
            setResults(response.data.data || []);
        } catch (err) {
            setError("An error occurred while searching");
        } finally {
            setLoading(false);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            mediaRecorderRef.current = new MediaRecorder(stream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(chunksRef.current, {
                    type: "audio/wav",
                });
                const audioUrl = URL.createObjectURL(audioBlob);
                setAudioURL(audioUrl);
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (error) {
            setError("Error accessing microphone");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            mediaRecorderRef.current.stream
                .getTracks()
                .forEach((track) => track.stop());
        }
    };

    const uploadAudio = async () => {
        if (!audioURL) return;

        setLoading(true);
        try {
            const response = await fetch(audioURL);
            const audioBlob = await response.blob();
            const formData = new FormData();
            formData.append("audio", audioBlob, "recording.wav");

            const uploadResponse = await fetch(
                "http://localhost:3000/voice/upload",
                {
                    method: "POST",
                    body: formData,
                }
            );

            const result = await uploadResponse.json();
            setResults(result.data || []);
        } catch (error) {
            setError("Error uploading audio");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-container">
            <h1 className="title">Voice Search Assistant</h1>

            <div className="search-section">
                <div className="audio-recorder">
                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`record-button ${
                            isRecording ? "recording" : ""
                        }`}
                    >
                        {isRecording ? "Stop Recording" : "Start Recording"}
                    </button>

                    {audioURL && (
                        <div className="audio-playback">
                            <audio
                                src={audioURL}
                                controls
                                className="audio-player"
                            />
                            <button
                                onClick={uploadAudio}
                                className="upload-button"
                            >
                                Upload Recording
                            </button>
                        </div>
                    )}
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
