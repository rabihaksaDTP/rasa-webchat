import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import close from 'assets/clear-button.svg';
import fullscreen from 'assets/fullscreen_button.svg';
import fullscreenExit from 'assets/fullscreen_exit_button.svg';
import './style.scss';
import ThemeContext from '../../../../ThemeContext';
import { store } from '../../../../../../../index';
import * as actions from '../../../../../../store/actions/index';
import { dropMessages } from '../../../../../../store/actions/dispatcher';
import { useDispatch } from 'react-redux';

const  Header = ({
  title,
  subtitle,
  fullScreenMode,
  toggleFullScreen,
  toggleChat,
  showCloseButton,
  showFullScreenButton,
  connected,
  connectingText,
  closeImage,
  profileAvatar,
  showClearChatButton,
  clearChatUrl,
  customSessionId,
  requestHeaders,
  trySendInitPayload
}) => {
  const { mainColor } = useContext(ThemeContext);
  const dispatch = useDispatch()
  const clearData ={
    "sessionId": customSessionId
  }
  const ClearChat = async () => {
    dispatch(actions.dropMessages())
    try {
      trySendInitPayload({forced:true})
      const response = await fetch(clearChatUrl, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(clearData)
      });
      if (response.ok) {
      }
      if (!response.ok) {

      }
    } catch (error) {

    }
  }
  const deleteIconFun = (width, height, color) => {
    return (
      <svg className='deleteIcon' width={`${width}px`} height={`${height}px`} viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" fill={`#${color}`} stroke={`#${color}`}>
        <g id="SVGRepo_bgCarrier" strokeWidth="0" />
        <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round" />
        <g id="SVGRepo_iconCarrier">
          <path className='deleteIconPath' fill={`#${color}`} d="M160 256H96a32 32 0 0 1 0-64h256V95.936a32 32 0 0 1 32-32h256a32 32 0 0 1 32 32V192h256a32 32 0 1 1 0 64h-64v672a32 32 0 0 1-32 32H192a32 32 0 0 1-32-32V256zm448-64v-64H416v64h192zM224 896h576V256H224v640zm192-128a32 32 0 0 1-32-32V416a32 32 0 0 1 64 0v320a32 32 0 0 1-32 32zm192 0a32 32 0 0 1-32-32V416a32 32 0 0 1 64 0v320a32 32 0 0 1-32 32z" />
        </g>
      </svg>
    );
  };
  return (
    <div className="rw-header-and-loading">
      <div style={{ backgroundColor: mainColor }}className={`rw-header ${subtitle ? 'rw-with-subtitle' : ''}`}>
        {
          profileAvatar && (
            <img src={profileAvatar} className="rw-avatar" alt="chat avatar" />
          )
        }
        <div className="rw-header-buttons">
        {
            showClearChatButton &&
            <button className="rw-clearChat" onClick={ClearChat}>
             {deleteIconFun(20, 20, 'fff')}
            </button>
          }
          {
            showFullScreenButton &&
            <button className="rw-toggle-fullscreen-button" onClick={toggleFullScreen}>
              <img
                className={`rw-toggle-fullscreen ${fullScreenMode ? 'rw-fullScreenExitImage' : 'rw-fullScreenImage'}`}
                src={fullScreenMode ? fullscreenExit : fullscreen}
                alt="toggle fullscreen"
              />
            </button>
          }
          {
            showCloseButton &&
            <button className="rw-close-button" onClick={toggleChat}>
              <img
                className={`rw-close ${closeImage ? '' : 'rw-default'}`}
                src={closeImage || close}
                alt="close"
              />
            </button>
          }
        </div>
        <h4 className={`rw-title ${profileAvatar && 'rw-with-avatar'}`}>{title}</h4>
        {subtitle && <span className={profileAvatar && 'rw-with-avatar'}>{subtitle}</span>}
      </div>
      {
        !connected &&
        <span className="rw-loading">
          {connectingText}
        </span>
      }
    </div>);
};

Header.propTypes = {
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  subtitle: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  fullScreenMode: PropTypes.bool,
  toggleFullScreen: PropTypes.func,
  toggleChat: PropTypes.func,
  showCloseButton: PropTypes.bool,
  showFullScreenButton: PropTypes.bool,
  connected: PropTypes.bool,
  connectingText: PropTypes.string,
  closeImage: PropTypes.string,
  profileAvatar: PropTypes.string
};

export default Header;
