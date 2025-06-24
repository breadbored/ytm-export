interface Message {
    action: string;
    enabled?: boolean;
    count?: number;
    total?: number;
}

chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
    if (message.action === 'songsCollected') {
        chrome.browserAction.setBadgeText({
            text: message.total?.toString() || '0'
        });
        chrome.browserAction.setBadgeBackgroundColor({
            color: '#ff0000'
        });
    }
});