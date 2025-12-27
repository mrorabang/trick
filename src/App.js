import React, { useState } from 'react';
import ImageDropZone from './components/ImageDropZone';
import ImageEditor from './components/ImageEditor';
import './App.css';

function App() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [editingFile, setEditingFile] = useState(null);

  const handleFilesSelected = (files) => {
    setSelectedFiles(files);
    console.log('Selected files:', files);
  };

  const handleEditImage = (file) => {
    setEditingFile(file);
  };

  const handleBackToDropZone = () => {
    setEditingFile(null);
  };

  const handleEditComplete = (result) => {
    console.log('Edit completed:', result);
    // You can handle the edited image result here
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>AI Image Editor</h1>
        <p>Upload an image and edit it with AI</p>
      </header>
      <main className="App-main">
        {editingFile ? (
          <ImageEditor
            imageFile={editingFile}
            onBack={handleBackToDropZone}
            onEditComplete={handleEditComplete}
          />
        ) : (
          <>
            <ImageDropZone 
              onFilesSelected={handleFilesSelected}
              multiple={true}
              maxSize={5 * 1024 * 1024} // 5MB
            />
            
            {selectedFiles.length > 0 && (
              <div className="files-info">
                <h3>Selected Files ({selectedFiles.length})</h3>
                <div className="files-grid">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="file-item">
                      <div className="file-thumbnail">
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt={file.name} 
                          className="thumbnail-img"
                        />
                      </div>
                      <div className="file-details">
                        <p className="file-name">{file.name}</p>
                        <p className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        <button 
                          className="edit-button"
                          onClick={() => handleEditImage(file)}
                        >
                          Edit with AI
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
