import React from 'react';
import { IoChatbubbleEllipsesOutline } from 'react-icons/io5';

interface ChatbotButtonProps {
    setShowChat: (show: boolean) => void;
}

const ChatbotButton: React.FC<ChatbotButtonProps> = ({ setShowChat }) => {
    return (
        <button
            onClick={() => setShowChat(true)}
            className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-50 h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-green-600 text-white text-2xl shadow-lg hover:scale-105 active:scale-95 transition-transform duration-200 flex items-center justify-center"
            aria-label="Mở chatbot"
        >
            <IoChatbubbleEllipsesOutline className="h-6 w-6 sm:h-7 sm:w-7" />
        </button>
    );
};

export default ChatbotButton;