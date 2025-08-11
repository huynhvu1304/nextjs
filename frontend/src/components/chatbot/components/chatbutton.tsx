import React from 'react';
import { IoChatbubbleEllipsesOutline } from 'react-icons/io5';

interface ChatbotButtonProps {
    setShowChat: (show: boolean) => void;
}

const ChatbotButton: React.FC<ChatbotButtonProps> = ({ setShowChat }) => {
    return (
        <button
            onClick={() => setShowChat(true)}
            className="fixed bottom-5 right-5 z-50 p-4 rounded-full bg-green-600 text-white text-2xl shadow-lg animate-pulse hover:scale-110 transition-transform duration-300"
            aria-label="Mở chatbot"
        >
            <IoChatbubbleEllipsesOutline />
        </button>
    );
};

export default ChatbotButton;