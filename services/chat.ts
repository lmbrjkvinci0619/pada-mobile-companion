import { supabase } from "./supabase";
import { ChatMessage, ChatConversation } from "@/types";
import { getValidAccessToken } from "./auth";

export async function fetchMessages(
  teamId: string,
  limit: number = 50,
  offset: number = 0
): Promise<ChatMessage[]> {
  // We'll need the internal Supabase team_id.
  // Assuming teamId passed here is the TopScore team_id.
  const { data: teamData, error: teamError } = await supabase
    .from("teams")
    .select("id")
    .eq("topscore_id", teamId)
    .single();

  if (teamError || !teamData) {
    console.error("Error fetching team from Supabase:", teamError);
    return [];
  }

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("team_id", teamData.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching messages:", error);
    return [];
  }

  return (data || []).map((msg) => ({
    id: msg.id,
    teamId: teamId, // keeping TopScore ID for the frontend
    senderId: msg.sender_id,
    senderName: msg.sender_name,
    content: msg.content,
    messageType: msg.message_type as any,
    attachmentUrl: msg.attachment_url,
    createdAt: msg.created_at,
    updatedAt: msg.updated_at,
  }));
}

export async function sendMessage(
  teamId: string,
  senderId: string,
  senderName: string,
  content: string
): Promise<ChatMessage | null> {
  const token = await getValidAccessToken();
  if (!token) {
    console.error("No valid TopScore token found for sending message");
    return null;
  }

  try {
    const { data, error } = await supabase.functions.invoke("send-message", {
      body: { topscoreToken: token, teamId, content },
    });

    if (error) {
      console.error("Error calling send-message edge function:", error);
      return null;
    }

    return {
      id: data.id,
      teamId: teamId,
      senderId: data.sender_id,
      senderName: data.sender_name,
      content: data.content,
      messageType: data.message_type as any,
      createdAt: data.created_at,
    };
  } catch (err) {
    console.error("Unexpected error sending message via edge function:", err);
    return null;
  }
}

export function subscribeToMessages(
  teamId: string,
  onInsert: (message: ChatMessage) => void
) {
  // To subscribe, we either need the uuid team_id or we filter by it if possible.
  // Since we don't have it synchronously, we can subscribe to all and filter, or fetch first.
  let subscription: any;

  // We fetch the internal team ID first, then subscribe
  supabase
    .from("teams")
    .select("id")
    .eq("topscore_id", teamId)
    .single()
    .then(({ data }) => {
      if (!data) return;
      const internalTeamId = data.id;

      subscription = supabase
        .channel(`messages:${internalTeamId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `team_id=eq.${internalTeamId}`,
          },
          (payload) => {
            const msg = payload.new;
            onInsert({
              id: msg.id,
              teamId: teamId, // pass TopScore ID
              senderId: msg.sender_id,
              senderName: msg.sender_name,
              content: msg.content,
              messageType: msg.message_type as any,
              attachmentUrl: msg.attachment_url,
              createdAt: msg.created_at,
            });
          }
        )
        .subscribe();
    });

  return () => {
    if (subscription) {
      supabase.removeChannel(subscription);
    }
  };
}

export async function fetchUserConversations(userId: string): Promise<ChatConversation[]> {
  // Get all teams where this user is a member
  const { data: memberData, error: memberError } = await supabase
    .from("team_members")
    .select("team_id, teams!inner(id, topscore_id, name)")
    .eq("topscore_person_id", userId);

  if (memberError || !memberData) {
    console.error("Error fetching user teams:", memberError);
    return [];
  }

  const conversations: ChatConversation[] = [];

  for (const row of memberData) {
    const internalTeamId = (row.teams as any).id;
    const topscoreId = (row.teams as any).topscore_id;
    const teamName = (row.teams as any).name;

    // Fetch last message for this team
    const { data: msgData } = await supabase
      .from("messages")
      .select("*")
      .eq("team_id", internalTeamId)
      .order("created_at", { ascending: false })
      .limit(1);

    let lastMessage = undefined;
    if (msgData && msgData.length > 0) {
      const msg = msgData[0];
      lastMessage = {
        id: msg.id,
        teamId: topscoreId,
        senderId: msg.sender_id,
        senderName: msg.sender_name,
        content: msg.content,
        messageType: msg.message_type as any,
        createdAt: msg.created_at,
      };
    }

    conversations.push({
      teamId: topscoreId,
      teamName,
      lastMessage,
      unreadCount: 0, // Unread count logic can be added later
    });
  }

  // Sort by last message date
  return conversations.sort((a, b) => {
    if (!a.lastMessage) return 1;
    if (!b.lastMessage) return -1;
    return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime();
  });
}
