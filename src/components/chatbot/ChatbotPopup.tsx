import React, { useState, useEffect, useRef } from 'react';
import { IoClose } from 'react-icons/io5';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import './loading.css';

interface ChatbotPopupProps {
    showChat: boolean;
    setShowChat: (show: boolean) => void;
}

const CHAT_SERVER_URL = 'ws://localhost:3000';

const ChatbotPopup: React.FC<ChatbotPopupProps> = ({ showChat, setShowChat }) => {
    const [inputMessage, setInputMessage] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const ws = useRef<WebSocket | null>(null);
    const chatBoxRef = useRef<HTMLDivElement>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);


    const hasReceivedInitialWelcome = useRef(false);

     const [messages, setMessages] = useState<{ text: string; sender: 'user' | 'ai' }[]>(() => {
        try {
            const savedMessages = sessionStorage.getItem('chatbot_messages');
            if (savedMessages) {
                const parsedMessages = JSON.parse(savedMessages);

                if (parsedMessages.length > 0 && parsedMessages[0].text.includes('Xin chào! Tôi là chatbot')) {
                    hasReceivedInitialWelcome.current = true;
                }
                return parsedMessages;
            }
            return [];
        } catch (error) {
            console.error("Lỗi khi tải tin nhắn từ sessionStorage", error);
            return [];
        }
    });



    useEffect(() => {
        let currentSessionId = sessionStorage.getItem('chatbotSessionId'); 
        if (!currentSessionId) {
            currentSessionId = crypto.randomUUID(); 
            sessionStorage.setItem('chatbotSessionId', currentSessionId); 
        }
        setSessionId(currentSessionId);
    }, []);


    useEffect(() => {
        try {
            sessionStorage.setItem('chatbot_messages', JSON.stringify(messages));
        } catch (error) {
            console.error("Lỗi khi lưu tin nhắn vào sessionStorage", error);
        }
    }, [messages]);

    // Removed devicePixelRatio scaling to avoid shrinking on high-DPR mobile screens


    useEffect(() => {
        if (showChat && sessionId && !ws.current) {
            console.log('Đang cố gắng kết nối WebSocket...');
            setIsConnected(false);

            if (messages.length === 0 || !hasReceivedInitialWelcome.current) {
                setIsLoading(true);
            }

            ws.current = new WebSocket(`${CHAT_SERVER_URL}?sessionId=${sessionId}`);

            ws.current.onopen = () => {
                console.log('WebSocket đã kết nối.');
                setIsConnected(true);
            };

            ws.current.onmessage = (event) => {
                setIsLoading(false);
                try {
                    const messageData = JSON.parse(event.data as string);

                    if (messageData.type === 'welcome') {
                        if (!hasReceivedInitialWelcome.current) {
                            setMessages([{ text: messageData.content, sender: 'ai' }]);
                        }
                        hasReceivedInitialWelcome.current = true;
                    } else if (messageData.type === 'chat') { 
                        addMessage(messageData.content, 'ai');
                    } else if (messageData.type === 'error') { 
                        addMessage(`Lỗi từ server: ${messageData.content}`, 'ai');
                    }
                } catch (e) {
                    console.error("Lỗi khi parse tin nhắn WebSocket hoặc định dạng không đúng:", e);
                    addMessage("Có lỗi xảy ra khi xử lý phản hồi từ chatbot.", 'ai');
                }
            };

            ws.current.onclose = () => {
                console.log('WebSocket đã ngắt kết nối.');
                setIsConnected(false);
                setIsLoading(false);
                addMessage('Rất tiếc, tôi đang ngoại tuyến hoặc kết nối bị gián đoạn. Vui lòng thử lại sau.', 'ai');
                ws.current = null;
            };

            ws.current.onerror = (error) => {
                console.error('Lỗi WebSocket:', error);
                setIsConnected(false);
                setIsLoading(false);
                addMessage('Có lỗi xảy ra với kết nối. Vui lòng kiểm tra console để biết thêm chi tiết.', 'ai');
                ws.current?.close();
                ws.current = null;
            };
        }

        return () => {
            if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                console.log('Đóng kết nối WebSocket khi component unmount hoặc popup đóng.');
                ws.current.close();
                ws.current = null;
            }
        };
    }, [showChat, sessionId]);

 
    useEffect(() => {
        if (chatBoxRef.current) {
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }
    }, [messages, isLoading]);


    const addMessage = (text: string, sender: 'user' | 'ai') => {
        setMessages((prevMessages) => [...prevMessages, { text, sender }]);
    };

  
    const sendMessage = () => {
        if (inputMessage.trim() === '' || !isConnected || isLoading) return;

        const messageToSend = inputMessage.trim();
        addMessage(messageToSend, 'user');
        setInputMessage('');
        setIsLoading(true);
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ sessionId, message: messageToSend }));
        } else {
            console.error('WebSocket chưa sẵn sàng hoặc đã đóng.');
            addMessage('Lỗi: Không thể gửi tin nhắn. Kết nối không ổn định. Vui lòng thử đóng và mở lại chatbot.', 'ai');
            setIsLoading(false);
        }
    };

    const components = {
        a: ({ node, ...props }: any) => (
            <a {...props} style={{ color: '#16A34A', fontWeight: 'bold', textDecoration: 'underline' }} />
        ),
    };

    if (!showChat) {
        return null;
    }

    return (
        <div
            className="fixed right-4 bottom-24 sm:bottom-20 bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden z-50 w-[90vw] max-w-[420px] h-[65vh] "
        >
            <div className="bg-green-600 text-white p-4 text-lg font-semibold flex justify-between items-center">
                <span>Chatbot Hỗ Trợ Cầu Lông</span>
                <button
                    onClick={() => setShowChat(false)}
                    className="text-white text-2xl hover:text-gray-200 transition-colors duration-200"
                    aria-label="Đóng chatbot"
                >
                    <IoClose />
                </button>
            </div>

            <div ref={chatBoxRef} className="flex-grow p-4 overflow-y-auto bg-gray-100 flex flex-col gap-3">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[75%] p-3 rounded-xl shadow-sm text-sm break-words
                                ${msg.sender === 'user'
                                    ? 'bg-green-600 text-white rounded-br-none'
                                    : 'bg-white text-gray-800 rounded-bl-none'
                                }`}
                        >
                            <ReactMarkdown rehypePlugins={[rehypeRaw]} components={components}>{msg.text}</ReactMarkdown>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white px-3 py-2 rounded-xl rounded-bl-none shadow-sm text-sm text-gray-800">
                            <span className="dot-pulse"></span>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-3 sm:p-4 border-t border-gray-200 bg-white flex items-center gap-2">
                <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            sendMessage();
                        }
                    }}
                    placeholder={!isConnected ? "Đang kết nối..." : (isLoading ? "Đang gõ phản hồi..." : "Nhập tin nhắn của bạn...")}
                    disabled={!isConnected || isLoading}
                    className={`flex-grow p-2.5 sm:p-3 rounded-full border ${isConnected ? 'border-gray-300' : 'border-gray-200 bg-gray-50'} focus:outline-none focus:ring-2 focus:ring-green-500`}
                />
                <button
                    onClick={sendMessage}
                    disabled={!isConnected || inputMessage.trim() === ''}
                    className={`p-2.5 sm:p-3 rounded-full ${isConnected && inputMessage.trim() !== '' ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300 cursor-not-allowed'} text-white transition-colors duration-200 flex-shrink-0`}
                    aria-label="Gửi tin nhắn"
                >
                    Gửi
                </button>
            </div>
        </div>
    );
};

export default ChatbotPopup;