import React, { useEffect, useState } from 'react';
import * as d3 from 'd3';
import Papa from 'papaparse';
import './App.css';

const App = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://thingproxy.freeboard.io/fetch/https://datahub.io/core/inflation/r/inflation-gdp.csv');
        const text = await response.text();

        Papa.parse(text, {
          header: true,
          complete: (results) => {
            const roundedData = results.data.map((row) => {
              return {
                ...row,
                Inflation: row.Inflation ? Math.round(parseFloat(row.Inflation)) : row.Inflation,
              };
            });
            setData(roundedData);
            setSelectedCountry(roundedData[0].Country); // Set default selected country
            setLoading(false);
          },
          error: (error) => {
            setError(error);
            setLoading(false);
          },
        });
      } catch (error) {
        setError(error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Function to handle country selection
  const handleCountryChange = (event) => {
    setSelectedCountry(event.target.value);
    drawChart(event.target.value);
  };

  const drawChart = (country) => {
    // Clear previous chart
    d3.select("#chart").selectAll("*").remove();

    // Filter data for the selected country
    const countryData = data.filter((d) => d.Country === country);

    const margin = { top: 20, right: 30, bottom: 30, left: 40 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select("#chart")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
      .domain(d3.extent(countryData, d => +d.Year))
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(countryData, d => +d.Inflation)])
      .range([height, 0]);

    const line = d3.line()
      .x(d => x(+d.Year))
      .y(d => y(+d.Inflation))
;

    svg.append("path")
      .datum(countryData)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1.5)
      .attr("d", line);

    // Create tooltip
    const tooltip = d3.select("#chart")
      .append("div")
      .style("position", "absolute")
      .style("background", "lightblue")
      .style("padding", "5px")
      .style("border-radius", "5px")
      .style("visibility", "hidden")
      .text("");

    // Draw points and add tooltip interaction
    svg.selectAll("dot")
      .data(countryData)
      .enter()
      .append("circle")
      .attr("r", 2)
      .attr("cx", d => x(+d.Year))
      .attr("cy", d => y(+d.Inflation))
      .attr("fill", "steelblue")
      .on("mouseover", function (event, d) {
        tooltip.style("visibility", "visible")
          .text(`Year: ${d.Year}, Inflation: ${d.Inflation}%`)
          .style("left", (event.pageX + 5) + "px")
          .style("top", (event.pageY - 28) + "px");
          
      })
      .on("mousemove", function (event) {
        tooltip.style("left", (event.pageX + 5) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function () {
        tooltip.style("visibility", "hidden");
      });

    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));

    svg.append("g")
      .call(d3.axisLeft(y));
  };

  useEffect(() => {
    if (!loading && data.length > 0) {
      drawChart(selectedCountry); // Draw chart for the default country when data is loaded
    }
  }, [data, loading, selectedCountry]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error fetching data: {error.message}</div>;
  }

  // Get unique countries for dropdown
  const countries = Array.from(new Set(data.map(row => row.Country)));

  return (
    <div>
      <h1>Inflation Data</h1>
      <label htmlFor="countrySelect">Select Country:</label>
      <select id="countrySelect" value={selectedCountry} onChange={handleCountryChange}>
        {countries.map((country, index) => (
          <option key={index} value={country}>{country}</option>
        ))}
      </select>
      <div id="chart"></div>
    </div>
  );
};

export default App;
