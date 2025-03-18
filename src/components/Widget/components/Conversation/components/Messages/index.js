import React, { Component,createRef } from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { connect } from 'react-redux';
import TextareaAutosize from 'react-textarea-autosize';
import { MESSAGES_TYPES } from 'constants';
import { Video, Image, Message, Carousel, Buttons } from 'messagesComponents';
import './styles.scss';
import ThemeContext from '../../../../ThemeContext';
import Send from '../../../../../../../assets/send_button';


const sendFeedback = async ({message, feedbackStatus, question,customData,toggleTextBox,formData, feedbackUrl, requestHeaders, markMessageAsReported, index}) => {

  let formDataObj = new FormData(formData.target);
  const feedbackData = {
    answer: message.get('text'),
    question,
    feedbackStatus,
    senderId: message.get('sender'),
    homeAirport:customData?.airport_id,
    client:customData?.client_id,
    feedback:formDataObj.get("feedback")
  };
  try {
    const response = await fetch(feedbackUrl, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(feedbackData)
    });
    if (response.ok) {
      markMessageAsReported(index)
      message._root.entries.push(["isReported", true]);
      toggleTextBox(false,index)
    }

    if (!response.ok) {
      console.error('Failed to send feedback');
    }
  } catch (error) {
    toggleTextBox(false,index)
  }
};

const isToday = (date) => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

const formatDate = (date) => {
  const dateToFormat = new Date(date);
  const showDate = isToday(dateToFormat) ? '' : `${dateToFormat.toLocaleDateString()} `;
  return `${showDate}${dateToFormat.toLocaleTimeString('en-US', { timeStyle: 'short' })}`;
};

const scrollToBottom = () => {
  const messagesDiv = document.getElementById('rw-messages');
  if (messagesDiv) {
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }
};

class Messages extends Component {
  constructor(props) {
    super(props);
    this.formRef = createRef();
    this.state = {
      textBoxOpen: {},
      textBoxVal:"",
      reportedMessages: new Set(),
    };
  }
  toggleTextBox = (bool,index) => {
    this.setState((prev)=> { return({ textBoxOpen:{...prev?.textBoxOpen, [index]: bool } } ) });
  };
  
