import React, { useState } from "react";
import Typeahead from "react-typeahead";

const AddHeaders = () => {
  const [selectedHeader, setSelectedHeader] = useState(null);

  const knownHeaders = [
    { header: "Content-Type", value: "application/json" },
    { header: "Authorization", value: "Bearer <token>" },
    { header: "Accept", value: "application/json" }
    // Add more as needed
  ];

  const handleSelect = (header) => {
    setSelectedHeader(header);
  };

  return (
    <div>
      <h3>Add Headers</h3>
      <Typeahead
        labelKey="header"
        options={knownHeaders}
        placeholder="Search for headers"
        onChange={handleSelect}
      />
      {selectedHeader && (
        <div>
          <strong>Selected Header:</strong> {selectedHeader.header}
          <br />
          <strong>Value:</strong> {selectedHeader.value}
        </div>
      )}
    </div>
  );
};

export default AddHeaders;
