import React, { useState, useEffect, useRef } from 'react';
import { css } from '@emotion/react';
import { ClipLoader } from 'react-spinners';
import * as d3 from 'd3';

const BarChart = ({ data, colorMap }) => {
  const svgRef = useRef();
  const tableRef = useRef();
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(null);
  const [tooltipContent, setTooltipContent] = useState(null);

  useEffect(() => {
    if (data.length > 0) {
      setSelectedYear(data[0].Year);
    }
  }, [data]);

  const numberWithCommas = (number) => {
    return number.toLocaleString('en-US');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Simulate a delay to show the spinner
        await new Promise(resolve => setTimeout(resolve, 2000));
        setLoading(false); // Set loading to false after the delay
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []); // Only runs once on initial render

  useEffect(() => {
    const updateChart = () => {
      if (!data || data.length === 0) return;

      const margin = { top: 20, right: 20, bottom: 50, left: 70 };
      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();

      const filteredData = data.filter(item => item.Year === selectedYear);
      const countries = filteredData.map(d => d.Entity);
      const maxDeathRate = d3.max(filteredData, d => d["Age-standardized deaths that are from malignant neoplasms per 100,000 people, in both sexes aged all ages"]);

      const barWidth = 50;
      const width = countries.length * barWidth + margin.left + margin.right;
      const height = 600 - margin.top - margin.bottom;

      const x = d3.scaleBand()
        .domain(countries)
        .range([0, width])
        .padding(0.2);

      const y = d3.scaleLinear()
        .domain([0, maxDeathRate])
        .nice()
        .range([height, 0]);

      const newSvg = svg
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);
      
      newSvg.selectAll(".bar")
        .data(filteredData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.Entity))
        .attr("y", d => y(d["Age-standardized deaths that are from malignant neoplasms per 100,000 people, in both sexes aged all ages"]))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d["Age-standardized deaths that are from malignant neoplasms per 100,000 people, in both sexes aged all ages"]))
        .attr("fill", d => colorMap[d.Entity]) // Use colorMap to determine the color
        .on('mouseover', (event, d) => handleMouseOver(event, d))
        .on('mouseleave', () => setTooltipContent(null))
        .append("title")
        .text(d => `${d.Entity}: ${d["Age-standardized deaths that are from malignant neoplasms per 100,000 people, in both sexes aged all ages"].toFixed(2)}`);

      newSvg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

      newSvg.append("g")
        .call(d3.axisLeft(y));

      newSvg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", `translate(${width / 2}, ${height + margin.top + 50})`)
        .text("Country");

      // newSvg.append("text")
      //   .attr("text-anchor", "middle")
      //   .attr("transform", `translate(${width / 2}, ${height + margin.top + Math.max(...countries.map(country => country.length)) * 200 + 10})`) // Adjusted the y-coordinate dynamically based on the maximum length of country names
      //   .text("Country");

      newSvg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", `rotate(-90) translate(-${height / 2}, ${-margin.left + 20})`)
        .text("Number of Deaths");
    };

    const updateTable = () => {
      if (!data || data.length === 0) return;

      const table = d3.select(tableRef.current);

      table.selectAll('*').remove();

      const years = Array.from(new Set(data.map(d => d.Year)));
      const countries = Array.from(new Set(data.map(d => d.Entity)));

      const tbody = table.append('tbody');

      countries.forEach((country, index) => {
        const row = tbody.append('tr');
        row.append('td').text(country);

        if (index % 2 === 1) {
          row.style('background-color', '#d3d3d3');
        }

        years.forEach(year => {
          const deaths = data.find(d => d.Entity === country && d.Year === year);
          row.append('td').text(deaths ? numberWithCommas(deaths["Age-standardized deaths that are from malignant neoplasms per 100,000 people, in both sexes aged all ages"].toFixed(2)) : "-").style('padding', '12px');
        });
      });

      const thead = table.append('thead');
      thead.append('tr')
        .selectAll('th')
        .data(['Country', ...years])
        .enter()
        .append('th')
        .text(d => d)
        .style('background-color', 'purple')
        .style('font-size', '15px')
        .style('color', '#ffffff')
        .style('padding', '12px')
        .style('margin-bottom', '50px');
    };

    updateChart();
    updateTable();
  }, [data, selectedYear, colorMap]);

  const handleYearChange = (event) => {
    setSelectedYear(parseInt(event.target.value));
  };

  const handleMouseOver = (event, d) => {
    setTooltipContent({
      'location': d.Entity,
      'year': selectedYear,
      'value': d["Age-standardized deaths that are from malignant neoplasms per 100,000 people, in both sexes aged all ages"].toFixed(2),
      'x': event.pageX,
      'y': event.pageY
    });
  };

  const spinnerStyle = css`
    display: block;
    margin: 0 auto;
  `;

  return (
    <div>
      {loading ? (
        <div className="spinner-container flex flex-row justify-center m-4">
          <ClipLoader color="red" loading={loading} css={spinnerStyle} size={50} padding={20} />
        </div>
      ) : (
        <div>
          <div>
            <label className='text-red-500'>* Please select a year </label> <br />
            <label htmlFor="year-select">Select a Year: </label>
            <select id="year-select" onChange={handleYearChange} value={selectedYear}>
              {Array.from(new Set(data.map(item => item.Year))).map((year, index) => (
                <option key={index} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div style={{ position: 'relative' }}>
            <svg ref={svgRef}></svg>
          </div>
          {/* Table */}
          <h1 className='text-center text-3xl m-3'>Total Number of Deaths Country per year (2000 - 2021)</h1>
          <div style={{ width: '100%', overflowX: 'auto', border: '1px solid #ddd', borderRadius: '5px' }}>
            <table ref={tableRef} style={{ borderCollapse: 'collapse', width: '100%', textAlign: 'center',padding:'15px' }}></table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BarChart;
