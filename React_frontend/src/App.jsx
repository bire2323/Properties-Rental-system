import { useEffect, useState } from 'react'



function App() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch('http://localhost:8000/api/accounts/')
      .then(response => response.json())
      .then(data => setData(data.message))
      .catch(error => console.error('Error fetching data:', error));
  }, []);

  return (
    <>
      <div className="w-full h-screen flex justify-center items-center bg-gray-100">
        <p className="text-2xl  font-bold">Property rental system</p>
      </div>
      <div className="w-full h-screen flex justify-center items-center bg-gray-100">
        {data ? (
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Data from Django Backend:</h1>
            <pre className="bg-white p-4 rounded shadow">{data}</pre>
          </div>
        ) : (
          <p className="text-xl">Loading data...</p>
        )}
      </div>

    </>
  )
}

export default App
