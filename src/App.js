import { useState, useRef } from 'react';
import './App.css';
import IVSBroadcastClient from 'amazon-ivs-web-broadcast';

function App() {

  const [ingestEndpoint, setIngestEndpoint] = useState('');
  const [streamKey, setStreamKey] = useState('');
  const clientRef = useRef(null)

  async function handlePermissions() {
    let permissions = {
      audio: false,
      video: false,
    };
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      for (const track of stream.getTracks()) {
        track.stop();
      }
      permissions = { video: true, audio: true };
    } catch (err) {
      permissions = { video: false, audio: false };
      console.error(err.message);
    }
    // If we still don't have permissions after requesting them display the error message
    if (!permissions.video) {
      console.error('Failed to get video permissions.');
    } else if (!permissions.audio) {
      console.error('Failed to get audio permissions.');
    }
  }

  async function startBroadcast() {
    if (clientRef.current) {
      alert('Stream is active')
      return;
    }
    const client = IVSBroadcastClient.create({
      // Enter the desired stream configuration
      streamConfig: IVSBroadcastClient.STANDARD_LANDSCAPE,
      // Enter the ingest endpoint created above
      ingestEndpoint
    });
    clientRef.current = client;
    await handlePermissions();
    // where #preview is an existing <canvas> DOM element on your page
    const previewEl = document.getElementById('preview');
    client.attachPreview(previewEl);
    const devices = await navigator.mediaDevices.enumerateDevices();
    window.videoDevices = devices.filter((d) => d.kind === 'videoinput');
    window.audioDevices = devices.filter((d) => d.kind === 'audioinput');
    const streamConfig = IVSBroadcastClient.STANDARD_LANDSCAPE;
    window.cameraStream = await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: window.videoDevices[0].deviceId,
        width: {
          ideal: streamConfig.maxResolution.width,
          max: streamConfig.maxResolution.width,
        },
        height: {
          ideal: streamConfig.maxResolution.height,
          max: streamConfig.maxResolution.height,
        },
      },
    });
    window.microphoneStream = await navigator.mediaDevices.getUserMedia({
      audio: { deviceId: window.audioDevices[0].deviceId },
    });
    client.addVideoInputDevice(window.cameraStream, 'camera1', { index: 0 }); // only 'index' is required for the position parameter
    client.addAudioInputDevice(window.microphoneStream, 'mic1');
    client
      .startBroadcast(streamKey)
      .then((result) => {
        console.log('I am successfully broadcasting!');
      })
      .catch((error) => {
        console.error('Something drastically failed while broadcasting!', error);
      });
  }

  const stopBroadcast = () => {
    if (clientRef.current) {
      clientRef.current.stopBroadcast();
      clientRef.current = null;
    }
  }

  return (
    <div className="App">
      <section className='container'>
        <canvas id="preview"></canvas>
      </section>
      <section className="container">
        <label htmlFor="ingest-endpoint">Ingest Endpoint</label>
        <input type="text" id="ingest-endpoint" value={ingestEndpoint} onChange={(e) => {
          setIngestEndpoint(e.target.value);
        }} />
      </section>
      <section className="container">
        <label htmlFor="stream-key">Stream Key</label>
        <input type="text" id="stream-key" value={streamKey} onChange={(e) => {
          setStreamKey(e.target.value);
        }} />
      </section>

      <section className="container">
        <button className="button" id="start" disabled="" onClick={startBroadcast}>Start Broadcast</button>
        <button className="button" id="stop" disabled="" onClick={stopBroadcast}>Stop Broadcast</button>
      </section>
    </div>
  );
}

export default App;
