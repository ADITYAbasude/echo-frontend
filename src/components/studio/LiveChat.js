import React, { useState, useRef, useEffect } from 'react';
import { useSubscription, useMutation } from '@apollo/client';
import { Send, Shield, UserPlus, Ban, MessageSquare, Users } from 'lucide-react';
import { Avatar, Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '..';
import useAuthToken from '../../hooks/useAuthToken';
import Cookies from 'js-cookie';

const LiveChat = ({ 
  subscription, 
  sendMessage, 
  broadcasterId,
  isMainBroadcaster,
  onModeratorAdd,
  onUserBan 
}) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState('chat'); // chat, participants
  const chatContainerRef = useRef(null);
  const token = useAuthToken();

  // const [sendChatMessage] = useMutation(sendMessage, {
  //   context: {
  //     headers: {
  //       Authorization: `Bearer ${token}`,
  //       token: `Bearer ${Cookies.get("broadcastToken")}`,
  //     },
  //   },
  // });

  // useSubscription(subscription, {
  //   variables: { broadcasterId },
  //   onSubscriptionData: ({ subscriptionData }) => {
  //     const message = subscriptionData.data.streamChat;
  //     setMessages(prev => [...prev, message]);
  //   },
  // });

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // try {
    //   await sendChatMessage({
    //     variables: { message: newMessage },
    //   });
    //   setNewMessage('');
    // } catch (error) {
    //   console.error('Failed to send message:', error);
    // }
  };

  const handleModeratorAdd = (userId) => {
    onModeratorAdd?.(userId);
  };

  const handleUserBan = (userId) => {
    onUserBan?.(userId);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header with Tabs */}
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'chat' ? 'bg-primary text-white' : 'text-white/60 hover:text-white/90'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="text-sm">Chat</span>
          </button>
          <button
            onClick={() => setActiveTab('participants')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'participants' ? 'bg-primary text-white' : 'text-white/60 hover:text-white/90'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="text-sm">Participants</span>
          </button>
        </div>
      </div>

      {activeTab === 'chat' ? (
        <>
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
          >
            {messages.map((msg, idx) => (
              <div key={idx} className="group flex items-start gap-3">
                <Avatar className="w-8 h-8">
                  <img src={msg.user.avatar} alt={msg.user.username} />
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white/90">{msg.user.username}</span>
                    <span className="text-xs text-white/50">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-sm text-white/80 break-words">{msg.message}</p>
                </div>
                {isMainBroadcaster && (
                  <div className="hidden group-hover:flex items-center gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => handleModeratorAdd(msg.user.id)}
                            className="p-1.5 hover:bg-white/5 rounded-lg"
                          >
                            <Shield className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Make Moderator</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => handleUserBan(msg.user.id)}
                            className="p-1.5 hover:bg-white/5 rounded-lg"
                          >
                            <Ban className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Ban User</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/90 
                  placeholder:text-white/50 focus:outline-none focus:border-primary/50"
              />
              <Button 
                type="submit" 
                className="p-2 bg-primary hover:bg-primary/90"
                disabled={!newMessage.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto p-4">
          {/* Participants list will be implemented here */}
          <div className="space-y-2">
            {messages.reduce((unique, msg) => {
              if (!unique.some(u => u.id === msg.user.id)) {
                unique.push(msg.user);
              }
              return unique;
            }, []).map((user) => (
              <div key={user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5">
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <img src={user.avatar} alt={user.username} />
                  </Avatar>
                  <span className="text-sm text-white/90">{user.username}</span>
                </div>
                {isMainBroadcaster && (
                  <div className="flex items-center gap-1">
                    <Button
                      onClick={() => handleModeratorAdd(user.id)}
                      className="p-1.5 hover:bg-white/10 rounded-lg"
                    >
                      <Shield className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleUserBan(user.id)}
                      className="p-1.5 hover:bg-white/10 rounded-lg"
                    >
                      <Ban className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveChat;
