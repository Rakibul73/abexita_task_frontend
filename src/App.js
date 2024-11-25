import React, { useState } from 'react';
import axios from 'axios';
import './App.css'; // We'll define the styles here

const App = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    setQuery(e.target.value);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResults([]);

    try {
      const response = await axios.post('http://localhost:3000/voice/search', {
        query,
      });
      setResults(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <h1 className="title">Voice Search Assistant</h1>
      
      {/* Search Bar at the top */}
      <div className="search-bar-container">
        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="Enter your query..."
            className="search-input"
          />
          <button type="submit" className="search-button">
            Search
          </button>
        </form>
      </div>

      {/* Loading/Error message */}
      {loading && <p className="loading-text">Loading...</p>}
      {error && <p className="error-text">{error}</p>}

      {/* Results Table below */}
      {results.length > 0 && (
        <div className="results-table-container">
          <h2 className="results-title">Search Results</h2>
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
                  <td>{item.subCategory.join(', ')}</td>
                  <td>{item.rating}</td>
                  <td>{item.branch.join(', ')}</td>
                  <td>{item.zone.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default App;
