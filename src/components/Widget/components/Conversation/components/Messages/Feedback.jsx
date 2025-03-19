import React, { useState } from 'react';
import Send from '../../../../../../../assets/send_button';
import { useRef } from 'react';

const sendFeedback = async ({ customSessionId, message, feedbackStatus, question, customData, toggleTextBox, formData, feedbackUrl, requestHeaders, markMessageAsReported, index, toggleFeedbackLoader }) => {

  let formDataObj = new FormData(formData.target);
  const timeOutTime = 2000;
  const feedbackData = {
    answer: message.get('text'),
    question,
    feedbackStatus,
    senderId: customSessionId,
    homeAirport: customData?.airport_id,
    client: customData?.client_id,
    feedback: formDataObj.get("feedback")
  };
  try {
    toggleFeedbackLoader(true, false, null, index);
    const response = await fetch(feedbackUrl, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(feedbackData)
    });
    if (response.ok) {
      markMessageAsReported(index);
      message._root.entries.push(["isReported", true]);
      toggleFeedbackLoader(false, true, null, index);
      setTimeout(() => {
        toggleFeedbackLoader(false, false, null, index);
        toggleTextBox(false, index);
      }, timeOutTime);
    }

    if (!response.ok) {
      console.error('Failed to send feedback');
      toggleFeedbackLoader(false, false, 'Failed to send feedback', index);
      setTimeout(() => {
        toggleFeedbackLoader(false, false, null, index);
        toggleTextBox(false, index);
      }, timeOutTime);
    }
  } catch (error) {
    toggleFeedbackLoader(false, false, 'Failed to send feedback', index);
    setTimeout(() => {
      toggleFeedbackLoader(false, false, null, index);
      toggleTextBox(false, index);
    }, timeOutTime);
  }
};
function Feedback({ customSessionId, customData, index, markMessageAsReported, message, messagePairs, feedbackUrl, requestHeaders }) {
  const [textBoxOpen, setTextBoxOpen] = useState({});
  const [feedbackLoader, setfeedbackLoader] = useState({});
  const formRef = useRef(null);
  const onEnterPress = (e) => {
    if (e.keyCode === 13 && !e.shiftKey) {
      e.preventDefault();
      formRef?.current?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
  };
  const toggleTextBox = (bool, index) => {
    setTextBoxOpen((prev) => { return ({ ...prev, [index]: bool }); });
  };
  const toggleFeedbackLoader = (loadingStatus, successStatus, errorMessage, index) => {
    setfeedbackLoader((prev) => { return ({ ...prev, [index]: { loading: loadingStatus, successStatus: successStatus, errorMessage: errorMessage } }); });
  };
  return (
    <>
      <div className="feedback-buttons" style={{ position: "relative", zIndex: "9999" }}>
        {!textBoxOpen[index] &&
          <div>
            <button onClick={() => { toggleTextBox("GoodResponse", index); }} className="good-feedback">
              👍
            </button>
            <button onClick={() => { toggleTextBox("BadResponse", index); }
            } className="bad-feedback">
              👎
            </button>
          </div>}
        {textBoxOpen[index] &&
          <div style={{ position: "absolute", minWidth: "250px" }} className='rw-feedback-container'>
            <form ref={formRef} className="rw-sender rw-feedback-form" onSubmit={(e) => {
              e.preventDefault();
              sendFeedback(
                {
                  toggleTextBox: toggleTextBox, message: message,
                  feedbackStatus: textBoxOpen[index], question: messagePairs.get(index),
                  customData: customData,
                  formData: e, textBoxValue: textBoxOpen,
                  feedbackUrl: feedbackUrl,
                  requestHeaders: requestHeaders,
                  markMessageAsReported: markMessageAsReported,
                  index: index,
                  toggleFeedbackLoader: toggleFeedbackLoader,
                  customSessionId: customSessionId
                });
            }}>

              <div style={{ display: "flex" }}>
                <textarea
                  type="text"
                  onKeyDown={onEnterPress}
                  className="rw-new-message rw-feedback-msg"
                  name="feedback"
                  placeholder={"Feedback"}
                  disabled={false}
                  autoFocus
                  autoComplete="off"
                />
                <button type="submit" className="rw-send rw-send-feedback">
                  <Send className="rw-send-icon" alt="send" />
                </button>

                <button type="button" className="rw-cancel-feedback" onClick={() => toggleTextBox(false, index)}>✖</button>

              </div>
              {feedbackLoader[index]?.loading && <div
                className='feed-loader-popup'
                style={{
                  position: "absolute",
                  background: "#4CA54C",
                  width: "100%",
                  height: "68%",
                  borderRadius: "7px",
                  textAlign: "center",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                }}
              > Sending Feedback... </div>}
              {feedbackLoader[index]?.successStatus && <div
                className='feed-sucess-popup'
                style={{
                  position: "absolute",
                  background: "#4CA54C",
                  width: "100%",
                  height: "68%",
                  borderRadius: "7px",
                  textAlign: "center",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                }}
              > Feedback sent succesfully </div>}
              {!feedbackLoader[index]?.successStatus && feedbackLoader[index]?.errorMessage && <div
                className='feed-error-popup'
                style={{
                  position: "absolute",
                  background: "#D63838",
                  width: "100%",
                  height: "68%",
                  borderRadius: "7px",
                  textAlign: "center",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                }}
              > {`Error: ${feedbackLoader[index]?.errorMessage}`} </div>}
            </form>
          </div>
        }
      </div>
    </>
  );
}

export default Feedback;