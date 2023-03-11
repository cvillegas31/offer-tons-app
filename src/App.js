import React, { useState, useEffect, useRef } from 'react';
import { Storage, API } from 'aws-amplify';
import { Amplify } from 'aws-amplify';
import config from './aws-exports';
Amplify.configure(config);


const App = () => {
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        setStream(stream);
      })
      .catch((error) => {
        console.log('Error accessing camera:', error);
      });
  }, []);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [videoRef, stream]);

  const handleTakePhoto = async () => {
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg');
    const imageBlob = await fetch(dataUrl).then(res => res.blob());
    const filename = `${Date.now()}.jpg`;
    await Storage.put(filename, imageBlob, {
      contentType: 'image/jpeg',
    });
    console.log('Image uploaded:', filename);
    if (location) {
      const response = await API.post('myApi', '/locations', {
        body: {
          filename: filename,
          location: location,
        }
      });
      console.log('Location saved:', response);
    }
  }

  const handleLocation = async () => {
    navigator.geolocation.getCurrentPosition((position) => {
      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    }, (error) => {
      console.log('Error getting location:', error);
    });
  }

  return (
    <div>
      <video ref={videoRef} autoPlay={true} />
      <button onClick={handleTakePhoto}>Take photo and upload</button>
      <button onClick={handleLocation}>Get location</button>
    </div>
  );
}

export default App;
