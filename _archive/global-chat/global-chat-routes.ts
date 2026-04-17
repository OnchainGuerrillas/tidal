export const NEW_GLOBAL_CHAT_ID = "global-chat-new";

export function getGlobalChatHref(chatId: string) {
  if (chatId === NEW_GLOBAL_CHAT_ID) {
    return "/";
  }

  return `/chat/${chatId}`;
}

export function getGlobalChatIdFromPathname(pathname: string) {
  if (pathname === "/") {
    return NEW_GLOBAL_CHAT_ID;
  }

  if (!pathname.startsWith("/chat/")) {
    return null;
  }

  const chatId = pathname.slice("/chat/".length);

  return chatId.length > 0 ? decodeURIComponent(chatId) : null;
}
