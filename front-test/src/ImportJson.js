import './App.css';
import React, { useState } from 'react';
import axios from 'axios';


function ImportJson() {
    const [jsonContent, setJsonContent] = useState(null);
    const [message, setMessage] = useState('');

    const handleFileChange = (event) => {
        const file = event.target.files[0];

        if (file && file.type === 'application/json') {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const parsedJson = JSON.parse(e.target.result);
                    setJsonContent(parsedJson);
                    setMessage('Fichier JSON chargé avec succès.');
                } catch (error) {
                    setMessage("Erreur : le fichier n'est pas un JSON valide.");
                }
            };

            reader.readAsText(file);
        } else {
            setMessage("Veuillez sélectionner un fichier .json valide.");
        }
    };

    const handleSendToBackend = async () => {
        if (!jsonContent) {
            setMessage("Aucun contenu JSON à envoyer.");
            return;
        }

        try {
            const response = await axios.post('http://localhost:8080/api/generate-bpmn', jsonContent);
            console.log("Réponse du backend :", response.data);
            setMessage("BPMN généré avec succès !");
        } catch (error) {
            console.error("Erreur lors de l'envoi :", error);
            setMessage("Erreur lors de l'envoi au backend.");
        }
    };

    return (
        <div className="p-4 border rounded-xl shadow-md bg-white max-w-md mx-auto my-10">
            <h2 className="text-xl font-bold mb-4">Importer un fichier JSON</h2>

            <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="mb-4"
            />

            {jsonContent && (
                <div className="bg-gray-100 p-2 rounded mb-4 text-sm max-h-64 overflow-auto">
                    <pre>{JSON.stringify(jsonContent, null, 2)}</pre>
                </div>
            )}

            <button
                onClick={handleSendToBackend}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
                Envoyer au backend
            </button>

            {message && <p className="mt-4 text-sm text-gray-700">{message}</p>}
        </div>
    );
}

export default ImportJson;
