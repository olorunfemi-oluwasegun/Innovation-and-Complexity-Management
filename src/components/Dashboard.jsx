import React, { useState, useEffect } from 'react';
import { useHistory } from "react-router-dom";
import { logout } from "../auth";
import BarChart from './Barchart';
import * as d3 from 'd3'; // Import d3 library

const Dashboard = () => {
  const history = useHistory(); // Import useHistory hook

  const [data, setData] = useState([]);
  const [defaultData, setDefaultData] = useState([]);
  const [uniqueCountries, setUniqueCountries] = useState([]); // State to store unique countries
  const [selectedCountries, setSelectedCountries] = useState([]); // State to store selected countries
  const [legendColors, setLegendColors] = useState({}); // State to store legend colors

  useEffect(() => {
    const fetchData = async () => {
      try {
        const jsonData = await d3.json('data.json'); // Fetch data using d3.json
        
        // Filter data between years 2008 and 2019
        const filteredData = jsonData.filter(item => item.Year >= 2000 && item.Year <= 2021);
        
        setData(filteredData);
        setDefaultData(filteredData);

        // Store unique country names
        const countrySet = new Set(filteredData.map(item => item.Entity));

        // Filter out non-EU countries
        const EU_countries = ["Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czech Republic", "Denmark", "Estonia", "Finland", "France", "Germany", "Greece", "Hungary", "Ireland", "Italy", "Latvia", "Lithuania", "Luxembourg", "Malta", "Netherlands", "Poland", "Portugal", "Romania", "Slovakia", "Slovenia", "Spain", "Sweden"];
        const EU_countries_set = new Set(EU_countries);
        const EU_countries_data = [...countrySet].filter(country => EU_countries_set.has(country));

        
        // Sort countries based on total deaths
        const sortedCountries = EU_countries_data.sort((a, b) => {
          const totalDeathsA = filteredData.filter(item => item.Entity === a).reduce((acc, curr) => acc + curr["Age-standardized deaths that are from malignant neoplasms per 100,000 people, in both sexes aged all ages"], 0);
          const totalDeathsB = filteredData.filter(item => item.Entity === b).reduce((acc, curr) => acc + curr["Age-standardized deaths that are from malignant neoplasms per 100,000 people, in both sexes aged all ages"], 0);
          return totalDeathsB - totalDeathsA;
        });

        // Convert set to array and set state
        setUniqueCountries(sortedCountries);

        // Create legend colors based on selected countries
        const colors = {};
        sortedCountries.forEach((country, index) => {
          colors[country] = d3.schemeCategory10[index % d3.schemeCategory10.length];
        });
        
        setLegendColors(colors);
      
        console.log({ "unique_countries": sortedCountries });
      
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    
    fetchData();
  }, []);

  const handleLogout = () => {
    // Call logout function from auth.js
    logout();
    // Redirect to login page after logout
    history.push("/login");
  };

  const handleCheckboxChange = (country) => {
    // Toggle selected country
    if (selectedCountries.includes(country)) {
      setSelectedCountries(selectedCountries.filter(c => c !== country));
    } else {
      setSelectedCountries([...selectedCountries, country]);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
  
    reader.onload = async (e) => {
      const text = e.target.result;
      const csvData = d3.csvParse(text, (d) => {
        // Convert numeric values from strings to floats
        d.Year = parseInt(d.Year);
        d["Age-standardized deaths that are from malignant neoplasms per 100,000 people, in both sexes aged all ages"] = parseFloat(d["Age-standardized deaths that are from malignant neoplasms per 100,000 people, in both sexes aged all ages"]);
        return d;
      });
      setData(csvData);
    };
  
    reader.readAsText(file);
  };

  const resetData = () => {
    // Reset data to default data
    setData(defaultData);
  };

  return (
    <div>
      <div className="h-screen bg-cover">
        <div className="bg-gray-100 bg-opacity-75 min-h-screen">
          <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold text-red mb-8">Dashboard</h1>
            <button onClick={handleLogout} className='p-3 mr-3 bg-red-500 text-white rounded-lg flex-row justify-end'>Logout</button>
            <button className='bg-white-500 ring-1 p-3 rounded-lg ring-red-500 hover:bg-red-500 hover:ring-white  hover:text-white' onClick={resetData}>Reset Data</button>
            <div>
              <h1 className='text-center text-3xl my-6'>Cancer death rate, 2000 to 2021</h1>
              <label htmlFor="file-upload" className='text-red-500'>* Please upload a .csv file </label> <br />
              <input type="file" id="file-upload" accept=".csv" onChange={handleFileUpload} /> <br /> <br />
              <label className='text-red-500'>* Please select a Country </label> <br />
              <form>
                <div className='flex flex-row flex-wrap p-4 justify-center mx-auto'>
                  {uniqueCountries.map(country => (
                    <div key={country} className="flex items-center mr-4">
                      <input type="checkbox" checked={selectedCountries.includes(country)} onChange={() => handleCheckboxChange(country)} className='h-5 w-5 mr-2' />
                      <span>{country}</span>
                    </div>
                  ))}
                </div>
              </form>

              <BarChart data={data.filter(item => selectedCountries.includes(item.Entity))} colorMap={legendColors} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