  setTextBoxVal = (textBoxVal) => {
    this.setState({ textBoxVal: textBoxVal });
  };
  onEnterPress = (e) => {
    if (e.keyCode === 13 && !e.shiftKey) {
      e.preventDefault();
      this.formRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
  };
  componentDidMount() {
    scrollToBottom();
  }

  componentDidUpdate() {
    scrollToBottom();
  }

  getComponentToRender = (message, index, isLast) => {
    const { params } = this.props;
    const ComponentToRender = (() => {
      switch (message.get('type')) {
        case MESSAGES_TYPES.TEXT: {
          return Message;
        }
        case MESSAGES_TYPES.CAROUSEL: {
          return Carousel;
        }
        case MESSAGES_TYPES.VIDREPLY.VIDEO: {
          return Video;
        }
        case MESSAGES_TYPES.IMGREPLY.IMAGE: {
          return Image;
        }
        case MESSAGES_TYPES.BUTTONS: {
          return Buttons;
        }
        case MESSAGES_TYPES.CUSTOM_COMPONENT:
          return connect(
            store => ({ store }),
            dispatch => ({ dispatch })
          )(this.props.customComponent);
        default:
          return null;
      }
    })();
    if (message.get('type') === 'component') {
      const messageProps = message.get('props');
      return (<ComponentToRender
        id={index}
        {...(messageProps.toJS ? messageProps.toJS() : messageProps)}
        isLast={isLast}
      />);
    }
    return <ComponentToRender id={index} params={params} message={message} isLast={isLast} />;
  }
  markMessageAsReported = (index) => {
    this.setState((prevState) => ({
      reportedMessages: new Set(prevState.reportedMessages).add(index),
    }));
  };
  render() {
    const { displayTypingIndication, profileAvatar,customData} = this.props;
    const { textBoxOpen } = this.state; 

    const renderMessages = () => {
      const {
        messages,
        showMessageDate
      } = this.props;

      if (messages.isEmpty()) return null;

      const groups = [];
      let group = null;

      const dateRenderer = typeof showMessageDate === 'function' ? showMessageDate :
        showMessageDate === true ? formatDate : null;

      const renderMessageDate = (message) => {
        const timestamp = message.get('timestamp');

        if (!dateRenderer || !timestamp) return null;
        const dateToRender = dateRenderer(message.get('timestamp', message));
        return dateToRender
          ? <span className="rw-message-date">{dateRenderer(message.get('timestamp'), message)}</span>
          : null;
      };

      let lastClientMessage = null;
      const messagePairs = new Map(); 
      let lastResponseIndex = [];
      let messagesJs = messages.toJS();
      const clientMessages = messagesJs.filter(msg => msg['sender'] === "client");
      // messages.toJS().findLast((e)=> e.text=== clientMessages.toJS()[clientMessages.toJS().length - 1].text )
      if (clientMessages) {
        let lastMessages =messagesJs.slice( messagesJs.findLastIndex((e)=> e?.text===clientMessages[clientMessages.length - 1]?.text) );
        lastResponseIndex = lastMessages
      } else {
        messages?.forEach((msg, index) => {
          if (msg.get('sender') === 'response') {
            lastResponseIndex=[msg.toJS()]
          }
        });
      }

      const renderMessage = (message, index) => {
        const sender = message.get('sender');
        const isReported = message.get('isReported');
        const isStateReported = this.state.reportedMessages.has(index); // Check if the message is reported

        const text = message.get('text') || 'Non-text message';

        if (sender === 'client') {
          lastClientMessage = text; 
        } else if (sender === 'response' && lastClientMessage) {
          messagePairs.set(index, lastClientMessage);
        }    
        return (
          <div className={'rw-message'} key={index} style={{flexDirection:this.props.withFeedback? "column":""}}>
            {this.getComponentToRender(message, index)}
            {sender === 'response' && 
            this.props.withFeedback && lastResponseIndex.some((e)=>(e?.text===message.toJS()?.text && e?.timestamp===message.toJS()?.timestamp) ) 
            && !isReported && !isStateReported && message.get('text') &&  (
              <div className="feedback-buttons" style={{position:"relative",zIndex:"9999"}}>
                {!textBoxOpen[index] &&
                  <div>
                    <button onClick={() => { this.toggleTextBox("GoodResponse",index); }} className="good-feedback">
                      👍
                    </button>
                    <button onClick={() => { this.toggleTextBox("BadResponse",index); }
                    } className="bad-feedback">
                      👎
                    </button>
                  </div>}
                {textBoxOpen[index] &&
                <div style={{position:"absolute",minWidth:"250px"}} className='rw-feedback-container'>
                  <form ref={this.formRef} className="rw-sender rw-feedback-form" onSubmit={(e)=>{ 
                    e.preventDefault();
                      sendFeedback(
                        {
                          setfeedbackbtns: this.setfeedbackbtns, toggleTextBox: this.toggleTextBox, message: message,
                          feedbackStatus: textBoxOpen[index] , question: messagePairs.get(index),
                          customData: customData,
                          formData: e, textBoxValue: textBoxOpen,
                          feedbackUrl: this.props.feedbackUrl,
                          requestHeaders: this.props.requestHeaders,
                          markMessageAsReported:this.markMessageAsReported,
                          index,
                        })
                    }}>

                    <div style={{ display: "flex" }}>
                      <textarea
                        type="text"
                        onKeyDown={this.onEnterPress}
                        className="rw-new-message rw-feedback-msg"
                        name="feedback"
                        placeholder={"Feedback"}
                        disabled={false}
                        onChange={(e) => { this.setTextBoxVal(e.target.value) }}
                        autoFocus
                        autoComplete="off"
                      />
                      <button type="submit" className="rw-send rw-send-feedback">
                        <Send className="rw-send-icon" alt="send" />
                      </button>

                      <button type="button" className="rw-cancel-feedback" onClick={() => this.toggleTextBox(false,index)}>✖</button>

                    </div>
                  </form>
                </div>
                }
              </div>
            )}
          </div>
        );
      };

      messages.forEach((msg, index) => {
        if (msg.get('hidden')) return;
        if (group === null || group.from !== msg.get('sender')) {
          if (group !== null) groups.push(group);

          group = {
            from: msg.get('sender'),
            messages: []
          };
        }

        group.messages.push(renderMessage(msg, index));
      });

      groups.push(group); // finally push last group of messages.

      return groups.map((g, index) => (
        <div className={`rw-group-message rw-from-${g && g.from}`} key={`group_${index}`}>
          {g.messages}
        </div>
      ));
    };
    const { conversationBackgroundColor, assistBackgoundColor } = this.context;

    return (
      <div id="rw-messages" style={{ backgroundColor: conversationBackgroundColor }} className="rw-messages-container">
        { renderMessages() }
        {displayTypingIndication && (
          <div className={`rw-message rw-typing-indication ${profileAvatar && 'rw-with-avatar'}`}>
            {
              profileAvatar &&
              <img src={profileAvatar} className="rw-avatar" alt="profile" />
            }
            <div style={{ backgroundColor: assistBackgoundColor }}className="rw-response">
              <div id="wave">
                <span className="rw-dot" />
                <span className="rw-dot" />
                <span className="rw-dot" />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}
Messages.contextType = ThemeContext;
Messages.propTypes = {
  messages: ImmutablePropTypes.listOf(ImmutablePropTypes.map),
  profileAvatar: PropTypes.string,
  customComponent: PropTypes.func,
  showMessageDate: PropTypes.oneOfType([PropTypes.bool, PropTypes.func]),
  displayTypingIndication: PropTypes.bool
};

Message.defaultTypes = {
  displayTypingIndication: false
};

export default connect(store => ({
  messages: store.messages,
  displayTypingIndication: store.behavior.get('messageDelayed')
}))(Messages);
