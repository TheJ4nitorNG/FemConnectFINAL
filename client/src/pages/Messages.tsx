import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Send, ArrowLeft, User, Loader2, MessageCircle } from "lucide-react";
import type { User as UserType, Message } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface Conversation {
  partnerId: number;
  lastMessage: Message;
  partner: UserType | undefined;
}

export default function Messages() {
  const { user: currentUser } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check for ?user= query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get("user");
    if (userId) {
      setSelectedPartnerId(Number(userId));
    }
  }, []);

  const { data: conversations = [], isLoading: loadingConversations } = useQuery<Conversation[]>({
    queryKey: ["/api/messages/conversations"],
  });

  // Fetch user info when selected from query param (might not be in conversations yet)
  const { data: selectedUserFromParam } = useQuery<UserType>({
    queryKey: ["/api/users", selectedPartnerId],
    enabled: !!selectedPartnerId && !conversations.find(c => c.partnerId === selectedPartnerId),
  });

  const { data: messages = [], isLoading: loadingMessages } = useQuery<Message[]>({
    queryKey: ["/api/messages", selectedPartnerId],
    enabled: !!selectedPartnerId,
  });

  const selectedPartner = conversations.find(c => c.partnerId === selectedPartnerId)?.partner || selectedUserFromParam;

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", "/api/messages", {
        receiverId: selectedPartnerId,
        content,
      });
      return res.json();
    },
    onSuccess: () => {
      setMessageInput("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages", selectedPartnerId] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim() && selectedPartnerId) {
      sendMessage.mutate(messageInput.trim());
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getProfilePictureUrl = (user: UserType | undefined) => {
    if (!user?.profilePicture) return null;
    return `/objects/${user.profilePicture.replace("/objects/", "")}`;
  };

  if (loadingConversations) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto h-[calc(100vh-180px)]">
        <Card className="h-full flex overflow-hidden">
          <div className={`w-full md:w-80 border-r flex-shrink-0 flex flex-col ${selectedPartnerId ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b">
              <h2 className="text-lg font-bold text-foreground" data-testid="text-messages-title">Messages</h2>
            </div>
            <ScrollArea className="flex-1">
              {conversations.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p>No conversations yet</p>
                  <p className="text-sm mt-1">Start a conversation from someone's profile!</p>
                </div>
              ) : (
                <div className="divide-y">
                  {conversations.map((conv) => {
                    const profileUrl = getProfilePictureUrl(conv.partner);
                    const isUnread = !conv.lastMessage.isRead && conv.lastMessage.receiverId === currentUser?.id;
                    return (
                      <button
                        key={conv.partnerId}
                        onClick={() => setSelectedPartnerId(conv.partnerId)}
                        className={`w-full p-4 flex items-center gap-3 hover-elevate text-left ${
                          selectedPartnerId === conv.partnerId ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                        }`}
                        data-testid={`button-conversation-${conv.partnerId}`}
                      >
                        <Avatar className="w-12 h-12">
                          {profileUrl ? (
                            <AvatarImage src={profileUrl} alt={conv.partner?.username} />
                          ) : null}
                          <AvatarFallback>
                            <User className="w-6 h-6" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`font-medium truncate ${isUnread ? 'text-foreground' : 'text-foreground/80'}`}>
                              {conv.partner?.username || "Unknown"}
                            </span>
                            {conv.lastMessage.createdAt && (
                              <span className="text-xs text-muted-foreground flex-shrink-0">
                                {formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: false })}
                              </span>
                            )}
                          </div>
                          <p className={`text-sm truncate ${isUnread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                            {conv.lastMessage.senderId === currentUser?.id ? 'You: ' : ''}
                            {conv.lastMessage.content}
                          </p>
                        </div>
                        {isUnread && (
                          <div className="w-2.5 h-2.5 rounded-full bg-purple-500 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          <div className={`flex-1 flex flex-col ${selectedPartnerId ? 'flex' : 'hidden md:flex'}`}>
            {selectedPartnerId && selectedPartner ? (
              <>
                <div className="p-4 border-b flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setSelectedPartnerId(null)}
                    data-testid="button-back-conversations"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <button
                    onClick={() => setLocation(`/profile/${selectedPartnerId}`)}
                    className="flex items-center gap-3 hover-elevate rounded-lg p-1 -m-1"
                    data-testid="button-view-profile"
                  >
                    <Avatar className="w-10 h-10">
                      {getProfilePictureUrl(selectedPartner) ? (
                        <AvatarImage src={getProfilePictureUrl(selectedPartner)!} alt={selectedPartner.username} />
                      ) : null}
                      <AvatarFallback>
                        <User className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">{selectedPartner.username}</p>
                      <p className="text-xs text-muted-foreground">{selectedPartner.role}</p>
                    </div>
                  </button>
                </div>

                <ScrollArea className="flex-1 p-4">
                  {loadingMessages ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-10">
                      <p>No messages yet</p>
                      <p className="text-sm">Say hello!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((msg) => {
                        const isOwn = msg.senderId === currentUser?.id;
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                            data-testid={`message-${msg.id}`}
                          >
                            <div
                              className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                                isOwn
                                  ? 'bg-purple-500 text-white rounded-br-md'
                                  : 'bg-muted text-foreground rounded-bl-md'
                              }`}
                            >
                              <p className="break-words">{msg.content}</p>
                              {msg.createdAt && (
                                <p className={`text-xs mt-1 ${isOwn ? 'text-purple-200' : 'text-muted-foreground'}`}>
                                  {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                <form onSubmit={handleSend} className="p-4 border-t flex gap-2">
                  <Input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1"
                    data-testid="input-message"
                  />
                  <Button
                    type="submit"
                    disabled={!messageInput.trim() || sendMessage.isPending}
                    data-testid="button-send-message"
                  >
                    {sendMessage.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-lg font-medium">Select a conversation</p>
                  <p className="text-sm">or start a new one from someone's profile</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
