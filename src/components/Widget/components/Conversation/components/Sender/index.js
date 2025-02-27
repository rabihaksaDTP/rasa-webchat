import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import TextareaAutosize from 'react-textarea-autosize';
import Send from 'assets/send_button';
import './style.scss';

const Sender = ({ sendMessage, inputTextFieldHint, disabledInput, userInput, withAudio }) => {
  const [inputValue, setInputValue] = useState('');
  const [recordingStatus, setRecordingStatus] = useState('inactive');
  const [audioChunks, setAudioChunks] = useState([]);
  const [audioArrBuffer, setAudioArrBuffer] = useState([]);
  const [audio, setAudio] = useState(null);
  const mediaRecorder = useRef(null);
  const mediaStream = useRef(null);

  const formRef = useRef(null);

  const microphoneSvg = <svg xmlns="http://www.w3.org/2000/svg" width="20%" height="40%" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2c-1.7 0-3 1.2-3 2.6v6.8c0 1.4 1.3 2.6 3 2.6s3-1.2 3-2.6V4.6C15 3.2 13.7 2 12 2z" /><path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18.4v3.3M8 22h8" /></svg>;
  const stopSvg = <svg xmlns="http://www.w3.org/2000/svg" width="40%" height="40%" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><rect x="9" y="9" width="6" height="6" /></svg>;

  useEffect(() => () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
    }
    if (mediaStream.current) {
      mediaStream.current.getTracks().forEach(track => track.stop());
    }
  }, []);

  const handleChange = (e) => {
    setInputValue(e.target.value);
  };


  const startRecording = () => {
    if ('MediaRecorder' in window && recordingStatus === 'inactive') {
      try {
        navigator.mediaDevices
          .getUserMedia({ audio: true, video: false })
          .then((stream) => {
            const media = new MediaRecorder(stream, { type: 'audio/webm' });
            setRecordingStatus('recording');

            mediaRecorder.current = media;
            mediaRecorder.current.start();
            const localAudioChunks = [];
            mediaRecorder.current.ondataavailable = (event) => {
              if (typeof event.data === 'undefined') return;
              if (event.data.size === 0) return;
              localAudioChunks.push(event.data);
            };
            setAudioChunks(localAudioChunks);
          });
      } catch (err) {
        console.error(err.message);
      }
    } else {
      console.error('The MediaRecorder API is not supported in your browser.');
    }
  };

  const stopRecording = () => {
    if (recordingStatus === 'recording') {
      setRecordingStatus('inactive');
      mediaRecorder.current.stop();
      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        audioBlob.arrayBuffer().then((buff) => {
          setAudioArrBuffer(buff);
        });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudio(audioUrl);
        setAudioChunks([]);
      };
    }
  };

  const arrayBufferToBase64 = (buffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const discardVoice = (e) => {
    e.preventDefault(); // Prevent form submission
    setAudio(null);
    setInputValue('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (audio) {
      const base64Audio = arrayBufferToBase64(audioArrBuffer);
      sendMessage(e, { message: base64Audio, audio_message: true });
      setInputValue('');
      setAudio(null);
    } else {
      sendMessage(e);
      setInputValue('');
    }
  };

  const onEnterPress = (e) => {
    if (e.keyCode === 13 && !e.shiftKey) {
      e.preventDefault();
      formRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
  };

  const arabic = /[\u0600-\u06FF]/;
  const rtl = inputValue && arabic.test(inputValue);

  return userInput === 'hide' ? (
    <div />
  ) : (
    <form ref={formRef} className="rw-sender" onSubmit={handleSubmit} style={{ direction: `${rtl ? 'rtl' : 'ltr'}` }}>
      {!audio && (
        <TextareaAutosize
          type="text"
          minRows={1}
          onKeyDown={onEnterPress}
          maxRows={3}
          onChange={handleChange}
          className="rw-new-message"
          name="message"
          placeholder={inputTextFieldHint}
          disabled={disabledInput || userInput === 'disable'}
          autoFocus
          autoComplete="off"
        />
      )}

      {audio && (
        <><button type="button" className="delete-button" onClick={discardVoice}>
          <svg className="deleteIcon" width="20px" height="20px" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" fill="#fff" stroke="#fff">
            <g id="SVGRepo_bgCarrier" strokeWidth="0" />
            <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round" />
            <g id="SVGRepo_iconCarrier">
              <path className="deleteIconPath" fill="#fff" d="M160 256H96a32 32 0 0 1 0-64h256V95.936a32 32 0 0 1 32-32h256a32 32 0 0 1 32 32V192h256a32 32 0 1 1 0 64h-64v672a32 32 0 0 1-32 32H192a32 32 0 0 1-32-32V256zm448-64v-64H416v64h192zM224 896h576V256H224v640zm192-128a32 32 0 0 1-32-32V416a32 32 0 0 1 64 0v320a32 32 0 0 1-32 32zm192 0a32 32 0 0 1-32-32V416a32 32 0 0 1 64 0v320a32 32 0 0 1-32 32z" />
            </g>
          </svg>
        </button><div className="audio-container">
          <audio className="audio" src={audio} controls />
        </div></>
      )}

      <button type="submit" className="rw-send" disabled={!inputValue && !audio}>
        <Send className="rw-send-icon" ready={!!(inputValue || audio)} alt="send" />
      </button>

      {!inputValue && !audio && withAudio && (
        <button
          type="button" // Add type="button" to prevent form submission
          onClick={recordingStatus === 'inactive' ? startRecording : stopRecording}
          className="recording-button"
          disabled={disabledInput || userInput === 'disable'}
        >
          {recordingStatus === 'inactive' ? (
            microphoneSvg
          ) : (
            stopSvg
          )}
        </button>
      )}
    </form>
  );
};

const mapStateToProps = state => ({
  userInput: state.metadata.get('userInput')
});

Sender.propTypes = {
  sendMessage: PropTypes.func,
  inputTextFieldHint: PropTypes.string,
  disabledInput: PropTypes.bool,
  userInput: PropTypes.string
};

export default connect(mapStateToProps)(Sender);
